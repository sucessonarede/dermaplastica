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
  Check
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type DermaliftProtocol = "sustentacao" | "estruturacao" | "embelezamento" | "revitalizacao";

interface Procedure {
  id: number;
  name: string;
  price: number;
  protocol: DermaliftProtocol;
  description?: string;
}

export default function QuoteBuilder() {
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [selectedProcedures, setSelectedProcedures] = useState<number[]>([]);
  const [patientDialogOpen, setPatientDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const patients = [
    { id: 1, name: "Maria Silva", phone: "(11) 98765-4321" },
    { id: 2, name: "Ana Costa", phone: "(11) 97654-3210" },
    { id: 3, name: "Juliana Santos", phone: "(11) 96543-2109" },
    { id: 4, name: "Patricia Oliveira", phone: "(11) 95432-1098" },
  ];

  const procedures: Procedure[] = [
    // Sustentação
    { id: 1, name: "Fios de Sustentação", price: 3500, protocol: "sustentacao", description: "Lifting facial com fios absorvíveis" },
    { id: 2, name: "Ultraformer III", price: 4200, protocol: "sustentacao", description: "HIFU para lifting não invasivo" },
    { id: 3, name: "Sculptra", price: 3800, protocol: "sustentacao", description: "Bioestimulador de colágeno" },
    
    // Estruturação
    { id: 4, name: "Harmonização Facial", price: 4500, protocol: "estruturacao", description: "Equilíbrio das proporções faciais" },
    { id: 5, name: "Preenchimento Malar", price: 2800, protocol: "estruturacao", description: "Definição da região das maçãs" },
    { id: 6, name: "Rinoplastia Não Cirúrgica", price: 3200, protocol: "estruturacao", description: "Correção do contorno nasal" },
    
    // Embelezamento
    { id: 7, name: "Preenchimento Labial", price: 2400, protocol: "embelezamento", description: "Volume e definição dos lábios" },
    { id: 8, name: "Toxina Botulínica", price: 1200, protocol: "embelezamento", description: "Suavização de rugas dinâmicas" },
    { id: 9, name: "Lipo de Papada", price: 5500, protocol: "embelezamento", description: "Redução de gordura localizada" },
    
    // Revitalização da Pele
    { id: 10, name: "Skinbooster", price: 1800, protocol: "revitalizacao", description: "Hidratação profunda da pele" },
    { id: 11, name: "Peeling Químico", price: 1200, protocol: "revitalizacao", description: "Renovação celular" },
    { id: 12, name: "Laser CO2 Fracionado", price: 3500, protocol: "revitalizacao", description: "Rejuvenescimento facial" },
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

  const toggleProcedure = (id: number) => {
    setSelectedProcedures((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleSelectPatient = (patient: any) => {
    setSelectedPatient(patient);
    setPatientDialogOpen(false);
  };

  const filteredPatients = patients.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const total = procedures
    .filter((p) => selectedProcedures.includes(p.id))
    .reduce((sum, p) => sum + p.price, 0);

  const selectedProceduresList = procedures.filter((p) =>
    selectedProcedures.includes(p.id)
  );

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
                      const isSelected = selectedProcedures.includes(procedure.id);
                      return (
                        <div
                          key={procedure.id}
                          onClick={() => toggleProcedure(procedure.id)}
                          className={`p-3 rounded-md border cursor-pointer transition-all ${
                            isSelected
                              ? `${config.bgColor} ${config.borderColor} ring-2`
                              : "border-border hover-elevate"
                          }`}
                          data-testid={`procedure-${procedure.id}`}
                        >
                          <div className="flex items-start justify-between gap-2">
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
                              <span className={`text-sm font-semibold ${isSelected ? config.textColor : "text-foreground"}`}>
                                R$ {procedure.price.toLocaleString()}
                              </span>
                              {isSelected && (
                                <Check className={`h-4 w-4 ${config.textColor}`} />
                              )}
                            </div>
                          </div>
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
                        return (
                          <div
                            key={procedure.id}
                            className="flex justify-between items-start gap-2 text-sm rounded-md bg-muted p-2"
                          >
                            <div className="flex-1">
                              <p className="font-medium text-foreground">{procedure.name}</p>
                              <Badge className={`text-xs mt-1 ${config.bgColor} ${config.textColor} border-0`}>
                                {config.title}
                              </Badge>
                            </div>
                            <span className="font-semibold text-foreground whitespace-nowrap">
                              R$ {procedure.price.toLocaleString()}
                            </span>
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
                        className="w-full"
                        disabled={!selectedPatient || selectedProcedures.length === 0}
                        data-testid="button-generate-pdf"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Gerar Orçamento PDF
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                        disabled={!selectedPatient || selectedProcedures.length === 0}
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
