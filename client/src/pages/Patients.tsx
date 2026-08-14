import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Phone, Mail, MapPin, Pencil, Trash2, FileText, ExternalLink, Filter, X, Upload, Image as ImageIcon } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPatientSchema, type InsertPatient, type Patient, type Quote, type PatientWithStats } from "@shared/schema";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";

interface PatientPhoto {
  id: string;
  patientId: string;
  photoUrl: string;
  caption: string | null;
  uploadedAt: string;
}

export default function Patients() {
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [deletingPatient, setDeletingPatient] = useState<Patient | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    createdFrom: "",
    createdTo: "",
    minBudget: "",
    maxBudget: "",
  });
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoCaption, setPhotoCaption] = useState("");
  const { toast} = useToast();
  const [, setLocation] = useLocation();

  // Build query parameters from filters and search
  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    if (searchTerm) params.append("search", searchTerm);
    if (filters.createdFrom) params.append("createdFrom", filters.createdFrom);
    if (filters.createdTo) params.append("createdTo", filters.createdTo);
    if (filters.minBudget) params.append("minBudget", filters.minBudget);
    if (filters.maxBudget) params.append("maxBudget", filters.maxBudget);
    return params.toString();
  }, [filters, searchTerm]);

  const { data: patients = [], isLoading } = useQuery<PatientWithStats[]>({
    queryKey: ["/api/patients", queryParams],
    queryFn: async () => {
      const url = queryParams ? `/api/patients?${queryParams}` : "/api/patients";
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch patients");
      return await res.json();
    },
  });

  const { data: quotes = [] } = useQuery<Quote[]>({
    queryKey: ["/api/quotes"],
  });

  // Fetch photos when editing a patient
  const { data: patientPhotos = [] } = useQuery<PatientPhoto[]>({
    queryKey: ["/api/patients", editingPatient?.id, "photos"],
    queryFn: async () => {
      if (!editingPatient?.id) return [];
      const res = await fetch(`/api/patients/${editingPatient.id}/photos`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch photos");
      return await res.json();
    },
    enabled: !!editingPatient?.id,
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
      complaints: "",
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

  const uploadPhotoMutation = useMutation({
    mutationFn: async ({ file, caption }: { file: File; caption: string }) => {
      if (!editingPatient?.id) throw new Error("No patient selected");
      
      const formData = new FormData();
      formData.append("photo", file);
      formData.append("caption", caption);

      const res = await fetch(`/api/patients/${editingPatient.id}/photos`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to upload photo");
      }

      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients", editingPatient?.id, "photos"] });
      toast({
        title: "Foto adicionada!",
        description: "A foto foi enviada com sucesso.",
      });
      setPhotoCaption("");
      setUploadingPhoto(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao enviar foto",
        description: error.message,
        variant: "destructive",
      });
      setUploadingPhoto(false);
    },
  });

  const deletePhotoMutation = useMutation({
    mutationFn: async (photoId: string) => {
      await apiRequest("DELETE", `/api/patient-photos/${photoId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients", editingPatient?.id, "photos"] });
      toast({
        title: "Foto excluída!",
        description: "A foto foi removida com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir foto",
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
      complaints: patient.complaints || "",
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
      setPhotoCaption("");
      setUploadingPhoto(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione apenas arquivos de imagem.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "O tamanho máximo permitido é 10MB.",
        variant: "destructive",
      });
      return;
    }

    setUploadingPhoto(true);
    uploadPhotoMutation.mutate({ file, caption: photoCaption });
    
    e.target.value = "";
  };

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
          <h1 className="font-serif text-[28px] font-bold tracking-tight text-foreground">Pacientes</h1>
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
                <FormField
                  control={form.control}
                  name="complaints"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Queixas / Observações</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Descreva as queixas ou observações do paciente..."
                          className="min-h-[100px]"
                          data-testid="input-patient-complaints"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {editingPatient && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold flex items-center gap-2">
                        <ImageIcon className="h-4 w-4" />
                        Fotos do Paciente
                      </h4>
                    </div>

                    {patientPhotos.length > 0 && (
                      <div className="grid grid-cols-2 gap-3">
                        {patientPhotos.map((photo) => (
                          <div
                            key={photo.id}
                            className="relative group rounded-md border border-border overflow-hidden"
                            data-testid={`photo-item-${photo.id}`}
                          >
                            <img
                              src={photo.photoUrl}
                              alt={photo.caption || "Foto do paciente"}
                              className="w-full h-32 object-cover"
                            />
                            {photo.caption && (
                              <p className="text-xs text-muted-foreground p-2 bg-background/95 border-t border-border">
                                {photo.caption}
                              </p>
                            )}
                            <Button
                              size="icon"
                              variant="destructive"
                              className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => deletePhotoMutation.mutate(photo.id)}
                              disabled={deletePhotoMutation.isPending}
                              data-testid={`button-delete-photo-${photo.id}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="space-y-2">
                      <Input
                        type="text"
                        placeholder="Legenda da foto (opcional)"
                        value={photoCaption}
                        onChange={(e) => setPhotoCaption(e.target.value)}
                        data-testid="input-photo-caption"
                      />
                      <div className="flex gap-2">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          disabled={uploadingPhoto}
                          className="flex-1"
                          data-testid="input-photo-upload"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          disabled={uploadingPhoto}
                          onClick={() => document.querySelector<HTMLInputElement>('[data-testid="input-photo-upload"]')?.click()}
                          data-testid="button-upload-photo"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          {uploadingPhoto ? "Enviando..." : "Adicionar Foto"}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

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

      <div className="space-y-4">
        {/* Busca e filtros dividem a mesma linha — economiza uma faixa inteira */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
            <Input
              placeholder="Buscar paciente..."
              className="bg-card pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              data-testid="input-search-patient"
            />
          </div>

          {!showFilters && (
            <Button
              variant="outline"
              onClick={() => setShowFilters(true)}
              data-testid="button-show-filters"
              className="h-10 shrink-0"
            >
              <Filter className="mr-2 h-4 w-4" />
              Filtros
            </Button>
          )}
        </div>

        {showFilters && (
          <Card className="bg-card p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filtros
              </h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowFilters(false)}
                data-testid="button-close-filters"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Data Início</label>
                <Input
                  type="date"
                  value={filters.createdFrom}
                  onChange={(e) => setFilters({ ...filters, createdFrom: e.target.value })}
                  data-testid="input-filter-date-from"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Data Fim</label>
                <Input
                  type="date"
                  value={filters.createdTo}
                  onChange={(e) => setFilters({ ...filters, createdTo: e.target.value })}
                  data-testid="input-filter-date-to"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Valor Mínimo (R$)</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={filters.minBudget}
                  onChange={(e) => setFilters({ ...filters, minBudget: e.target.value })}
                  data-testid="input-filter-min-budget"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Valor Máximo (R$)</label>
                <Input
                  type="number"
                  placeholder="10000"
                  value={filters.maxBudget}
                  onChange={(e) => setFilters({ ...filters, maxBudget: e.target.value })}
                  data-testid="input-filter-max-budget"
                />
              </div>
            </div>
            <div className="flex justify-end mt-4 gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setFilters({ createdFrom: "", createdTo: "", minBudget: "", maxBudget: "" })}
                data-testid="button-clear-filters"
              >
                Limpar Filtros
              </Button>
            </div>
          </Card>
        )}

      </div>

      {patients.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Nenhum paciente encontrado.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Adicione um paciente para começar.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {patients.map((patient) => {
                const quotes = getPatientQuotes(patient.id);
                return (
                  <div
                    key={patient.id}
                    className="group flex flex-col gap-4 p-4 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center"
                    data-testid={`card-patient-${patient.id}`}
                  >
                    {/* Identificação */}
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarFallback className="bg-primary/10 text-sm text-primary">
                          {patient.name.split(" ").slice(0, 2).map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate font-medium">{patient.name}</p>
                          {patient.origin && (
                            <Badge className="border-[hsl(var(--chart-2))]/30 bg-[hsl(var(--chart-2))]/15 text-xs text-[hsl(var(--chart-2))]">
                              {patient.origin}
                            </Badge>
                          )}
                          {patient.tags?.map((tag) => (
                            <Badge
                              key={tag}
                              className="border-[hsl(var(--chart-3))]/30 bg-[hsl(var(--chart-3))]/15 text-xs text-[hsl(var(--chart-3))]"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>

                        {/* Contato numa linha só, separado por ponto */}
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-muted-foreground">
                          {patient.phone && (
                            <span className="inline-flex items-center gap-1.5">
                              <Phone className="h-3.5 w-3.5" />
                              {patient.phone}
                            </span>
                          )}
                          {patient.city && (
                            <span className="inline-flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5" />
                              {patient.city}
                            </span>
                          )}
                          {patient.email && (
                            <span className="inline-flex min-w-0 items-center gap-1.5">
                              <Mail className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate">{patient.email}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Orçamentos e ações */}
                    <div className="flex items-center gap-3 sm:gap-4">
                      {quotes.length > 0 && (
                        <div className="hidden items-center gap-1.5 lg:flex">
                          {quotes.slice(0, 2).map((quote: any) => (
                            <Button
                              key={quote.id}
                              size="sm"
                              variant="outline"
                              className="h-8 gap-1 text-xs"
                              onClick={() => handleViewQuote(quote.id)}
                              data-testid={`button-view-quote-${quote.id}`}
                            >
                              <ExternalLink className="h-3 w-3" />
                              {new Date(quote.createdAt).toLocaleDateString("pt-BR", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "2-digit",
                              })}
                              {quote.total && (
                                <span className="font-semibold text-primary">
                                  · R$ {parseFloat(quote.total).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                </span>
                              )}
                            </Button>
                          ))}
                          {quotes.length > 2 && (
                            <span className="text-xs text-muted-foreground">+{quotes.length - 2}</span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="default"
                          className="h-8"
                          onClick={() => setLocation(`/protocolo-dermalift?patient=${patient.id}`)}
                          data-testid={`button-new-protocol-${patient.id}`}
                        >
                          <Plus className="mr-1 h-4 w-4" />
                          Protocolo
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 opacity-60 transition-opacity group-hover:opacity-100"
                          onClick={() => handleEdit(patient)}
                          data-testid={`button-edit-patient-${patient.id}`}
                          title="Editar paciente"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive opacity-60 transition-opacity hover:text-destructive group-hover:opacity-100"
                          onClick={() => handleDelete(patient)}
                          data-testid={`button-delete-patient-${patient.id}`}
                          title="Excluir paciente"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

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
