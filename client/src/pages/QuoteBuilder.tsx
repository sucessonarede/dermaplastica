import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, FileText, Download } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function QuoteBuilder() {
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [selectedProcedures, setSelectedProcedures] = useState<number[]>([]);

  const patients = [
    { id: 1, name: "Maria Silva", phone: "(11) 98765-4321" },
    { id: 2, name: "Ana Costa", phone: "(11) 97654-3210" },
  ];

  const procedures = [
    { id: 1, name: "Harmonização Facial", price: 4500, category: "Facial" },
    { id: 2, name: "Toxina Botulínica", price: 1200, category: "Facial" },
    { id: 3, name: "Preenchimento Labial", price: 2800, category: "Facial" },
    { id: 4, name: "Bioestimulador de Colágeno", price: 3200, category: "Corporal" },
  ];

  const toggleProcedure = (id: number) => {
    setSelectedProcedures((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const total = procedures
    .filter((p) => selectedProcedures.includes(p.id))
    .reduce((sum, p) => sum + p.price, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-[hsl(var(--primary))]">Construtor de Orçamentos</h1>
        <p className="text-muted-foreground">Crie orçamentos personalizados rapidamente</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="ring-1 ring-[hsl(var(--primary))]/20">
          <CardHeader className="bg-gradient-to-r from-transparent via-[hsl(var(--primary))]/5 to-transparent">
            <CardTitle className="text-[hsl(var(--primary))]">1. Selecionar Paciente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar paciente..."
                  className="pl-10"
                  data-testid="input-search-quote-patient"
                />
              </div>
              <div className="space-y-2">
                {patients.map((patient) => (
                  <div
                    key={patient.id}
                    className={`flex items-center gap-3 rounded-md border p-3 cursor-pointer hover-elevate active-elevate-2 ${
                      selectedPatient?.id === patient.id ? "border-primary" : ""
                    }`}
                    onClick={() => setSelectedPatient(patient)}
                    data-testid={`card-select-patient-${patient.id}`}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                        {patient.name.split(" ").map(n => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-foreground">{patient.name}</p>
                      <p className="text-xs text-muted-foreground">{patient.phone}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="ring-1 ring-[hsl(var(--chart-2))]/20">
          <CardHeader className="bg-gradient-to-r from-transparent via-[hsl(var(--chart-2))]/5 to-transparent">
            <CardTitle className="text-[hsl(var(--primary))]">2. Selecionar Procedimentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {procedures.map((procedure) => (
                <div
                  key={procedure.id}
                  className="flex items-start gap-3 rounded-md border p-3"
                  data-testid={`card-procedure-${procedure.id}`}
                >
                  <Checkbox
                    checked={selectedProcedures.includes(procedure.id)}
                    onCheckedChange={() => toggleProcedure(procedure.id)}
                    data-testid={`checkbox-procedure-${procedure.id}`}
                  />
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{procedure.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className="text-xs bg-[hsl(var(--chart-2))]/15 text-[hsl(var(--chart-2))] border-[hsl(var(--chart-2))]/30">
                        {procedure.category}
                      </Badge>
                      <span className="text-sm font-semibold text-foreground">
                        R$ {procedure.price.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="ring-1 ring-[hsl(var(--chart-3))]/20">
          <CardHeader className="bg-gradient-to-r from-transparent via-[hsl(var(--chart-3))]/5 to-transparent">
            <CardTitle className="text-[hsl(var(--primary))]">3. Resumo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedPatient && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Paciente</p>
                <div className="flex items-center gap-2 rounded-md bg-muted p-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                      {selectedPatient.name.split(" ").map((n: string) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-sm font-medium text-foreground">{selectedPatient.name}</p>
                </div>
              </div>
            )}

            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Procedimentos Selecionados ({selectedProcedures.length})
              </p>
              <div className="space-y-2">
                {procedures
                  .filter((p) => selectedProcedures.includes(p.id))
                  .map((procedure) => (
                    <div
                      key={procedure.id}
                      className="flex justify-between text-sm rounded-md bg-muted p-2"
                    >
                      <span className="text-foreground">{procedure.name}</span>
                      <span className="font-semibold text-foreground">
                        R$ {procedure.price.toLocaleString()}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-semibold text-foreground">Total</span>
                <span className="text-2xl font-bold text-primary">
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
