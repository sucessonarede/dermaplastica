import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Sun,
  Sunset,
  Moon,
  Sparkles,
  Plus,
  Check,
  Printer,
  Download,
  ImagePlus,
  Trash2,
  X,
  Loader2,
} from "lucide-react";
import type { SkincareProduct, SkincareTimeOfDay, ClinicSettings } from "@shared/schema";
import { generateReceituarioPDF } from "@/lib/generateReceituarioPDF";

const blocksConfig: {
  key: SkincareTimeOfDay;
  label: string;
  description: string;
  icon: React.ElementType;
  colorHex: string;
  bgClass: string;
  ringClass: string;
  textClass: string;
}[] = [
  {
    key: "diurno",
    label: "Tratamentos Diurnos",
    description: "Rotina da manhã",
    icon: Sun,
    colorHex: "#d97706",
    bgClass: "bg-amber-500/10",
    ringClass: "ring-amber-500/30",
    textClass: "text-amber-600 dark:text-amber-400",
  },
  {
    key: "tarde",
    label: "Tratamentos da Tarde",
    description: "Rotina do meio-dia / tarde",
    icon: Sunset,
    colorHex: "#ea580c",
    bgClass: "bg-orange-500/10",
    ringClass: "ring-orange-500/30",
    textClass: "text-orange-600 dark:text-orange-400",
  },
  {
    key: "noturno",
    label: "Tratamentos Noturnos",
    description: "Rotina da noite",
    icon: Moon,
    colorHex: "#7c3aed",
    bgClass: "bg-violet-500/10",
    ringClass: "ring-violet-500/30",
    textClass: "text-violet-600 dark:text-violet-400",
  },
  {
    key: "especial",
    label: "Tratamentos Especiais / Corporais",
    description: "Tratamentos complementares",
    icon: Sparkles,
    colorHex: "#0891b2",
    bgClass: "bg-cyan-500/10",
    ringClass: "ring-cyan-500/30",
    textClass: "text-cyan-600 dark:text-cyan-400",
  },
];

interface InlineAddForm {
  name: string;
  usageInstructions: string;
  imageFile: File | null;
  imagePreview: string | null;
}

export default function Receituario() {
  const { toast } = useToast();

  const [patientName, setPatientName] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [addingFor, setAddingFor] = useState<SkincareTimeOfDay | null>(null);
  const [inlineForm, setInlineForm] = useState<InlineAddForm>({
    name: "",
    usageInstructions: "",
    imageFile: null,
    imagePreview: null,
  });
  const [isPDFLoading, setIsPDFLoading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const { data: products = [], isLoading } = useQuery<SkincareProduct[]>({
    queryKey: ["/api/skincare-products"],
  });

  const { data: clinicSettings } = useQuery<ClinicSettings>({
    queryKey: ["/api/clinic-settings"],
  });

  const uploadImageMutation = useMutation({
    mutationFn: async ({ productId, file }: { productId: string; file: File }) => {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch(`/api/skincare-products/${productId}/image`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Upload failed");
      return await res.json();
    },
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      usageInstructions: string;
      timeOfDay: SkincareTimeOfDay;
    }) => {
      const res = await apiRequest("POST", "/api/skincare-products", data);
      return (await res.json()) as SkincareProduct;
    },
    onSuccess: async (newProduct) => {
      if (inlineForm.imageFile) {
        await uploadImageMutation.mutateAsync({
          productId: newProduct.id,
          file: inlineForm.imageFile,
        });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/skincare-products"] });
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.add(newProduct.id);
        return next;
      });
      setAddingFor(null);
      setInlineForm({ name: "", usageInstructions: "", imageFile: null, imagePreview: null });
      toast({ title: "Produto adicionado!", description: newProduct.name });
    },
    onError: () => {
      toast({ title: "Erro ao adicionar produto", variant: "destructive" });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/skincare-products/${id}`);
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["/api/skincare-products"] });
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      toast({ title: "Produto removido" });
    },
    onError: () => {
      toast({ title: "Erro ao remover produto", variant: "destructive" });
    },
  });

  const toggleProduct = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setInlineForm((f) => ({ ...f, imageFile: file, imagePreview: preview }));
  };

  const handleAddProduct = async (timeOfDay: SkincareTimeOfDay) => {
    if (!inlineForm.name.trim()) {
      toast({ title: "Nome é obrigatório", variant: "destructive" });
      return;
    }
    createProductMutation.mutate({
      name: inlineForm.name.trim(),
      usageInstructions: inlineForm.usageInstructions.trim(),
      timeOfDay,
    });
  };

  const handlePrint = () => {
    const selected = products.filter((p) => selectedIds.has(p.id));
    if (selected.length === 0) {
      toast({ title: "Selecione ao menos um produto", variant: "destructive" });
      return;
    }
    window.print();
  };

  const handlePDF = async () => {
    const selected = products.filter((p) => selectedIds.has(p.id));
    if (selected.length === 0) {
      toast({ title: "Selecione ao menos um produto", variant: "destructive" });
      return;
    }
    setIsPDFLoading(true);
    try {
      await generateReceituarioPDF({
        patientName: patientName.trim() || undefined,
        clinicName: clinicSettings?.clinicName,
        selectedProducts: selected,
      });
    } catch {
      toast({ title: "Erro ao gerar PDF", variant: "destructive" });
    } finally {
      setIsPDFLoading(false);
    }
  };

  const selectedCount = selectedIds.size;
  const productsByBlock = (tod: SkincareTimeOfDay) =>
    products.filter((p) => p.timeOfDay === tod);

  const printContent = (
    <div id="receituario-print-area">
      <h1 style={{ fontSize: "20px", marginBottom: "4px", color: "#b45a6e" }}>
        Receituário de Skincare
      </h1>
      {patientName && (
        <p style={{ fontSize: "13px", marginBottom: "12px", color: "#555" }}>
          Paciente: <strong>{patientName}</strong>
        </p>
      )}
      {blocksConfig.map((block) => {
        const blockProducts = productsByBlock(block.key).filter((p) => selectedIds.has(p.id));
        if (blockProducts.length === 0) return null;
        return (
          <div key={block.key} style={{ marginBottom: "16px" }}>
            <h2
              style={{
                fontSize: "13px",
                fontWeight: "bold",
                textTransform: "uppercase",
                color: "#b45a6e",
                borderBottom: "1px solid #e5c0c8",
                paddingBottom: "4px",
                marginBottom: "8px",
              }}
            >
              {block.label}
            </h2>
            {blockProducts.map((p, i) => (
              <div
                key={p.id}
                style={{
                  marginBottom: "8px",
                  paddingLeft: "12px",
                  borderLeft: "3px solid #e5c0c8",
                }}
              >
                <strong style={{ fontSize: "12px" }}>
                  {i + 1}. {p.name}
                </strong>
                {p.usageInstructions && (
                  <p style={{ fontSize: "11px", color: "#555", margin: "2px 0 0 0" }}>
                    {p.usageInstructions}
                  </p>
                )}
              </div>
            ))}
          </div>
        );
      })}
      <p
        style={{
          fontSize: "10px",
          color: "#aaa",
          marginTop: "24px",
          textAlign: "center",
          fontStyle: "italic",
        }}
      >
        Este receituário foi elaborado especialmente para você. Siga as orientações para melhores resultados.
      </p>
    </div>
  );

  return (
    <>
      <style>{`
        @media print {
          body > *:not(#receituario-print-area) { display: none !important; }
          #receituario-print-area {
            display: block !important;
            padding: 20mm 15mm;
            font-family: Arial, sans-serif;
          }
        }
        @media screen {
          #receituario-print-area { display: none !important; }
        }
      `}</style>

      {createPortal(printContent, document.body)}

      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Receituário</h1>
            <p className="text-sm text-muted-foreground">
              Monte a rotina de skincare personalizada para o paciente
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Input
              placeholder="Nome do paciente (opcional)"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              className="w-56"
              data-testid="input-patient-name"
            />
            {selectedCount > 0 && (
              <Badge variant="secondary" data-testid="badge-selected-count">
                {selectedCount} selecionado{selectedCount !== 1 ? "s" : ""}
              </Badge>
            )}
            <Button
              variant="outline"
              onClick={handlePrint}
              data-testid="button-print"
            >
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
            <Button onClick={handlePDF} disabled={isPDFLoading} data-testid="button-pdf">
              {isPDFLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Gerar PDF
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {blocksConfig.map((block) => {
              const Icon = block.icon;
              const blockProducts = productsByBlock(block.key);
              const isAddingHere = addingFor === block.key;

              return (
                <Card
                  key={block.key}
                  className={`flex flex-col ring-1 ${block.ringClass}`}
                  data-testid={`block-${block.key}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-md ${block.bgClass}`}
                      >
                        <Icon className={`h-4 w-4 ${block.textClass}`} />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-semibold leading-tight">
                          {block.label}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">{block.description}</p>
                      </div>
                    </div>
                    <div className={`h-0.5 rounded-full ${block.bgClass}`} />
                  </CardHeader>

                  <CardContent className="flex flex-col gap-2 flex-1">
                    {blockProducts.length === 0 && !isAddingHere && (
                      <p className="text-xs text-muted-foreground italic py-2 text-center">
                        Nenhum produto cadastrado
                      </p>
                    )}

                    {blockProducts.map((product) => {
                      const isSelected = selectedIds.has(product.id);
                      return (
                        <div
                          key={product.id}
                          className={`group relative flex items-start gap-3 rounded-md p-2.5 cursor-pointer transition-colors hover-elevate ${
                            isSelected ? `${block.bgClass} ring-1 ${block.ringClass}` : "hover:bg-muted/50"
                          }`}
                          onClick={() => toggleProduct(product.id)}
                          data-testid={`product-item-${product.id}`}
                        >
                          <div
                            className="flex-shrink-0 mt-0.5 h-4 w-4 rounded border flex items-center justify-center transition-colors"
                            style={
                              isSelected
                                ? { backgroundColor: block.colorHex, borderColor: block.colorHex }
                                : {}
                            }
                          >
                            {isSelected && (
                              <Check className="h-3 w-3 text-white" strokeWidth={3} />
                            )}
                          </div>

                          {product.imageUrl && (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="flex-shrink-0 h-10 w-10 rounded object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                              }}
                            />
                          )}

                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium leading-snug">{product.name}</p>
                            {product.usageInstructions && (
                              <p className="text-xs text-muted-foreground mt-0.5 leading-snug line-clamp-2">
                                {product.usageInstructions}
                              </p>
                            )}
                          </div>

                          <button
                            className="invisible group-hover:visible flex-shrink-0 rounded p-0.5 text-muted-foreground hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteProductMutation.mutate(product.id);
                            }}
                            data-testid={`button-delete-product-${product.id}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      );
                    })}

                    {isAddingHere && (
                      <div className="rounded-md border bg-muted/30 p-3 space-y-2">
                        <Input
                          placeholder="Nome do produto *"
                          value={inlineForm.name}
                          onChange={(e) => setInlineForm((f) => ({ ...f, name: e.target.value }))}
                          className="text-sm h-8"
                          data-testid="input-new-product-name"
                          autoFocus
                        />
                        <Textarea
                          placeholder="Modo de uso (opcional)"
                          value={inlineForm.usageInstructions}
                          onChange={(e) =>
                            setInlineForm((f) => ({ ...f, usageInstructions: e.target.value }))
                          }
                          className="text-sm resize-none"
                          rows={2}
                          data-testid="input-new-product-instructions"
                        />
                        <div className="flex items-center gap-2">
                          <input
                            ref={imageInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageChange}
                            data-testid="input-new-product-image"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => imageInputRef.current?.click()}
                            className="text-xs h-7"
                            data-testid="button-select-image"
                          >
                            <ImagePlus className="h-3 w-3 mr-1" />
                            {inlineForm.imagePreview ? "Trocar imagem" : "Adicionar imagem"}
                          </Button>
                          {inlineForm.imagePreview && (
                            <img
                              src={inlineForm.imagePreview}
                              alt="preview"
                              className="h-8 w-8 rounded object-cover border"
                            />
                          )}
                        </div>
                        <div className="flex gap-2 pt-1">
                          <Button
                            size="sm"
                            className="flex-1 h-7 text-xs"
                            onClick={() => handleAddProduct(block.key)}
                            disabled={createProductMutation.isPending}
                            data-testid="button-confirm-add-product"
                          >
                            {createProductMutation.isPending ? (
                              <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            ) : (
                              <Check className="h-3 w-3 mr-1" />
                            )}
                            Salvar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => {
                              setAddingFor(null);
                              setInlineForm({
                                name: "",
                                usageInstructions: "",
                                imageFile: null,
                                imagePreview: null,
                              });
                            }}
                            data-testid="button-cancel-add-product"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {!isAddingHere && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-auto justify-start text-muted-foreground text-xs h-8 w-full"
                        onClick={() => {
                          setAddingFor(block.key);
                          setInlineForm({
                            name: "",
                            usageInstructions: "",
                            imageFile: null,
                            imagePreview: null,
                          });
                        }}
                        data-testid={`button-add-item-${block.key}`}
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Adicionar item
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
