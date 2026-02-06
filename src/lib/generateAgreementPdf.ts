import { jsPDF } from "jspdf";
import { format } from "date-fns";
import dazeLogoSrc from "@/assets/daze-logo.png";

// Brand colors (converted to RGB for jsPDF)
const COLORS = {
  primary: { r: 59, g: 130, b: 246 },     // #3B82F6
  darkText: { r: 30, g: 41, b: 59 },      // #1E293B
  mutedText: { r: 100, g: 116, b: 139 },  // #64748B
  lightGray: { r: 241, g: 245, b: 249 },  // #F1F5F9
  white: { r: 255, g: 255, b: 255 },
  border: { r: 226, g: 232, b: 240 },     // #E2E8F0
};

export interface LegalEntityData {
  legal_entity_name?: string;
  billing_address?: string;
  authorized_signer_name?: string;
  authorized_signer_title?: string;
}

export interface GeneratePdfOptions {
  entity: LegalEntityData;
  signatureDataUrl?: string;
  signedAt?: string;
  documentId?: string;
}

// Convert image URL to base64
const imageToBase64 = (imgSrc: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = reject;
    img.src = imgSrc;
  });
};

// Generate the agreement text content
const getAgreementSections = (entity: LegalEntityData) => {
  const entityName = entity.legal_entity_name?.trim() || "[Legal Entity Name]";
  const address = entity.billing_address?.trim() || "[Registered Address]";
  const signerName = entity.authorized_signer_name?.trim() || "[Authorized Signer]";
  const signerTitle = entity.authorized_signer_title?.trim() || "[Title]";

  return [
    {
      title: "1. PURPOSE",
      content: "This Pilot Agreement establishes the terms and conditions under which the Partner will participate in the Daze platform pilot program."
    },
    {
      title: "2. PILOT PERIOD",
      content: "The pilot period shall commence upon execution of this Agreement and continue for a period of ninety (90) days, unless terminated earlier in accordance with Section 8."
    },
    {
      title: "3. SERVICES PROVIDED",
      content: `During the pilot period, Daze shall provide:\n• Access to the Daze ordering platform\n• Hardware installation and setup\n• Staff training and onboarding support\n• 24/7 technical support\n• Analytics and reporting dashboard`
    },
    {
      title: "4. PARTNER OBLIGATIONS",
      content: `${entityName} agrees to:\n• Provide accurate brand assets and menu information\n• Designate ${signerName} as the primary point of contact\n• Ensure staff participation in training sessions\n• Maintain operational hours as specified\n• Provide timely feedback on platform performance`
    },
    {
      title: "5. FEES AND PAYMENT",
      content: `During the pilot period, ${entityName} shall pay a reduced pilot fee as specified in the attached Schedule A. Standard pricing shall apply following the pilot period if Partner elects to continue.`
    },
    {
      title: "6. CONFIDENTIALITY",
      content: "Both parties agree to maintain the confidentiality of proprietary information shared during the pilot program."
    },
    {
      title: "7. DATA USAGE",
      content: `${entityName} grants Daze the right to collect and analyze anonymized operational data for the purpose of improving the platform and services.`
    },
    {
      title: "8. TERMINATION",
      content: "Either party may terminate this Agreement with thirty (30) days written notice. Upon termination, Daze shall remove all installed hardware within fourteen (14) business days."
    },
    {
      title: "9. LIMITATION OF LIABILITY",
      content: "Neither party shall be liable for indirect, incidental, or consequential damages arising from this Agreement."
    },
    {
      title: "10. GOVERNING LAW",
      content: "This Agreement shall be governed by the laws of the State of Delaware."
    }
  ];
};

export async function generateAgreementPdf(options: GeneratePdfOptions): Promise<void> {
  const { entity, signatureDataUrl, signedAt, documentId } = options;
  
  const entityName = entity.legal_entity_name?.trim() || "[Legal Entity Name]";
  const address = entity.billing_address?.trim() || "[Registered Address]";
  const signerName = entity.authorized_signer_name?.trim() || "[Authorized Signer]";
  const signerTitle = entity.authorized_signer_title?.trim() || "[Title]";
  
  const isSigned = !!signatureDataUrl;
  const docDate = signedAt ? format(new Date(signedAt), "MMMM d, yyyy") : format(new Date(), "MMMM d, yyyy");
  const docId = documentId || `PA-${Date.now().toString(36).toUpperCase()}`;

  // Create PDF (A4: 210mm x 297mm)
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  
  let y = margin;

  // Helper to add new page if needed
  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - 30) {
      pdf.addPage();
      y = margin;
      return true;
    }
    return false;
  };

  // =====================
  // HEADER SECTION
  // =====================
  try {
    const logoBase64 = await imageToBase64(dazeLogoSrc);
    pdf.addImage(logoBase64, "PNG", margin, y, 25, 25);
  } catch (e) {
    // If logo fails, add text fallback
    pdf.setFontSize(18);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
    pdf.text("DAZE", margin, y + 15);
  }

  // Document metadata (right aligned)
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(COLORS.mutedText.r, COLORS.mutedText.g, COLORS.mutedText.b);
  pdf.text(`Document #: ${docId}`, pageWidth - margin, y + 5, { align: "right" });
  pdf.text(`Date: ${docDate}`, pageWidth - margin, y + 10, { align: "right" });
  
  if (isSigned) {
    pdf.setTextColor(34, 197, 94); // Green
    pdf.setFont("helvetica", "bold");
    pdf.text("✓ SIGNED", pageWidth - margin, y + 16, { align: "right" });
  } else {
    pdf.setTextColor(245, 158, 11); // Amber
    pdf.setFont("helvetica", "bold");
    pdf.text("DRAFT", pageWidth - margin, y + 16, { align: "right" });
  }

  y += 35;

  // Divider line
  pdf.setDrawColor(COLORS.border.r, COLORS.border.g, COLORS.border.b);
  pdf.setLineWidth(0.5);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 10;

  // =====================
  // TITLE
  // =====================
  pdf.setFontSize(24);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(COLORS.darkText.r, COLORS.darkText.g, COLORS.darkText.b);
  pdf.text("PILOT AGREEMENT", pageWidth / 2, y, { align: "center" });
  y += 8;

  // Subtitle
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(COLORS.mutedText.r, COLORS.mutedText.g, COLORS.mutedText.b);
  pdf.text(
    `Between Daze Technologies, Inc. and ${entityName}`,
    pageWidth / 2,
    y,
    { align: "center" }
  );
  y += 15;

  // =====================
  // PARTNER INFORMATION BOX
  // =====================
  const boxHeight = 32;
  pdf.setFillColor(COLORS.lightGray.r, COLORS.lightGray.g, COLORS.lightGray.b);
  pdf.roundedRect(margin, y, contentWidth, boxHeight, 3, 3, "F");

  // Box label
  pdf.setFontSize(8);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(COLORS.mutedText.r, COLORS.mutedText.g, COLORS.mutedText.b);
  pdf.text("PARTNER INFORMATION", margin + 5, y + 6);

  // Entity details
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(COLORS.darkText.r, COLORS.darkText.g, COLORS.darkText.b);
  pdf.text(`Entity: ${entityName}`, margin + 5, y + 14);
  
  pdf.setFont("helvetica", "normal");
  pdf.text(`Address: ${address}`, margin + 5, y + 21);
  pdf.text(`Authorized Signer: ${signerName}, ${signerTitle}`, margin + 5, y + 28);

  y += boxHeight + 12;

  // =====================
  // AGREEMENT SECTIONS
  // =====================
  const sections = getAgreementSections(entity);

  for (const section of sections) {
    checkPageBreak(25);

    // Section title
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
    pdf.text(section.title, margin, y);
    y += 6;

    // Section content
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(COLORS.darkText.r, COLORS.darkText.g, COLORS.darkText.b);
    
    const lines = pdf.splitTextToSize(section.content, contentWidth);
    for (const line of lines) {
      checkPageBreak(6);
      pdf.text(line, margin, y);
      y += 5;
    }
    y += 6;
  }

  // =====================
  // SIGNATURE SECTION
  // =====================
  checkPageBreak(60);
  y += 5;

  // Divider
  pdf.setDrawColor(COLORS.border.r, COLORS.border.g, COLORS.border.b);
  pdf.setLineWidth(0.5);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 12;

  // Signature header
  pdf.setFontSize(12);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(COLORS.darkText.r, COLORS.darkText.g, COLORS.darkText.b);
  pdf.text("AUTHORIZED SIGNATURE", margin, y);
  y += 10;

  if (signatureDataUrl) {
    // Add signature image
    try {
      pdf.addImage(signatureDataUrl, "PNG", margin, y, 60, 25);
      y += 28;
    } catch {
      y += 5;
    }

    // Signature line
    pdf.setDrawColor(COLORS.darkText.r, COLORS.darkText.g, COLORS.darkText.b);
    pdf.setLineWidth(0.3);
    pdf.line(margin, y, margin + 80, y);
    y += 5;

    // Signer info
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.text(`${signerName}, ${signerTitle}`, margin, y);
    y += 5;
    pdf.setFont("helvetica", "normal");
    pdf.text(entityName, margin, y);
    y += 8;

    // Signed timestamp
    if (signedAt) {
      const signedDateTime = format(new Date(signedAt), "MMMM d, yyyy 'at' h:mm a");
      pdf.setFontSize(9);
      pdf.setTextColor(COLORS.mutedText.r, COLORS.mutedText.g, COLORS.mutedText.b);
      pdf.text(`Digitally Signed: ${signedDateTime}`, margin, y);
    }
  } else {
    // Unsigned state - show signature line placeholder
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "italic");
    pdf.setTextColor(COLORS.mutedText.r, COLORS.mutedText.g, COLORS.mutedText.b);
    pdf.text("This document has not been signed.", margin, y);
    y += 12;

    // Signature line placeholder
    pdf.setDrawColor(COLORS.border.r, COLORS.border.g, COLORS.border.b);
    pdf.setLineWidth(0.3);
    pdf.line(margin, y, margin + 80, y);
    y += 5;

    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(COLORS.darkText.r, COLORS.darkText.g, COLORS.darkText.b);
    pdf.text(`${signerName}, ${signerTitle}`, margin, y);
    y += 5;
    pdf.text(entityName, margin, y);
  }

  // =====================
  // FOOTER
  // =====================
  const footerY = pageHeight - 15;
  const totalPages = pdf.getNumberOfPages();

  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    
    // Footer divider
    pdf.setDrawColor(COLORS.border.r, COLORS.border.g, COLORS.border.b);
    pdf.setLineWidth(0.3);
    pdf.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

    // Page number (center)
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(COLORS.mutedText.r, COLORS.mutedText.g, COLORS.mutedText.b);
    pdf.text(`Page ${i} of ${totalPages}`, pageWidth / 2, footerY, { align: "center" });

    // Confidential (left)
    pdf.text("CONFIDENTIAL", margin, footerY);

    // Company name (right)
    pdf.text("Daze Technologies, Inc.", pageWidth - margin, footerY, { align: "right" });
  }

  // =====================
  // SAVE PDF
  // =====================
  const fileName = `Daze_Pilot_Agreement_${entityName.replace(/[^a-zA-Z0-9]/g, "_")}${isSigned ? "_SIGNED" : "_DRAFT"}.pdf`;
  pdf.save(fileName);
}
