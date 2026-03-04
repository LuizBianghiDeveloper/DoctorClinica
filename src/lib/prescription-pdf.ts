import dayjs from "dayjs";
import jsPDF from "jspdf";

export interface PrescriptionData {
  patientName: string;
  patientBirthDate: string | null;
  doctorName: string;
  doctorSpecialty?: string;
  clinicName: string;
  clinicAddress?: string | null;
  date: string;
  items: Array<{
    medication: string;
    dosage: string;
    instructions?: string | null;
  }>;
  additionalInstructions?: string | null;
}

export function generatePrescriptionPDF(data: PrescriptionData): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const maxWidth = pageWidth - margin * 2;
  let y = 25;

  doc.setFontSize(16);
  doc.setTextColor(60, 60, 60);
  doc.text(data.clinicName, margin, y);
  y += 6;

  if (data.clinicAddress) {
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(data.clinicAddress, margin, y);
    y += 10;
  } else {
    y += 4;
  }

  doc.setFontSize(14);
  doc.setTextColor(60, 60, 60);
  doc.text("RECEITUÁRIO MÉDICO", pageWidth / 2, y, { align: "center" });
  y += 15;

  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);

  const leftCol = margin;
  const rightCol = margin + 90;

  doc.text("Paciente:", leftCol, y);
  doc.text(data.patientName, leftCol + 25, y);
  y += 6;

  if (data.patientBirthDate) {
    doc.text("Nascimento:", leftCol, y);
    doc.text(dayjs(data.patientBirthDate).format("DD/MM/YYYY"), leftCol + 25, y);
    y += 6;
  }

  doc.text("Data:", rightCol, y);
  doc.text(dayjs(data.date).format("DD/MM/YYYY HH:mm"), rightCol + 15, y);
  y += 6;

  doc.text("Prescritor:", leftCol, y);
  doc.text(
    data.doctorSpecialty
      ? `${data.doctorName} - ${data.doctorSpecialty}`
      : data.doctorName,
    leftCol + 25,
    y,
  );
  y += 12;

  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  doc.setFont("helvetica", "bold");
  doc.text("Medicamentos:", margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");

  for (const item of data.items) {
    if (y > 250) {
      doc.addPage();
      y = 20;
    }

    doc.setFont("helvetica", "bold");
    const medLines = doc.splitTextToSize(`${item.medication} - ${item.dosage}`, maxWidth - 5);
    doc.text(medLines[0], margin, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    if (item.instructions) {
      const instLines = doc.splitTextToSize(`  ${item.instructions}`, maxWidth - 10);
      for (const line of instLines) {
        doc.text(line, margin, y);
        y += 5;
      }
    }
    y += 4;
  }

  if (data.additionalInstructions?.trim()) {
    y += 4;
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
    doc.setFont("helvetica", "bold");
    doc.text("Orientações adicionais:", margin, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    const addLines = doc.splitTextToSize(data.additionalInstructions.trim(), maxWidth);
    for (const line of addLines) {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, margin, y);
      y += 5;
    }
  }

  const filename = `receita_${data.patientName.replace(/\s+/g, "_")}_${dayjs(data.date).format("YYYY-MM-DD")}.pdf`;
  doc.save(filename);
}
