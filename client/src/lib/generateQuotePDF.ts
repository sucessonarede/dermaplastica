import jsPDF from "jspdf";
import { desenharPranchaDermalift, PILAR_DA_COLUNA, type ColunaKey } from "./dermaliftBoard";
import { desenharOrcamentoDermalift, type LinhaOrcamento } from "./dermaliftQuote";

/**
 * PDF do Projeto Dermalift, entregue à paciente na consulta.
 *
 *   Página 1 — a prancha visual: os quatro pilares, o que cada um faz e em
 *              que profundidade atua. Sem nenhum valor.
 *   Página 2 — o investimento: uma linha por procedimento e o fechamento
 *              comparando os tratamentos avulsos com o valor do projeto.
 */

interface QuoteData {
  patient: {
    name: string;
  };
  items: Array<{
    quantity: string | number;
    subtotal: string | number;
    note?: string | null;
    procedure: {
      name: string;
      protocol: string;
      description?: string | null;
    };
  }>;
  total: string | number;
  discount?: string | number | null;
  discountPercentage?: string | number | null;
  installments?: number | null;
  downPayment?: string | number | null;
  bonusList?: string[] | null;
  /** Áreas marcadas no mapa facial, por pilar. */
  faceZones?: Record<string, string[]> | null;
}

const paraNumero = (v: string | number | null | undefined, padrao = 0): number => {
  if (v === null || v === undefined) return padrao;
  const n = typeof v === "string" ? parseFloat(v) : v;
  return isNaN(n) ? padrao : n;
};

/** Ordem em que os pilares aparecem na tabela. */
const ORDEM: Record<string, number> = {
  sustentacao: 0,
  estruturacao: 1,
  embelezamento: 2,
  revitalizacao: 3,
  alem_da_face: 4,
};

/** Agrupa os procedimentos do orçamento nas quatro colunas da prancha. */
function planoPorColuna(quote: QuoteData): Partial<Record<ColunaKey, string[]>> {
  const plano: Partial<Record<ColunaKey, string[]>> = {};

  for (const item of quote.items) {
    const coluna = PILAR_DA_COLUNA[item.procedure.protocol as keyof typeof PILAR_DA_COLUNA];
    if (!coluna) continue;

    const nome = item.procedure.name;
    const lista = (plano[coluna] ??= []);
    if (!lista.includes(nome)) lista.push(nome);
  }

  return plano;
}

/**
 * Monta as linhas da tabela: primeiro os procedimentos, na ordem dos pilares,
 * e depois os bônus — que aparecem com a palavra "Bônus" no lugar do valor.
 */
function linhasDoOrcamento(quote: QuoteData): LinhaOrcamento[] {
  const ordenados = [...quote.items].sort(
    (a, b) => (ORDEM[a.procedure.protocol] ?? 99) - (ORDEM[b.procedure.protocol] ?? 99)
  );

  const linhas: LinhaOrcamento[] = ordenados.map((item) => {
    const protocolo = item.procedure.protocol;
    const pilar = (PILAR_DA_COLUNA[protocolo as keyof typeof PILAR_DA_COLUNA] ??
      "alem_da_face") as LinhaOrcamento["pilar"];

    const quantidade = paraNumero(item.quantity, 1);
    const nome =
      quantidade && quantidade !== 1
        ? `${item.procedure.name} (${formatarQuantidade(quantidade)})`
        : item.procedure.name;

    return {
      pilar,
      nome,
      descricao: item.procedure.description ?? null,
      valor: paraNumero(item.subtotal),
    };
  });

  for (const bonus of quote.bonusList ?? []) {
    if (bonus?.trim()) {
      linhas.push({ pilar: "bonus", nome: bonus.trim(), descricao: null, valor: null });
    }
  }

  return linhas;
}

/** "2" vira "2x"; "1.5" vira "1,5 ml" — o decimal só aparece em volume. */
function formatarQuantidade(q: number): string {
  return Number.isInteger(q)
    ? `${q}x`
    : `${q.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} ml`;
}

export const generateQuotePDF = async (quote: QuoteData) => {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const total = paraNumero(quote.total);
  const desconto = paraNumero(quote.discount);

  await desenharPranchaDermalift(doc, {
    patientName: quote.patient.name,
    plano: planoPorColuna(quote),
  });

  doc.addPage();

  await desenharOrcamentoDermalift(doc, {
    patientName: quote.patient.name,
    linhas: linhasDoOrcamento(quote),
    // O `total` do orçamento já vem com o desconto aplicado; o valor avulso é
    // ele somado de volta ao que o projeto economiza.
    valorIndividual: total + desconto,
    valorProjeto: total,
    economia: desconto,
    parcelas: quote.installments ?? null,
  });

  doc.save(`Projeto_Dermalift_${quote.patient.name.replace(/\s+/g, "_")}.pdf`);
};
