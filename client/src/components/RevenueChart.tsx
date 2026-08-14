import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { QuoteWithDetails } from "../../../server/storage";

/**
 * Faturamento dos últimos 6 meses, somado a partir dos orçamentos.
 * Série única, então dispensa legenda — o título já diz o que é.
 */

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

function moedaCurta(valor: number): string {
  if (valor >= 1000) return `R$ ${(valor / 1000).toFixed(valor >= 10000 ? 0 : 1)}k`;
  return `R$ ${valor.toFixed(0)}`;
}

function moedaCheia(valor: number): string {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

type Ponto = { mes: string; total: number; qtd: number };

/** Últimos 6 meses, inclusive os sem orçamento — a lacuna também é informação. */
function agrupaPorMes(quotes: QuoteWithDetails[]): Ponto[] {
  const hoje = new Date();
  const baldes = new Map<string, Ponto>();

  for (let i = 5; i >= 0; i--) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    baldes.set(`${d.getFullYear()}-${d.getMonth()}`, {
      mes: MESES[d.getMonth()],
      total: 0,
      qtd: 0,
    });
  }

  for (const q of quotes) {
    const d = new Date(q.createdAt);
    if (Number.isNaN(d.getTime())) continue;
    const balde = baldes.get(`${d.getFullYear()}-${d.getMonth()}`);
    if (!balde) continue;
    balde.total += parseFloat(q.total) || 0;
    balde.qtd += 1;
  }

  return Array.from(baldes.values());
}

function DicaGrafico({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const p: Ponto = payload[0].payload;
  return (
    <div className="rounded-xl border border-border/60 bg-popover px-3 py-2 shadow-lg">
      <p className="text-xs capitalize text-muted-foreground">{p.mes}</p>
      <p className="font-semibold tabular-nums text-foreground">{moedaCheia(p.total)}</p>
      <p className="text-xs text-muted-foreground">
        {p.qtd} {p.qtd === 1 ? "orçamento" : "orçamentos"}
      </p>
    </div>
  );
}

export function RevenueChart() {
  const { data: quotes, isLoading } = useQuery<QuoteWithDetails[]>({
    queryKey: ["/api/quotes"],
  });

  const dados = useMemo(() => agrupaPorMes(quotes ?? []), [quotes]);
  const temValor = dados.some((d) => d.total > 0);

  if (isLoading) {
    return <div className="h-[260px] animate-pulse rounded-xl bg-muted/60" />;
  }

  if (!temValor) {
    return (
      <div className="flex h-[260px] flex-col items-center justify-center text-center">
        <p className="text-sm text-muted-foreground">Ainda não há orçamentos nos últimos 6 meses.</p>
        <p className="mt-1 text-xs text-muted-foreground">
          O gráfico aparece assim que o primeiro for salvo.
        </p>
      </div>
    );
  }

  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={dados} margin={{ top: 8, right: 4, bottom: 0, left: -12 }}>
          {/* Grade recessiva: só horizontal, para leitura de magnitude */}
          <CartesianGrid
            vertical={false}
            stroke="hsl(var(--border))"
            strokeOpacity={0.6}
            strokeDasharray="3 3"
          />
          <XAxis
            dataKey="mes"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            dy={6}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={64}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            tickFormatter={(v) => moedaCurta(Number(v))}
          />
          <Tooltip
            content={<DicaGrafico />}
            cursor={{ fill: "hsl(var(--muted))", fillOpacity: 0.5 }}
          />
          <Bar
            dataKey="total"
            fill="hsl(var(--chart-bar))"
            radius={[4, 4, 0, 0]}
            maxBarSize={44}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default RevenueChart;
