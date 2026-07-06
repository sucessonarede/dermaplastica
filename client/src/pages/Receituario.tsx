import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Loader2,
  GripVertical,
  Layers,
} from "lucide-react";
import type { SkincareProduct, SkincareTimeOfDay, ClinicSettings } from "@shared/schema";
import { skincareTimesOfDay } from "@shared/schema";
import { generateReceituarioPDF } from "@/lib/generateReceituarioPDF";

const blocksConfig: {
  key: SkincareTimeOfDay;
  label: string;
  shortLabel: string;
  description: string;
  icon: React.ElementType;
  colorHex: string;
  bgClass: string;
  ringClass: string;
  textClass: string;
  dotClass: string;
}[] = [
  {
    key: "diurno",
    label: "Tratamentos Diurnos",
    shortLabel: "Diurno",
    description: "Rotina da manhã",
    icon: Sun,
    colorHex: "#d97706",
    bgClass: "bg-amber-500/10",
    ringClass: "ring-amber-500/30",
    textClass: "text-amber-600 dark:text-amber-400",
    dotClass: "bg-amber-400",
  },
  {
    key: "tarde",
    label: "Tratamentos da Tarde",
    shortLabel: "Tarde",
    description: "Rotina do meio-dia / tarde",
    icon: Sunset,
    colorHex: "#ea580c",
    bgClass: "bg-orange-500/10",
    ringClass: "ring-orange-500/30",
    textClass: "text-orange-600 dark:text-orange-400",
    dotClass: "bg-orange-400",
  },
  {
    key: "noturno",
    label: "Tratamentos Noturnos",
    shortLabel: "Noturno",
    description: "Rotina da noite",
    icon: Moon,
    colorHex: "#7c3aed",
    bgClass: "bg-violet-500/10",
    ringClass: "ring-violet-500/30",
    textClass: "text-violet-600 dark:text-violet-400",
    dotClass: "bg-violet-400",
  },
  {
    key: "especial",
    label: "Tratamentos Especiais / Corporais",
    shortLabel: "Especial",
    description: "Tratamentos complementares",
    icon: Sparkles,
    colorHex: "#0891b2",
    bgClass: "bg-cyan-500/10",
    ringClass: "ring-cyan-500/30",
    textClass: "text-cyan-600 dark:text-cyan-400",
    dotClass: "bg-cyan-400",
  },
];

const blockByKey = Object.fromEntries(blocksConfig.map((b) => [b.key, b])) as Record<
  SkincareTimeOfDay,
  (typeof blocksConfig)[0]
>;

interface InlineAddForm {
  name: string;
  usageInstructions: string;
  imageFile: File | null;
  imagePreview: string | null;
  selectedBlocks: Set<SkincareTimeOfDay>;
}

interface SortableProductItemProps {
  product: SkincareProduct;
  currentBlock: SkincareTimeOfDay;
  isSelected: boolean;
  colorHex: string;
  bgClass: string;
  ringClass: string;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateBlocks: (id: string, blocks: SkincareTimeOfDay[]) => void;
}

function SortableProductItem({
  product,
  currentBlock,
  isSelected,
  colorHex,
  bgClass,
  ringClass,
  onToggle,
  onDelete,
  onUpdateBlocks,
}: SortableProductItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: product.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  const otherBlocks = blocksConfig.filter(
    (b) => b.key !== currentBlock && product.timeOfDay.includes(b.key)
  );

  const toggleBlock = (blockKey: SkincareTimeOfDay, checked: boolean) => {
    let newBlocks = [...product.timeOfDay];
    if (checked) {
      if (!newBlocks.includes(blockKey)) newBlocks.push(blockKey);
    } else {
      newBlocks = newBlocks.filter((b) => b !== blockKey);
    }
    if (newBlocks.length === 0) return;
    onUpdateBlocks(product.id, newBlocks as SkincareTimeOfDay[]);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative flex items-start gap-2 rounded-md p-2.5 cursor-pointer transition-colors ${
        isSelected ? `${bgClass} ring-1 ${ringClass}` : "hover:bg-muted/50"
      }`}
      data-testid={`product-item-${product.id}`}
    >
      {/* Drag handle */}
      <button
        className="flex-shrink-0 mt-0.5 cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground transition-colors touch-none"
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        data-testid={`drag-handle-${product.id}`}
        tabIndex={-1}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Checkbox + content area */}
      <div
        className="flex items-start gap-2 flex-1 min-w-0"
        onClick={() => onToggle(product.id)}
      >
        <div
          className="flex-shrink-0 mt-0.5 h-4 w-4 rounded border flex items-center justify-center transition-colors"
          style={
            isSelected
              ? { backgroundColor: colorHex, borderColor: colorHex }
              : {}
          }
        >
          {isSelected && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
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
          {/* Other-block indicator dots */}
          {otherBlocks.length > 0 && (
            <div className="flex items-center gap-1 mt-1">
              {otherBlocks.map((b) => (
                <span
                  key={b.key}
                  title={b.shortLabel}
                  className={`inline-block h-2 w-2 rounded-full ${b.dotClass}`}
                />
              ))}
              <span className="text-[10px] text-muted-foreground ml-0.5">
                {otherBlocks.map((b) => b.shortLabel).join(", ")}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Action buttons (appear on hover) */}
      <div className="invisible group-hover:visible flex items-center gap-0.5 flex-shrink-0">
        {/* Manage blocks dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="rounded p-0.5 text-muted-foreground hover:text-foreground"
              onClick={(e) => e.stopPropagation()}
              data-testid={`button-manage-blocks-${product.id}`}
              title="Gerenciar blocos"
            >
              <Layers className="h-3.5 w-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuLabel className="text-xs">Exibir nos blocos</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {blocksConfig.map((b) => {
              const isChecked = product.timeOfDay.includes(b.key);
              const isOnlyBlock = isChecked && product.timeOfDay.length === 1;
              return (
                <DropdownMenuCheckboxItem
                  key={b.key}
                  checked={isChecked}
                  disabled={isOnlyBlock}
                  onCheckedChange={(checked) => toggleBlock(b.key, checked)}
                  data-testid={`checkbox-block-${b.key}-${product.id}`}
                >
                  <span className={`mr-1.5 inline-block h-2 w-2 rounded-full ${b.dotClass}`} />
                  {b.shortLabel}
                  {isOnlyBlock && (
                    <span className="ml-1 text-[10px] text-muted-foreground">(mín.)</span>
                  )}
                </DropdownMenuCheckboxItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Delete button */}
        <button
          className="rounded p-0.5 text-muted-foreground hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(product.id);
          }}
          data-testid={`button-delete-product-${product.id}`}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
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
    selectedBlocks: new Set(),
  });
  const [isPDFLoading, setIsPDFLoading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Local ordered lists per block for optimistic drag-and-drop
  const [localOrder, setLocalOrder] = useState<Record<SkincareTimeOfDay, string[]>>({
    diurno: [],
    tarde: [],
    noturno: [],
    especial: [],
  });

  // Track product IDs snapshot to detect real changes (not just re-renders)
  const prevProductKeyRef = useRef<string>("");

  const { data: products = [], isLoading } = useQuery<SkincareProduct[]>({
    queryKey: ["/api/skincare-products"],
  });

  const { data: clinicSettings } = useQuery<ClinicSettings>({
    queryKey: ["/api/clinic-settings"],
  });

  // Sync server data into local order only when product set actually changes
  useEffect(() => {
    const productKey = products
      .map((p) => `${p.id}:${p.displayOrder}:${p.timeOfDay.sort().join(",")}`)
      .sort()
      .join("|");
    if (productKey === prevProductKeyRef.current) return;
    prevProductKeyRef.current = productKey;

    setLocalOrder((prev) => {
      const next = { ...prev };
      for (const tod of skincareTimesOfDay) {
        const blockProducts = products
          .filter((p) => p.timeOfDay.includes(tod))
          .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

        // Keep existing order for products already in the list; append new ones
        const existing = prev[tod].filter((id) => blockProducts.some((p) => p.id === id));
        const newOnes = blockProducts
          .filter((p) => !prev[tod].includes(p.id))
          .map((p) => p.id);
        next[tod] = [...existing, ...newOnes];
      }
      return next;
    });
  }, [products]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

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
      timeOfDay: SkincareTimeOfDay[];
    }) => {
      const res = await apiRequest("POST", "/api/skincare-products", data);
      return (await res.json()) as SkincareProduct;
    },
    onSuccess: async (newProduct) => {
      if (inlineForm.imageFile) {
        try {
          await uploadImageMutation.mutateAsync({
            productId: newProduct.id,
            file: inlineForm.imageFile,
          });
        } catch {
          toast({
            title: "Produto adicionado, mas a imagem não pôde ser enviada",
            variant: "destructive",
          });
        }
      }
      queryClient.invalidateQueries({ queryKey: ["/api/skincare-products"] });
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.add(newProduct.id);
        return next;
      });
      setAddingFor(null);
      setInlineForm({
        name: "",
        usageInstructions: "",
        imageFile: null,
        imagePreview: null,
        selectedBlocks: new Set(),
      });
      toast({ title: "Produto adicionado!", description: newProduct.name });
    },
    onError: () => {
      toast({ title: "Erro ao adicionar produto", variant: "destructive" });
    },
  });

  const updateBlocksMutation = useMutation({
    mutationFn: async ({ id, timeOfDay }: { id: string; timeOfDay: SkincareTimeOfDay[] }) => {
      await apiRequest("PATCH", `/api/skincare-products/${id}`, { timeOfDay });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/skincare-products"] });
    },
    onError: () => {
      toast({ title: "Erro ao atualizar blocos", variant: "destructive" });
      queryClient.invalidateQueries({ queryKey: ["/api/skincare-products"] });
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

  const reorderMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await apiRequest("POST", "/api/skincare-products/reorder", { ids });
    },
    onError: () => {
      toast({ title: "Erro ao salvar ordem", variant: "destructive" });
      queryClient.invalidateQueries({ queryKey: ["/api/skincare-products"] });
    },
  });

  const handleDragEnd = (event: DragEndEvent, tod: SkincareTimeOfDay) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setLocalOrder((prev) => {
      const oldIds = prev[tod];
      const oldIndex = oldIds.indexOf(active.id as string);
      const newIndex = oldIds.indexOf(over.id as string);
      if (oldIndex === -1 || newIndex === -1) return prev;
      const newIds = arrayMove(oldIds, oldIndex, newIndex);
      reorderMutation.mutate(newIds);
      return { ...prev, [tod]: newIds };
    });
  };

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

  const handleStartAdding = (blockKey: SkincareTimeOfDay) => {
    setAddingFor(blockKey);
    setInlineForm({
      name: "",
      usageInstructions: "",
      imageFile: null,
      imagePreview: null,
      selectedBlocks: new Set([blockKey]),
    });
  };

  const handleCancelAdding = () => {
    setAddingFor(null);
    setInlineForm({
      name: "",
      usageInstructions: "",
      imageFile: null,
      imagePreview: null,
      selectedBlocks: new Set(),
    });
  };

  const toggleInlineBlock = (blockKey: SkincareTimeOfDay) => {
    setInlineForm((f) => {
      const next = new Set(f.selectedBlocks);
      if (next.has(blockKey)) {
        if (next.size > 1) next.delete(blockKey);
      } else {
        next.add(blockKey);
      }
      return { ...f, selectedBlocks: next };
    });
  };

  const handleAddProduct = async () => {
    if (!inlineForm.name.trim()) {
      toast({ title: "Nome é obrigatório", variant: "destructive" });
      return;
    }
    if (inlineForm.selectedBlocks.size === 0) {
      toast({ title: "Selecione ao menos um bloco", variant: "destructive" });
      return;
    }
    createProductMutation.mutate({
      name: inlineForm.name.trim(),
      usageInstructions: inlineForm.usageInstructions.trim(),
      timeOfDay: Array.from(inlineForm.selectedBlocks),
    });
  };

  const handlePrint = () => {
    if (selectedIds.size === 0) {
      toast({ title: "Selecione ao menos um produto", variant: "destructive" });
      return;
    }
    window.print();
  };

  const handlePDF = async () => {
    const selected = getOrderedSelectedProducts();
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

  const getBlockProducts = (tod: SkincareTimeOfDay): SkincareProduct[] => {
    const productMap = Object.fromEntries(products.map((p) => [p.id, p]));
    return localOrder[tod].map((id) => productMap[id]).filter(Boolean) as SkincareProduct[];
  };

  // Returns ALL selected products across all blocks in display order (deduplicated)
  const getOrderedSelectedProducts = (): SkincareProduct[] => {
    const seen = new Set<string>();
    const result: SkincareProduct[] = [];
    for (const tod of skincareTimesOfDay) {
      for (const p of getBlockProducts(tod)) {
        if (selectedIds.has(p.id) && !seen.has(p.id)) {
          seen.add(p.id);
          result.push(p);
        }
      }
    }
    return result;
  };

  const selectedCount = selectedIds.size;

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
        const blockProducts = getBlockProducts(block.key).filter((p) =>
          selectedIds.has(p.id)
        );
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
            <Button variant="outline" onClick={handlePrint} data-testid="button-print">
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
              const blockProducts = getBlockProducts(block.key);
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

                  <CardContent className="flex flex-col gap-1 flex-1">
                    {blockProducts.length === 0 && !isAddingHere && (
                      <p className="text-xs text-muted-foreground italic py-2 text-center">
                        Nenhum produto cadastrado
                      </p>
                    )}

                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={(e) => handleDragEnd(e, block.key)}
                    >
                      <SortableContext
                        items={localOrder[block.key]}
                        strategy={verticalListSortingStrategy}
                      >
                        {blockProducts.map((product) => (
                          <SortableProductItem
                            key={product.id}
                            product={product}
                            currentBlock={block.key}
                            isSelected={selectedIds.has(product.id)}
                            colorHex={block.colorHex}
                            bgClass={block.bgClass}
                            ringClass={block.ringClass}
                            onToggle={toggleProduct}
                            onDelete={(id) => deleteProductMutation.mutate(id)}
                            onUpdateBlocks={(id, blocks) =>
                              updateBlocksMutation.mutate({ id, timeOfDay: blocks })
                            }
                          />
                        ))}
                      </SortableContext>
                    </DndContext>

                    {/* Inline add form */}
                    {isAddingHere && (
                      <div className="rounded-md border bg-muted/30 p-3 space-y-2 mt-1">
                        <Input
                          placeholder="Nome do produto *"
                          value={inlineForm.name}
                          onChange={(e) =>
                            setInlineForm((f) => ({ ...f, name: e.target.value }))
                          }
                          className="text-sm h-8"
                          data-testid="input-new-product-name"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleAddProduct();
                            if (e.key === "Escape") handleCancelAdding();
                          }}
                        />
                        <Textarea
                          placeholder="Modo de uso (opcional)"
                          value={inlineForm.usageInstructions}
                          onChange={(e) =>
                            setInlineForm((f) => ({
                              ...f,
                              usageInstructions: e.target.value,
                            }))
                          }
                          className="text-sm resize-none"
                          rows={2}
                          data-testid="input-new-product-instructions"
                        />

                        {/* Block selector */}
                        <div className="space-y-1">
                          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                            Exibir nos blocos
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {blocksConfig.map((b) => {
                              const isChecked = inlineForm.selectedBlocks.has(b.key);
                              return (
                                <button
                                  key={b.key}
                                  type="button"
                                  onClick={() => toggleInlineBlock(b.key)}
                                  data-testid={`block-checkbox-${b.key}`}
                                  className={`flex items-center gap-1 rounded px-2 py-0.5 text-xs border transition-colors ${
                                    isChecked
                                      ? "border-transparent text-white"
                                      : "border-border text-muted-foreground hover:text-foreground"
                                  }`}
                                  style={
                                    isChecked
                                      ? { backgroundColor: blockByKey[b.key].colorHex }
                                      : {}
                                  }
                                >
                                  <span className={`h-1.5 w-1.5 rounded-full ${isChecked ? "bg-white/60" : b.dotClass}`} />
                                  {b.shortLabel}
                                </button>
                              );
                            })}
                          </div>
                        </div>

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
                            className="text-xs"
                            data-testid="button-select-image"
                          >
                            <ImagePlus className="h-3 w-3 mr-1" />
                            {inlineForm.imagePreview ? "Trocar imagem" : "Adicionar imagem"}
                          </Button>
                          {inlineForm.imagePreview && (
                            <img
                              src={inlineForm.imagePreview}
                              alt="preview"
                              className="h-7 w-7 rounded object-cover"
                            />
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={handleAddProduct}
                            disabled={createProductMutation.isPending}
                            className="flex-1 text-xs"
                            data-testid="button-confirm-add-product"
                          >
                            {createProductMutation.isPending ? (
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            ) : (
                              <Check className="h-3 w-3 mr-1" />
                            )}
                            Salvar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancelAdding}
                            className="text-xs"
                            data-testid="button-cancel-add-product"
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Add item button */}
                    {!isAddingHere && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-1 text-xs text-muted-foreground justify-start"
                        onClick={() => handleStartAdding(block.key)}
                        data-testid={`button-add-product-${block.key}`}
                      >
                        <Plus className="h-3 w-3 mr-1" />
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
