import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { 
  Search, 
  User,
  Activity,
  Layers,
  Sparkles,
  Droplets,
  Check,
  Plus,
  Minus,
  Edit2,
  Save,
  FileText,
  Download,
  MessageSquare
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type Procedure, type DermaliftProtocol, type Patient } from "@shared/schema";

interface SelectedItem {
  quantity: number;
  customPrice?: number;
  note?: string;
}

export default function QuoteBuilder() {
  const [, setLocation] = useLocation();
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedItems, setSelectedItems] = useState<Map<string, SelectedItem>>(new Map());
  const [patientDialogOpen, setPatientDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingPrice, setEditingPrice] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch procedures from API
  const { data: procedures = [], isLoading: isLoadingProcedures } = useQuery<Procedure[]>({
    queryKey: ["/api/procedures"],
  });

  // Fetch patients from API
  const { data: patients = [], isLoading: isLoadingPatients } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  // Get loadQuote parameter from URL
  const urlParams = new URLSearchParams(window.location.search);
  const loadQuoteId = urlParams.get('loadQuote');

  // Load quote data if loadQuote parameter exists
  const { data: loadedQuote } = useQuery<any>({
    queryKey: ['/api/quotes', loadQuoteId],
    enabled: !!loadQuoteId,
  });

  // Populate form when quote is loaded
  useEffect(() => {
    if (loadedQuote && procedures.length > 0) {
      // Set the patient
      setSelectedPatient(loadedQuote.patient);
      
      // Set the selected items
      const itemsMap = new Map<string, SelectedItem>();
      loadedQuote.items.forEach((item: any) => {
        // Find the procedure by matching the name or id
        const procedure = procedures.find(p => p.id === item.procedure.id || p.name === item.procedure.name);
        if (procedure) {
          itemsMap.set(procedure.id, {
            quantity: parseFloat(item.quantity),
            customPrice: item.customPrice ? parseFloat(item.customPrice) : undefined,
            note: item.note || undefined,
          });
        }
      });
      setSelectedItems(itemsMap);
    }
  }, [loadedQuote, procedures]);

  const protocolConfig = {
    sustentacao: {
      title: "Sustentação",
      icon: Activity,
      color: "hsl(var(--primary))",
      bgColor: "bg-[hsl(var(--primary))]/10",
      borderColor: "ring-[hsl(var(--primary))]/30",
      textColor: "text-[hsl(var(--primary))]",
      description: "Base estrutural do tratamento"
    },
    estruturacao: {
      title: "Estruturação",
      icon: Layers,
      color: "hsl(var(--chart-2))",
      bgColor: "bg-[hsl(var(--chart-2))]/10",
      borderColor: "ring-[hsl(var(--chart-2))]/30",
      textColor: "text-[hsl(var(--chart-2))]",
      description: "Definição e proporções faciais"
    },
    embelezamento: {
      title: "Embelezamento",
      icon: Sparkles,
      color: "hsl(var(--chart-3))",
      bgColor: "bg-[hsl(var(--chart-3))]/10",
      borderColor: "ring-[hsl(var(--chart-3))]/30",
      textColor: "text-[hsl(var(--chart-3))]",
      description: "Refinamento estético"
    },
    revitalizacao: {
      title: "Revitalização da Pele",
      icon: Droplets,
      color: "hsl(var(--chart-4))",
      bgColor: "bg-[hsl(var(--chart-4))]/10",
      borderColor: "ring-[hsl(var(--chart-4))]/30",
      textColor: "text-[hsl(var(--chart-4))]",
      description: "Qualidade e textura da pele"
    }
  };

  const toggleProcedure = (procedure: Procedure) => {
    setSelectedItems((prev) => {
      const newMap = new Map(prev);
      if (newMap.has(procedure.id)) {
        newMap.delete(procedure.id);
      } else {
        const mlPrice = procedure.mlPrice ? parseFloat(procedure.mlPrice as string) : null;
        const minMl = procedure.minMl ? parseFloat(procedure.minMl as string) : 1;
        newMap.set(procedure.id, { 
          quantity: mlPrice ? minMl : 1 
        });
      }
      return newMap;
    });
  };

  const updateQuantity = (procedureId: string, delta: number, procedure: Procedure) => {
    setSelectedItems((prev) => {
      const newMap = new Map(prev);
      const item = newMap.get(procedureId);
      if (item) {
        const newQuantity = item.quantity + delta;
        
        // For mlPrice procedures, use minMl/maxMl constraints
        // For regular procedures, allow 1-99
        const minQty = procedure.mlPrice ? (procedure.minMl ? parseFloat(procedure.minMl as string) : 1) : 1;
        const maxQty = procedure.mlPrice ? (procedure.maxMl ? parseFloat(procedure.maxMl as string) : 10) : 99;
        
        if (newQuantity >= minQty && newQuantity <= maxQty) {
          newMap.set(procedureId, { ...item, quantity: newQuantity });
        }
      }
      return newMap;
    });
  };

  const updateCustomPrice = (procedureId: string, price: string) => {
    const numPrice = parseFloat(price);
    if (!isNaN(numPrice) && numPrice > 0) {
      setSelectedItems((prev) => {
        const newMap = new Map(prev);
        const item = newMap.get(procedureId);
        if (item) {
          newMap.set(procedureId, { ...item, customPrice: numPrice });
        }
        return newMap;
      });
    }
  };

  const removeCustomPrice = (procedureId: string) => {
    setSelectedItems((prev) => {
      const newMap = new Map(prev);
      const item = newMap.get(procedureId);
      if (item) {
        const { customPrice, ...rest } = item;
        newMap.set(procedureId, rest);
      }
      return newMap;
    });
  };

  const updateNote = (procedureId: string, note: string) => {
    setSelectedItems((prev) => {
      const newMap = new Map(prev);
      const item = newMap.get(procedureId);
      if (item) {
        newMap.set(procedureId, { ...item, note: note.trim() || undefined });
      }
      return newMap;
    });
  };

  const removeNote = (procedureId: string) => {
    setSelectedItems((prev) => {
      const newMap = new Map(prev);
      const item = newMap.get(procedureId);
      if (item) {
        const { note, ...rest } = item;
        newMap.set(procedureId, rest);
      }
      return newMap;
    });
  };

  const handleSelectPatient = (patient: any) => {
    setSelectedPatient(patient);
    setPatientDialogOpen(false);
  };

  const filteredPatients = patients.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calculateSubtotal = (procedure: Procedure) => {
    const item = selectedItems.get(procedure.id);
    if (!item) return 0;

    if (item.customPrice !== undefined) {
      return item.customPrice;
    }

    const mlPrice = procedure.mlPrice ? parseFloat(procedure.mlPrice as string) : null;
    if (mlPrice) {
      return mlPrice * item.quantity;
    }

    // Multiply base price by quantity for non-mlPrice procedures
    return parseFloat(procedure.price as string) * item.quantity;
  };

  const total = procedures
    .filter((p) => selectedItems.has(p.id))
    .reduce((sum, p) => sum + calculateSubtotal(p), 0);

  const selectedProceduresList = procedures.filter((p) =>
    selectedItems.has(p.id)
  );

  // Mutation to save quote
  const saveQuoteMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPatient) {
        throw new Error("Nenhum paciente selecionado");
      }
      
      if (selectedProceduresList.length === 0) {
        throw new Error("Nenhum procedimento selecionado");
      }

      const items = selectedProceduresList.map(proc => {
        const item = selectedItems.get(proc.id)!;
        const subtotal = calculateSubtotal(proc);
        
        return {
          procedureId: proc.id,
          quantity: item.quantity,
          customPrice: item.customPrice,
          subtotal,
          note: item.note,
        };
      });

      const quoteData = {
        patientId: selectedPatient.id,
        total,
        discount: 0,
        status: "pending",
        notes: null,
        items,
      };

      const res = await apiRequest("POST", "/api/quotes", quoteData);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Orçamento salvo!",
        description: "Abrindo apresentação...",
      });
      // Invalidar cache para recarregar lista
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      // Navegar para apresentação
      setLocation(`/apresentacao/${data.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao salvar",
        description: error.message || "Não foi possível salvar o orçamento.",
        variant: "destructive",
      });
    },
  });

  const handleSaveQuote = () => {
    saveQuoteMutation.mutate();
  };

  return (
    <div className="space-y-6">
      {/* Título da página */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-serif text-3xl font-bold text-[hsl(var(--primary))]">
            Protocolo Dermalift
          </h1>
          <p className="text-muted-foreground">Monte o tratamento ideal para seu paciente</p>
        </div>

        <Dialog open={patientDialogOpen} onOpenChange={setPatientDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant={selectedPatient ? "outline" : "default"}
              size="lg"
              data-testid="button-select-patient"
            >
              <User className="h-4 w-4 mr-2" />
              {selectedPatient ? selectedPatient.name : "Selecionar Paciente"}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md" data-testid="dialog-select-patient">
            <DialogHeader>
              <DialogTitle>Selecionar Paciente</DialogTitle>
              <DialogDescription>
                Escolha o paciente para criar o protocolo personalizado
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar paciente..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  data-testid="input-search-patient"
                />
              </div>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {filteredPatients.map((patient) => (
                  <div
                    key={patient.id}
                    className={`flex items-center gap-3 rounded-md border p-3 cursor-pointer hover-elevate active-elevate-2 ${
                      selectedPatient?.id === patient.id ? "border-primary bg-primary/5" : ""
                    }`}
                    onClick={() => handleSelectPatient(patient)}
                    data-testid={`card-patient-${patient.id}`}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {patient.name.split(" ").map(n => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{patient.name}</p>
                      <p className="text-sm text-muted-foreground">{patient.phone}</p>
                    </div>
                    {selectedPatient?.id === patient.id && (
                      <Check className="h-5 w-5 text-primary" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Nome do paciente selecionado */}
      {selectedPatient && (
        <Card className="ring-1 ring-primary/20" data-testid="card-selected-patient">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {selectedPatient.name.split(" ").map((n: string) => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Paciente</p>
                <p className="text-lg font-semibold text-foreground" data-testid="text-selected-patient-name">{selectedPatient.name}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Linha Horizontal: 4 Pilares + Painel de Resumo */}
      <div className="flex gap-6 overflow-x-auto pb-4">
        {isLoadingProcedures ? (
          <div className="w-full text-center py-8 text-muted-foreground">
            Carregando procedimentos...
          </div>
        ) : (
          <>
            {(Object.keys(protocolConfig) as DermaliftProtocol[]).map((protocol) => {
              const config = protocolConfig[protocol];
              const Icon = config.icon;
              const protocolProcedures = procedures.filter((p) => p.protocol === protocol);

              return (
                <Card
                  key={protocol}
                  className={`ring-1 ${config.borderColor} hover-elevate flex-shrink-0 w-[380px]`}
                  data-testid={`card-protocol-${protocol}`}
                >
                  <CardHeader className={`${config.bgColor} rounded-t-xl`}>
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-md ${config.bgColor} ring-1 ${config.borderColor}`}>
                        <Icon className={`h-5 w-5 ${config.textColor}`} />
                      </div>
                      <div className="flex-1">
                        <CardTitle className={`text-lg ${config.textColor}`}>
                          {config.title}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">
                          {config.description}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      {protocolProcedures.map((procedure) => {
                        const isSelected = selectedItems.has(procedure.id);
                        const item = selectedItems.get(procedure.id);
                        
                        return (
                          <div
                            key={procedure.id}
                            className={`p-3 rounded-md border transition-all ${
                              isSelected
                                ? `${config.bgColor} ${config.borderColor} ring-2`
                                : "border-border hover-elevate"
                            }`}
                            data-testid={`procedure-${procedure.id}`}
                          >
                            <div 
                              className="flex items-start justify-between gap-2 cursor-pointer"
                              onClick={() => !isSelected && toggleProcedure(procedure)}
                            >
                              <div className="flex-1">
                                <p className={`font-medium ${isSelected ? config.textColor : "text-foreground"}`}>
                                  {procedure.name}
                                </p>
                                {procedure.description && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {procedure.description}
                                  </p>
                                )}
                              </div>
                              {isSelected && (
                                <Check className={`h-4 w-4 ${config.textColor}`} />
                              )}
                            </div>
                            
                            {isSelected && procedure.mlPrice && item && (
                              <div className="flex items-center justify-center mt-3 pt-3 border-t border-border/50">
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    className="h-7 w-7"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateQuantity(procedure.id, -1, procedure);
                                    }}
                                    disabled={item.quantity <= (procedure.minMl ? parseFloat(procedure.minMl as string) : 1)}
                                    data-testid={`button-decrease-${procedure.id}`}
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  <span className={`text-sm font-medium min-w-[3rem] text-center ${config.textColor}`}>
                                    {item.quantity} mL
                                  </span>
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    className="h-7 w-7"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateQuantity(procedure.id, 1, procedure);
                                    }}
                                    disabled={item.quantity >= (procedure.maxMl ? parseFloat(procedure.maxMl as string) : 10)}
                                    data-testid={`button-increase-${procedure.id}`}
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            )}
                            
                            {isSelected && !procedure.mlPrice && item && (
                              <div className="flex items-center justify-center mt-3 pt-3 border-t border-border/50">
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    className="h-7 w-7"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateQuantity(procedure.id, -1, procedure);
                                    }}
                                    disabled={item.quantity <= 1}
                                    data-testid={`button-decrease-${procedure.id}`}
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  <span className={`text-sm font-medium min-w-[3rem] text-center ${config.textColor}`}>
                                    {item.quantity}x
                                  </span>
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    className="h-7 w-7"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateQuantity(procedure.id, 1, procedure);
                                    }}
                                    disabled={item.quantity >= 99}
                                    data-testid={`button-increase-${procedure.id}`}
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {/* Painel de Resumo */}
            <Card className="ring-1 ring-[hsl(var(--chart-3))]/20 flex-shrink-0 w-[380px]">
            <CardHeader className="bg-gradient-to-r from-transparent via-[hsl(var(--chart-3))]/5 to-transparent">
              <CardTitle className="text-[hsl(var(--primary))]">Resumo do Protocolo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedProceduresList.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Selecione os tratamentos para montar o protocolo
                </p>
              ) : (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Tratamentos Selecionados ({selectedProceduresList.length})
                    </p>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {selectedProceduresList.map((procedure) => {
                        const config = protocolConfig[procedure.protocol];
                        const item = selectedItems.get(procedure.id);
                        
                        return (
                          <div
                            key={procedure.id}
                            className="rounded-md bg-muted p-3"
                          >
                            <div className="flex justify-between items-start gap-2 mb-2">
                              <div className="flex-1">
                                <p className="font-medium text-foreground text-sm">{procedure.name}</p>
                                <Badge className={`text-xs mt-1 ${config.bgColor} ${config.textColor} border-0`}>
                                  {config.title}
                                </Badge>
                                {item && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {procedure.mlPrice ? (
                                      <>{item.quantity} mL</>
                                    ) : (
                                      <>{item.quantity}x</>
                                    )}
                                  </p>
                                )}
                              </div>
                            </div>
                            
                            {/* Note section */}
                            <div className={`${item?.note ? 'pt-2 border-t border-border/50' : 'pt-2'}`}>
                              {editingNote === procedure.id ? (
                                <div className="space-y-2">
                                  <Input
                                    type="text"
                                    placeholder="Ex: região malar direita, aplicação na testa..."
                                    className="h-8 text-xs"
                                    defaultValue={item?.note || ''}
                                    onBlur={(e) => {
                                      const value = e.target.value.trim();
                                      if (value) {
                                        updateNote(procedure.id, value);
                                      } else {
                                        removeNote(procedure.id);
                                      }
                                      setEditingNote(null);
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        const value = (e.target as HTMLInputElement).value.trim();
                                        if (value) {
                                          updateNote(procedure.id, value);
                                        } else {
                                          removeNote(procedure.id);
                                        }
                                        setEditingNote(null);
                                      } else if (e.key === 'Escape') {
                                        setEditingNote(null);
                                      }
                                    }}
                                    autoFocus
                                    data-testid={`input-note-${procedure.id}`}
                                  />
                                </div>
                              ) : (
                                <div>
                                  {item?.note ? (
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex items-start gap-1 flex-1">
                                        <MessageSquare className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                                        <p className="text-xs text-muted-foreground italic">{item.note}</p>
                                      </div>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-5 w-5"
                                        onClick={() => setEditingNote(procedure.id)}
                                        data-testid={`button-edit-note-${procedure.id}`}
                                      >
                                        <Edit2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 text-xs text-muted-foreground"
                                      onClick={() => setEditingNote(procedure.id)}
                                      data-testid={`button-add-note-${procedure.id}`}
                                    >
                                      <MessageSquare className="h-3 w-3 mr-1" />
                                      Adicionar observação
                                    </Button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="space-y-2">
                      <Button
                        className="w-full bg-gradient-to-r from-primary to-chart-2 hover:opacity-90"
                        disabled={!selectedPatient || selectedProceduresList.length === 0 || saveQuoteMutation.isPending}
                        onClick={handleSaveQuote}
                        data-testid="button-save-quote"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {saveQuoteMutation.isPending ? "Salvando..." : "Salvar e Apresentar"}
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                        disabled={!selectedPatient || selectedProceduresList.length === 0}
                        data-testid="button-generate-pdf"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Gerar Orçamento PDF
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                        disabled={!selectedPatient || selectedProceduresList.length === 0}
                        data-testid="button-share-quote"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Compartilhar Link
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
          </>
        )}
      </div>
    </div>
  );
}
