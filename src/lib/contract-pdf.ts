import dayjs from "dayjs";
import jsPDF from "jspdf";

export interface ContractVariables {
  paciente_nome: string;
  paciente_email: string;
  paciente_telefone: string;
  paciente_nascimento: string;
  data_hoje: string;
  clinica_nome: string;
}

const PLACEHOLDERS = [
  "paciente_nome",
  "paciente_email",
  "paciente_telefone",
  "paciente_nascimento",
  "data_hoje",
  "clinica_nome",
] as const;

export function replacePlaceholders(
  content: string,
  variables: ContractVariables,
): string {
  let result = content;
  for (const key of PLACEHOLDERS) {
    result = result.replace(
      new RegExp(`\\{\\{${key}\\}\\}`, "g"),
      variables[key] ?? "",
    );
  }
  return result;
}

export function generateContractPDF(
  templateName: string,
  content: string,
  variables: ContractVariables,
): void {
  const text = replacePlaceholders(content, variables);
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const maxWidth = pageWidth - margin * 2;
  const lineHeight = 6;
  let y = 25;

  doc.setFontSize(14);
  doc.text(templateName, pageWidth / 2, y, { align: "center" });
  y += 15;

  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);

  const paragraphs = text.split(/\n\n+/);
  for (const paragraph of paragraphs) {
    const lines = doc.splitTextToSize(paragraph.trim(), maxWidth);
    for (const line of lines) {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, margin, y);
      y += lineHeight;
    }
    y += lineHeight;
  }

  const filename = `contrato_${variables.paciente_nome.replace(/\s+/g, "_")}_${dayjs().format("YYYY-MM-DD")}.pdf`;
  doc.save(filename);
}
