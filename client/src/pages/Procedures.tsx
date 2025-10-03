import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Edit, Package } from "lucide-react";

export default function Procedures() {
  const [searchTerm, setSearchTerm] = useState("");

  const procedures = [
    {
      id: 1,
      name: "Harmonização Facial",
      category: "Facial",
      price: 4500,
      duration: "90 min",
      materials: ["Ácido Hialurônico", "Toxina Botulínica"],
    },
    {
      id: 2,
      name: "Toxina Botulínica",
      category: "Facial",
      price: 1200,
      duration: "30 min",
      materials: ["Toxina Botulínica"],
    },
    {
      id: 3,
      name: "Preenchimento Labial",
      category: "Facial",
      price: 2800,
      duration: "60 min",
      materials: ["Ácido Hialurônico"],
    },
    {
      id: 4,
      name: "Bioestimulador de Colágeno",
      category: "Corporal",
      price: 3200,
      duration: "45 min",
      materials: ["Bioestimulador"],
    },
  ];

  const filteredProcedures = procedures.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">Procedimentos</h1>
          <p className="text-muted-foreground">Gerencie procedimentos, pacotes e materiais</p>
        </div>
        <Button data-testid="button-add-procedure">
          <Plus className="h-4 w-4 mr-2" />
          Novo Procedimento
        </Button>
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
        {filteredProcedures.map((procedure) => (
          <Card key={procedure.id} className="hover-elevate" data-testid={`card-procedure-${procedure.id}`}>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                  <Package className="h-4 w-4 text-primary" />
                </div>
                <Badge variant="secondary">{procedure.category}</Badge>
              </div>
              <Button size="icon" variant="ghost" data-testid={`button-edit-procedure-${procedure.id}`}>
                <Edit className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h3 className="font-semibold text-foreground">{procedure.name}</h3>
                <p className="text-sm text-muted-foreground">{procedure.duration}</p>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Materiais</p>
                <div className="flex flex-wrap gap-1">
                  {procedure.materials.map((material) => (
                    <Badge key={material} variant="outline" className="text-xs">
                      {material}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t">
                <p className="text-2xl font-bold text-primary">
                  R$ {procedure.price.toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
