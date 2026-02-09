import { jsPDF } from "jspdf";
import { format } from "date-fns";
import dazeLogoSrc from "@/assets/daze-logo.png";
import type { PilotAgreementData } from "@/types/pilotAgreement";

const COLORS = {
  primary: { r: 59, g: 130, b: 246 },
  darkText: { r: 30, g: 41, b: 59 },
  mutedText: { r: 100, g: 116, b: 139 },
  lightGray: { r: 241, g: 245, b: 249 },
  white: { r: 255, g: 255, b: 255 },
  border: { r: 226, g: 232, b: 240 },
};

export type { PilotAgreementData };

export interface GeneratePdfOptions {
  entity: PilotAgreementData;
  signatureDataUrl?: string;
  signedAt?: string;
  documentId?: string;
}

const imageToBase64 = (imgSrc: string): Promise<string> => {
  return new Promise((resolve, reject) => {
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
};

const blank = (v?: string, fallback = "_______________") => v?.trim() || fallback;

const getAgreementSections = (d: PilotAgreementData) => {
  const name = blank(d.legal_entity_name, "[Client Legal Name]");
  const dba = blank(d.dba_name, "[DBA]");
  const addr = blank(d.billing_address, "[Address]");
  const contact = blank(d.authorized_signer_name, "[Primary Contact]");
  const title = blank(d.authorized_signer_title, "[Title]");
  const email = blank(d.contact_email, "[Email]");

  const outlets = (d.covered_outlets || []).filter(o => o.trim());
  const outletLines = outlets.length > 0
    ? outlets.map((o, i) => `${i + 1}. ${o}`).join("\n")
    : "1. _______________\n2. _______________\n3. _______________\n4. _______________";

  const hwCheck = d.hardware_option === "daze_provided";

  const startDate = d.start_date ? format(new Date(d.start_date), "MMMM d, yyyy") : "_______________";
  const termDays = d.pilot_term_days != null ? String(d.pilot_term_days) : "________";

  const pm = d.pricing_model;
  const pAmt = blank(d.pricing_amount, "________");

  const posSystem = blank(d.pos_system);
  const posVersion = blank(d.pos_version);
  const posApiKey = blank(d.pos_api_key);
  const posContact = blank(d.pos_contact);

  return [
    {
      title: "",
      content: `This Pilot Agreement ("Agreement") is entered into between Daze Technologies Corp., a Delaware corporation with its principal place of business in Florida ("Daze"), and:\n\nClient Legal Name: ${name}\nDBA (Doing Business as): ${dba}\nAddress: ${addr}\nPrimary Contact: ${contact}\nTitle: ${title}\nEmail: ${email}\n\n("Client") for the purpose of deploying and evaluating the Daze platform in a live operational environment.`
    },
    {
      title: "1. PILOT PURPOSE",
      content: "The purpose of this pilot is to deploy the Daze platform within select Client locations to:\n• Validate operational workflows and staff adoption.\n• Improve guest ordering convenience and overall experience.\n• Measure service efficiency, labor impact, and operational benefits.\n• Evaluate revenue performance, guest adoption rates, and return on investment.\n\nThe pilot is intended as a pre-commercial implementation to demonstrate operational readiness and mutual fit."
    },
    {
      title: "2. PILOT SCOPE",
      content: `2.1 Covered Outlets\nThe Pilot will be conducted at the following F&B outlets and Serviceable areas:\n${outletLines}\n\n2.2 Products and Services\nAvailable products include:\n• Pool & Beach Mobile Ordering\n• Common Space Digital Ordering\n• Table Pay & Order\n• In-Room Dining\n\n2.3 Hardware Selection\n${hwCheck ? "[ ] No Daze Hardware Required\n[X] Daze-Provided Hardware" : "[X] No Daze Hardware Required\n[ ] Daze-Provided Hardware"}\n• Number of Tablets: ${tablets}\n• Mounts/Stands: ${mounts}\n\n2.4 Enabled Capabilities\n• Guest mobile ordering via smartphone or tablet.\n• Payment processing and facilitation.\n• Location-based delivery coordination.\n• Management reporting and analytics dashboard.\n• POS integration with Client's designated POS system(s).\n• QR Code Access Points.`
    },
    {
      title: "3. PILOT TERM",
      content: `Start Date: ${startDate}\nPilot Term: ${termDays} days (recommended: 60-90 days)\n\nThe Pilot Term may be extended by mutual written agreement of both parties.`
    },
    {
      title: "4. RESPONSIBILITIES",
      content: `4.1 Daze Responsibilities\nDaze shall:\n• Configure and deploy the platform for Covered Outlets.\n• Provide onboard training for Client staff.\n• Provide operational support during business hours.\n• Monitor platform performance and provide reporting.\n• Integrate with Client's designated POS system(s).\n\n4.2 Client Responsibilities\nClient shall:\n• Provide operational access to Covered Outlets, including Wi-Fi and power.\n• Ensure staff participation in training.\n• Designate a primary point of contact.\n• Provide timely feedback on platform performance.\n• Maintain PCI DSS compliance.\n• Provide API credentials and documentation for POS integration.\n\n4.3 Hardware & Physical Materials\nIf selected in Section 2.3, all Hardware remains the sole property of Daze and is subject to bailment terms.`
    },
    {
      title: "5. PILOT FEES",
      content: `${pm === "none" || !pm ? "[X]" : "[ ]"} 5.1 No Fees — No fees apply during the Pilot Term.\n\n${pm === "subscription" ? "[X]" : "[ ]"} 5.2 Subscription Platform Fee — $${pm === "subscription" ? pAmt : "________"}\n\n${pm === "daze_rev_share" ? "[X]" : "[ ]"} 5.3 Daze Revenue Share Fee — ${pm === "daze_rev_share" ? pAmt : "________"}% of gross transaction value.\n\n${pm === "client_rev_share" ? "[X]" : "[ ]"} 5.4 Client Revenue Share Fee — ${pm === "client_rev_share" ? pAmt : "________"}% of gross F&B sales value.\n\n5.5 Payment Terms\nPilot fees are due Net 7 from invoice date.`
    },
    {
      title: "6. SETTLEMENT, TIPS, AND CHARGEBACKS",
      content: "6.1 Settlement — Net proceeds remitted on a Net 7 basis.\n6.2 Tips and Gratuities — All tips are pass-through funds.\n6.3 Payment Disputes — Client is solely responsible for refunds, chargebacks, and disputes."
    },
    {
      title: "7. PILOT SUCCESS CHECKPOINT & CONTINUITY CLAUSE",
      content: "The parties agree to conduct a good-faith review of pilot performance, typically 14–21 days prior to the end of the Pilot Term."
    },
    {
      title: "8. DATA, SECURITY, AND CONFIDENTIALITY",
      content: "8.1 Data Ownership — Daze retains platform IP; Client retains Client Data.\n8.2 Data License — Client grants Daze a license to use aggregated, de-identified data.\n8.3 Security — SOC 2 aligned architecture.\n8.4 Encryption — AES-256 at rest, TLS 1.2+ in transit.\n8.5 Privacy — No sale of guest PII.\n8.6 PCI DSS — No raw card data stored on Daze servers.\n8.7 Incident Response — 48-hour breach notification.\n8.8 Confidentiality — 3-year confidentiality obligation."
    },
    {
      title: "9. TERMINATION",
      content: "Either party may terminate upon fourteen (14) days' written notice."
    },
    {
      title: "10. INDEMNIFICATION",
      content: "Client shall indemnify Daze from claims arising from Client's use, products sold, guest complaints, PCI breaches, negligence, or IP infringement."
    },
    {
      title: "11. LIMITATION OF LIABILITY",
      content: "NEITHER PARTY'S LIABILITY SHALL EXCEED FEES PAID UNDER THIS AGREEMENT. NEITHER PARTY SHALL BE LIABLE FOR INDIRECT, INCIDENTAL, OR CONSEQUENTIAL DAMAGES."
    },
    {
      title: "12. SERVICE LEVEL AGREEMENT",
      content: "Daze targets 99.5% platform uptime during Client's operating hours (excluding scheduled maintenance)."
    },
    {
      title: "13. MISCELLANEOUS",
      content: `13.1 Subcontractors — Daze may use third-party subcontractors.\n\n13.2 POS Integration\nPOS System: ${posSystem}\nVersion: ${posVersion}\nAPI Key: ${posApiKey}\nWho to Contact: ${posContact}\n\n13.3 Governing Law — State of Florida.\n13.4 Dispute Resolution — Good faith negotiation, then Miami-Dade County courts.\n13.5 Entire Agreement\n13.6 Amendment — Written instrument signed by both parties.\n13.7 Assignment\n13.8 Force Majeure\n13.9 Severability\n13.10 Counterparts`
    },
  ];
};

export async function generateAgreementPdf(options: GeneratePdfOptions): Promise<void> {
  const { entity, signatureDataUrl, signedAt, documentId } = options;

  const entityName = blank(entity.legal_entity_name, "[Client Legal Name]");
  const signerName = blank(entity.authorized_signer_name, "[Authorized Signer]");
  const signerTitle = blank(entity.authorized_signer_title, "[Title]");

  const isSigned = !!signatureDataUrl;
  const docDate = signedAt ? format(new Date(signedAt), "MMMM d, yyyy") : format(new Date(), "MMMM d, yyyy");
  const docId = documentId || `PA-${Date.now().toString(36).toUpperCase()}`;

  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  let y = margin;

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - 30) {
      pdf.addPage();
      y = margin;
      return true;
    }
    return false;
  };

  // HEADER
  try {
    const logoBase64 = await imageToBase64(dazeLogoSrc);
    pdf.addImage(logoBase64, "PNG", margin, y, 25, 25);
  } catch {
    pdf.setFontSize(18);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
    pdf.text("DAZE", margin, y + 15);
  }

  pdf.setFontSize(9);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(COLORS.mutedText.r, COLORS.mutedText.g, COLORS.mutedText.b);
  pdf.text(`Document #: ${docId}`, pageWidth - margin, y + 5, { align: "right" });
  pdf.text(`Date: ${docDate}`, pageWidth - margin, y + 10, { align: "right" });

  if (isSigned) {
    pdf.setTextColor(34, 197, 94);
    pdf.setFont("helvetica", "bold");
    pdf.text("✓ SIGNED", pageWidth - margin, y + 16, { align: "right" });
  } else {
    pdf.setTextColor(245, 158, 11);
    pdf.setFont("helvetica", "bold");
    pdf.text("DRAFT", pageWidth - margin, y + 16, { align: "right" });
  }

  y += 35;
  pdf.setDrawColor(COLORS.border.r, COLORS.border.g, COLORS.border.b);
  pdf.setLineWidth(0.5);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 10;

  // TITLE
  pdf.setFontSize(22);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(COLORS.darkText.r, COLORS.darkText.g, COLORS.darkText.b);
  pdf.text("PILOT AGREEMENT", pageWidth / 2, y, { align: "center" });
  y += 7;

  pdf.setFontSize(11);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(COLORS.mutedText.r, COLORS.mutedText.g, COLORS.mutedText.b);
  pdf.text("Daze Technologies Corp.", pageWidth / 2, y, { align: "center" });
  y += 12;

  // AGREEMENT SECTIONS
  const sections = getAgreementSections(entity);

  for (const section of sections) {
    if (section.title) {
      checkPageBreak(20);
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(COLORS.primary.r, COLORS.primary.g, COLORS.primary.b);
      pdf.text(section.title, margin, y);
      y += 6;
    }

    pdf.setFontSize(9.5);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(COLORS.darkText.r, COLORS.darkText.g, COLORS.darkText.b);

    const lines = pdf.splitTextToSize(section.content, contentWidth);
    for (const line of lines) {
      checkPageBreak(5);
      pdf.text(line, margin, y);
      y += 4.5;
    }
    y += 5;
  }

  // SIGNATURE BLOCK — dual column
  checkPageBreak(70);
  y += 5;
  pdf.setDrawColor(COLORS.border.r, COLORS.border.g, COLORS.border.b);
  pdf.setLineWidth(0.5);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 10;

  pdf.setFontSize(11);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(COLORS.darkText.r, COLORS.darkText.g, COLORS.darkText.b);
  pdf.text("IN WITNESS WHEREOF", margin, y);
  y += 10;

  const colWidth = (contentWidth - 10) / 2;
  const leftX = margin;
  const rightX = margin + colWidth + 10;

  // Left column: DAZE
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "bold");
  pdf.text("DAZE TECHNOLOGIES CORP.", leftX, y);
  pdf.setFont("helvetica", "normal");
  const dazeSignY = y + 22;
  pdf.setDrawColor(COLORS.darkText.r, COLORS.darkText.g, COLORS.darkText.b);
  pdf.setLineWidth(0.3);
  pdf.line(leftX, dazeSignY, leftX + colWidth, dazeSignY);
  pdf.text("Signature", leftX, dazeSignY + 5);
  pdf.line(leftX, dazeSignY + 15, leftX + colWidth, dazeSignY + 15);
  pdf.text("Name", leftX, dazeSignY + 20);
  pdf.line(leftX, dazeSignY + 30, leftX + colWidth, dazeSignY + 30);
  pdf.text("Title", leftX, dazeSignY + 35);
  pdf.line(leftX, dazeSignY + 45, leftX + colWidth, dazeSignY + 45);
  pdf.text("Date", leftX, dazeSignY + 50);

  // Right column: CLIENT
  pdf.setFont("helvetica", "bold");
  pdf.text("CLIENT", rightX, y);
  pdf.setFont("helvetica", "normal");

  if (signatureDataUrl) {
    try {
      pdf.addImage(signatureDataUrl, "PNG", rightX, y + 5, 50, 15);
    } catch { /* ignore */ }
  }

  pdf.setDrawColor(COLORS.darkText.r, COLORS.darkText.g, COLORS.darkText.b);
  pdf.line(rightX, dazeSignY, rightX + colWidth, dazeSignY);
  pdf.text("Signature", rightX, dazeSignY + 5);

  pdf.line(rightX, dazeSignY + 15, rightX + colWidth, dazeSignY + 15);
  pdf.setFont("helvetica", "bold");
  pdf.text(signerName, rightX, dazeSignY + 13);
  pdf.setFont("helvetica", "normal");
  pdf.text("Name", rightX, dazeSignY + 20);

  pdf.line(rightX, dazeSignY + 30, rightX + colWidth, dazeSignY + 30);
  pdf.text(signerTitle, rightX, dazeSignY + 28);
  pdf.text("Title", rightX, dazeSignY + 35);

  pdf.line(rightX, dazeSignY + 45, rightX + colWidth, dazeSignY + 45);
  pdf.text(signedAt ? format(new Date(signedAt), "MMMM d, yyyy") : "", rightX, dazeSignY + 43);
  pdf.text("Date", rightX, dazeSignY + 50);

  // FOOTER on all pages
  const footerY = pageHeight - 15;
  const totalPages = pdf.getNumberOfPages();

  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setDrawColor(COLORS.border.r, COLORS.border.g, COLORS.border.b);
    pdf.setLineWidth(0.3);
    pdf.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(COLORS.mutedText.r, COLORS.mutedText.g, COLORS.mutedText.b);
    pdf.text(`${i} / ${totalPages}`, pageWidth / 2, footerY, { align: "center" });
    pdf.text("Daze Technologies Corp. - Pilot Agreement", margin, footerY);
  }

  const fileName = `Daze_Pilot_Agreement_${entityName.replace(/[^a-zA-Z0-9]/g, "_")}${isSigned ? "_SIGNED" : "_DRAFT"}.pdf`;
  pdf.save(fileName);
}
