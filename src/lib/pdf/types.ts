import type { jsPDF } from "jspdf";

export interface PdfColors {
  primary: { r: number; g: number; b: number };
  darkText: { r: number; g: number; b: number };
  mutedText: { r: number; g: number; b: number };
  lightGray: { r: number; g: number; b: number };
  white: { r: number; g: number; b: number };
  border: { r: number; g: number; b: number };
}

export const COLORS: PdfColors = {
  primary: { r: 59, g: 130, b: 246 },
  darkText: { r: 30, g: 41, b: 59 },
  mutedText: { r: 100, g: 116, b: 139 },
  lightGray: { r: 241, g: 245, b: 249 },
  white: { r: 255, g: 255, b: 255 },
  border: { r: 226, g: 232, b: 240 },
};

export type ContentBlock =
  | { type: "paragraph"; text: string }
  | { type: "subsection"; text: string }
  | { type: "sub-sub"; text: string }
  | { type: "label-value"; label: string; value: string }
  | { type: "bullet-list"; items: string[] }
  | { type: "checkbox"; checked: boolean; text: string }
  | { type: "italic-note"; text: string }
  | { type: "spacer"; height?: number };

export interface AgreementSection {
  title: string;
  blocks: ContentBlock[];
}

export interface RenderContext {
  pdf: jsPDF;
  y: number;
  margin: number;
  contentWidth: number;
  pageHeight: number;
}
