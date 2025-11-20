import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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
}

const toNumber = (value: string | number | null | undefined, defaultValue: number = 0): number => {
  if (value === null || value === undefined) return defaultValue;
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return isNaN(num) ? defaultValue : num;
};

export const generateQuotePDF = async (quote: QuoteData) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  const protocolNames: Record<string, string> = {
    "sustentacao": "Sustentação",
    "estruturacao": "Estruturação",
    "embelezamento": "Embelezamento",
    "revitalizacao": "Revitalização e Pele",
    "alem_da_face": "Além da Face"
  };

  const terracottaColor: [number, number, number] = [139, 69, 19];
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 60; // Espaçamento para cabeçalho pré-impresso

  // Título (sem logotipo)
  doc.setFontSize(18);
  doc.setTextColor(terracottaColor[0], terracottaColor[1], terracottaColor[2]);
  doc.setFont("helvetica", "bold");
  doc.text("Projeto Dermalift", pageWidth / 2, yPos, { align: "center" });

  yPos += 15;
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  doc.text(`Paciente: ${quote.patient.name}`, 15, yPos);

  yPos += 10;

  const groupedByProtocol: Record<string, typeof quote.items> = {};
  quote.items.forEach(item => {
    const protocol = item.procedure.protocol;
    if (!groupedByProtocol[protocol]) {
      groupedByProtocol[protocol] = [];
    }
    groupedByProtocol[protocol].push(item);
  });

  const tableData: any[] = [];
  const protocolOrder = ["sustentacao", "estruturacao", "embelezamento", "revitalizacao", "alem_da_face"];

  protocolOrder.forEach(protocol => {
    if (groupedByProtocol[protocol]) {
      tableData.push([
        { content: protocolNames[protocol], colSpan: 3, styles: { fontStyle: "bold", fillColor: [245, 245, 245] } }
      ]);

      groupedByProtocol[protocol].forEach(item => {
        const quantity = toNumber(item.quantity, 1);
        const subtotal = toNumber(item.subtotal, 0);

        const serviceName = quantity > 1 ? `${quantity}. ${item.procedure.name}` : item.procedure.name;
        const description = item.note || "";
        const valueText = `R$ ${subtotal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

        tableData.push([serviceName, description, valueText]);
      });
    }
  });

  autoTable(doc, {
    startY: yPos,
    head: [["SERVIÇO", "DESCRIÇÃO", "VALOR"]],
    body: tableData,
    theme: "grid",
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: terracottaColor,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "center"
    },
    columnStyles: {
      0: { cellWidth: 55 },
      1: { cellWidth: 75 },
      2: { cellWidth: 38, halign: "right" }
    }
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Calculate subtotal by summing all item subtotals (which include custom prices)
  const subtotal = quote.items.reduce((sum, item) => sum + toNumber(item.subtotal, 0), 0);
  const total = toNumber(quote.total, 0);
  const discountAmount = toNumber(quote.discount, 0);
  const discountPercentage = toNumber(quote.discountPercentage, 0);
  const downPayment = toNumber(quote.downPayment, 0);
  const remainingBalance = total - downPayment;
  const installments = quote.installments || 0;
  const installmentValue = installments > 0 ? remainingBalance / installments : 0;

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  
  if (discountPercentage > 0) {
    doc.text(`TOTAL DOS TRATAMENTOS AVULSOS: R$ ${subtotal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 15, yPos);
    yPos += 7;
    doc.text(`DESCONTO ${discountPercentage.toFixed(1)}%: R$ ${discountAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 15, yPos);
    yPos += 7;
  }

  doc.text(`TOTAL: R$ ${total.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 15, yPos);
  yPos += 7;

  if (downPayment > 0) {
    doc.text(`ENTRADA: R$ ${downPayment.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 15, yPos);
    yPos += 7;
  }

  if (installments > 0) {
    doc.text(`${installments} X R$ ${installmentValue.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 15, yPos);
    yPos += 7;
  }

  if (quote.bonusList && quote.bonusList.length > 0) {
    yPos += 5;
    doc.setFont("helvetica", "bold");
    doc.text("BÔNUS:", 15, yPos);
    yPos += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    quote.bonusList.forEach((bonus) => {
      doc.text(`• ${bonus}`, 15, yPos);
      yPos += 5;
    });
  }

  yPos += 10;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("CONDIÇÕES E PAGAMENTOS", 15, yPos);
  yPos += 7;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Este orçamento é válido por 30 dias.", 15, yPos);
  yPos += 5;
  doc.text("Pagamento no cartão.", 15, yPos);

  doc.save(`Orcamento_${quote.patient.name.replace(/\s/g, "_")}.pdf`);
};
