import jsPDF from "jspdf";
import type { SkincareProduct, SkincareTimeOfDay } from "@shared/schema";
import {
  aplicar,
  ajustarNaLargura,
  barra,
  carregarImagem,
  centralizado,
  registrarFontes,
  CINZA,
  ITEM,
  OURO,
  OURO_CLARO,
  SERIF,
  SERIF_MEDIO,
  TINTA,
  type OpcoesTexto,
} from "./dermaliftBoard";

/**
 * Receituário de skincare, no mesmo naipe do Projeto Dermalift: fundo branco,
 * fios dourados e a serifada da marca.
 *
 * A rotina é organizada por turno; um mesmo produto pode aparecer em mais de
 * um, porque é assim que a Dra. monta na tela.
 */

const LARGURA_PAGINA = 210;
const ALTURA_PAGINA = 297;
const CENTRO = LARGURA_PAGINA / 2;
const MARGEM = 16;
const LARGURA_UTIL = LARGURA_PAGINA - MARGEM * 2;

const ESCUDO = "/dermalift/escudo.jpg";
const LOGO = "/dermalift/logo-flavia.jpg";

const Y = {
  escudo: 0,
  alturaEscudo: 21.8,
  titulo: 36.4,
  barra: 41.5,
  alturaBarra: 1,
  larguraBarra: 26.2,
  nome: 51.9,
  data: 58.5,
  /** Onde a primeira seção começa quando há nome de paciente. */
  conteudo: 70,
  /** Margem inferior reservada para o fecho. */
  baseUtil: 268,
};

const ROTULO_TURNO: Record<SkincareTimeOfDay, string> = {
  diurno: "ROTINA DA MANHÃ",
  tarde: "ROTINA DA TARDE",
  noturno: "ROTINA DA NOITE",
  especial: "TRATAMENTOS ESPECIAIS",
};

const ORDEM_TURNOS: SkincareTimeOfDay[] = ["diurno", "tarde", "noturno", "especial"];

/** Lado da miniatura do produto, em mm. */
const LADO_IMAGEM = 20;

export interface ReceituarioData {
  patientName?: string;
  clinicName?: string;
  /**
   * Produtos selecionados em cada turno, já na ordem da tela.
   *
   * Vem separado por bloco de propósito: um produto pode estar na rotina da
   * manhã e na da noite, e precisa aparecer nas duas seções do receituário.
   */
  productsByBlock: Record<SkincareTimeOfDay, SkincareProduct[]>;
}

async function imagemParaDataUrl(url: string): Promise<string | null> {
  try {
    const resposta = await fetch(url);
    if (!resposta.ok) return null;
    const blob = await resposta.blob();
    return await new Promise((resolve) => {
      const leitor = new FileReader();
      leitor.onloadend = () => resolve(leitor.result as string);
      leitor.onerror = () => resolve(null);
      leitor.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export const generateReceituarioPDF = async (data: ReceituarioData) => {
  const { patientName, clinicName, productsByBlock } = data;

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  registrarFontes(doc);

  const [escudo, logo] = await Promise.all([
    carregarImagem(ESCUDO),
    carregarImagem(LOGO),
  ]);

  // As fotos vêm do servidor; busca todas antes de desenhar para não
  // intercalar espera com layout.
  const turnosComProdutos = ORDEM_TURNOS.filter(
    (turno) => (productsByBlock[turno] ?? []).length > 0
  );
  const fotos = new Map<string, string | null>();
  await Promise.all(
    turnosComProdutos
      .flatMap((turno) => productsByBlock[turno] ?? [])
      .map(async (produto) => {
        if (!produto.imageUrl || fotos.has(produto.id)) return;
        fotos.set(produto.id, await imagemParaDataUrl(produto.imageUrl));
      })
  );

  barra(doc, 0, 0, LARGURA_PAGINA, ALTURA_PAGINA, [255, 255, 255]);

  /* ------------------------------------------------------------ topo --- */

  if (escudo) {
    const largura = (Y.alturaEscudo * escudo.width) / escudo.height;
    doc.addImage(escudo, "JPEG", CENTRO - largura / 2, Y.escudo, largura, Y.alturaEscudo);
  }

  ajustarNaLargura(doc, "RECEITUÁRIO DE SKINCARE", CENTRO, Y.titulo, LARGURA_UTIL, {
    estilo: "bold",
    tamanho: 14.5,
    cor: TINTA,
    espacamento: 0.1,
  });

  barra(doc, CENTRO - Y.larguraBarra / 2, Y.barra, Y.larguraBarra, Y.alturaBarra, OURO);

  let y = Y.conteudo;

  if (patientName) {
    ajustarNaLargura(
      doc,
      patientName.toUpperCase(),
      CENTRO,
      Y.nome,
      LARGURA_PAGINA - 40,
      { fonte: SERIF, estilo: SERIF_MEDIO, tamanho: 18.5, cor: TINTA, espacamento: 1.1 }
    );
  } else {
    y = Y.conteudo - 9;
  }

  centralizado(
    doc,
    new Date().toLocaleDateString("pt-BR"),
    CENTRO,
    patientName ? Y.data : Y.nome,
    { tamanho: 8.5, cor: CINZA, espacamento: 0.4 }
  );

  /* --------------------------------------------------------- rotinas --- */

  const quebrarPagina = (necessario: number) => {
    if (y + necessario <= Y.baseUtil) return;
    doc.addPage();
    barra(doc, 0, 0, LARGURA_PAGINA, ALTURA_PAGINA, [255, 255, 255]);
    y = 26;
  };

  for (const turno of turnosComProdutos) {
    const produtos = productsByBlock[turno] ?? [];

    // O título de um turno nunca fica sozinho no pé da página: reserva o
    // espaço dele mais o do primeiro produto antes de decidir a quebra.
    quebrarPagina(11.4 + alturaDoProduto(doc, produtos[0]));
    y = desenharTituloTurno(doc, ROTULO_TURNO[turno], y);

    produtos.forEach((produto, indice) => {
      const altura = alturaDoProduto(doc, produto);
      quebrarPagina(altura);
      y = desenharProduto(doc, produto, indice + 1, y, fotos.get(produto.id) ?? null);
    });

    y += 6;
  }

  /* ---------------------------------------------------------- fecho --- */

  desenharFecho(doc, logo, clinicName);

  const nomeArquivo = patientName
    ? `Receituario_${patientName.replace(/\s+/g, "_")}.pdf`
    : "Receituario_Skincare.pdf";
  doc.save(nomeArquivo);
};

/** Cabeçalho de um turno: tarja dourada, rótulo e fio fino atravessando. */
function desenharTituloTurno(doc: jsPDF, rotulo: string, y: number): number {
  const alturaTarja = 6.4;
  barra(doc, MARGEM, y, 2, alturaTarja, OURO);

  const opcoes: OpcoesTexto = {
    estilo: "bold",
    tamanho: 9.5,
    cor: TINTA,
    espacamento: 0.5,
  };
  aplicar(doc, opcoes);
  const x = MARGEM + 5;
  doc.text(rotulo, x, y + alturaTarja - 1.4, { charSpace: opcoes.espacamento });

  const fimRotulo = x + doc.getTextWidth(rotulo) + rotulo.length * 0.5 + 4;
  doc.setDrawColor(OURO_CLARO[0], OURO_CLARO[1], OURO_CLARO[2]);
  doc.setLineWidth(0.25);
  doc.line(fimRotulo, y + alturaTarja - 2.4, LARGURA_PAGINA - MARGEM, y + alturaTarja - 2.4);

  return y + alturaTarja + 5;
}

/** Quanto espaço vertical um produto ocupa, com texto e miniatura. */
function alturaDoProduto(doc: jsPDF, produto: SkincareProduct): number {
  const larguraTexto = LARGURA_UTIL - 11 - (produto.imageUrl ? LADO_IMAGEM + 6 : 0);
  aplicar(doc, { tamanho: 8.5, cor: CINZA });
  const linhas = produto.usageInstructions
    ? (doc.splitTextToSize(produto.usageInstructions, larguraTexto) as string[])
    : [];
  const alturaTexto = 5.2 + linhas.length * 3.9;
  return Math.max(produto.imageUrl ? LADO_IMAGEM : 0, alturaTexto) + 7;
}

/** Raio dos cantos da miniatura, em mm. */
const RAIO_MINIATURA = 2.2;

/**
 * Miniatura do produto com cantos arredondados.
 *
 * A foto é recortada pela moldura antes de ser desenhada — só arredondar o
 * fio deixaria os cantos quadrados da imagem aparecendo por fora quando o
 * fundo dela não for branco.
 */
function desenharMiniatura(
  doc: jsPDF,
  foto: string,
  x: number,
  y: number,
  lado: number
): void {
  const recorta = typeof (doc as { clip?: unknown }).clip === "function";

  if (recorta) {
    doc.saveGraphicsState();
    // `null` monta o caminho sem pintá-lo; clip() passa a usá-lo como máscara.
    doc.roundedRect(x, y, lado, lado, RAIO_MINIATURA, RAIO_MINIATURA, null as never);
    doc.clip();
    doc.discardPath();
  }

  doc.addImage(foto, x, y, lado, lado);

  if (recorta) doc.restoreGraphicsState();

  doc.setDrawColor(OURO_CLARO[0], OURO_CLARO[1], OURO_CLARO[2]);
  doc.setLineWidth(0.25);
  doc.roundedRect(x, y, lado, lado, RAIO_MINIATURA, RAIO_MINIATURA, "S");
}

function desenharProduto(
  doc: jsPDF,
  produto: SkincareProduct,
  passo: number,
  y: number,
  foto: string | null
): number {
  const temFoto = Boolean(foto);
  const xTexto = MARGEM + 11;
  const larguraTexto = LARGURA_UTIL - 11 - (temFoto ? LADO_IMAGEM + 6 : 0);

  // Número do passo
  doc.setFillColor(OURO[0], OURO[1], OURO[2]);
  doc.circle(MARGEM + 3.6, y + 3.4, 3.4, "F");
  aplicar(doc, { estilo: "bold", tamanho: 8, cor: [255, 255, 255] });
  doc.text(String(passo), MARGEM + 3.6, y + 4.6, { align: "center" });

  // Nome do produto
  aplicar(doc, { estilo: "bold", tamanho: 10.5, cor: TINTA });
  doc.text(produto.name, xTexto, y + 4.4);

  // Modo de uso
  let alturaTexto = 5.2;
  if (produto.usageInstructions) {
    aplicar(doc, { tamanho: 8.5, cor: CINZA });
    const linhas = doc.splitTextToSize(produto.usageInstructions, larguraTexto) as string[];
    linhas.forEach((linha, i) => doc.text(linha, xTexto, y + 9.4 + i * 3.9));
    alturaTexto += linhas.length * 3.9;
  }

  // Miniatura, emoldurada como os quadros da prancha
  if (foto) {
    const xImagem = LARGURA_PAGINA - MARGEM - LADO_IMAGEM;
    desenharMiniatura(doc, foto, xImagem, y, LADO_IMAGEM);
  }

  const altura = Math.max(temFoto ? LADO_IMAGEM : 0, alturaTexto) + 7;

  // Fio separando do próximo passo
  doc.setDrawColor(243, 238, 230);
  doc.setLineWidth(0.2);
  doc.line(MARGEM, y + altura - 3.5, LARGURA_PAGINA - MARGEM, y + altura - 3.5);

  return y + altura;
}

/** Assinatura no pé da última página. */
function desenharFecho(
  doc: jsPDF,
  logo: HTMLImageElement | null,
  clinicName?: string
): void {
  const yBase = ALTURA_PAGINA - 20;

  doc.setDrawColor(OURO_CLARO[0], OURO_CLARO[1], OURO_CLARO[2]);
  doc.setLineWidth(0.25);
  doc.line(MARGEM, yBase - 12, LARGURA_PAGINA - MARGEM, yBase - 12);

  ajustarNaLargura(
    doc,
    "ESTE RECEITUÁRIO FOI MONTADO ESPECIALMENTE PARA VOCÊ.",
    MARGEM + 52,
    yBase - 6,
    110,
    { tamanho: 7, cor: CINZA, espacamento: 0.9 }
  );

  if (logo) {
    const altura = 11;
    const largura = (altura * logo.width) / logo.height;
    doc.addImage(
      logo,
      "JPEG",
      LARGURA_PAGINA - MARGEM - largura,
      yBase - 10,
      largura,
      altura
    );
  } else if (clinicName) {
    aplicar(doc, { fonte: SERIF, estilo: "bold", tamanho: 12, cor: TINTA });
    doc.text(clinicName, LARGURA_PAGINA - MARGEM, yBase - 4, { align: "right" });
  }
}
