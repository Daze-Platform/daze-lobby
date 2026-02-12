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
    : ["_______________", "_______________", "_______________", "_______________"];

  const hwDaze = d.hardware_option === "daze_provided";
  const numTablets = blank(d.num_tablets, "__________");
  const mountsStands = blank(d.mounts_stands, "____________");

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
          text: `This Pilot Agreement ("Agreement") is entered into between Daze Technologies Corp., a Delaware corporation with its principal place of business in Florida ("Daze"), and:`,
        },
        { type: "spacer", height: 3 },
        { type: "label-value", label: "Client Legal Name:", value: name },
        { type: "label-value", label: "DBA (Doing Business As):", value: dba },
        { type: "label-value", label: "Address:", value: addr },
        { type: "label-value", label: "Primary Contact:", value: contact },
        { type: "label-value", label: "Title:", value: title },
        { type: "label-value", label: "Email:", value: email },
        { type: "spacer", height: 3 },
        {
          type: "paragraph",
          text: `("Client") for the purpose of deploying and evaluating the Daze platform in a live operational environment. This Agreement reflects the parties' shared intent to proceed with a structured pilot as a step toward a long-term commercial relationship governed by Daze's Master Services Agreement ("MSA").`,
        },
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
          text: "The pilot is intended as a pre-commercial implementation to demonstrate operational readiness and mutual fit, not as a proof-of-concept or technology validation exercise.",
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
        { type: "paragraph", text: "Pool/Beach/Room/Common Space area" },
        { type: "bullet-list", items: outletItems.map((o, i) => `[F&B Outlet] & [Service area]: ${o}`) },
        { type: "spacer" },

        { type: "subsection", text: "2.2 Products and Services" },
        {
          type: "paragraph",
          text: `The Pilot may include one or more Daze products, which shall be deployed and rolled out according to a written implementation schedule agreed by both parties ("Implementation Schedule"). Rollout of additional products beyond the initial scope requires written approval from both parties and may trigger revised pilot terms.`,
        },
        { type: "paragraph", text: "Available products include:" },
        {
          type: "bullet-list",
          items: [
            "Pool & Beach Mobile Ordering: Digital ordering and payment facilitation for outdoor beach and pool areas.",
            "Common Space Digital Ordering: Digital ordering and payment facilitation for indoor common areas.",
            "Table Pay & Order: Digital menu access, ordering, and payment for restaurant tables and dining areas.",
            "In-Room Dining: Full digital menu access and ordering for guest rooms and suites.",
          ],
        },
        { type: "spacer" },

        { type: "subsection", text: "2.3 Hardware Selection" },
        { type: "checkbox", checked: !hwDaze, text: "No Daze Hardware Required" },
        { type: "checkbox", checked: hwDaze, text: "Daze-Provided Hardware. Daze shall provide the following physical materials as a bailment under Section 4.3" },
        ...(hwDaze ? [
          { type: "bullet-list" as const, items: [`Number of Tablets: ${numTablets}`, `Mounts/Stands: ${mountsStands}`] },
        ] : []),
        { type: "spacer" },

        { type: "subsection", text: "2.4 Enabled Capabilities" },
        { type: "paragraph", text: "During the Pilot Term, Daze shall provide the following capabilities:" },
        {
          type: "bullet-list",
          items: [
            "Guest mobile ordering via smartphone or tablet.",
            "Payment processing and facilitation (Client remains merchant of record).",
            "Location-based delivery coordination to beach chairs, poolside loungers, guest rooms, and designated areas.",
            "Management reporting and analytics dashboard.",
            "POS integration with Client's designated point-of-sale system(s).",
            "QR Code Access Points: Design and provision of branded QR code signage for guest access; Client may also utilize Daze-approved digital QR assets for integration into Client-owned physical materials or signage.",
          ],
        },
      ],
    },

    // 3. PILOT TERM
    {
      title: "3. Pilot Term",
      blocks: [
        {
          type: "paragraph",
          text: `The pilot shall commence on the "Start Date" specified below and continue for the "Pilot Term" specified below, unless terminated earlier in accordance with Section 9.`,
        },
        { type: "spacer" },
        { type: "label-value", label: "Start Date:", value: startDate },
        { type: "label-value", label: "Pilot Term:", value: `${termDays} days (recommended: 60-90 days)` },
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
            "Configure and deploy the platform for Covered Outlets according to the Implementation Schedule.",
            "Provide onboard training for Client staff.",
            "Provide operational support during business hours.",
            "Monitor platform performance and provide reporting during the Pilot Term.",
            "Integrate with Client's designated POS system(s) as specified in Section 13.2.",
          ],
        },
        { type: "spacer" },

        { type: "subsection", text: "4.2 Client Responsibilities" },
        { type: "paragraph", text: "Client shall:" },
        {
          type: "bullet-list",
          items: [
            "Provide operational access to Covered Outlets, including Wi-Fi connectivity and power access.",
            "Ensure staff participation in training and day-to-day platform operation.",
            "Designate a primary point of contact with authority to make operational decisions.",
            "Provide timely feedback on platform performance and guest experience.",
            "Maintain PCI DSS compliance for its payment processing systems.",
            "Provide API credentials and technical documentation for POS integration.",
          ],
        },
        { type: "spacer" },

        { type: "subsection", text: "4.3 Hardware & Physical Materials" },
        {
          type: "paragraph",
          text: `If selected in Section 2.3, Daze shall provide Client with hardware and physical materials ("Hardware"). All such Hardware remains the sole property of Daze and is subject to the following terms:`,
        },
        {
          type: "paragraph",
          text: `Ownership: All Hardware remains the sole and exclusive property of Daze. This Agreement constitutes a bailment of Hardware for the Pilot Term only.`,
        },
        {
          type: "paragraph",
          text: `Standard of Care: Client shall be responsible for the care, security, and proper use of the Hardware and shall protect it from loss, theft, or damage beyond normal wear and tear.`,
        },
        {
          type: "paragraph",
          text: `Restrictions: Client shall not sell, transfer, modify, or repurpose the Hardware and shall ensure it is used solely by authorized staff for the Services.`,
        },
        {
          type: "paragraph",
          text: `Recovery & Reimbursement: Upon termination or expiration of the Pilot Term, Client shall return all Hardware to Daze within seven (7) days. If Hardware is not returned or is returned in a damaged state, Client shall reimburse Daze for the full replacement cost at then-current market rates.`,
        },
        {
          type: "paragraph",
          text: `QR Code IP: QR code designs and branding provided by Daze are the Intellectual Property of Daze and are licensed to Client solely for use with the Daze platform during the Pilot Term.`,
        },
      ],
    },

    // 5. PILOT FEES
    {
      title: "5. Pilot Fees",
      blocks: [
        {
          type: "paragraph",
          text: "Pilot pricing is agreed separately below and does not establish precedent for long-term pricing under any MSA or Order Form.",
        },
        { type: "paragraph", text: "Select one pricing model:" },
        { type: "spacer" },

        { type: "sub-sub", text: "5.1 No Fees" },
        { type: "checkbox", checked: false, text: "No fees apply during the Pilot Term." },
        { type: "spacer" },

        { type: "sub-sub", text: "5.2 Subscription Platform Fee" },
        {
          type: "checkbox",
          checked: pm === "subscription",
          text: `Client agrees to pay Daze a platform subscription fee of $${pm === "subscription" ? pAmt : "________"} for access and use of the Daze platform and related services during the Pilot Term.`,
        },
        { type: "spacer" },

        { type: "sub-sub", text: "5.3 Daze Revenue Share Fee" },
        {
          type: "checkbox",
          checked: pm === "daze_rev_share",
          text: `During the Pilot Term, Daze shall retain a fee equal to ${pm === "daze_rev_share" ? pAmt : "________"}% of the gross transaction value of each completed order processed through the platform. The remaining net proceeds, including applicable food and beverage revenue and tips, shall be remitted to Client in accordance with Section 6.`,
        },
        {
          type: "italic-note",
          text: "Daze acts solely as a payment facilitation agent and does not purchase, resell, or take ownership of any food, beverage, or tip amounts.",
        },
        { type: "spacer" },

        { type: "sub-sub", text: "5.4 Client Revenue Share Fee" },
        {
          type: "checkbox",
          checked: pm === "client_rev_share",
          text: `During the Pilot Term, Client shall pay Daze a revenue-share fee equal to ${pm === "client_rev_share" ? pAmt : "________"}% of the gross food and beverage sales value of each completed order processed through the platform. Such revenue-share fees shall be borne solely by Client and shall not be presented to or charged to guests.`,
        },
        {
          type: "italic-note",
          text: "Daze acts strictly as a technology provider and payment facilitation agent and does not purchase, resell, or take ownership of any food, beverage, or tip amounts. All guest payments represent the Client's food and beverage sales.",
        },
        { type: "spacer" },

        { type: "subsection", text: "5.5 Payment Terms" },
        {
          type: "paragraph",
          text: "Any pilot fees will be invoiced by Daze and are due Net 7 from the invoice date, unless otherwise agreed in writing. Pilot fees are provided solely for evaluation purposes and do not establish pricing, discounts, or commercial terms for any future agreement.",
        },
        {
          type: "paragraph",
          text: `Any continued use of the Services following the Pilot Term will be governed exclusively by a mutually executed Master Services Agreement ("MSA") and applicable Order Form.`,
        },
      ],
    },

    // 6. SETTLEMENT
    {
      title: "6. Settlement, Tips, and Chargebacks",
      blocks: [
        { type: "subsection", text: "6.1 Settlement" },
        {
          type: "paragraph",
          text: "Net food and beverage proceeds, less applicable platform fees, are remitted to Client on a Net 7 settlement basis measured from the applicable settlement statement date, unless otherwise specified. Settlement payments will be made via ACH to Client's designated bank account.",
        },
        {
          type: "italic-note",
          text: "Minimum Settlement Threshold: Daze may accumulate settlements and remit when the balance exceeds $250. Balances below this threshold shall be remitted quarterly.",
        },
        { type: "spacer" },

        { type: "subsection", text: "6.2 Tips and Gratuities" },
        {
          type: "paragraph",
          text: "All customer tips and gratuities are pass-through funds, are not revenue of Daze, are excluded from platform fee calculations, and are not subject to settlement timing. Daze may hold tips in reserve to cover chargebacks, refunds, or payment disputes, releasing them to Client upon resolution.",
        },
        { type: "spacer" },

        { type: "subsection", text: "6.3 Payment Disputes and Chargebacks" },
        {
          type: "paragraph",
          text: "Client remains solely responsible for all refunds, returns, chargebacks, payment disputes, and fraudulent transactions. Daze may deduct chargeback amounts, dispute fees, and associated costs from future settlements or invoice Client directly within seven (7) days.",
        },
        {
          type: "paragraph",
          text: "If chargeback rates exceed 2% of gross transaction volume in any month, Daze may, at its sole discretion: (a) suspend revenue share settlements and require pre-payment; (b) increase the revenue share percentage by 1% to offset risk; or (c) terminate this Agreement upon fourteen (14) days' written notice.",
        },
      ],
    },

    // 7. CHECKPOINT
    {
      title: "7. Pilot Success Checkpoint & Continuity Clause",
      blocks: [
        {
          type: "paragraph",
          text: `During the Pilot Term, the parties agree to conduct a good-faith review of pilot performance, operational workflows, and guest adoption (the "Pilot Success Checkpoint"), typically scheduled 14–21 days prior to the end of the Pilot Term. The Pilot Success Checkpoint is intended to assess whether the Services meet the Client's operational and experiential objectives and whether the parties wish to continue the relationship under a commercial agreement governed by Daze's Master Services Agreement ("MSA") and an applicable Order Form.`,
        },
        {
          type: "paragraph",
          text: `Participation in the Pilot Success Checkpoint does not obligate either party to enter into a commercial agreement, and either party may terminate the Pilot in accordance with this Agreement. Unless the Client provides written notice of termination within fourteen (14) days following the end of the Pilot Term, the Services may continue on an interim basis under the terms of this Pilot Agreement solely to facilitate transition discussions, until an MSA and Order Form are executed or the Services are terminated.`,
        },
        {
          type: "italic-note",
          text: "Client acknowledges that POS integration may require coordination with third-party POS vendors, and Daze is not responsible for delays or failures caused by such third parties.",
        },
      ],
    },

    // 8. DATA & SECURITY
    {
      title: "8. Data, Security, and Confidentiality",
      blocks: [
        { type: "subsection", text: "8.1 Data Ownership & Sovereignty" },
        {
          type: "bullet-list",
          items: [
            "Daze IP: Daze retains all rights, title, and interest in and to the Daze platform, software, algorithms, documentation, and related intellectual property.",
            "Client Data: Client retains all right, title, and interest in and to all guest data, transaction records, and operational information processed through the Platform (\"Client Data\").",
          ],
        },
        { type: "spacer" },

        { type: "subsection", text: "8.2 Data License (The \"Valuation\" Clause)" },
        {
          type: "paragraph",
          text: `Client grants Daze a non-exclusive, perpetual, irrevocable, royalty-free license to use Client Data solely in aggregated and de-identified form ("Aggregated Data"). Daze may use Aggregated Data for benchmarking, service improvement, analytics, and industry reporting, provided that such data does not identify Client, any individual guest, or specific transactions.`,
        },
        { type: "spacer" },

        { type: "subsection", text: "8.3 Security Standards & SOC-2 Alignment" },
        {
          type: "paragraph",
          text: "Daze maintains administrative, technical, and physical safeguards designed to protect the integrity and confidentiality of Client Data. The Platform architecture is aligned with SOC 2 Trust Services Criteria (Security, Availability, and Confidentiality) and is hosted on enterprise-grade infrastructure providers (e.g., AWS) that maintain current SOC 2 Type II certifications.",
        },
        { type: "spacer" },

        { type: "subsection", text: "8.4 Encryption & Access Control" },
        {
          type: "paragraph",
          text: "All Client Data is encrypted using AES-256 at rest and TLS 1.2 or higher in transit. Daze employs multi-factor authentication (MFA) and least-privilege access controls for all administrative and backend systems.",
        },
        { type: "spacer" },

        { type: "subsection", text: "8.5 Privacy & PII Compliance Protection" },
        {
          type: "paragraph",
          text: "Daze shall not sell, rent, or share guest Personally Identifiable Information (PII) with third parties (except as required for payment processing via authorized subcontractors). Any data used for platform optimization or performance analytics must be strictly anonymized.",
        },
        { type: "spacer" },

        { type: "subsection", text: "8.6 PCI DSS Compliance" },
        {
          type: "paragraph",
          text: "The Platform is designed so that no raw credit card data is stored on Daze-managed servers. All payment processing is facilitated through PCI-compliant third-party gateways (e.g., Stripe), ensuring the Client's environment remains secure and compliant with global payment standards. Client is responsible for maintaining PCI DSS compliance for its own operations and on-premises networks.",
        },
        { type: "spacer" },

        { type: "subsection", text: "8.7 Incident Response" },
        {
          type: "paragraph",
          text: "In the event of a confirmed security breach involving Client Data, Daze will notify the Client within forty-eight (48) hours of discovery and provide reasonable cooperation in any subsequent investigation or remediation efforts.",
        },
        { type: "spacer" },

        { type: "subsection", text: "8.8 Confidentiality" },
        {
          type: "paragraph",
          text: "Both parties agree to maintain the confidentiality of non-public information disclosed during the Pilot, using reasonable care for a period of three (3) years from the date of disclosure.",
        },
      ],
    },

    // 9. TERMINATION
    {
      title: "9. Termination",
      blocks: [
        {
          type: "paragraph",
          text: "Either party may terminate this Agreement upon fourteen (14) days' written notice to the other party.",
        },
        {
          type: "paragraph",
          text: "Upon termination: (a) Client shall immediately cease use of the platform; (b) Daze shall provide final settlement within fourteen (14) days; (c) each party shall return or destroy the other's Confidential Information.",
        },
      ],
    },

    // 10. INDEMNIFICATION
    {
      title: "10. Indemnification",
      blocks: [
        {
          type: "paragraph",
          text: "Client shall indemnify, defend, and hold harmless Daze and its officers, directors, employees, and agents from and against any and all claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys' fees) arising out of or relating to:",
        },
        {
          type: "bullet-list",
          items: [
            "Client's use of the Services in violation of this Agreement.",
            "Any food, beverage, or product sold or delivered by Client.",
            "Any guest complaint, injury, or claim related to Client's operations.",
            "Client's breach of PCI DSS or payment processing obligations.",
            "Client's negligence or willful misconduct.",
            "Any claim that Client data or content infringes third-party intellectual property rights.",
          ],
        },
      ],
    },

    // 11. LIMITATION OF LIABILITY
    {
      title: "11. Limitation of Liability",
      blocks: [
        { type: "paragraph", text: "TO THE MAXIMUM EXTENT PERMITTED BY LAW:" },
        {
          type: "bullet-list",
          items: [
            "NEITHER PARTY'S LIABILITY SHALL EXCEED FEES PAID BY CLIENT UNDER THIS AGREEMENT;",
            "NEITHER PARTY SHALL BE LIABLE FOR INDIRECT, INCIDENTAL, CONSEQUENTIAL, SPECIAL, OR PUNITIVE DAMAGES, INCLUDING LOST PROFITS, LOST DATA, OR BUSINESS INTERRUPTION.",
          ],
        },
        {
          type: "paragraph",
          text: "THESE LIMITATIONS DO NOT APPLY TO: BREACHES OF CONFIDENTIALITY, IP INFRINGEMENT, INDEMNIFICATION OBLIGATIONS, GROSS NEGLIGENCE, WILLFUL MISCONDUCT, OR AMOUNTS THAT CANNOT BE LIMITED UNDER APPLICABLE LAW.",
        },
      ],
    },

    // 12. SLA
    {
      title: "12. Service Level Agreement",
      blocks: [
        {
          type: "paragraph",
          text: `Daze targets 99.5% platform uptime during Client's operating hours (excluding scheduled maintenance). "Uptime" means the platform is accessible and processing transactions.`,
        },
        {
          type: "paragraph",
          text: "Scheduled maintenance shall not exceed four (4) hours monthly and shall be conducted during low-traffic periods with 48 hours' advance notice.",
        },
        {
          type: "paragraph",
          text: "Daze does not guarantee uptime for issues caused by: third-party services (including POS systems), Client's internet connectivity, force majeure events, or Client's misuse of the platform.",
        },
      ],
    },

    // 13. MISCELLANEOUS
    {
      title: "13. Miscellaneous",
      blocks: [
        { type: "subsection", text: "13.1 Subcontractors" },
        {
          type: "paragraph",
          text: "Daze may use third-party subcontractors (including AWS for hosting, payment processors, and analytics providers) to perform Services. Daze remains responsible for subcontractor performance. Daze shall maintain a list of material subcontractors available upon request and shall notify Client of any changes to material subcontractors thirty (30) days in advance.",
        },
        { type: "spacer" },

        { type: "subsection", text: "13.2 POS Integration" },
        {
          type: "paragraph",
          text: "Daze will integrate with Client's designated POS system(s) as specified in the Implementation Schedule.",
        },
        { type: "label-value", label: "POS System:", value: posSystem },
        { type: "label-value", label: "Version:", value: posVersion },
        { type: "label-value", label: "API Key:", value: posApiKey },
        { type: "label-value", label: "Who to Contact:", value: posContact },
        { type: "spacer" },
        { type: "paragraph", text: "Client is responsible for:" },
        {
          type: "bullet-list",
          items: [
            "Providing API credentials, technical documentation, and test environmental access.",
            "Designating a technical point of contact with appropriate technical knowledge.",
            "Testing and validating integration functionality before go-live.",
            "Promptly reporting integration issues and cooperating in resolution.",
          ],
        },
        {
          type: "italic-note",
          text: "Daze does not warrant compatibility with all POS versions, configurations, or customizations. Daze's liability for integration failures is limited to commercially reasonable efforts to resolve issues and does not include lost revenue, data corruption, or operational downtime.",
        },
        { type: "spacer" },

        { type: "subsection", text: "13.3 Governing Law" },
        {
          type: "paragraph",
          text: "This Agreement is governed by and construed in accordance with the laws of the State of Florida, without regard to its conflict of laws principles.",
        },
        { type: "spacer" },

        { type: "subsection", text: "13.4 Dispute Resolution" },
        {
          type: "paragraph",
          text: "Any dispute arising out of or relating to this Agreement shall first be resolved through good faith negotiation between senior executives of both parties. If the dispute cannot be resolved within thirty (30) days, either party may pursue any remedy available at law or in equity in the state or federal courts located in Miami-Dade County, Florida.",
        },
        { type: "spacer" },

        { type: "subsection", text: "13.5 Entire Agreement" },
        {
          type: "paragraph",
          text: "This Agreement constitutes the entire agreement between the parties regarding the subject matter hereof and supersedes all prior agreements, LOIs, and understandings.",
        },
        { type: "spacer" },

        { type: "subsection", text: "13.6 Amendment" },
        {
          type: "paragraph",
          text: "This Agreement may not be amended except by written instrument signed by both parties.",
        },
        { type: "spacer" },

        { type: "subsection", text: "13.7 Assignment" },
        {
          type: "paragraph",
          text: "Neither party may assign this Agreement without prior written consent, except to affiliates or in connection with a merger, acquisition, or sale of substantially all assets.",
        },
        { type: "spacer" },

        { type: "subsection", text: "13.8 Force Majeure" },
        {
          type: "paragraph",
          text: "Neither party is liable for delays or failures caused by events beyond reasonable control, including acts of God, natural disasters, war, terrorism, government actions, internet outages, third-party service failures, or pandemics.",
        },
        { type: "spacer" },

        { type: "subsection", text: "13.9 Severability" },
        {
          type: "paragraph",
          text: "If any provision is held invalid, the remaining provisions shall continue in full force and effect.",
        },
        { type: "spacer" },

        { type: "subsection", text: "13.10 Counterparts" },
        {
          type: "paragraph",
          text: "This Agreement may be executed in counterparts, each of which shall be deemed an original.",
        },
      ],
    },
  ];
}
