import fs from "fs";
import path from "path";
import type { Response } from "express";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Camada de armazenamento de arquivos.
 *
 * Supabase Storage em produção; disco local em desenvolvimento quando as
 * credenciais do Supabase não estiverem configuradas.
 *
 * Variáveis de ambiente:
 *   SUPABASE_URL                 - https://<project-ref>.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY    - service_role key (NUNCA expor no frontend)
 *   SUPABASE_STORAGE_BUCKET      - nome do bucket (padrão: "dermalift")
 *   PRIVATE_OBJECT_DIR           - prefixo dentro do bucket (padrão: "private")
 *   LOCAL_STORAGE_DIR            - pasta usada no fallback local (padrão: ".local-storage")
 */

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

export interface StoredObject {
  buffer: Buffer;
  contentType: string;
}

interface StorageProvider {
  readonly name: string;
  upload(key: string, buffer: Buffer, contentType: string): Promise<void>;
  remove(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  read(key: string): Promise<StoredObject | null>;
}

const MIME_BY_EXT: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
  ".heic": "image/heic",
  ".pdf": "application/pdf",
};

export function guessContentType(key: string): string {
  return MIME_BY_EXT[path.extname(key).toLowerCase()] || "application/octet-stream";
}

/** Normaliza a chave: remove barras iniciais/duplicadas. */
function normalizeKey(key: string): string {
  return key.replace(/^\/+/, "").replace(/\/{2,}/g, "/");
}

/* -------------------------------------------------------------------------- */
/* Supabase Storage                                                            */
/* -------------------------------------------------------------------------- */

class SupabaseStorageProvider implements StorageProvider {
  readonly name = "supabase";
  private client: SupabaseClient;
  private bucket: string;

  constructor(url: string, serviceKey: string, bucket: string) {
    this.client = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    this.bucket = bucket;
  }

  async upload(key: string, buffer: Buffer, contentType: string): Promise<void> {
    const { error } = await this.client.storage
      .from(this.bucket)
      .upload(key, buffer, { contentType, upsert: true });
    if (error) {
      throw new Error(`Falha ao enviar "${key}" para o Supabase Storage: ${error.message}`);
    }
  }

  async remove(key: string): Promise<void> {
    const { error } = await this.client.storage.from(this.bucket).remove([key]);
    if (error) {
      throw new Error(`Falha ao remover "${key}" do Supabase Storage: ${error.message}`);
    }
  }

  async exists(key: string): Promise<boolean> {
    const dir = path.posix.dirname(key);
    const base = path.posix.basename(key);
    const { data, error } = await this.client.storage
      .from(this.bucket)
      .list(dir === "." ? "" : dir, { search: base, limit: 100 });
    if (error) return false;
    return (data || []).some((entry) => entry.name === base);
  }

  async read(key: string): Promise<StoredObject | null> {
    const { data, error } = await this.client.storage.from(this.bucket).download(key);
    if (error || !data) return null;
    const buffer = Buffer.from(await data.arrayBuffer());
    return { buffer, contentType: data.type || guessContentType(key) };
  }
}

/* -------------------------------------------------------------------------- */
/* Disco local (apenas desenvolvimento)                                        */
/* -------------------------------------------------------------------------- */

class LocalDiskStorageProvider implements StorageProvider {
  readonly name = "local-disk";
  private root: string;

  constructor(root: string) {
    this.root = path.resolve(root);
  }

  private resolve(key: string): string {
    const full = path.resolve(this.root, normalizeKey(key));
    if (!full.startsWith(this.root)) {
      throw new Error("Caminho inválido");
    }
    return full;
  }

  async upload(key: string, buffer: Buffer): Promise<void> {
    const full = this.resolve(key);
    await fs.promises.mkdir(path.dirname(full), { recursive: true });
    await fs.promises.writeFile(full, buffer);
  }

  async remove(key: string): Promise<void> {
    const full = this.resolve(key);
    await fs.promises.rm(full, { force: true });
  }

  async exists(key: string): Promise<boolean> {
    try {
      await fs.promises.access(this.resolve(key));
      return true;
    } catch {
      return false;
    }
  }

  async read(key: string): Promise<StoredObject | null> {
    try {
      const buffer = await fs.promises.readFile(this.resolve(key));
      return { buffer, contentType: guessContentType(key) };
    } catch {
      return null;
    }
  }
}

/* -------------------------------------------------------------------------- */
/* Serviço                                                                      */
/* -------------------------------------------------------------------------- */

let cachedProvider: StorageProvider | null = null;

function isServerless(): boolean {
  return Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
}

function createProvider(): StorageProvider {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "dermalift";

  if (url && serviceKey) {
    return new SupabaseStorageProvider(url, serviceKey, bucket);
  }

  if (isServerless() || process.env.NODE_ENV === "production") {
    throw new Error(
      "Storage não configurado. Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY " +
        "(e opcionalmente SUPABASE_STORAGE_BUCKET) nas variáveis de ambiente."
    );
  }

  const root = process.env.LOCAL_STORAGE_DIR || ".local-storage";
  console.warn(
    `[storage] SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY não definidos — usando disco local em "${root}" (somente desenvolvimento).`
  );
  return new LocalDiskStorageProvider(root);
}

function getProvider(): StorageProvider {
  if (!cachedProvider) {
    cachedProvider = createProvider();
  }
  return cachedProvider;
}

export class ObjectStorageService {
  /** Prefixo (pasta) usado dentro do bucket para objetos privados. */
  getPrivateObjectDir(): string {
    return normalizeKey(process.env.PRIVATE_OBJECT_DIR || "private");
  }

  async uploadFromBytes(key: string, buffer: Buffer, contentType?: string): Promise<void> {
    const normalized = normalizeKey(key);
    await getProvider().upload(normalized, buffer, contentType || guessContentType(normalized));
  }

  async deleteObject(key: string): Promise<void> {
    await getProvider().remove(normalizeKey(key));
  }

  async objectExists(key: string): Promise<boolean> {
    return getProvider().exists(normalizeKey(key));
  }

  /** Envia o objeto diretamente na resposta HTTP. Retorna false se não existir. */
  async serveObject(key: string, res: Response, cacheTtlSec = 3600): Promise<boolean> {
    const normalized = normalizeKey(key);
    const object = await getProvider().read(normalized);
    if (!object) return false;

    res.set({
      "Content-Type": object.contentType,
      "Content-Length": String(object.buffer.length),
      "Cache-Control": `private, max-age=${cacheTtlSec}`,
    });
    res.end(object.buffer);
    return true;
  }
}

export const objectStorageService = new ObjectStorageService();
