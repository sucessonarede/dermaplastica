import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Presentation, Edit2, FileText, Trash2, Search, Calendar, X } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type DermaliftProtocol = "sustentacao" | "estruturacao" | "embelezamento" | "revitalizacao";

interface SavedQuote {
  id: string;
  patientId: string;
  total: string;
  discount?: string;
  status: string;
  createdAt: string;
  notes?: string | null;
  patient: {
    id: string;
    name: string;
    phone: string;
    email?: string;
  };
  items: Array<{
    id: string;
    quoteId: string;
    procedureId: string;
    quantity: string;
    customPrice?: string;
    subtotal: string;
    procedure: {
      id: string;
      name: string;
      price: string;
      protocol: DermaliftProtocol;
    };
  }>;
}

export default function SavedQuotes() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { data: savedQuotes, isLoading: isLoadingSavedQuotes } = useQuery<SavedQuote[]>({
    queryKey: ["/api/quotes"],
  });

  const deleteQuoteMutation = useMutation({
    mutationFn: async (quoteId: string) => {
      await apiRequest("DELETE", `/api/quotes/${quoteId}`);
    },
    onSuccess: () => {
      toast({
        title: "Orçamento excluído!",
        description: "O orçamento foi excluído com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir",
        description: error.message || "Não foi possível excluir o orçamento.",
        variant: "destructive",
      });
    },
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: "Pendente",
      accepted: "Aceito",
      rejected: "Rejeitado",
    };
    return statusMap[status] || status;
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "outline" | "destructive" => {
    const variantMap: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
      pending: "secondary",
      accepted: "default",
      rejected: "destructive",
    };
    return variantMap[status] || "outline";
  };

  const filteredQuotes = savedQuotes?.filter((quote) => {
    // Filter by search term (patient name)
    const matchesSearch = searchTerm.trim() === "" || 
      quote.patient.name.toLowerCase().includes(searchTerm.toLowerCase());

    // Filter by date range
    const quoteDate = new Date(quote.createdAt);
    const matchesStartDate = !startDate || quoteDate >= new Date(startDate);
    const matchesEndDate = !endDate || quoteDate <= new Date(endDate + "T23:59:59");

    return matchesSearch && matchesStartDate && matchesEndDate;
  }) || [];

  const clearFilters = () => {
    setSearchTerm("");
    setStartDate("");
    setEndDate("");
  };

  const hasActiveFilters = searchTerm.trim() !== "" || startDate !== "" || endDate !== "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-[hsl(var(--primary))]">Orçamentos Salvos</h1>
        <p className="text-muted-foreground">Gerencie e visualize seus orçamentos</p>
      </div>

      {/* Filters Section */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome do paciente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                data-testid="input-search-quotes"
              />
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  placeholder="Data inicial"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="pl-9 w-full sm:w-auto"
                  data-testid="input-start-date"
                />
              </div>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  placeholder="Data final"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="pl-9 w-full sm:w-auto"
                  data-testid="input-end-date"
                />
              </div>
              {hasActiveFilters && (
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={clearFilters}
                  data-testid="button-clear-filters"
                  title="Limpar filtros"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          {hasActiveFilters && (
            <div className="mt-3 text-sm text-muted-foreground">
              {filteredQuotes.length} {filteredQuotes.length === 1 ? 'orçamento encontrado' : 'orçamentos encontrados'}
            </div>
          )}
        </CardContent>
      </Card>

      {isLoadingSavedQuotes ? (
        <Card>
          <CardContent className="py-16">
            <div className="text-center text-muted-foreground">Carregando orçamentos...</div>
          </CardContent>
        </Card>
      ) : !savedQuotes || savedQuotes.length === 0 ? (
        <Card>
          <CardContent className="py-16">
            <div className="text-center space-y-4">
              <FileText className="h-16 w-16 mx-auto text-muted-foreground/50" />
              <div>
                <h3 className="font-semibold text-lg">Nenhum orçamento salvo</h3>
                <p className="text-muted-foreground text-sm mt-1">
                  Crie seu primeiro orçamento no Protocolo Dermalift
                </p>
              </div>
              <Button onClick={() => setLocation("/protocolo-dermalift")} data-testid="button-create-quote">
                Criar Orçamento
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : filteredQuotes.length === 0 ? (
        <Card>
          <CardContent className="py-16">
            <div className="text-center space-y-4">
              <Search className="h-16 w-16 mx-auto text-muted-foreground/50" />
              <div>
                <h3 className="font-semibold text-lg">Nenhum orçamento encontrado</h3>
                <p className="text-muted-foreground text-sm mt-1">
                  Tente ajustar os filtros de busca
                </p>
              </div>
              <Button onClick={clearFilters} variant="outline" data-testid="button-clear-filters-empty">
                Limpar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredQuotes.map((quote) => (
            <Card key={quote.id} className="hover-elevate" data-testid={`card-quote-${quote.id}`}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {quote.patient.name.split(" ").map(n => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm" data-testid={`text-patient-name-${quote.id}`}>
                        {quote.patient.name}
                      </p>
                      <p className="text-xs text-muted-foreground" data-testid={`text-date-${quote.id}`}>
                        {formatDate(quote.createdAt)}
                      </p>
                    </div>
                  </div>
                  <Badge variant={getStatusVariant(quote.status)} data-testid={`badge-status-${quote.id}`}>
                    {getStatusLabel(quote.status)}
                  </Badge>
                </div>
                
                <Separator />
                
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Total</span>
                    <span className="font-semibold text-primary" data-testid={`text-total-${quote.id}`}>
                      R$ {parseFloat(quote.total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Procedimentos</span>
                    <span className="text-xs" data-testid={`text-items-count-${quote.id}`}>
                      {quote.items.length} {quote.items.length === 1 ? 'item' : 'itens'}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1"
                    onClick={() => setLocation(`/apresentacao/${quote.id}`)}
                    data-testid={`button-generate-presentation-${quote.id}`}
                  >
                    <Presentation className="h-3 w-3 mr-1" />
                    Apresentação
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLocation(`/protocolo-dermalift?loadQuote=${quote.id}`)}
                    data-testid={`button-load-quote-${quote.id}`}
                  >
                    <Edit2 className="h-3 w-3 mr-1" />
                    Editar
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        data-testid={`button-delete-quote-${quote.id}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir orçamento?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação não pode ser desfeita. O orçamento de {quote.patient.name} será permanentemente excluído.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteQuoteMutation.mutate(quote.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
