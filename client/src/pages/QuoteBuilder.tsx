import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  FileText, 
  Download, 
  User,
  Activity,
  Layers,
  Sparkles,
  Droplets,
  Check,
  Plus,
  Minus,
  Edit2,
  Save
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type DermaliftProtocol = "sustentacao" | "estruturacao" | "embelezamento" | "revitalizacao";

interface Procedure {
  id: number;
  dbId: string;
  name: string;
  price: number;
  protocol: DermaliftProtocol;
  description?: string;
  mlPrice?: number;
  minMl?: number;
  maxMl?: number;
}

interface SelectedItem {
  quantity: number;
  customPrice?: number;
}

export default function QuoteBuilder() {
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [selectedItems, setSelectedItems] = useState<Map<number, SelectedItem>>(new Map());
  const [patientDialogOpen, setPatientDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingPrice, setEditingPrice] = useState<number | null>(null);
  const { toast } = useToast();

  const patients = [
    { id: 1, dbId: "patient-1", name: "Maria Silva", phone: "(11) 98765-4321" },
    { id: 2, dbId: "patient-2", name: "Ana Costa", phone: "(11) 97654-3210" },
    { id: 3, dbId: "patient-3", name: "Juliana Santos", phone: "(11) 96543-2109" },
    { id: 4, dbId: "patient-4", name: "Patricia Oliveira", phone: "(11) 95432-1098" },
  ];

  const procedures: Procedure[] = [
    // Sustentação
    { id: 1, dbId: "proc-1", name: "Fios de Sustentação", price: 3500, protocol: "sustentacao", description: "Lifting facial com fios absorvíveis" },
    { id: 2, dbId: "proc-2", name: "Ultraformer III", price: 4200, protocol: "sustentacao", description: "HIFU para lifting não invasivo" },
    { id: 3, dbId: "proc-3", name: "Sculptra", price: 3800, protocol: "sustentacao", description: "Bioestimulador de colágeno" },
    
    // Estruturação
    { id: 4, dbId: "proc-4", name: "Harmonização Facial", price: 4500, protocol: "estruturacao", description: "Equilíbrio das proporções faciais" },
    { id: 5, dbId: "proc-5", name: "Preenchimento Malar", mlPrice: 800, minMl: 1, maxMl: 5, price: 800, protocol: "estruturacao", description: "Definição da região das maçãs" },
    { id: 6, dbId: "proc-6", name: "Rinoplastia Não Cirúrgica", price: 3200, protocol: "estruturacao", description: "Correção do contorno nasal" },
    
    // Embelezamento
    { id: 7, dbId: "proc-7", name: "Preenchimento Labial", mlPrice: 800, minMl: 1, maxMl: 5, price: 800, protocol: "embelezamento", description: "Volume e definição dos lábios" },
    { id: 8, dbId: "proc-8", name: "Toxina Botulínica", price: 1200, protocol: "embelezamento", description: "Suavização de rugas dinâmicas" },
    { id: 9, dbId: "proc-9", name: "Lipo de Papada", price: 5500, protocol: "embelezamento", description: "Redução de gordura localizada" },
    
    // Revitalização da Pele
    { id: 10, dbId: "proc-10", name: "Skinbooster", mlPrice: 600, minMl: 1, maxMl: 4, price: 600, protocol: "revitalizacao", description: "Hidratação profunda da pele" },
    { id: 11, dbId: "proc-11", name: "Peeling Químico", price: 1200, protocol: "revitalizacao", description: "Renovação celular" },
    { id: 12, dbId: "proc-12", name: "Laser CO2 Fracionado", price: 3500, protocol: "revitalizacao", description: "Rejuvenescimento facial" },
  ];

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
        newMap.set(procedure.id, { 
          quantity: procedure.mlPrice ? (procedure.minMl || 1) : 1 
        });
      }
      return newMap;
    });
  };

  const updateQuantity = (procedureId: number, delta: number, procedure: Procedure) => {
    setSelectedItems((prev) => {
      const newMap = new Map(prev);
      const item = newMap.get(procedureId);
      if (item) {
        const newQuantity = item.quantity + delta;
        const minMl = procedure.minMl || 1;
        const maxMl = procedure.maxMl || 10;
        
        if (newQuantity >= minMl && newQuantity <= maxMl) {
          newMap.set(procedureId, { ...item, quantity: newQuantity });
        }
      }
      return newMap;
    });
  };

  const updateCustomPrice = (procedureId: number, price: string) => {
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

  const removeCustomPrice = (procedureId: number) => {
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

    if (procedure.mlPrice) {
      return procedure.mlPrice * item.quantity;
    }

    return procedure.price;
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
          procedureId: proc.dbId,
          quantity: item.quantity,
          customPrice: item.customPrice,
          subtotal,
        };
      });

      const quoteData = {
        patientId: selectedPatient.dbId,
        total,
        discount: 0,
        status: "pending",
        notes: null,
        items,
      };

      const res = await apiRequest("POST", "/api/quotes", quoteData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Orçamento salvo!",
        description: "O orçamento foi salvo com sucesso.",
      });
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
      {/* Header com seleção de paciente */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
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

      {/* Grid dos 4 Pilares + Painel de Resumo */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Grid 2x2 dos Pilares */}
        <div className="lg:col-span-2 grid gap-6 md:grid-cols-2">
          {(Object.keys(protocolConfig) as DermaliftProtocol[]).map((protocol) => {
            const config = protocolConfig[protocol];
            const Icon = config.icon;
            const protocolProcedures = procedures.filter((p) => p.protocol === protocol);

            return (
              <Card
                key={protocol}
                className={`ring-1 ${config.borderColor} hover-elevate`}
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
                            <div className="flex flex-col items-end gap-1">
                              {procedure.mlPrice ? (
                                <span className={`text-sm font-semibold ${isSelected ? config.textColor : "text-foreground"}`}>
                                  R$ {procedure.mlPrice.toLocaleString()} / mL
                                </span>
                              ) : (
                                <span className={`text-sm font-semibold ${isSelected ? config.textColor : "text-foreground"}`}>
                                  R$ {procedure.price.toLocaleString()}
                                </span>
                              )}
                              {isSelected && !procedure.mlPrice && (
                                <Check className={`h-4 w-4 ${config.textColor}`} />
                              )}
                            </div>
                          </div>
                          
                          {isSelected && procedure.mlPrice && item && (
                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                              <div className="flex items-center gap-2">
                                <Button
                                  size="icon"
                                  variant="outline"
                                  className="h-7 w-7"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateQuantity(procedure.id, -1, procedure);
                                  }}
                                  disabled={item.quantity <= (procedure.minMl || 1)}
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
                                  disabled={item.quantity >= (procedure.maxMl || 10)}
                                  data-testid={`button-increase-${procedure.id}`}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-sm font-semibold ${config.textColor}`}>
                                  R$ {(procedure.mlPrice * item.quantity).toLocaleString()}
                                </span>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleProcedure(procedure);
                                  }}
                                  data-testid={`button-remove-${procedure.id}`}
                                >
                                  <Check className={`h-4 w-4 ${config.textColor}`} />
                                </Button>
                              </div>
                            </div>
                          )}
                          
                          {isSelected && !procedure.mlPrice && (
                            <div className="flex justify-end mt-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleProcedure(procedure);
                                }}
                                data-testid={`button-remove-${procedure.id}`}
                              >
                                Remover
                              </Button>
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
        </div>

        {/* Painel de Resumo */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6 ring-1 ring-[hsl(var(--chart-3))]/20">
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
                        const subtotal = calculateSubtotal(procedure);
                        const hasCustomPrice = item?.customPrice !== undefined;
                        
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
                                {procedure.mlPrice && item && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {item.quantity} mL × R$ {procedure.mlPrice}
                                  </p>
                                )}
                              </div>
                              {editingPrice === procedure.id ? (
                                <div className="flex items-center gap-1">
                                  <Input
                                    type="number"
                                    className="h-7 w-20 text-xs"
                                    defaultValue={item?.customPrice || subtotal}
                                    onBlur={(e) => {
                                      const value = e.target.value;
                                      if (value) {
                                        updateCustomPrice(procedure.id, value);
                                      }
                                      setEditingPrice(null);
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        const value = (e.target as HTMLInputElement).value;
                                        if (value) {
                                          updateCustomPrice(procedure.id, value);
                                        }
                                        setEditingPrice(null);
                                      }
                                    }}
                                    autoFocus
                                    data-testid={`input-price-${procedure.id}`}
                                  />
                                </div>
                              ) : (
                                <div className="flex items-center gap-1">
                                  <span className="font-semibold text-foreground text-sm whitespace-nowrap">
                                    R$ {subtotal.toLocaleString()}
                                  </span>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-6 w-6"
                                    onClick={() => setEditingPrice(procedure.id)}
                                    data-testid={`button-edit-price-${procedure.id}`}
                                  >
                                    <Edit2 className={`h-3 w-3 ${hasCustomPrice ? 'text-primary' : ''}`} />
                                  </Button>
                                </div>
                              )}
                            </div>
                            {hasCustomPrice && (
                              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                                <span className="text-xs text-muted-foreground">Preço customizado</span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 text-xs"
                                  onClick={() => removeCustomPrice(procedure.id)}
                                  data-testid={`button-reset-price-${procedure.id}`}
                                >
                                  Restaurar original
                                </Button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-lg font-semibold text-foreground">Total</span>
                      <span className="text-2xl font-bold text-primary" data-testid="text-total-amount">
                        R$ {total.toLocaleString()}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <Button
                        className="w-full bg-gradient-to-r from-primary to-chart-2 hover:opacity-90"
                        disabled={!selectedPatient || selectedProceduresList.length === 0 || saveQuoteMutation.isPending}
                        onClick={handleSaveQuote}
                        data-testid="button-save-quote"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {saveQuoteMutation.isPending ? "Salvando..." : "Salvar Orçamento"}
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
        </div>
      </div>
    </div>
  );
}
