import { format } from "date-fns";
import type { PilotAgreementData } from "@/types/pilotAgreement";
import type { AgreementSection } from "./types";

const blank = (v?: string, fallback = "_______________") => v?.trim() || fallback;

export function getAgreementSections(d: PilotAgreementData): AgreementSection[] {
  const name = blank(d.legal_entity_name, "[Client Legal Name]");
  const dba = blank(d.dba_name, "[DBA]");
  const addr = blank(d.billing_address, "[Address]");
  const contact = blank(d.authorized_signer_name, "[Primary Contact]");
  const title = blank(d.authorized_signer_title, "[Title]");
  const email = blank(d.contact_email, "[Email]");

  const outlets = (d.covered_outlets || []).filter(o => o.trim());
  const outletItems = outlets.length > 0
    ? outlets
    : ["_______________", "_______________", "_______________"];

  const hwDaze = d.hardware_option === "daze_provided";

  const startDate = d.start_date ? format(new Date(d.start_date), "MMMM d, yyyy") : "_______________";
  const termDays = d.pilot_term_days != null ? String(d.pilot_term_days) : "________";

  const pm = d.pricing_model;
  const pAmt = blank(d.pricing_amount, "________");

  const posSystem = blank(d.pos_system);
  const posVersion = blank(d.pos_version);
  const posApiKey = blank(d.pos_api_key);
  const posContact = blank(d.pos_contact);

  return [
    // PREAMBLE (no title)
    {
      title: "",
      blocks: [
        {
          type: "paragraph",
          text: `This Pilot Agreement ("Agreement") is entered into between Daze Technologies Corp., a Delaware corporation with its principal place of business in Florida ("Daze"), and the entity identified below ("Client") for the purpose of deploying and evaluating the Daze platform in a live operational environment.`,
        },
        { type: "spacer", height: 3 },
        { type: "label-value", label: "Client Legal Name:", value: name },
        { type: "label-value", label: "DBA (Doing Business As):", value: dba },
        { type: "label-value", label: "Address:", value: addr },
        { type: "label-value", label: "Primary Contact:", value: contact },
        { type: "label-value", label: "Title:", value: title },
        { type: "label-value", label: "Email:", value: email },
      ],
    },

    // 1. PILOT PURPOSE
    {
      title: "1. Pilot Purpose",
      blocks: [
        {
          type: "paragraph",
          text: "The purpose of this pilot is to deploy the Daze platform within select Client locations to:",
        },
        {
          type: "bullet-list",
          items: [
            "Validate operational workflows and staff adoption.",
            "Improve guest ordering convenience and overall experience.",
            "Measure service efficiency, labor impact, and operational benefits.",
            "Evaluate revenue performance, guest adoption rates, and return on investment.",
          ],
        },
        {
          type: "italic-note",
          text: "The pilot is intended as a pre-commercial implementation to demonstrate operational readiness and mutual fit.",
        },
      ],
    },

    // 2. PILOT SCOPE
    {
      title: "2. Pilot Scope",
      blocks: [
        { type: "subsection", text: "2.1 Covered Outlets" },
        {
          type: "paragraph",
          text: "The Pilot will be conducted at the following F&B outlets and Serviceable areas:",
        },
        { type: "bullet-list", items: outletItems },
        { type: "spacer" },

        { type: "subsection", text: "2.2 Products and Services" },
        {
          type: "paragraph",
          text: "Available products include:",
        },
        {
          type: "bullet-list",
          items: [
            "Pool & Beach Mobile Ordering",
            "Common Space Digital Ordering",
            "Table Pay & Order",
            "In-Room Dining",
          ],
        },
        { type: "spacer" },

        { type: "subsection", text: "2.3 Hardware Selection" },
        { type: "checkbox", checked: !hwDaze, text: "No Daze Hardware Required" },
        { type: "checkbox", checked: hwDaze, text: "Daze-Provided Hardware" },
        { type: "spacer" },

        { type: "subsection", text: "2.4 Enabled Capabilities" },
        {
          type: "bullet-list",
          items: [
            "Guest mobile ordering via smartphone or tablet.",
            "Payment processing and facilitation.",
            "Location-based delivery coordination.",
            "Management reporting and analytics dashboard.",
            "POS integration with Client's designated POS system(s).",
            "QR Code Access Points.",
          ],
        },
      ],
    },

    // 3. PILOT TERM
    {
      title: "3. Pilot Term",
      blocks: [
        { type: "label-value", label: "Start Date:", value: startDate },
        { type: "label-value", label: "Pilot Term:", value: `${termDays} days` },
        { type: "italic-note", text: "(Recommended: 60–90 days)" },
        { type: "spacer" },
        {
          type: "paragraph",
          text: "The Pilot Term may be extended by mutual written agreement of both parties.",
        },
      ],
    },

    // 4. RESPONSIBILITIES
    {
      title: "4. Responsibilities",
      blocks: [
        { type: "subsection", text: "4.1 Daze Responsibilities" },
        { type: "paragraph", text: "Daze shall:" },
        {
          type: "bullet-list",
          items: [
            "Configure and deploy the platform for Covered Outlets.",
            "Provide onboard training for Client staff.",
            "Provide operational support during business hours.",
            "Monitor platform performance and provide reporting.",
            "Integrate with Client's designated POS system(s).",
          ],
        },
        { type: "spacer" },

        { type: "subsection", text: "4.2 Client Responsibilities" },
        { type: "paragraph", text: "Client shall:" },
        {
          type: "bullet-list",
          items: [
            "Provide operational access to Covered Outlets, including Wi-Fi and power.",
            "Ensure staff participation in training.",
            "Designate a primary point of contact.",
            "Provide timely feedback on platform performance.",
            "Maintain PCI DSS compliance.",
            "Provide API credentials and documentation for POS integration.",
          ],
        },
        { type: "spacer" },

        { type: "subsection", text: "4.3 Hardware & Physical Materials" },
        {
          type: "paragraph",
          text: "If selected in Section 2.3, all Hardware remains the sole property of Daze and is subject to bailment terms.",
        },
      ],
    },

    // 5. PILOT FEES
    {
      title: "5. Pilot Fees",
      blocks: [
        { type: "sub-sub", text: "5.1 No Fees" },
        { type: "checkbox", checked: pm === "none" || !pm, text: "No fees apply during the Pilot Term." },
        { type: "spacer" },

        { type: "sub-sub", text: "5.2 Subscription Platform Fee" },
        {
          type: "checkbox",
          checked: pm === "subscription",
          text: `$${pm === "subscription" ? pAmt : "________"} per month`,
        },
        { type: "spacer" },

        { type: "sub-sub", text: "5.3 Daze Revenue Share Fee" },
        {
          type: "checkbox",
          checked: pm === "daze_rev_share",
          text: `${pm === "daze_rev_share" ? pAmt : "________"}% of gross transaction value.`,
        },
        { type: "spacer" },

        { type: "sub-sub", text: "5.4 Client Revenue Share Fee" },
        {
          type: "checkbox",
          checked: pm === "client_rev_share",
          text: `${pm === "client_rev_share" ? pAmt : "________"}% of gross F&B sales value.`,
        },
        { type: "spacer" },

        { type: "subsection", text: "5.5 Payment Terms" },
        { type: "paragraph", text: "Pilot fees are due Net 7 from invoice date." },
      ],
    },

    // 6. SETTLEMENT
    {
      title: "6. Settlement, Tips, and Chargebacks",
      blocks: [
        { type: "subsection", text: "6.1 Settlement" },
        { type: "paragraph", text: "Net proceeds remitted on a Net 7 basis." },
        { type: "subsection", text: "6.2 Tips and Gratuities" },
        { type: "paragraph", text: "All tips are pass-through funds." },
        { type: "subsection", text: "6.3 Payment Disputes" },
        { type: "paragraph", text: "Client is solely responsible for refunds, chargebacks, and disputes." },
      ],
    },

    // 7. CHECKPOINT
    {
      title: "7. Pilot Success Checkpoint & Continuity Clause",
      blocks: [
        {
          type: "paragraph",
          text: "The parties agree to conduct a good-faith review of pilot performance, typically 14–21 days prior to the end of the Pilot Term.",
        },
      ],
    },

    // 8. DATA & SECURITY
    {
      title: "8. Data, Security, and Confidentiality",
      blocks: [
        { type: "subsection", text: "8.1 Data Ownership" },
        { type: "paragraph", text: "Daze retains platform IP; Client retains Client Data." },
        { type: "subsection", text: "8.2 Data License" },
        { type: "paragraph", text: "Client grants Daze a license to use aggregated, de-identified data." },
        { type: "subsection", text: "8.3 Security" },
        { type: "paragraph", text: "SOC 2 aligned architecture." },
        { type: "subsection", text: "8.4 Encryption" },
        { type: "paragraph", text: "AES-256 at rest, TLS 1.2+ in transit." },
        { type: "subsection", text: "8.5 Privacy" },
        { type: "paragraph", text: "No sale of guest PII." },
        { type: "subsection", text: "8.6 PCI DSS" },
        { type: "paragraph", text: "No raw card data stored on Daze servers." },
        { type: "subsection", text: "8.7 Incident Response" },
        { type: "paragraph", text: "48-hour breach notification." },
        { type: "subsection", text: "8.8 Confidentiality" },
        { type: "paragraph", text: "3-year confidentiality obligation." },
      ],
    },

    // 9. TERMINATION
    {
      title: "9. Termination",
      blocks: [
        {
          type: "paragraph",
          text: "Either party may terminate upon fourteen (14) days' written notice.",
        },
      ],
    },

    // 10. INDEMNIFICATION
    {
      title: "10. Indemnification",
      blocks: [
        {
          type: "paragraph",
          text: "Client shall indemnify Daze from claims arising from Client's use, products sold, guest complaints, PCI breaches, negligence, or IP infringement.",
        },
      ],
    },

    // 11. LIMITATION OF LIABILITY
    {
      title: "11. Limitation of Liability",
      blocks: [
        {
          type: "paragraph",
          text: "NEITHER PARTY'S LIABILITY SHALL EXCEED FEES PAID UNDER THIS AGREEMENT. NEITHER PARTY SHALL BE LIABLE FOR INDIRECT, INCIDENTAL, OR CONSEQUENTIAL DAMAGES.",
        },
      ],
    },

    // 12. SLA
    {
      title: "12. Service Level Agreement",
      blocks: [
        {
          type: "paragraph",
          text: "Daze targets 99.5% platform uptime during Client's operating hours.",
        },
        { type: "italic-note", text: "(Excluding scheduled maintenance)" },
      ],
    },

    // 13. MISCELLANEOUS
    {
      title: "13. Miscellaneous",
      blocks: [
        { type: "subsection", text: "13.1 Subcontractors" },
        { type: "paragraph", text: "Daze may use third-party subcontractors." },
        { type: "spacer" },

        { type: "subsection", text: "13.2 POS Integration" },
        { type: "label-value", label: "POS System:", value: posSystem },
        { type: "label-value", label: "Version:", value: posVersion },
        { type: "label-value", label: "API Key:", value: posApiKey },
        { type: "label-value", label: "Who to Contact:", value: posContact },
        { type: "spacer" },

        { type: "subsection", text: "13.3 Governing Law" },
        { type: "paragraph", text: "State of Florida." },
        { type: "subsection", text: "13.4 Dispute Resolution" },
        { type: "paragraph", text: "Good faith negotiation, then Miami-Dade County courts." },
        { type: "subsection", text: "13.5 Entire Agreement" },
        { type: "subsection", text: "13.6 Amendment" },
        { type: "paragraph", text: "Written instrument signed by both parties." },
        { type: "subsection", text: "13.7 Assignment" },
        { type: "subsection", text: "13.8 Force Majeure" },
        { type: "subsection", text: "13.9 Severability" },
        { type: "subsection", text: "13.10 Counterparts" },
      ],
    },
  ];
}
