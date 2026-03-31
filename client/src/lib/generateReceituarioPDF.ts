import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { SkincareProduct, SkincareTimeOfDay } from "@shared/schema";

const timeOfDayLabels: Record<SkincareTimeOfDay, string> = {
  diurno: "Tratamentos Diurnos",
  tarde: "Tratamentos da Tarde",
  noturno: "Tratamentos Noturnos",
  especial: "Tratamentos Especiais / Corporais",
};

const timeOfDayOrder: SkincareTimeOfDay[] = ["diurno", "tarde", "noturno", "especial"];

async function imageUrlToBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export interface ReceituarioData {
  patientName?: string;
  clinicName?: string;
  selectedProducts: SkincareProduct[];
}

export const generateReceituarioPDF = async (data: ReceituarioData) => {
  const { patientName, clinicName, selectedProducts } = data;

  const roseColor: [number, number, number] = [180, 90, 110];
  const lightGray: [number, number, number] = [245, 243, 243];

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginLeft = 15;
  const marginRight = 15;
  const contentWidth = pageWidth - marginLeft - marginRight;
  let yPos = 20;

  // Header
  doc.setFillColor(roseColor[0], roseColor[1], roseColor[2]);
  doc.rect(0, 0, pageWidth, 14, "F");
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text(clinicName || "Dermalift", pageWidth / 2, 9, { align: "center" });

  yPos = 22;
  doc.setFontSize(16);
  doc.setTextColor(roseColor[0], roseColor[1], roseColor[2]);
  doc.setFont("helvetica", "bold");
  doc.text("Receituário de Skincare", pageWidth / 2, yPos, { align: "center" });

  yPos += 7;
  if (patientName) {
    doc.setFontSize(11);
    doc.setTextColor(60, 60, 60);
    doc.setFont("helvetica", "normal");
    doc.text(`Paciente: ${patientName}`, pageWidth / 2, yPos, { align: "center" });
    yPos += 5;
  }

  const today = new Date().toLocaleDateString("pt-BR");
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text(`Data: ${today}`, pageWidth / 2, yPos, { align: "center" });
  yPos += 10;

  // Group by time of day
  const grouped: Record<SkincareTimeOfDay, SkincareProduct[]> = {
    diurno: [],
    tarde: [],
    noturno: [],
    especial: [],
  };

  for (const p of selectedProducts) {
    grouped[p.timeOfDay].push(p);
  }

  let stepNumber = 1;

  for (const tod of timeOfDayOrder) {
    const products = grouped[tod];
    if (products.length === 0) continue;

    // Section header
    doc.setFillColor(roseColor[0], roseColor[1], roseColor[2]);
    doc.setDrawColor(roseColor[0], roseColor[1], roseColor[2]);
    doc.roundedRect(marginLeft, yPos, contentWidth, 8, 2, 2, "F");
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text(timeOfDayLabels[tod].toUpperCase(), marginLeft + 4, yPos + 5.5);
    yPos += 12;

    for (const product of products) {
      const imageBase64 = product.imageUrl ? await imageUrlToBase64(product.imageUrl) : null;

      const instructions = product.usageInstructions || "";
      const wrappedInstructions = doc.splitTextToSize(instructions, imageBase64 ? contentWidth - 28 : contentWidth - 8);
      const textBlockHeight = wrappedInstructions.length * 5 + 4;
      const blockHeight = Math.max(imageBase64 ? 28 : 14, textBlockHeight + 14);

      if (yPos + blockHeight > pageHeight - 20) {
        doc.addPage();
        yPos = 20;
      }

      // Product card background
      doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.setDrawColor(220, 215, 215);
      doc.roundedRect(marginLeft, yPos, contentWidth, blockHeight, 2, 2, "FD");

      // Step number circle
      doc.setFillColor(roseColor[0], roseColor[1], roseColor[2]);
      doc.circle(marginLeft + 6, yPos + 6, 4, "F");
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.text(String(stepNumber), marginLeft + 6, yPos + 7.2, { align: "center" });

      let textStartX = marginLeft + 14;

      // Image
      if (imageBase64) {
        try {
          doc.addImage(imageBase64, "JPEG", marginLeft + contentWidth - 28, yPos + 2, 24, 24);
        } catch {
          // ignore image errors
        }
      }

      // Product name
      doc.setFontSize(10);
      doc.setTextColor(40, 40, 40);
      doc.setFont("helvetica", "bold");
      const nameMaxWidth = imageBase64 ? contentWidth - 30 : contentWidth - 18;
      const wrappedName = doc.splitTextToSize(product.name, nameMaxWidth - 2);
      doc.text(wrappedName, textStartX, yPos + 7);

      // Usage instructions
      if (instructions) {
        doc.setFontSize(9);
        doc.setTextColor(80, 80, 80);
        doc.setFont("helvetica", "normal");
        const instrMaxWidth = imageBase64 ? contentWidth - 30 : contentWidth - 18;
        const wrappedInstr = doc.splitTextToSize(instructions, instrMaxWidth - 2);
        doc.text(wrappedInstr, textStartX, yPos + 7 + wrappedName.length * 5 + 2);
      }

      yPos += blockHeight + 3;
      stepNumber++;
    }

    yPos += 5;
  }

  // Footer note
  if (yPos + 15 > pageHeight - 10) {
    doc.addPage();
    yPos = 20;
  }
  yPos += 5;
  doc.setFontSize(8);
  doc.setTextColor(140, 140, 140);
  doc.setFont("helvetica", "italic");
  doc.text("Este receituário foi elaborado especialmente para você. Siga as orientações para melhores resultados.", pageWidth / 2, yPos, { align: "center" });

  const fileName = patientName
    ? `Receituario_${patientName.replace(/\s/g, "_")}.pdf`
    : "Receituario_Skincare.pdf";
  doc.save(fileName);
};
