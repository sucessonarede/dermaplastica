import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, Calculator, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

function getGreeting() {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 12) {
    return "Bom dia";
  } else if (hour >= 12 && hour < 18) {
    return "Boa tarde";
  } else {
    return "Boa noite";
  }
}

export default function Dashboard() {
  const { data: user } = useQuery<User>({
    queryKey: ["/api/auth/me"],
  });
  const stats = [
    {
      title: "Pacientes Ativos",
      value: "248",
      change: "+12%",
      icon: Users,
      trend: "up",
    },
    {
      title: "Orçamentos Este Mês",
      value: "67",
      change: "+8%",
      icon: Calculator,
      trend: "up",
    },
    {
      title: "Ticket Médio",
      value: "R$ 3.450",
      change: "+15%",
      icon: DollarSign,
      trend: "up",
    },
    {
      title: "Taxa de Conversão",
      value: "68%",
      change: "+5%",
      icon: TrendingUp,
      trend: "up",
    },
  ];

  const recentQuotes = [
    { id: 1, patient: "Maria Silva", procedure: "Harmonização Facial", value: 4500, status: "Pendente" },
    { id: 2, patient: "Ana Costa", procedure: "Toxina Botulínica", value: 1200, status: "Aceito" },
    { id: 3, patient: "Juliana Santos", procedure: "Preenchimento Labial", value: 2800, status: "Pendente" },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-gradient-to-r from-[hsl(275,100%,26%)] via-[hsl(340,74%,62%)] to-[hsl(17,100%,61%)] p-8 text-primary-foreground hover-elevate">
        <h1 className="font-serif text-3xl font-bold">
          {getGreeting()}, {user?.name || "Usuário"}!
        </h1>
        <p className="text-primary-foreground/90">Visão geral da sua clínica</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={stat.title} className="hover-elevate ring-1 ring-[hsl(var(--chart-2))]/20">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${
                index === 0 ? "text-[hsl(var(--primary))]" : 
                index === 1 ? "text-[hsl(var(--chart-2))]" : 
                index === 2 ? "text-[hsl(var(--chart-3))]" : 
                "text-[hsl(var(--chart-4))]"
              }`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <p className="text-xs text-chart-4 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {stat.change} vs mês anterior
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="ring-1 ring-[hsl(var(--chart-2))]/20">
          <CardHeader className="bg-gradient-to-r from-transparent via-[hsl(var(--chart-2))]/5 to-transparent">
            <CardTitle className="text-[hsl(var(--primary))]">Orçamentos Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentQuotes.map((quote) => (
                <div
                  key={quote.id}
                  className="flex items-center justify-between rounded-md border p-4 hover-elevate"
                  data-testid={`card-quote-${quote.id}`}
                >
                  <div>
                    <p className="font-medium text-foreground">{quote.patient}</p>
                    <p className="text-sm text-muted-foreground">{quote.procedure}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">
                      R$ {quote.value.toLocaleString()}
                    </p>
                    <span
                      className={`inline-block text-xs px-2 py-1 rounded-full font-medium ${
                        quote.status === "Aceito"
                          ? "bg-[hsl(var(--chart-4))]/15 text-[hsl(var(--chart-4))]"
                          : "bg-[hsl(var(--chart-3))]/15 text-[hsl(var(--chart-3))]"
                      }`}
                    >
                      {quote.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/quotes">
              <Button variant="outline" className="w-full mt-4" data-testid="button-view-all-quotes">
                Ver Todos os Orçamentos
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="ring-1 ring-[hsl(var(--chart-3))]/20">
          <CardHeader className="bg-gradient-to-r from-transparent via-[hsl(var(--chart-3))]/5 to-transparent">
            <CardTitle className="text-[hsl(var(--primary))]">Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/quotes/new" className="block">
              <Button className="w-full" data-testid="button-new-quote">
                <Calculator className="h-4 w-4 mr-2" />
                Novo Orçamento
              </Button>
            </Link>
            <Link href="/patients/new" className="block">
              <Button variant="outline" className="w-full" data-testid="button-new-patient">
                <Users className="h-4 w-4 mr-2" />
                Cadastrar Paciente
              </Button>
            </Link>
            <Link href="/procedures" className="block">
              <Button variant="outline" className="w-full" data-testid="button-manage-procedures">
                Gerenciar Procedimentos
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
