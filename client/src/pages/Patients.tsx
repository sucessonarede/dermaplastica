import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Phone, Mail, MapPin } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Patients() {
  const [searchTerm, setSearchTerm] = useState("");

  const patients = [
    {
      id: 1,
      name: "Maria Silva",
      phone: "(11) 98765-4321",
      email: "maria@email.com",
      origin: "Instagram",
      tags: ["VIP", "Retorno"],
      city: "São Paulo",
    },
    {
      id: 2,
      name: "Ana Costa",
      phone: "(11) 97654-3210",
      email: "ana@email.com",
      origin: "Indicação",
      tags: ["Novo"],
      city: "São Paulo",
    },
    {
      id: 3,
      name: "Juliana Santos",
      phone: "(11) 96543-2109",
      email: "juliana@email.com",
      origin: "Google",
      tags: ["Retorno"],
      city: "Campinas",
    },
  ];

  const filteredPatients = patients.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-serif text-3xl font-bold text-[hsl(var(--primary))]">Pacientes</h1>
          <p className="text-muted-foreground">Gerencie seus pacientes e leads</p>
        </div>
        <Button data-testid="button-add-patient">
          <Plus className="h-4 w-4 mr-2" />
          Novo Paciente
        </Button>
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredPatients.map((patient, index) => (
          <Card key={patient.id} className="hover-elevate ring-1 ring-[hsl(var(--chart-2))]/20" data-testid={`card-patient-${patient.id}`}>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Avatar>
                  <AvatarFallback className={`${
                    index % 3 === 0 ? "bg-[hsl(var(--primary))]" :
                    index % 3 === 1 ? "bg-[hsl(var(--chart-2))]" :
                    "bg-[hsl(var(--chart-3))]"
                  } text-primary-foreground`}>
                    {patient.name.split(" ").map(n => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <h3 className="font-semibold text-foreground">{patient.name}</h3>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      {patient.phone}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      {patient.email}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {patient.city}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 pt-2">
                    <Badge className="text-xs bg-[hsl(var(--chart-2))]/15 text-[hsl(var(--chart-2))] border-[hsl(var(--chart-2))]/30">
                      {patient.origin}
                    </Badge>
                    {patient.tags.map((tag) => (
                      <Badge key={tag} className="text-xs bg-[hsl(var(--chart-3))]/15 text-[hsl(var(--chart-3))] border-[hsl(var(--chart-3))]/30">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
