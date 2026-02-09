import type { jsPDF } from "jspdf";
import { COLORS, type ContentBlock, type RenderContext } from "./types";

const BULLET_INDENT = 5;

function checkPageBreak(ctx: RenderContext, needed: number): void {
  if (ctx.y + needed > ctx.pageHeight - 30) {
    ctx.pdf.addPage();
    ctx.y = ctx.margin;
  }
}

export function renderSectionTitle(ctx: RenderContext, title: string): void {
  checkPageBreak(ctx, 16);
  const { pdf, margin } = ctx;

  pdf.setFontSize(11.5);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
  pdf.text(title.toUpperCase(), margin, ctx.y);
  ctx.y += 2;

  // Subtle underline
  pdf.setDrawColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
  pdf.setLineWidth(0.4);
  pdf.line(margin, ctx.y, margin + ctx.contentWidth, ctx.y);
  ctx.y += 5;
}

function renderSubsection(ctx: RenderContext, text: string): void {
  checkPageBreak(ctx, 10);
  ctx.pdf.setFontSize(10);
  ctx.pdf.setFont("helvetica", "bold");
  ctx.pdf.setTextColor(COLORS.darkText.r, COLORS.darkText.g, COLORS.darkText.b);
  ctx.pdf.text(text, ctx.margin, ctx.y);
  ctx.y += 5.5;
}

function renderSubSub(ctx: RenderContext, text: string): void {
  checkPageBreak(ctx, 8);
  ctx.pdf.setFontSize(9.5);
  ctx.pdf.setFont("helvetica", "bolditalic");
  ctx.pdf.setTextColor(COLORS.darkText.r, COLORS.darkText.g, COLORS.darkText.b);
  ctx.pdf.text(text, ctx.margin, ctx.y);
  ctx.y += 5;
}

function renderParagraph(ctx: RenderContext, text: string): void {
  const { pdf, margin, contentWidth } = ctx;
  pdf.setFontSize(9.5);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(COLORS.darkText.r, COLORS.darkText.g, COLORS.darkText.b);

  const lines: string[] = pdf.splitTextToSize(text, contentWidth);
  for (const line of lines) {
    checkPageBreak(ctx, 5);
    pdf.text(line, margin, ctx.y);
    ctx.y += 4.5;
  }
  ctx.y += 1;
}

function renderLabelValue(ctx: RenderContext, label: string, value: string): void {
  checkPageBreak(ctx, 6);
  const { pdf, margin } = ctx;

  pdf.setFontSize(9.5);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(COLORS.darkText.r, COLORS.darkText.g, COLORS.darkText.b);
  const labelWidth = pdf.getTextWidth(label + " ");
  pdf.text(label, margin, ctx.y);

  pdf.setFont("helvetica", "normal");
  pdf.text(value, margin + labelWidth, ctx.y);
  ctx.y += 5;
}

function renderBulletList(ctx: RenderContext, items: string[]): void {
  const { pdf, margin, contentWidth } = ctx;
  const bulletX = margin + BULLET_INDENT;
  const textX = bulletX + 3;
  const textWidth = contentWidth - BULLET_INDENT - 3;

  pdf.setFontSize(9.5);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(COLORS.darkText.r, COLORS.darkText.g, COLORS.darkText.b);

  for (const item of items) {
    checkPageBreak(ctx, 6);
    pdf.text("•", bulletX, ctx.y);

    const lines: string[] = pdf.splitTextToSize(item, textWidth);
    for (let i = 0; i < lines.length; i++) {
      if (i > 0) checkPageBreak(ctx, 5);
      pdf.text(lines[i], textX, ctx.y);
      ctx.y += 4.5;
    }
  }
  ctx.y += 1;
}

function renderCheckbox(ctx: RenderContext, checked: boolean, text: string): void {
  checkPageBreak(ctx, 6);
  const { pdf, margin } = ctx;
  const boxX = margin + BULLET_INDENT;
  const boxY = ctx.y - 3;
  const boxSize = 3.5;

  // Draw checkbox outline
  pdf.setDrawColor(COLORS.darkText.r, COLORS.darkText.g, COLORS.darkText.b);
  pdf.setLineWidth(0.3);
  pdf.rect(boxX, boxY, boxSize, boxSize);

  if (checked) {
    // Checkmark
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
    pdf.text("✓", boxX + 0.3, ctx.y - 0.2);
  }

  // Text next to checkbox
  pdf.setFontSize(9.5);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(COLORS.darkText.r, COLORS.darkText.g, COLORS.darkText.b);
  pdf.text(text, boxX + boxSize + 2.5, ctx.y);
  ctx.y += 5.5;
}

function renderItalicNote(ctx: RenderContext, text: string): void {
  const { pdf, margin, contentWidth } = ctx;
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "italic");
  pdf.setTextColor(COLORS.mutedText.r, COLORS.mutedText.g, COLORS.mutedText.b);

  const lines: string[] = pdf.splitTextToSize(text, contentWidth);
  for (const line of lines) {
    checkPageBreak(ctx, 5);
    pdf.text(line, margin, ctx.y);
    ctx.y += 4.5;
  }
  ctx.y += 1;
}

export function renderBlock(ctx: RenderContext, block: ContentBlock): void {
  switch (block.type) {
    case "paragraph":
      renderParagraph(ctx, block.text);
      break;
    case "subsection":
      renderSubsection(ctx, block.text);
      break;
    case "sub-sub":
      renderSubSub(ctx, block.text);
      break;
    case "label-value":
      renderLabelValue(ctx, block.label, block.value);
      break;
    case "bullet-list":
      renderBulletList(ctx, block.items);
      break;
    case "checkbox":
      renderCheckbox(ctx, block.checked, block.text);
      break;
    case "italic-note":
      renderItalicNote(ctx, block.text);
      break;
    case "spacer":
      ctx.y += block.height ?? 4;
      break;
  }
}
