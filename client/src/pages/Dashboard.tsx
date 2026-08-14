import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, Calculator, DollarSign, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { RevenueChart } from "@/components/RevenueChart";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";
import type { QuoteWithDetails } from "../../../server/storage";

interface DashboardStats {
  activePatientsCount: number;
  quotesThisMonth: number;
  quotesLastMonth: number;
  averageTicket: number;
  conversionRate: number;
  acceptedQuotes: number;
}

/** Cor de cada indicador, na ordem em que aparecem. */
const STAT_COLORS = [
  "hsl(var(--ring))", // = primary no claro, roxo claro no escuro
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
];

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
      change: `${dashboardStats?.acceptedQuotes || 0} de ${dashboardStats?.quotesThisMonth || 0} aceitos`,
      icon: TrendingUp,
      trend: "up",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Saudação: o gradiente da marca vira um fio na borda esquerda, em vez
          de um bloco cheio que compete com os números. */}
      <div className="relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-r from-card via-card/85 to-transparent px-7 py-6 lg:flex-row lg:items-center lg:justify-between">
        <div
          aria-hidden
          className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-[hsl(275,100%,26%)] via-[hsl(340,74%,62%)] to-[hsl(17,100%,61%)]"
        />

        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight">
            {getGreeting()}, {user?.name || "Usuário"}!{" "}
            <span role="img" aria-label="aceno">
              👋
            </span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Visão geral da sua clínica</p>
        </div>

        {/* Ações rápidas: no lado oposto da saudação, em botões compactos */}
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/protocolo-dermalift">
            <Button size="sm" data-testid="button-new-quote">
              <Calculator className="mr-1.5 h-4 w-4" />
              Novo Orçamento
            </Button>
          </Link>
          <Link href="/patients">
            <Button size="sm" variant="outline" data-testid="button-new-patient">
              <Users className="mr-1.5 h-4 w-4" />
              Cadastrar Paciente
            </Button>
          </Link>
          <Link href="/procedures">
            <Button size="sm" variant="outline" data-testid="button-manage-procedures">
              <Package className="mr-1.5 h-4 w-4" />
              Procedimentos
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={stat.title} className="hover-elevate border-border/60">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                style={{
                  backgroundColor: `color-mix(in srgb, ${STAT_COLORS[index]} 12%, transparent)`,
                }}
              >
                <stat.icon className="h-[18px] w-[18px]" style={{ color: STAT_COLORS[index] }} />
              </div>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <>
                  <div className="h-8 w-24 bg-muted animate-pulse rounded mb-2" />
                  <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                </>
              ) : (
                <>
                  <div className="text-[28px] font-bold leading-none tracking-tight text-foreground">{stat.value}</div>
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <TrendingUp className="h-3 w-3 text-chart-4" />
                    {stat.change}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold tracking-tight">Orçamentos Recentes</CardTitle>
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
            <Link href="/apresentacao">
              <Button variant="ghost" className="mt-4 w-full text-muted-foreground hover:text-foreground" data-testid="button-view-all-quotes">
                Ver todos os orçamentos
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold tracking-tight">Faturamento</CardTitle>
            <p className="text-sm text-muted-foreground">
              Total em orçamentos nos últimos 6 meses
            </p>
          </CardHeader>
          <CardContent>
            <RevenueChart />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
