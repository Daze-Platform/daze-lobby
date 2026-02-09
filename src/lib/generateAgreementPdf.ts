import { jsPDF } from "jspdf";
import { format } from "date-fns";
import dazeLogoSrc from "@/assets/daze-logo.png";
import type { PilotAgreementData } from "@/types/pilotAgreement";
import { COLORS, type RenderContext } from "./pdf/types";
import { renderSectionTitle, renderBlock } from "./pdf/renderers";
import { getAgreementSections } from "./pdf/sections";

export type { PilotAgreementData };

export interface GeneratePdfOptions {
  entity: PilotAgreementData;
  signatureDataUrl?: string;
  signedAt?: string;
  documentId?: string;
}

const imageToBase64 = (imgSrc: string): Promise<string> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("No canvas ctx")); return; }
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = reject;
    img.src = imgSrc;
  });

const blank = (v?: string, fallback = "_______________") => v?.trim() || fallback;

export async function generateAgreementPdf(options: GeneratePdfOptions): Promise<void> {
  const { entity, signatureDataUrl, signedAt, documentId } = options;

  const entityName = blank(entity.legal_entity_name, "[Client Legal Name]");
  const signerName = blank(entity.authorized_signer_name, "[Authorized Signer]");
  const signerTitle = blank(entity.authorized_signer_title, "[Title]");

  const isSigned = !!signatureDataUrl;
  const docDate = signedAt
    ? format(new Date(signedAt), "MMMM d, yyyy")
    : format(new Date(), "MMMM d, yyyy");
  const docId = documentId || `PA-${Date.now().toString(36).toUpperCase()}`;

  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  const ctx: RenderContext = { pdf, y: margin, margin, contentWidth, pageHeight };

  // ── HEADER ──────────────────────────────────────────────
  try {
    const logoBase64 = await imageToBase64(dazeLogoSrc);
    pdf.addImage(logoBase64, "PNG", margin, ctx.y, 25, 25);
  } catch {
    pdf.setFontSize(18);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
    pdf.text("DAZE", margin, ctx.y + 15);
  }

  pdf.setFontSize(8.5);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(COLORS.mutedText.r, COLORS.mutedText.g, COLORS.mutedText.b);
  pdf.text(`Document #: ${docId}`, pageWidth - margin, ctx.y + 5, { align: "right" });
  pdf.text(`Date: ${docDate}`, pageWidth - margin, ctx.y + 10, { align: "right" });

  if (isSigned) {
    pdf.setTextColor(34, 197, 94);
    pdf.setFont("helvetica", "bold");
    pdf.text("✓ SIGNED", pageWidth - margin, ctx.y + 16, { align: "right" });
  } else {
    pdf.setTextColor(245, 158, 11);
    pdf.setFont("helvetica", "bold");
    pdf.text("DRAFT", pageWidth - margin, ctx.y + 16, { align: "right" });
  }

  ctx.y += 35;
  pdf.setDrawColor(COLORS.border.r, COLORS.border.g, COLORS.border.b);
  pdf.setLineWidth(0.5);
  pdf.line(margin, ctx.y, pageWidth - margin, ctx.y);
  ctx.y += 10;

  // ── TITLE ──────────────────────────────────────────────
  pdf.setFontSize(22);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(COLORS.darkText.r, COLORS.darkText.g, COLORS.darkText.b);
  pdf.text("PILOT AGREEMENT", pageWidth / 2, ctx.y, { align: "center" });
  ctx.y += 7;

  pdf.setFontSize(11);
  pdf.setFont("helvetica", "italic");
  pdf.setTextColor(COLORS.mutedText.r, COLORS.mutedText.g, COLORS.mutedText.b);
  pdf.text("Daze Technologies Corp.", pageWidth / 2, ctx.y, { align: "center" });
  ctx.y += 12;

  // ── SECTIONS ──────────────────────────────────────────
  const sections = getAgreementSections(entity);

  for (const section of sections) {
    if (section.title) {
      renderSectionTitle(ctx, section.title);
    }
    for (const block of section.blocks) {
      renderBlock(ctx, block);
    }
    ctx.y += 3;
  }

  // ── SIGNATURE BLOCK ───────────────────────────────────
  if (ctx.y + 70 > pageHeight - 30) {
    pdf.addPage();
    ctx.y = margin;
  }

  ctx.y += 5;
  pdf.setDrawColor(COLORS.border.r, COLORS.border.g, COLORS.border.b);
  pdf.setLineWidth(0.5);
  pdf.line(margin, ctx.y, pageWidth - margin, ctx.y);
  ctx.y += 10;

  // "IN WITNESS WHEREOF" — small caps style
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(COLORS.darkText.r, COLORS.darkText.g, COLORS.darkText.b);
  pdf.text("IN WITNESS WHEREOF", margin, ctx.y);
  ctx.y += 10;

  const colWidth = (contentWidth - 10) / 2;
  const leftX = margin;
  const rightX = margin + colWidth + 10;
  const signBaseY = ctx.y;

  // Left column: DAZE
  pdf.setFontSize(9.5);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
  pdf.text("DAZE TECHNOLOGIES CORP.", leftX, signBaseY);

  const lineStartY = signBaseY + 22;
  pdf.setDrawColor(COLORS.darkText.r, COLORS.darkText.g, COLORS.darkText.b);
  pdf.setLineWidth(0.3);

  pdf.line(leftX, lineStartY, leftX + colWidth, lineStartY);
  pdf.setFontSize(8);
  pdf.setFont("helvetica", "italic");
  pdf.setTextColor(COLORS.mutedText.r, COLORS.mutedText.g, COLORS.mutedText.b);
  pdf.text("Signature", leftX, lineStartY + 4);

  pdf.line(leftX, lineStartY + 14, leftX + colWidth, lineStartY + 14);
  pdf.text("Name", leftX, lineStartY + 18);

  pdf.line(leftX, lineStartY + 28, leftX + colWidth, lineStartY + 28);
  pdf.text("Title", leftX, lineStartY + 32);

  pdf.line(leftX, lineStartY + 42, leftX + colWidth, lineStartY + 42);
  pdf.text("Date", leftX, lineStartY + 46);

  // Right column: CLIENT
  pdf.setFontSize(9.5);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
  pdf.text("CLIENT", rightX, signBaseY);

  if (signatureDataUrl) {
    try {
      pdf.addImage(signatureDataUrl, "PNG", rightX, signBaseY + 5, 50, 15);
    } catch { /* ignore */ }
  }

  pdf.setDrawColor(COLORS.darkText.r, COLORS.darkText.g, COLORS.darkText.b);
  pdf.line(rightX, lineStartY, rightX + colWidth, lineStartY);
  pdf.setFontSize(8);
  pdf.setFont("helvetica", "italic");
  pdf.setTextColor(COLORS.mutedText.r, COLORS.mutedText.g, COLORS.mutedText.b);
  pdf.text("Signature", rightX, lineStartY + 4);

  // Filled client values
  pdf.setFontSize(9.5);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(COLORS.darkText.r, COLORS.darkText.g, COLORS.darkText.b);
  pdf.text(signerName, rightX, lineStartY + 12);
  pdf.line(rightX, lineStartY + 14, rightX + colWidth, lineStartY + 14);
  pdf.setFontSize(8);
  pdf.setFont("helvetica", "italic");
  pdf.setTextColor(COLORS.mutedText.r, COLORS.mutedText.g, COLORS.mutedText.b);
  pdf.text("Name", rightX, lineStartY + 18);

  pdf.setFontSize(9.5);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(COLORS.darkText.r, COLORS.darkText.g, COLORS.darkText.b);
  pdf.text(signerTitle, rightX, lineStartY + 26);
  pdf.line(rightX, lineStartY + 28, rightX + colWidth, lineStartY + 28);
  pdf.setFontSize(8);
  pdf.setFont("helvetica", "italic");
  pdf.setTextColor(COLORS.mutedText.r, COLORS.mutedText.g, COLORS.mutedText.b);
  pdf.text("Title", rightX, lineStartY + 32);

  pdf.setFontSize(9.5);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(COLORS.darkText.r, COLORS.darkText.g, COLORS.darkText.b);
  pdf.text(signedAt ? format(new Date(signedAt), "MMMM d, yyyy") : "", rightX, lineStartY + 40);
  pdf.line(rightX, lineStartY + 42, rightX + colWidth, lineStartY + 42);
  pdf.setFontSize(8);
  pdf.setFont("helvetica", "italic");
  pdf.setTextColor(COLORS.mutedText.r, COLORS.mutedText.g, COLORS.mutedText.b);
  pdf.text("Date", rightX, lineStartY + 46);

  // ── FOOTER on all pages ───────────────────────────────
  const footerY = pageHeight - 15;
  const totalPages = pdf.getNumberOfPages();

  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setDrawColor(COLORS.border.r, COLORS.border.g, COLORS.border.b);
    pdf.setLineWidth(0.3);
    pdf.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

    pdf.setFontSize(7.5);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(COLORS.mutedText.r, COLORS.mutedText.g, COLORS.mutedText.b);
    pdf.text(`${i} / ${totalPages}`, pageWidth / 2, footerY, { align: "center" });

    pdf.setFont("helvetica", "italic");
    pdf.text("Daze Technologies Corp. — Pilot Agreement", margin, footerY);
  }

  const fileName = `Daze_Pilot_Agreement_${entityName.replace(/[^a-zA-Z0-9]/g, "_")}${isSigned ? "_SIGNED" : "_DRAFT"}.pdf`;
  pdf.save(fileName);
}
