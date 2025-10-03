import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, Calculator, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function Dashboard() {
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
      <div>
        <h1 className="font-serif text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral da sua clínica</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="hover-elevate">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
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
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">Orçamentos Recentes</CardTitle>
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
                      className={`inline-block text-xs px-2 py-1 rounded-full ${
                        quote.status === "Aceito"
                          ? "bg-chart-4/10 text-chart-4"
                          : "bg-chart-5/10 text-chart-5"
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

        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/quotes/new">
              <Button className="w-full" data-testid="button-new-quote">
                <Calculator className="h-4 w-4 mr-2" />
                Novo Orçamento
              </Button>
            </Link>
            <Link href="/patients/new">
              <Button variant="outline" className="w-full" data-testid="button-new-patient">
                <Users className="h-4 w-4 mr-2" />
                Cadastrar Paciente
              </Button>
            </Link>
            <Link href="/procedures">
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
