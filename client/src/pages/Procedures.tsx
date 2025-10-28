import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Edit, Package } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProcedureSchema, type InsertProcedure, type Procedure, dermaliftProtocols } from "@shared/schema";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const protocolLabels: Record<string, string> = {
  sustentacao: "Sustentação",
  estruturacao: "Estruturação",
  embelezamento: "Embelezamento",
  revitalizacao: "Revitalização"
};

export default function Procedures() {
  const [searchTerm, setSearchTerm] = useState("");
  const [protocolFilter, setProtocolFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProcedure, setEditingProcedure] = useState<Procedure | null>(null);
  const { toast } = useToast();

  const { data: procedures = [], isLoading } = useQuery<Procedure[]>({
    queryKey: ["/api/procedures"],
  });

  const form = useForm<InsertProcedure>({
    resolver: zodResolver(insertProcedureSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "" as any,
      mlPrice: undefined,
      minMl: undefined,
      maxMl: undefined,
      protocol: undefined,
      category: "",
      displayOrder: 0,
    },
  });

  const createProcedureMutation = useMutation({
    mutationFn: async (data: InsertProcedure) => {
      const res = await apiRequest("POST", "/api/procedures", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/procedures"] });
      toast({
        title: "Procedimento criado!",
        description: "O procedimento foi adicionado com sucesso.",
      });
      form.reset();
      setDialogOpen(false);
      setEditingProcedure(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar procedimento",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateProcedureMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertProcedure> }) => {
      const res = await apiRequest("PUT", `/api/procedures/${id}`, data);
      return await res.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/procedures"] });
      await queryClient.refetchQueries({ queryKey: ["/api/procedures"] });
      toast({
        title: "Procedimento atualizado!",
        description: "O procedimento foi atualizado com sucesso.",
      });
      form.reset();
      setDialogOpen(false);
      setEditingProcedure(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar procedimento",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertProcedure) => {
    if (editingProcedure) {
      updateProcedureMutation.mutate({ id: editingProcedure.id, data });
    } else {
      createProcedureMutation.mutate(data);
    }
  };

  const handleEdit = (procedure: Procedure) => {
    setEditingProcedure(procedure);
    form.reset({
      name: procedure.name,
      description: procedure.description || "",
      price: Number(procedure.price),
      discountedPrice: procedure.discountedPrice ? Number(procedure.discountedPrice) : undefined,
      mlPrice: procedure.mlPrice ? Number(procedure.mlPrice) : undefined,
      minMl: procedure.minMl ? Number(procedure.minMl) : undefined,
      maxMl: procedure.maxMl ? Number(procedure.maxMl) : undefined,
      protocol: procedure.protocol,
      category: procedure.category || "",
      displayOrder: procedure.displayOrder ?? 0,
    });
    setDialogOpen(true);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setEditingProcedure(null);
      form.reset({
        name: "",
        description: "",
        price: "" as any,
        discountedPrice: undefined,
        mlPrice: undefined,
        minMl: undefined,
        maxMl: undefined,
        protocol: undefined,
        category: "",
        displayOrder: 0,
      });
    }
    setDialogOpen(open);
  };

  const filteredProcedures = procedures.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProtocol = protocolFilter === "all" || p.protocol === protocolFilter;
    return matchesSearch && matchesProtocol;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Carregando procedimentos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-serif text-3xl font-bold text-[hsl(var(--primary))]">Procedimentos</h1>
          <p className="text-muted-foreground">Gerencie procedimentos, pacotes e materiais</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-procedure">
              <Plus className="h-4 w-4 mr-2" />
              Novo Procedimento
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{editingProcedure ? "Editar Procedimento" : "Adicionar Novo Procedimento"}</DialogTitle>
              <DialogDescription>
                Preencha os dados do procedimento. Campos obrigatórios estão marcados com *.
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
                        <Input placeholder="Nome do procedimento" data-testid="input-procedure-name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Descrição do procedimento" data-testid="input-procedure-description" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="protocol"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Protocolo Dermalift *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-procedure-protocol">
                              <SelectValue placeholder="Selecione o protocolo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {dermaliftProtocols.map((protocol) => (
                              <SelectItem key={protocol} value={protocol}>
                                {protocolLabels[protocol]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoria</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Facial, Corporal" data-testid="input-procedure-category" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="displayOrder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ordem de Exibição</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0" 
                          data-testid="input-procedure-display-order" 
                          {...field} 
                          value={field.value ?? ""} 
                          onChange={(e) => field.onChange(e.target.value === "" ? "" : e.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preço Base (Unid/mL) *</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="0.00" data-testid="input-procedure-price" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="discountedPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preço c/ Desconto (Unid/mL)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            placeholder="0.00" 
                            data-testid="input-procedure-discounted-price" 
                            {...field} 
                            value={field.value ?? ""} 
                            onChange={(e) => field.onChange(e.target.value === "" ? "" : e.target.value)}
                          />
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
                    onClick={() => handleOpenChange(false)}
                    data-testid="button-cancel-procedure"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={createProcedureMutation.isPending || updateProcedureMutation.isPending}
                    data-testid="button-save-procedure"
                  >
                    {(createProcedureMutation.isPending || updateProcedureMutation.isPending) 
                      ? "Salvando..." 
                      : editingProcedure ? "Atualizar" : "Salvar"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar procedimento..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            data-testid="input-search-procedure"
          />
        </div>
        <Select value={protocolFilter} onValueChange={setProtocolFilter}>
          <SelectTrigger className="w-[220px]" data-testid="select-protocol-filter">
            <SelectValue placeholder="Filtrar por protocolo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Protocolos</SelectItem>
            <SelectItem value="sustentacao">Sustentação</SelectItem>
            <SelectItem value="estruturacao">Estruturação</SelectItem>
            <SelectItem value="embelezamento">Embelezamento</SelectItem>
            <SelectItem value="revitalizacao">Revitalização</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {filteredProcedures.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhum procedimento encontrado.</p>
            <p className="text-sm text-muted-foreground mt-1">Adicione um procedimento para começar.</p>
          </div>
        ) : (
          filteredProcedures.map((procedure) => (
            <Card key={procedure.id} className="hover-elevate ring-1 ring-[hsl(var(--chart-3))]/20" data-testid={`card-procedure-${procedure.id}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Order Badge */}
                  <div className="flex-shrink-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] font-semibold">
                      {procedure.displayOrder ?? 0}
                    </div>
                  </div>

                  {/* Protocol Badge */}
                  <div className="flex-shrink-0">
                    <Badge className="bg-[hsl(var(--chart-2))]/15 text-[hsl(var(--chart-2))] border-[hsl(var(--chart-2))]/30">
                      {protocolLabels[procedure.protocol]}
                    </Badge>
                  </div>

                  {/* Info Section */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground text-lg">{procedure.name}</h3>
                    {procedure.description && (
                      <p className="text-sm text-muted-foreground mt-1">{procedure.description}</p>
                    )}
                    {procedure.category && (
                      <p className="text-xs text-muted-foreground mt-1">Categoria: {procedure.category}</p>
                    )}
                  </div>

                  {/* Price Section */}
                  <div className="flex-shrink-0 text-right">
                    {procedure.discountedPrice ? (
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground line-through">
                          R$ {Number(procedure.price).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <p className="text-xl font-bold text-green-600 dark:text-green-500">
                          R$ {Number(procedure.discountedPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    ) : (
                      <p className="text-xl font-bold text-primary">
                        R$ {Number(procedure.price).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    )}
                  </div>

                  {/* Edit Button */}
                  <div className="flex-shrink-0">
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      onClick={() => handleEdit(procedure)}
                      data-testid={`button-edit-procedure-${procedure.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
