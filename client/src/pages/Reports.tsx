import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, DollarSign, Percent } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface TopProcedure {
  name: string;
  sales: number;
  revenue: number;
}

interface ReportsMetrics {
  averageTicket: number;
  averageDiscount: number;
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

export default function Reports() {
  const { data: metrics, isLoading } = useQuery<ReportsMetrics>({
    queryKey: ["/api/reports/metrics"],
  });

  const monthlyMetrics = [
    { 
      metric: "Ticket Médio", 
      value: formatCurrency(metrics?.averageTicket || 0),
      icon: DollarSign,
    },
    { 
      metric: "% Médio de Desconto", 
      value: metrics?.averageDiscount ? `${metrics.averageDiscount.toFixed(1)}%` : "0%",
      icon: Percent,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-[hsl(var(--primary))]">Relatórios</h1>
        <p className="text-muted-foreground">Análise de desempenho e métricas da clínica</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {monthlyMetrics.map((item, index) => (
          <Card key={item.metric} className="hover-elevate ring-1 ring-[hsl(var(--chart-3))]/20">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {item.metric}
              </CardTitle>
              <item.icon className={`h-4 w-4 ${
                index === 0 ? "text-[hsl(var(--chart-4))]" : "text-[hsl(var(--chart-3))]"
              }`} />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-8 w-24 bg-muted animate-pulse rounded" />
              ) : (
                <div className="text-2xl font-bold text-foreground">{item.value}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6">
        <Card className="ring-1 ring-[hsl(var(--chart-2))]/20">
          <CardHeader className="bg-gradient-to-r from-transparent via-[hsl(var(--chart-2))]/5 to-transparent">
            <CardTitle className="flex items-center gap-2 text-[hsl(var(--primary))]">
              <BarChart3 className="h-5 w-5 text-[hsl(var(--chart-2))]" />
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
              <div className="space-y-4">
                {metrics.topProcedures.map((procedure, index) => (
                  <div
                    key={procedure.name}
                    className="rounded-md border p-4 hover-elevate"
                    data-testid={`stat-procedure-${index + 1}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-foreground">{procedure.name}</h4>
                      <span className={`text-xs px-2 py-1 rounded font-medium ${
                        index === 0 ? "bg-[hsl(var(--chart-3))]/15 text-[hsl(var(--chart-3))]" :
                        index === 1 ? "bg-[hsl(var(--chart-2))]/15 text-[hsl(var(--chart-2))]" :
                        "bg-[hsl(var(--primary))]/15 text-[hsl(var(--primary))]"
                      }`}>
                        #{index + 1}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Vendas</p>
                        <p className="font-semibold text-foreground">{procedure.sales}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Receita</p>
                        <p className="font-semibold text-foreground">
                          {formatCurrency(procedure.revenue)}
                        </p>
                      </div>
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
