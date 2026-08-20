import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FACE_ZONES, zoneChips } from "@/components/FaceMap";

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

type RGB = [number, number, number];

/* -------------------------------------------------------------------------- */
/* Identidade                                                                   */
/* -------------------------------------------------------------------------- */

/** Cores dos pilares, iguais às da tela. */
const PILARES: Record<string, { nome: string; cor: RGB }> = {
  sustentacao: { nome: "Sustentação", cor: [77, 0, 133] },
  estruturacao: { nome: "Estruturação", cor: [230, 86, 134] },
  embelezamento: { nome: "Embelezamento", cor: [255, 112, 56] },
  revitalizacao: { nome: "Revitalização da Pele", cor: [22, 162, 73] },
  alem_da_face: { nome: "Além da Face", cor: [245, 159, 10] },
};

const ORDEM_PILARES = [
  "sustentacao",
  "estruturacao",
  "embelezamento",
  "revitalizacao",
  "alem_da_face",
];

const ROXO: RGB = [77, 0, 133];
const TINTA: RGB = [33, 33, 38];
const TINTA_SUAVE: RGB = [122, 122, 132];
const LINHA: RGB = [226, 226, 232];
const FUNDO_SUAVE: RGB = [248, 247, 252];

/** Papel timbrado: o topo da folha já vem impresso. */
const TOPO_RESERVADO = 60;
const MARGEM = 15;

/* --------------------------------------------------------------- rosto --- */

/** Imagem base do mapa facial (mesma da tela). */
const IMAGEM_ROSTO = "/rosto-base.jpg";

/**
 * Recorte, no espaço 0–1000 do FaceMap, para o PDF. A imagem original tem
 * muita margem vazia; aqui o rosto ocupa o quadro inteiro.
 */
const RECORTE = { x0: 195, y0: 55, x1: 805, y1: 865 };
const RECORTE_L = RECORTE.x1 - RECORTE.x0;
const RECORTE_A = RECORTE.y1 - RECORTE.y0;

/** Largura do mapa facial no PDF, em mm. */
const LARGURA_ROSTO = 35;
const ALTURA_ROSTO = (LARGURA_ROSTO * RECORTE_A) / RECORTE_L;
const TOPO_ROSTO = 53;

/* -------------------------------------------------------------------------- */
/* Utilidades                                                                   */
/* -------------------------------------------------------------------------- */

const paraNumero = (v: string | number | null | undefined, padrao = 0): number => {
  if (v === null || v === undefined) return padrao;
  const n = typeof v === "string" ? parseFloat(v) : v;
  return isNaN(n) ? padrao : n;
};

const moeda = (v: number): string =>
  `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Mistura a cor com branco. Serve para as faixas dos pilares. */
const clarear = (cor: RGB, forca: number): RGB =>
  cor.map((c) => Math.round(c + (255 - c) * forca)) as RGB;

/** Corta o texto com reticências para caber em `largura` (mm). */
function encurtar(doc: jsPDF, texto: string, largura: number): string {
  if (doc.getTextWidth(texto) <= largura) return texto;
  let corte = texto;
  while (corte.length > 1 && doc.getTextWidth(corte + "...") > largura) {
    corte = corte.slice(0, -1);
  }
  return corte.replace(/[,\s]+$/, "") + "...";
}

/* -------------------------------------------------------------------------- */
/* Mapa facial                                                                  */
/* -------------------------------------------------------------------------- */

/** Cada área marcada recebe a cor do primeiro pilar que a reivindica. */
function corDasAreas(zonas: Record<string, string[]>): Map<string, RGB> {
  const mapa = new Map<string, RGB>();
  const chaves = [
    ...ORDEM_PILARES,
    ...Object.keys(zonas).filter((c) => !ORDEM_PILARES.includes(c)),
  ];
  for (const chave of chaves) {
    const cor = PILARES[chave]?.cor ?? ROXO;
    for (const id of zonas[chave] ?? []) {
      if (!mapa.has(id)) mapa.set(id, cor);
    }
  }
  return mapa;
}

function carregarImagem(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/**
 * Reproduz o mapa facial da tela num bitmap: a foto base com as áreas
 * marcadas preenchidas na cor do seu pilar, sem contorno.
 * Devolve `null` quando não há nada marcado ou a imagem não carrega.
 */
async function renderizarRosto(zonas: Record<string, string[]>): Promise<string | null> {
  if (typeof document === "undefined") return null;

  const cores = corDasAreas(zonas);
  if (cores.size === 0) return null;

  const img = await carregarImagem(IMAGEM_ROSTO);
  if (!img) return null;

  const largura = 700;
  const altura = Math.round((largura * RECORTE_A) / RECORTE_L);

  const canvas = document.createElement("canvas");
  canvas.width = largura;
  canvas.height = altura;

  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, largura, altura);

  // O espaço 0–1000 do FaceMap é mapeado para o canvas já recortado; a foto
  // é esticada para esse mesmo espaço, como no componente (object-fill).
  const escalaX = largura / RECORTE_L;
  const escalaY = altura / RECORTE_A;

  ctx.save();
  ctx.translate(-RECORTE.x0 * escalaX, -RECORTE.y0 * escalaY);
  ctx.drawImage(img, 0, 0, 1000 * escalaX, 1000 * escalaY);

  ctx.scale(escalaX, escalaY);
  ctx.globalAlpha = 0.5;
  for (const zona of FACE_ZONES) {
    const cor = cores.get(zona.id);
    if (!cor) continue;
    ctx.fillStyle = `rgb(${cor[0]}, ${cor[1]}, ${cor[2]})`;
    ctx.fill(new Path2D(zona.d));
  }
  ctx.restore();

  return canvas.toDataURL("image/jpeg", 0.92);
}

/* -------------------------------------------------------------------------- */

export const generateQuotePDF = async (quote: QuoteData) => {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const larguraPagina = doc.internal.pageSize.getWidth();
  const alturaPagina = doc.internal.pageSize.getHeight();
  const larguraUtil = larguraPagina - MARGEM * 2;

  /* ---------------------------------------------------------------- capa --- */

  const zonasPorPilar = quote.faceZones ?? {};
  const rosto = await renderizarRosto(zonasPorPilar);

  // Com o mapa facial no canto, a coluna de texto encolhe para não encostar nele.
  const xRosto = larguraPagina - MARGEM - LARGURA_ROSTO;
  const fimEsquerda = rosto ? xRosto - 7 : larguraPagina - MARGEM;

  if (rosto) {
    doc.addImage(rosto, "JPEG", xRosto, TOPO_ROSTO, LARGURA_ROSTO, ALTURA_ROSTO);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...TINTA_SUAVE);
    doc.text(
      "Áreas do seu tratamento",
      xRosto + LARGURA_ROSTO / 2,
      TOPO_ROSTO + ALTURA_ROSTO + 3.4,
      { align: "center" }
    );
  }

  let y = TOPO_RESERVADO;

  // Fio da marca sobre o título, no lugar de um logotipo
  doc.setFillColor(...ROXO);
  doc.rect(MARGEM, y - 8, 18, 1.2, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...TINTA);
  doc.text("Projeto Dermalift", MARGEM, y);

  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...TINTA_SUAVE);
  doc.text("Plano de tratamento personalizado", MARGEM, y);

  const dataHoje = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  // Sem o mapa facial a data fica na linha do subtítulo; com ele, desce
  // para a linha do rótulo PACIENTE, onde ainda há espaço.
  if (!rosto) {
    doc.setFontSize(9);
    doc.text(dataHoje, fimEsquerda, y, { align: "right" });
  }

  y += 10;
  doc.setDrawColor(...LINHA);
  doc.setLineWidth(0.3);
  doc.line(MARGEM, y, fimEsquerda, y);

  y += 9;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...TINTA_SUAVE);
  doc.text("PACIENTE", MARGEM, y);
  if (rosto) {
    doc.text(dataHoje, fimEsquerda, y, { align: "right" });
  }

  y += 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...TINTA);
  doc.text(doc.splitTextToSize(quote.patient.name, fimEsquerda - MARGEM)[0], MARGEM, y);

  y += 8;

  // A tabela só começa depois do mapa facial e da sua legenda.
  if (rosto) {
    y = Math.max(y, TOPO_ROSTO + ALTURA_ROSTO + 7);
  }

  /* ----------------------------------------------------- procedimentos --- */

  const porPilar: Record<string, QuoteData["items"]> = {};
  quote.items.forEach((item) => {
    const p = item.procedure.protocol;
    (porPilar[p] ||= []).push(item);
  });

  const linhas: any[] = [];

  ORDEM_PILARES.forEach((chave) => {
    const itens = porPilar[chave];
    if (!itens?.length) return;

    const pilar = PILARES[chave] ?? { nome: chave, cor: ROXO };

    // Áreas marcadas para este pilar, resumidas no canto direito da faixa
    const areas = zonasPorPilar[chave] ?? [];
    const textoAreas =
      areas.length >= FACE_ZONES.length
        ? "Todas as áreas"
        : zoneChips(areas).join("  ·  ");

    // Faixa do pilar: fundo tingido e texto na cor cheia
    linhas.push([
      {
        content: pilar.nome.toUpperCase(),
        colSpan: 3,
        _areas: textoAreas,
        _cor: pilar.cor,
        styles: {
          fontStyle: "bold",
          fontSize: 8.5,
          textColor: pilar.cor,
          fillColor: clarear(pilar.cor, 0.9),
          cellPadding: { top: 2.2, bottom: 2.2, left: 4, right: 4 },
        },
      },
    ]);

    itens.forEach((item) => {
      const qtd = paraNumero(item.quantity, 1);
      const nome = qtd > 1 ? `${item.procedure.name}  (${qtd}x)` : item.procedure.name;
      linhas.push([nome, item.note || "", moeda(paraNumero(item.subtotal, 0))]);
    });
  });

  autoTable(doc, {
    startY: y,
    head: [["Procedimento", "Observação", "Valor"]],
    body: linhas,
    theme: "plain",
    styles: {
      font: "helvetica",
      fontSize: 9.5,
      textColor: TINTA,
      cellPadding: { top: 2.5, bottom: 2.5, left: 4, right: 4 },
      lineColor: LINHA,
      lineWidth: 0,
    } as any,
    headStyles: {
      fontStyle: "bold",
      fontSize: 8,
      textColor: TINTA_SUAVE,
      fillColor: [255, 255, 255],
      cellPadding: { top: 0, bottom: 3, left: 4, right: 4 },
      lineColor: LINHA,
      lineWidth: { bottom: 0.4 } as any,
    },
    columnStyles: {
      0: { cellWidth: 62, fontStyle: "bold" },
      1: { cellWidth: larguraUtil - 62 - 30, textColor: TINTA_SUAVE, fontSize: 8.5 },
      2: { cellWidth: 30, halign: "right" },
    },
    margin: { left: MARGEM, right: MARGEM, top: 20 },
    // Linha divisória fina só entre procedimentos, nunca em volta de tudo
    didDrawCell: (data) => {
      const celulaFaixa = (data.row.raw as any[])?.[0];
      const ehFaixa = celulaFaixa?.colSpan === 3;

      // Na faixa do pilar, as áreas do rosto aparecem à direita
      if (data.section === "body" && ehFaixa && celulaFaixa?._areas) {
        // Mede o nome do pilar com a fonte dele antes de trocar
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        const larguraNome = doc.getTextWidth(String(celulaFaixa.content));

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(...(celulaFaixa._cor as RGB));

        const disponivel = data.cell.width - 8 - larguraNome - 6;
        if (disponivel > 14) {
          doc.text(
            encurtar(doc, String(celulaFaixa._areas), disponivel),
            data.cell.x + data.cell.width - 4,
            data.cell.y + data.cell.height / 2 + 1,
            { align: "right" }
          );
        }
      }

      if (data.section === "body" && !ehFaixa && data.column.index === 0) {
        doc.setDrawColor(...LINHA);
        doc.setLineWidth(0.2);
        doc.line(
          MARGEM,
          data.cell.y + data.cell.height,
          larguraPagina - MARGEM,
          data.cell.y + data.cell.height
        );
      }
    },
  });

  y = (doc as any).lastAutoTable.finalY + 7;

  /* ------------------------------------------------------------ valores --- */

  const subtotal = quote.items.reduce((s, i) => s + paraNumero(i.subtotal, 0), 0);
  const total = paraNumero(quote.total, 0);
  const desconto = paraNumero(quote.discount, 0);
  const descontoPct = paraNumero(quote.discountPercentage, 0);
  const entrada = paraNumero(quote.downPayment, 0);
  const saldo = total - entrada;
  const parcelas = quote.installments || 0;
  const valorParcela = parcelas > 0 ? saldo / parcelas : 0;

  // Altura real do que ainda falta desenhar, para decidir a quebra de página.
  // Some: linhas de desconto + caixa do total + entrada/saldo + parcelas,
  // depois o espaço até o rodapé e a própria caixa de condições.
  const alturaBonus = quote.bonusList?.length ? 6.5 + quote.bonusList.length * 6.2 : 0;
  const alturaValores =
    (descontoPct > 0 ? 14 : 0) + 14 + (entrada > 0 ? 12 : 0) + (parcelas > 0 ? 8 : 0);
  const alturaRestante = Math.max(alturaValores, alturaBonus) + 7 + 13;

  if (y + alturaRestante > alturaPagina - 8) {
    doc.addPage();
    y = 25;
  }

  const larguraResumo = 88;
  const xResumo = larguraPagina - MARGEM - larguraResumo;
  let yResumo = y;

  const linhaValor = (rotulo: string, valor: string, forte = false) => {
    doc.setFont("helvetica", forte ? "bold" : "normal");
    doc.setFontSize(forte ? 10 : 9.5);
    doc.setTextColor(...(forte ? TINTA : TINTA_SUAVE));
    doc.text(rotulo, xResumo, yResumo);
    doc.setTextColor(...TINTA);
    doc.setFont("helvetica", forte ? "bold" : "normal");
    doc.text(valor, larguraPagina - MARGEM, yResumo, { align: "right" });
    yResumo += 6;
  };

  if (descontoPct > 0) {
    linhaValor("Tratamentos avulsos", moeda(subtotal));
    linhaValor(`Desconto ${descontoPct.toFixed(0)}%`, `- ${moeda(desconto)}`);
    yResumo += 1.5;
    doc.setDrawColor(...LINHA);
    doc.setLineWidth(0.3);
    doc.line(xResumo, yResumo - 4, larguraPagina - MARGEM, yResumo - 4);
  }

  // Total em destaque
  doc.setFillColor(...clarear(ROXO, 0.93));
  doc.roundedRect(xResumo - 4, yResumo - 5.5, larguraResumo + 4, 13, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...ROXO);
  doc.text("Investimento total", xResumo, yResumo);
  doc.setFontSize(13);
  doc.text(moeda(total), larguraPagina - MARGEM, yResumo + 0.5, { align: "right" });
  yResumo += 14;

  if (entrada > 0) {
    linhaValor("Entrada", moeda(entrada));
    linhaValor("Saldo a pagar", moeda(saldo));
  }

  if (parcelas > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...TINTA);
    doc.text(
      `${parcelas}x de ${moeda(valorParcela)}`,
      larguraPagina - MARGEM,
      yResumo + 1,
      { align: "right" }
    );
    yResumo += 8;
  }

  /* -------------------------------------------------------------- bônus --- */

  let yEsquerda = y;

  if (quote.bonusList?.length) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...TINTA_SUAVE);
    doc.text("INCLUSO NO SEU PLANO", MARGEM, yEsquerda);
    yEsquerda += 6.5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...TINTA);

    quote.bonusList.forEach((bonus) => {
      doc.setFillColor(...ROXO);
      doc.circle(MARGEM + 1.2, yEsquerda - 1.2, 0.9, "F");
      const texto = doc.splitTextToSize(bonus, xResumo - MARGEM - 12);
      doc.text(texto, MARGEM + 5, yEsquerda);
      yEsquerda += texto.length * 4.6 + 1.6;
    });
  }

  /* ------------------------------------------------------------ rodapé --- */

  const yRodape = Math.max(yEsquerda, yResumo) + 7;
  const yCondicoes = Math.min(yRodape, alturaPagina - 21);

  doc.setFillColor(...FUNDO_SUAVE);
  doc.roundedRect(MARGEM, yCondicoes, larguraUtil, 13, 2, 2, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...TINTA_SUAVE);
  doc.text("CONDIÇÕES", MARGEM + 5, yCondicoes + 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...TINTA);
  doc.text(
    "Este orçamento é válido por 30 dias.  ·  Pagamento no cartão.",
    MARGEM + 5,
    yCondicoes + 9.8
  );

  // Numeração, quando passa de uma página
  const paginas = doc.getNumberOfPages();
  if (paginas > 1) {
    for (let p = 1; p <= paginas; p++) {
      doc.setPage(p);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...TINTA_SUAVE);
      doc.text(`${p} / ${paginas}`, larguraPagina / 2, alturaPagina - 10, {
        align: "center",
      });
    }
  }

  doc.save(`Projeto_Dermalift_${quote.patient.name.replace(/\s+/g, "_")}.pdf`);
};
