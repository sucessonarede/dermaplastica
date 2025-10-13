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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/procedures"] });
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
      });
    }
    setDialogOpen(open);
  };

  const filteredProcedures = procedures.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                          <Input type="number" step="0.01" placeholder="0.00" data-testid="input-procedure-discounted-price" {...field} value={field.value || ""} />
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

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar procedimento..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          data-testid="input-search-procedure"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredProcedures.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground">Nenhum procedimento encontrado.</p>
            <p className="text-sm text-muted-foreground mt-1">Adicione um procedimento para começar.</p>
          </div>
        ) : (
          filteredProcedures.map((procedure, index) => (
            <Card key={procedure.id} className="hover-elevate ring-1 ring-[hsl(var(--chart-3))]/20" data-testid={`card-procedure-${procedure.id}`}>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
                <div className="flex items-center gap-2">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-md ${
                    index % 3 === 0 ? "bg-[hsl(var(--primary))]/10" :
                    index % 3 === 1 ? "bg-[hsl(var(--chart-2))]/10" :
                    "bg-[hsl(var(--chart-3))]/10"
                  }`}>
                    <Package className={`h-4 w-4 ${
                      index % 3 === 0 ? "text-[hsl(var(--primary))]" :
                      index % 3 === 1 ? "text-[hsl(var(--chart-2))]" :
                      "text-[hsl(var(--chart-3))]"
                    }`} />
                  </div>
                  <Badge className="bg-[hsl(var(--chart-2))]/15 text-[hsl(var(--chart-2))] border-[hsl(var(--chart-2))]/30">
                    {protocolLabels[procedure.protocol]}
                  </Badge>
                </div>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  onClick={() => handleEdit(procedure)}
                  data-testid={`button-edit-procedure-${procedure.id}`}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h3 className="font-semibold text-foreground">{procedure.name}</h3>
                  {procedure.description && (
                    <p className="text-sm text-muted-foreground mt-1">{procedure.description}</p>
                  )}
                  {procedure.category && (
                    <p className="text-sm text-muted-foreground mt-1">{procedure.category}</p>
                  )}
                </div>

                <div className="pt-2 border-t">
                  <p className="text-2xl font-bold text-primary">
                    R$ {Number(procedure.price).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
