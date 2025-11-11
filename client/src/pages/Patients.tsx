import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Phone, Mail, MapPin, Pencil, Trash2, FileText, ExternalLink } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPatientSchema, type InsertPatient, type Patient, type Quote } from "@shared/schema";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function Patients() {
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [deletingPatient, setDeletingPatient] = useState<Patient | null>(null);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: patients = [], isLoading } = useQuery<Patient[]>({
    queryKey: ["/api/patients"],
  });

  const { data: quotes = [] } = useQuery<Quote[]>({
    queryKey: ["/api/quotes"],
  });

  const form = useForm<InsertPatient>({
    resolver: zodResolver(insertPatientSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      cpf: "",
      birthDate: "",
      address: "",
      city: "",
      state: "",
      origin: "",
      tags: [],
    },
  });

  const savePatientMutation = useMutation({
    mutationFn: async (data: InsertPatient) => {
      if (editingPatient) {
        const res = await apiRequest("PATCH", `/api/patients/${editingPatient.id}`, data);
        return await res.json();
      } else {
        const res = await apiRequest("POST", "/api/patients", data);
        return await res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reports/metrics"] });
      toast({
        title: editingPatient ? "Paciente atualizado!" : "Paciente criado!",
        description: editingPatient 
          ? "O paciente foi atualizado com sucesso."
          : "O paciente foi adicionado com sucesso.",
      });
      form.reset();
      setDialogOpen(false);
      setEditingPatient(null);
    },
    onError: (error: Error) => {
      toast({
        title: editingPatient ? "Erro ao atualizar paciente" : "Erro ao criar paciente",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deletePatientMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/patients/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reports/metrics"] });
      toast({
        title: "Paciente excluído!",
        description: "O paciente foi removido com sucesso.",
      });
      setDeletingPatient(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir paciente",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertPatient) => {
    savePatientMutation.mutate(data);
  };

  const handleEdit = (patient: Patient) => {
    setEditingPatient(patient);
    form.reset({
      name: patient.name,
      phone: patient.phone || "",
      email: patient.email || "",
      cpf: patient.cpf || "",
      birthDate: patient.birthDate || "",
      address: patient.address || "",
      city: patient.city || "",
      state: patient.state || "",
      origin: patient.origin || "",
      tags: patient.tags || [],
    });
    setDialogOpen(true);
  };

  const handleDelete = (patient: Patient) => {
    setDeletingPatient(patient);
  };

  // Memoize patient-to-quotes mapping for performance
  const patientQuotesMap = useMemo(() => {
    const map = new Map<string, Quote[]>();
    quotes.forEach((quote) => {
      const existing = map.get(quote.patientId) || [];
      map.set(quote.patientId, [...existing, quote]);
    });
    return map;
  }, [quotes]);

  const getPatientQuotes = (patientId: string): Quote[] => {
    return patientQuotesMap.get(patientId) || [];
  };

  const handleViewQuote = (quoteId: string) => {
    setLocation(`/apresentacao/${quoteId}`);
  };

  const confirmDelete = () => {
    if (deletingPatient) {
      deletePatientMutation.mutate(deletingPatient.id);
    }
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingPatient(null);
      form.reset();
    }
  };

  const filteredPatients = patients.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Carregando pacientes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-serif text-3xl font-bold text-[hsl(var(--primary))]">Pacientes</h1>
          <p className="text-muted-foreground">Gerencie seus pacientes e leads</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-patient">
              <Plus className="h-4 w-4 mr-2" />
              Novo Paciente
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingPatient ? "Editar Paciente" : "Adicionar Novo Paciente"}
              </DialogTitle>
              <DialogDescription>
                Preencha os dados do paciente. Campos obrigatórios estão marcados com *.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome completo" data-testid="input-patient-name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone</FormLabel>
                        <FormControl>
                          <Input placeholder="(11) 99999-9999" data-testid="input-patient-phone" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="email@exemplo.com" data-testid="input-patient-email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cidade</FormLabel>
                        <FormControl>
                          <Input placeholder="São Paulo" data-testid="input-patient-city" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="origin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Origem</FormLabel>
                        <FormControl>
                          <Input placeholder="Instagram, Google, etc." data-testid="input-patient-origin" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleDialogClose(false)}
                    data-testid="button-cancel-patient"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={savePatientMutation.isPending}
                    data-testid="button-save-patient"
                  >
                    {savePatientMutation.isPending ? "Salvando..." : "Salvar"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

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

      <div className="space-y-2">
        {filteredPatients.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhum paciente encontrado.</p>
            <p className="text-sm text-muted-foreground mt-1">Adicione um paciente para começar.</p>
          </div>
        ) : (
          filteredPatients.map((patient, index) => (
            <div
              key={patient.id}
              className="flex items-center gap-4 p-4 rounded-md border border-border hover-elevate group"
              data-testid={`card-patient-${patient.id}`}
            >
              <Avatar className="h-12 w-12">
                <AvatarFallback className={`${
                  index % 3 === 0 ? "bg-[hsl(var(--primary))]" :
                  index % 3 === 1 ? "bg-[hsl(var(--chart-2))]" :
                  "bg-[hsl(var(--chart-3))]"
                } text-primary-foreground text-base`}>
                  {patient.name.split(" ").map(n => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground text-lg">{patient.name}</h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                      {patient.phone && (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Phone className="h-3.5 w-3.5" />
                          {patient.phone}
                        </div>
                      )}
                      {patient.email && (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Mail className="h-3.5 w-3.5" />
                          {patient.email}
                        </div>
                      )}
                      {patient.city && (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5" />
                          {patient.city}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => handleEdit(patient)}
                      data-testid={`button-edit-patient-${patient.id}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(patient)}
                      data-testid={`button-delete-patient-${patient.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  {(patient.origin || (patient.tags && patient.tags.length > 0)) && (
                    <div className="flex flex-wrap gap-1.5">
                      {patient.origin && (
                        <Badge className="text-xs bg-[hsl(var(--chart-2))]/15 text-[hsl(var(--chart-2))] border-[hsl(var(--chart-2))]/30">
                          {patient.origin}
                        </Badge>
                      )}
                      {patient.tags && patient.tags.map((tag) => (
                        <Badge key={tag} className="text-xs bg-[hsl(var(--chart-3))]/15 text-[hsl(var(--chart-3))] border-[hsl(var(--chart-3))]/30">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  {getPatientQuotes(patient.id).length > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <FileText className="h-3.5 w-3.5" />
                        <span>{getPatientQuotes(patient.id).length} orçamento{getPatientQuotes(patient.id).length > 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {getPatientQuotes(patient.id).map((quote: any) => (
                          <Button
                            key={quote.id}
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs gap-1 hover-elevate"
                            onClick={() => handleViewQuote(quote.id)}
                            data-testid={`button-view-quote-${quote.id}`}
                          >
                            <ExternalLink className="h-3 w-3" />
                            {new Date(quote.createdAt).toLocaleDateString('pt-BR', { 
                              day: '2-digit', 
                              month: '2-digit',
                              year: '2-digit'
                            })}
                            {quote.total && (
                              <span className="text-[hsl(var(--primary))] font-semibold">
                                · R$ {parseFloat(quote.total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            )}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <AlertDialog open={!!deletingPatient} onOpenChange={(open) => !open && setDeletingPatient(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o paciente <strong>{deletingPatient?.name}</strong>? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {deletePatientMutation.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
