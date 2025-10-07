import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, Calculator, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";
import type { QuoteWithDetails } from "../../../server/storage";

interface DashboardStats {
  activePatientsCount: number;
  quotesThisMonth: number;
  quotesLastMonth: number;
  averageTicket: number;
  conversionRate: number;
}

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

function calculatePercentageChange(current: number, previous: number): string {
  if (previous === 0) {
    return current > 0 ? "+100%" : "0%";
  }
  const change = ((current - previous) / previous) * 100;
  return change >= 0 ? `+${change.toFixed(0)}%` : `${change.toFixed(0)}%`;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function translateStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'pending': 'Pendente',
    'accepted': 'Aceito',
    'rejected': 'Rejeitado',
  };
  return statusMap[status] || status;
}

export default function Dashboard() {
  const { data: user } = useQuery<User>({
    queryKey: ["/api/auth/me"],
  });

  const { data: dashboardStats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: recentQuotesData, isLoading: quotesLoading } = useQuery<QuoteWithDetails[]>({
    queryKey: ["/api/dashboard/recent-quotes"],
  });

  const stats = [
    {
      title: "Pacientes Ativos",
      value: dashboardStats?.activePatientsCount.toString() || "0",
      change: "Total cadastrado",
      icon: Users,
      trend: "up",
    },
    {
      title: "Orçamentos Este Mês",
      value: dashboardStats?.quotesThisMonth.toString() || "0",
      change: calculatePercentageChange(
        dashboardStats?.quotesThisMonth || 0,
        dashboardStats?.quotesLastMonth || 0
      ),
      icon: Calculator,
      trend: "up",
    },
    {
      title: "Ticket Médio",
      value: formatCurrency(dashboardStats?.averageTicket || 0),
      change: "Média mensal",
      icon: DollarSign,
      trend: "up",
    },
    {
      title: "Taxa de Conversão",
      value: `${dashboardStats?.conversionRate.toFixed(0) || 0}%`,
      change: "Orçamentos aceitos",
      icon: TrendingUp,
      trend: "up",
    },
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
              {statsLoading ? (
                <>
                  <div className="h-8 w-24 bg-muted animate-pulse rounded mb-2" />
                  <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                  <p className="text-xs text-chart-4 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    {stat.change}
                  </p>
                </>
              )}
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
            {quotesLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between rounded-md border p-4">
                    <div className="space-y-2">
                      <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                      <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                      <div className="h-5 w-16 bg-muted animate-pulse rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentQuotesData && recentQuotesData.length > 0 ? (
              <div className="space-y-4">
                {recentQuotesData.map((quote) => (
                  <div
                    key={quote.id}
                    className="flex items-center justify-between rounded-md border p-4 hover-elevate"
                    data-testid={`card-quote-${quote.id}`}
                  >
                    <div>
                      <p className="font-medium text-foreground">{quote.patient.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {quote.items.length > 0 ? quote.items[0].procedure.name : 'Sem procedimentos'}
                        {quote.items.length > 1 && ` +${quote.items.length - 1}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">
                        {formatCurrency(Number(quote.total))}
                      </p>
                      <span
                        className={`inline-block text-xs px-2 py-1 rounded-full font-medium ${
                          quote.status === "accepted"
                            ? "bg-[hsl(var(--chart-4))]/15 text-[hsl(var(--chart-4))]"
                            : "bg-[hsl(var(--chart-3))]/15 text-[hsl(var(--chart-3))]"
                        }`}
                      >
                        {translateStatus(quote.status)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum orçamento cadastrado ainda
              </div>
            )}
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
