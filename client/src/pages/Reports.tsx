import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Users, DollarSign, Percent } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Reports() {
  const conversionByAttendant = [
    { name: "Dra. Juliana", quotes: 45, conversions: 32, rate: 71 },
    { name: "Dr. Carlos", quotes: 38, conversions: 24, rate: 63 },
    { name: "Dra. Marina", quotes: 52, conversions: 38, rate: 73 },
  ];

  const topProcedures = [
    { name: "Harmonização Facial", sales: 28, revenue: 126000 },
    { name: "Toxina Botulínica", sales: 56, revenue: 67200 },
    { name: "Preenchimento Labial", sales: 42, revenue: 117600 },
  ];

  const monthlyMetrics = [
    { metric: "Ticket Médio", value: "R$ 3.450", change: "+15%" },
    { metric: "% Médio de Desconto", value: "8,5%", change: "-2%" },
    { metric: "Tempo Médio de Resposta", value: "2,3h", change: "-18%" },
    { metric: "Taxa de Retorno", value: "45%", change: "+8%" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-[hsl(var(--primary))]">Relatórios</h1>
        <p className="text-muted-foreground">Análise de desempenho e métricas da clínica</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {monthlyMetrics.map((item, index) => (
          <Card key={item.metric} className="hover-elevate ring-1 ring-[hsl(var(--chart-3))]/20">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {item.metric}
              </CardTitle>
              {index === 0 && <DollarSign className="h-4 w-4 text-[hsl(var(--chart-4))]" />}
              {index === 1 && <Percent className="h-4 w-4 text-[hsl(var(--chart-3))]" />}
              {index === 2 && <TrendingUp className="h-4 w-4 text-[hsl(var(--chart-2))]" />}
              {index === 3 && <Users className="h-4 w-4 text-[hsl(var(--primary))]" />}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{item.value}</div>
              <p className={`text-xs flex items-center gap-1 ${
                item.change.startsWith("+") ? "text-chart-4" : "text-chart-5"
              }`}>
                <TrendingUp className="h-3 w-3" />
                {item.change} vs mês anterior
              </p>
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
            <div className="space-y-4">
              {topProcedures.map((procedure, index) => (
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
                        R$ {(procedure.revenue / 1000).toFixed(0)}k
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
