import { useState, useEffect, useRef, useMemo } from "react";
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
  MessageSquare,
  Loader2
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import FaceMap from "@/components/FaceMap";
import { useToast } from "@/hooks/use-toast";
import { type Procedure, type DermaliftProtocol, type Patient } from "@shared/schema";
import { generateQuotePDF } from "@/lib/generateQuotePDF";

interface SelectedItem {
  quantity: number;
  customPrice?: number;
  note?: string;
}

export default function QuoteBuilder() {
  const [location, setLocation] = useLocation();
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedItems, setSelectedItems] = useState<Map<string, SelectedItem>>(new Map());
  const [patientDialogOpen, setPatientDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddName, setQuickAddName] = useState("");
  const [quickAddPhone, setQuickAddPhone] = useState("");
  const [editingPrice, setEditingPrice] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [discountPercentage, setDiscountPercentage] = useState<number>(0);
  const [installments, setInstallments] = useState<number>(1);
  const [downPayment, setDownPayment] = useState<number>(0);
  const [bonusList, setBonusList] = useState<string[]>([]);
  const [newBonus, setNewBonus] = useState("");
  // Áreas do mapa facial marcadas por pilar. Independente dos procedimentos:
  // serve só para o paciente ver, na proposta, onde será tratado.
  const [faceZones, setFaceZones] = useState<Record<string, string[]>>({});
  const prevLoadQuoteIdRef = useRef<string | null | undefined>(undefined);
  const isHydratedRef = useRef<boolean>(false);
  const { toast } = useToast();

  // Fetch procedures from API
  const { data: procedures = [], isLoading: isLoadingProcedures } = useQuery<Procedure[]>({
    queryKey: ["/api/procedures"],
  });

  // Fetch patients from API
  const { data: patients = [], isLoading: isLoadingPatients } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  // Get URL parameters reactively - useMemo ensures it updates when location changes
  const { loadQuoteId, preselectedPatientId } = useMemo(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const loadQuote = urlParams.get('loadQuote');
    const patient = urlParams.get('patient');
    return { loadQuoteId: loadQuote, preselectedPatientId: patient };
  }, [location]); // Re-compute when location changes

  // Load quote data if loadQuote parameter exists
  const { data: loadedQuote, isLoading: isLoadingQuote } = useQuery<any>({
    queryKey: ['/api/quotes', loadQuoteId],
    enabled: !!loadQuoteId,
  });

  // Helper function to reset all form states
  const resetForm = () => {
    setSelectedPatient(null);
    setSelectedItems(new Map());
    setDiscountPercentage(0);
    setInstallments(1);
    setDownPayment(0);
    setBonusList([]);
    setNewBonus("");
    setFaceZones({});
    setEditingPrice(null);
    setEditingNote(null);
    isHydratedRef.current = false;
  };

  // Reset form when loadQuoteId changes
  useEffect(() => {
    // Check if loadQuoteId actually changed from previous value
    if (prevLoadQuoteIdRef.current !== loadQuoteId) {
      resetForm();
      prevLoadQuoteIdRef.current = loadQuoteId;
    }
  }, [loadQuoteId]);

  // Pre-select patient from URL parameter
  useEffect(() => {
    if (preselectedPatientId && patients.length > 0 && !selectedPatient) {
      const patient = patients.find(p => p.id.toString() === preselectedPatientId);
      if (patient) {
        setSelectedPatient(patient);
      }
    }
  }, [preselectedPatientId, patients, selectedPatient]);

  // Populate form when quote is loaded
  useEffect(() => {
    // Only hydrate if we have a quote, procedures, and haven't hydrated yet for this quote
    if (loadedQuote && procedures.length > 0 && !isHydratedRef.current && String(loadedQuote.id) === loadQuoteId) {
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

      // Restore discount, installments, down payment and bonus list
      if (loadedQuote.discountPercentage !== undefined && loadedQuote.discountPercentage !== null) {
        setDiscountPercentage(parseFloat(loadedQuote.discountPercentage));
      }
      if (loadedQuote.installments !== undefined && loadedQuote.installments !== null) {
        setInstallments(loadedQuote.installments);
      }
      if (loadedQuote.downPayment !== undefined && loadedQuote.downPayment !== null) {
        setDownPayment(parseFloat(loadedQuote.downPayment));
      }
      if (loadedQuote.bonusList && Array.isArray(loadedQuote.bonusList)) {
        setBonusList(loadedQuote.bonusList);
      }

      if (loadedQuote.faceZones && typeof loadedQuote.faceZones === "object") {
        setFaceZones(loadedQuote.faceZones as Record<string, string[]>);
      }

      // Mark as hydrated
      isHydratedRef.current = true;
    }
  }, [loadedQuote, procedures, loadQuoteId]);

  const protocolConfig = {
    sustentacao: {
      title: "Sustentação",
      icon: Activity,
      color: "hsl(var(--ring))",
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
    },
    alem_da_face: {
      title: "Além da Face",
      icon: User,
      color: "hsl(var(--chart-5))",
      bgColor: "bg-[hsl(var(--chart-5))]/10",
      borderColor: "ring-[hsl(var(--chart-5))]/30",
      textColor: "text-[hsl(var(--chart-5))]",
      description: "Tratamentos corporais e além do facial"
    }
  };

  const toggleProcedure = (procedure: Procedure) => {
    setSelectedItems((prev) => {
      const newMap = new Map(prev);
      if (newMap.has(procedure.id)) {
        newMap.delete(procedure.id);
      } else {
        const mlPrice = procedure.mlPrice ? parseFloat(procedure.mlPrice as string) : null;
        newMap.set(procedure.id, { 
          quantity: mlPrice ? 1 : 1 
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
        
        // No limits - allow any positive quantity (minimum 1)
        if (newQuantity >= 1) {
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
    const discountedPrice = procedure.discountedPrice ? parseFloat(procedure.discountedPrice as string) : null;
    const basePrice = parseFloat(procedure.price as string);
    
    if (mlPrice) {
      // Use discounted price if available, otherwise use mlPrice
      const pricePerUnit = discountedPrice || mlPrice;
      return pricePerUnit * item.quantity;
    }

    // Use discounted price if available, otherwise use base price
    const pricePerUnit = discountedPrice || basePrice;
    return pricePerUnit * item.quantity;
  };

  const subtotal = procedures
    .filter((p) => selectedItems.has(p.id))
    .reduce((sum, p) => sum + calculateSubtotal(p), 0);

  const discountAmount = (subtotal * discountPercentage) / 100;
  const total = subtotal - discountAmount;
  
  // Clamp downPayment to not exceed total
  const validDownPayment = Math.min(downPayment, total);
  const remainingAfterDownPayment = Math.max(0, total - validDownPayment);
  const installmentValue = installments > 0 ? remainingAfterDownPayment / installments : remainingAfterDownPayment;

  const selectedProceduresList = procedures.filter((p) =>
    selectedItems.has(p.id)
  );

  const addBonus = () => {
    if (newBonus.trim()) {
      setBonusList([...bonusList, newBonus.trim()]);
      setNewBonus("");
    }
  };

  const removeBonus = (index: number) => {
    setBonusList(bonusList.filter((_, i) => i !== index));
  };

  // Mutation to quick add patient
  const quickAddPatientMutation = useMutation({
    mutationFn: async (data: { name: string; phone: string }) => {
      const res = await apiRequest("POST", "/api/patients", data);
      return await res.json();
    },
    onSuccess: (newPatient) => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      setSelectedPatient(newPatient);
      setPatientDialogOpen(false);
      setShowQuickAdd(false);
      setQuickAddName("");
      setQuickAddPhone("");
      toast({
        title: "Paciente adicionado!",
        description: "Você pode completar o cadastro depois na página de Pacientes.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao adicionar paciente",
        description: error.message || "Não foi possível adicionar o paciente.",
        variant: "destructive",
      });
    },
  });

  const handleQuickAddPatient = () => {
    if (!quickAddName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, informe o nome do paciente.",
        variant: "destructive",
      });
      return;
    }
    quickAddPatientMutation.mutate({ 
      name: quickAddName.trim(), 
      phone: quickAddPhone.trim() 
    });
  };

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
        discount: discountAmount,
        discountPercentage,
        installments,
        downPayment: validDownPayment,
        bonusList,
        status: loadedQuote?.status || "pending",
        notes: null,
        faceZones,
        items,
      };

      // Se está editando um orçamento existente, usa PUT. Caso contrário, usa POST
      const isEditing = !!loadQuoteId;
      const method = isEditing ? "PUT" : "POST";
      const endpoint = isEditing ? `/api/quotes/${loadQuoteId}` : "/api/quotes";
      
      const res = await apiRequest(method, endpoint, quoteData);
      return await res.json();
    },
    onSuccess: (data) => {
      const isEditing = !!loadQuoteId;
      toast({
        title: isEditing ? "Orçamento atualizado!" : "Orçamento salvo!",
        description: "Abrindo apresentação...",
      });
      // Invalidar cache para recarregar todas as telas
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/recent-quotes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reports/metrics"] });
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

  const handleDownloadPDF = () => {
    if (!selectedPatient || selectedProceduresList.length === 0) {
      toast({
        title: "Não é possível gerar PDF",
        description: "Selecione um paciente e procedimentos primeiro.",
        variant: "destructive",
      });
      return;
    }

    const items = selectedProceduresList.map(proc => {
      const item = selectedItems.get(proc.id)!;
      const subtotal = calculateSubtotal(proc);
      
      return {
        quantity: item.quantity.toString(),
        subtotal: subtotal.toString(),
        note: item.note,
        procedure: {
          name: proc.name,
          protocol: proc.protocol,
          description: proc.description,
        },
      };
    });

    const quoteData = {
      patient: {
        name: selectedPatient.name,
      },
      items,
      total: total.toString(),
      discount: discountAmount > 0 ? discountAmount.toString() : undefined,
      discountPercentage: discountPercentage > 0 ? discountPercentage.toString() : undefined,
      installments: installments > 1 ? installments : undefined,
      downPayment: validDownPayment > 0 ? validDownPayment.toString() : undefined,
      bonusList: bonusList.length > 0 ? bonusList : undefined,
      faceZones,
    };

    generateQuotePDF(quoteData);
    
    toast({
      title: "PDF gerado com sucesso!",
      description: "O arquivo foi baixado para seu computador.",
    });
  };

  // Show loading spinner while quote is being loaded
  if (loadQuoteId && isLoadingQuote) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground">Carregando orçamento...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Título da página */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-serif text-[28px] font-bold tracking-tight text-foreground">
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
              <DialogTitle>{showQuickAdd ? "Adicionar Paciente" : "Selecionar Paciente"}</DialogTitle>
              <DialogDescription>
                {showQuickAdd 
                  ? "Cadastro rápido - complete os dados depois" 
                  : "Escolha o paciente para criar o protocolo personalizado"}
              </DialogDescription>
            </DialogHeader>
            
            {showQuickAdd ? (
              <div className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">
                      Nome *
                    </label>
                    <Input
                      placeholder="Nome do paciente"
                      value={quickAddName}
                      onChange={(e) => setQuickAddName(e.target.value)}
                      data-testid="input-quick-add-name"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">
                      Telefone
                    </label>
                    <Input
                      placeholder="(00) 00000-0000"
                      value={quickAddPhone}
                      onChange={(e) => setQuickAddPhone(e.target.value)}
                      data-testid="input-quick-add-phone"
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowQuickAdd(false);
                      setQuickAddName("");
                      setQuickAddPhone("");
                    }}
                    data-testid="button-cancel-quick-add"
                  >
                    Voltar
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleQuickAddPatient}
                    disabled={quickAddPatientMutation.isPending || !quickAddName.trim()}
                    data-testid="button-confirm-quick-add"
                  >
                    {quickAddPatientMutation.isPending ? "Salvando..." : "Adicionar"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Buscar paciente..."
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      data-testid="input-search-patient"
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setShowQuickAdd(true)}
                    data-testid="button-show-quick-add"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Novo
                  </Button>
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
                          {patient.name.split(" ").slice(0, 2).map(n => n[0]).join("")}
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
            )}
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
                  {selectedPatient.name.split(" ").slice(0, 2).map((n: string) => n[0]).join("")}
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
              const protocolProcedures = procedures
                .filter((p) => p.protocol === protocol)
                .sort((a, b) => {
                  // Sort by displayOrder first (ascending), then by name
                  const orderA = a.displayOrder ?? 0;
                  const orderB = b.displayOrder ?? 0;
                  if (orderA !== orderB) {
                    return orderA - orderB;
                  }
                  return a.name.localeCompare(b.name);
                });

              return (
                <Card
                  key={protocol}
                  className={`ring-1 ${config.borderColor} hover-elevate flex-shrink-0 w-[380px]`}
                  data-testid={`card-protocol-${protocol}`}
                >
                  <CardHeader className={`${config.bgColor} rounded-t-2xl px-5 py-4`}>
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-background/70">
                        <Icon className={`h-[18px] w-[18px] ${config.textColor}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <CardTitle className={`text-base font-semibold ${config.textColor}`}>
                          {config.title}
                        </CardTitle>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {config.description}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="px-5 pb-5 pt-4">
                    {/* Mapa facial: o profissional marca as áreas que serão
                        tratadas neste pilar. Puramente ilustrativo — não altera
                        procedimentos nem valores. */}
                    <FaceMap
                      value={faceZones[protocol] ?? []}
                      onChange={(ids) =>
                        setFaceZones((prev) => ({ ...prev, [protocol]: ids }))
                      }
                      accent={config.color}
                      maxChips={6}
                      className="mb-4 w-full"
                    />

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
                              onClick={() => toggleProcedure(procedure)}
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
                                    disabled={item.quantity <= 1}
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
            <Card className="border-border/60 flex-shrink-0 w-[380px]">
          <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold tracking-tight">Resumo do Protocolo</CardTitle>
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
                              <div className="text-right">
                                {editingPrice === procedure.id ? (
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="Preço"
                                    className="h-8 w-28 text-right text-sm"
                                    defaultValue={item?.customPrice || calculateSubtotal(procedure)}
                                    onBlur={(e) => {
                                      const value = e.target.value.trim();
                                      if (value && parseFloat(value) > 0) {
                                        updateCustomPrice(procedure.id, value);
                                      } else {
                                        removeCustomPrice(procedure.id);
                                      }
                                      setEditingPrice(null);
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        const value = (e.target as HTMLInputElement).value.trim();
                                        if (value && parseFloat(value) > 0) {
                                          updateCustomPrice(procedure.id, value);
                                        } else {
                                          removeCustomPrice(procedure.id);
                                        }
                                        setEditingPrice(null);
                                      } else if (e.key === 'Escape') {
                                        setEditingPrice(null);
                                      }
                                    }}
                                    autoFocus
                                    data-testid={`input-price-${procedure.id}`}
                                  />
                                ) : (
                                  <div className="flex items-center gap-1">
                                    <p className="font-semibold text-primary" data-testid={`text-subtotal-${procedure.id}`}>
                                      R$ {calculateSubtotal(procedure).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </p>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-5 w-5"
                                      onClick={() => setEditingPrice(procedure.id)}
                                      data-testid={`button-edit-price-${procedure.id}`}
                                    >
                                      <Edit2 className="h-3 w-3" />
                                    </Button>
                                  </div>
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

                  {/* Discount, Installments and Bonus Section */}
                  <div className="border-t pt-4 space-y-3">
                    {/* Discount and Installments side by side */}
                    <div className="grid grid-cols-2 gap-3">
                      {/* Discount Percentage */}
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                          Desconto (%)
                        </label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={discountPercentage}
                          onChange={(e) => setDiscountPercentage(parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          className="h-9"
                          data-testid="input-discount-percentage"
                        />
                      </div>

                      {/* Installments */}
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                          Parcelas
                        </label>
                        <Input
                          type="number"
                          min="1"
                          step="1"
                          value={installments}
                          onChange={(e) => setInstallments(parseInt(e.target.value) || 1)}
                          placeholder="1"
                          className="h-9"
                          data-testid="input-installments"
                        />
                      </div>
                    </div>

                    {/* Bonus List */}
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                        Bônus
                      </label>
                      <div className="flex gap-2 mb-2">
                        <Input
                          type="text"
                          value={newBonus}
                          onChange={(e) => setNewBonus(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addBonus();
                            }
                          }}
                          placeholder="Ex: Limpeza de pele grátis"
                          className="h-9 flex-1"
                          data-testid="input-new-bonus"
                        />
                        <Button
                          size="icon"
                          onClick={addBonus}
                          disabled={!newBonus.trim()}
                          className="h-9 w-9 flex-shrink-0"
                          data-testid="button-add-bonus"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      {bonusList.length > 0 && (
                        <div className="space-y-1.5">
                          {bonusList.map((bonus, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between gap-2 rounded-md bg-muted p-2"
                            >
                              <span className="text-xs text-foreground">{bonus}</span>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 flex-shrink-0"
                                onClick={() => removeBonus(index)}
                                data-testid={`button-remove-bonus-${index}`}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Down Payment */}
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                        Valor de Entrada (R$)
                      </label>
                      <Input
                        type="number"
                        min="0"
                        max={total}
                        step="0.01"
                        value={downPayment}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0;
                          setDownPayment(Math.min(value, total));
                        }}
                        placeholder="0,00"
                        className="h-9"
                        data-testid="input-down-payment"
                      />
                    </div>
                  </div>

                  {/* Total Section */}
                  <div className="border-t pt-4">
                    <div className="space-y-2">
                      {discountPercentage > 0 && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Subtotal</span>
                          <span className="text-muted-foreground" data-testid="text-subtotal">
                            R$ {subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      )}
                      {discountPercentage > 0 && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Desconto ({discountPercentage}%)</span>
                          <span className="text-destructive" data-testid="text-discount-amount">
                            - R$ {discountAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground font-medium">Investimento Total</span>
                        <span className="font-semibold text-foreground" data-testid="text-total">
                          R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      {downPayment > 0 && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Entrada</span>
                          <span className="text-chart-3" data-testid="text-down-payment-display">
                            - R$ {downPayment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between items-center pt-2 border-t">
                        <span className="text-sm font-medium text-muted-foreground">
                          {downPayment > 0 ? 'Saldo a Pagar' : 'Total a Pagar'}
                        </span>
                        <span className="text-2xl font-bold text-primary" data-testid="text-remaining">
                          {installments > 1 ? (
                            <>{installments}x R$ {installmentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</>
                          ) : (
                            <>R$ {remainingAfterDownPayment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4 space-y-2">
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
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs text-muted-foreground hover:text-foreground"
                      disabled={!selectedPatient || selectedProceduresList.length === 0}
                      onClick={handleDownloadPDF}
                      data-testid="button-download-pdf"
                    >
                      <Download className="h-3 w-3 mr-1.5" />
                      Baixar PDF
                    </Button>
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
