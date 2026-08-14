import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, DollarSign, Percent, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface TopProcedure {
  name: string;
  sales: number;
  revenue: number;
}

interface ReportsMetrics {
  averageTicket: number;
  averageDiscount: number;
  conversionRate: number;
  acceptedQuotes: number;
  quotesThisMonth: number;
  topProcedures: TopProcedure[];
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/** Cores dos indicadores e das posições do ranking. */
const METRIC_COLORS = ["hsl(var(--chart-4))", "hsl(var(--chart-3))", "hsl(var(--chart-2))"];
const RANK_COLORS = ["hsl(var(--chart-3))", "hsl(var(--chart-2))", "hsl(var(--ring))"];

export default function Reports() {
  const { data: metrics, isLoading } = useQuery<ReportsMetrics>({
    queryKey: ["/api/reports/metrics"],
  });

  const monthlyMetrics = [
    { 
      metric: "Ticket Médio", 
      value: formatCurrency(metrics?.averageTicket || 0),
      subtitle: "Média mensal",
      icon: DollarSign,
    },
    { 
      metric: "% Médio de Desconto", 
      value: metrics?.averageDiscount ? `${metrics.averageDiscount.toFixed(1)}%` : "0%",
      subtitle: "Média mensal",
      icon: Percent,
    },
    {
      metric: "Taxa de Conversão",
      value: `${(metrics?.conversionRate ?? 0).toFixed(0)}%`,
      subtitle: `${metrics?.acceptedQuotes || 0} de ${metrics?.quotesThisMonth || 0} aceitos`,
      icon: TrendingUp,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-[28px] font-bold tracking-tight text-foreground">Relatórios</h1>
        <p className="text-muted-foreground">Análise de desempenho e métricas da clínica</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {monthlyMetrics.map((item, index) => (
          <Card key={item.metric} className="hover-elevate border-border/60">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {item.metric}
              </CardTitle>
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                style={{
                  backgroundColor: `color-mix(in srgb, ${METRIC_COLORS[index]} 12%, transparent)`,
                }}
              >
                <item.icon className="h-[18px] w-[18px]" style={{ color: METRIC_COLORS[index] }} />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <div className="h-8 w-24 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                </div>
              ) : (
                <div>
                  <div className="text-[28px] font-bold leading-none tracking-tight text-foreground">{item.value}</div>
                  <p className="mt-2 text-xs text-muted-foreground">{item.subtitle}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6">
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold tracking-tight">
              <BarChart3 className="h-[18px] w-[18px] text-muted-foreground" />
              Procedimentos Mais Vendidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-md border p-4">
                    <div className="h-6 w-48 bg-muted animate-pulse rounded mb-2" />
                    <div className="grid grid-cols-2 gap-4">
                      <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                      <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : metrics?.topProcedures && metrics.topProcedures.length > 0 ? (
              <div className="space-y-2">
                {metrics.topProcedures.map((procedure, index) => (
                  <div
                    key={procedure.name}
                    className="flex items-center gap-4 rounded-xl border border-border/60 px-4 py-3 hover-elevate"
                    data-testid={`stat-procedure-${index + 1}`}
                  >
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold tabular-nums"
                      style={{
                        color: RANK_COLORS[Math.min(index, RANK_COLORS.length - 1)],
                        backgroundColor: `color-mix(in srgb, ${RANK_COLORS[Math.min(index, RANK_COLORS.length - 1)]} 12%, transparent)`,
                      }}
                    >
                      {index + 1}
                    </span>

                    <h4 className="min-w-0 flex-1 truncate font-medium text-foreground">
                      {procedure.name}
                    </h4>

                    <div className="shrink-0 text-right">
                      <p className="text-xs text-muted-foreground">Vendas</p>
                      <p className="font-semibold tabular-nums text-foreground">{procedure.sales}</p>
                    </div>

                    <div className="w-32 shrink-0 text-right">
                      <p className="text-xs text-muted-foreground">Receita</p>
                      <p className="font-semibold tabular-nums text-foreground">
                        {formatCurrency(procedure.revenue)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum procedimento vendido este mês
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
