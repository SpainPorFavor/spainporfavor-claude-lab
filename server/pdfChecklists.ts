/**
 * PDF Checklist Generator — Creates branded, downloadable document checklists
 * for each visa type using PDFKit.
 */
import PDFDocument from "pdfkit";
import type { Express, Request, Response } from "express";
import { getChecklistForVisaType, type DocumentSlotTemplate } from "./documentChecklists";
import { isPaidVisaProduct } from "../shared/visaRoutes";

// Visa type metadata for PDF headers
const VISA_METADATA: Record<
  string,
  { title: string; subtitle: string; description: string }
> = {
  "digital-nomad-visa": {
    title: "Digital Nomad Visa (DNV)",
    subtitle: "Visado para teletrabajo de carácter internacional",
    description:
      "Spain's visa for remote workers employed by non-Spanish companies. Grants 1-year initial residency, renewable for 3-year periods. Income requirement: €2,849/month (200% IPREM). Processing time: 4–6 weeks.",
  },
  "non-lucrative-visa": {
    title: "Non-Lucrative Visa (NLV)",
    subtitle: "Visado de residencia no lucrativa",
    description:
      "Spain's visa for retirees and financially independent individuals. No work permitted. Financial requirement: ~€28,800/year (400% IPREM). Processing time: 6–8 weeks.",
  },
  "student-visa": {
    title: "Student Visa",
    subtitle: "Estancia por Estudios",
    description:
      "Spain's visa for enrollment in a Spanish educational institution. Part-time work allowed (20 hours/week). Financial requirement: €600/month. Processing time: 4–6 weeks.",
  },
  "work-visa": {
    title: "Work Visa",
    subtitle: "Autorización Cuenta Ajena",
    description:
      "Spain's visa for those with a job offer from a Spanish employer. Employer must sponsor the application. Processing time: 8–12 weeks.",
  },
};

const VALID_VISA_TYPES = Object.keys(VISA_METADATA);

// Brand colors
const AMBER = [245, 158, 11] as const; // #F59E0B
const NAVY = [26, 35, 50] as const; // #1A2332
const GRAY_600 = [75, 85, 99] as const;
const GRAY_400 = [156, 163, 175] as const;
const GREEN = [22, 163, 74] as const;
const WHITE = [255, 255, 255] as const;
const LIGHT_BG = [250, 251, 252] as const; // #FAFBFC

function generateChecklistPDF(visaType: string): PDFKit.PDFDocument {
  if (!isPaidVisaProduct(visaType)) {
    throw new Error(`Invalid visa type for PDF generation: ${JSON.stringify(visaType)}`);
  }
  const meta = VISA_METADATA[visaType];
  const checklist = getChecklistForVisaType(visaType);

  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 50, bottom: 50, left: 50, right: 50 },
    info: {
      Title: `${meta.title} — Document Checklist`,
      Author: "SpainPorFavor",
      Subject: `Document checklist for the Spain ${meta.title}`,
      Keywords: `Spain, visa, ${meta.title}, document checklist, immigration`,
      Creator: "SpainPorFavor (spainporfavor.com)",
    },
  });

  const pageWidth = 595.28; // A4 width in points
  const contentWidth = pageWidth - 100; // margins

  // ─── Header ───
  // Amber accent bar
  doc.rect(0, 0, pageWidth, 6).fill([...AMBER]);

  // Logo text
  doc.fontSize(18).font("Helvetica-Bold");
  doc.fillColor([...NAVY]).text("Spain", 50, 25, { continued: true });
  doc.fillColor([...AMBER]).text("PorFavor", { continued: false });

  // Website URL
  doc
    .fontSize(9)
    .font("Helvetica")
    .fillColor([...GRAY_400])
    .text("spainporfavor.com", 50, 28, { align: "right" });

  // Divider
  doc
    .moveTo(50, 52)
    .lineTo(pageWidth - 50, 52)
    .strokeColor([...GRAY_400])
    .lineWidth(0.5)
    .stroke();

  // ─── Title Section ───
  doc
    .fontSize(22)
    .font("Helvetica-Bold")
    .fillColor([...NAVY])
    .text(meta.title, 50, 68);

  doc
    .fontSize(11)
    .font("Helvetica-Oblique")
    .fillColor([...GRAY_600])
    .text(meta.subtitle, 50, doc.y + 4);

  doc
    .fontSize(10)
    .font("Helvetica")
    .fillColor([...GRAY_600])
    .text(meta.description, 50, doc.y + 8, { width: contentWidth, lineGap: 2 });

  doc
    .fontSize(9)
    .fillColor([...GRAY_400])
    .text(`Document Checklist — Last updated: May 2026`, 50, doc.y + 8);

  // Divider
  const divY = doc.y + 10;
  doc
    .moveTo(50, divY)
    .lineTo(pageWidth - 50, divY)
    .strokeColor([...GRAY_400])
    .lineWidth(0.5)
    .stroke();

  // ─── Checklist Items ───
  let yPos = divY + 14;

  checklist.forEach((item, index) => {
    // Check if we need a new page
    if (yPos > 720) {
      doc.addPage();
      yPos = 50;
    }

    // Checkbox
    doc
      .rect(50, yPos + 1, 12, 12)
      .lineWidth(1)
      .strokeColor([...NAVY])
      .stroke();

    // Document label
    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .fillColor([...NAVY])
      .text(item.label, 70, yPos, { width: contentWidth - 20 });

    yPos = doc.y + 2;

    // Requirements text
    doc
      .fontSize(9)
      .font("Helvetica")
      .fillColor([...GRAY_600])
      .text(item.requirementsText, 70, yPos, { width: contentWidth - 20, lineGap: 1.5 });

    yPos = doc.y + 3;

    // Tags row
    const tags: string[] = [];
    if (item.isRequired) tags.push("Required");
    if (item.apostilleRequired) tags.push("Apostille needed");
    if (item.translationRequired) tags.push("Translation needed");
    if (item.validityDays) tags.push(`Valid ${item.validityDays} days`);

    if (tags.length > 0) {
      let tagX = 70;
      tags.forEach((tag) => {
        const tagWidth = doc.widthOfString(tag) + 12;
        const isRequired = tag === "Required";
        const bgColor = isRequired ? [...GREEN] : [...GRAY_400];

        // Tag background
        doc
          .roundedRect(tagX, yPos, tagWidth, 14, 3)
          .fill(bgColor as any);

        // Tag text
        doc
          .fontSize(7)
          .font("Helvetica-Bold")
          .fillColor([...WHITE])
          .text(tag, tagX + 6, yPos + 3.5, { width: tagWidth, lineBreak: false });

        tagX += tagWidth + 5;
      });
      yPos += 20;
    }

    // Spacing between items
    yPos += 8;
  });

  // ─── Tips Section ───
  if (yPos > 650) {
    doc.addPage();
    yPos = 50;
  }

  // Divider
  doc
    .moveTo(50, yPos)
    .lineTo(pageWidth - 50, yPos)
    .strokeColor([...GRAY_400])
    .lineWidth(0.5)
    .stroke();

  yPos += 12;

  doc
    .fontSize(13)
    .font("Helvetica-Bold")
    .fillColor([...NAVY])
    .text("Tips for Success", 50, yPos);

  yPos = doc.y + 6;

  const tips = [
    "Start with your criminal record certificate — it takes the longest to obtain (4–8 weeks for FBI/ACRO).",
    "All apostilles must be federal/national level. State-level apostilles are NOT accepted.",
    "Certified translations must be done by a sworn translator (traductor jurado) registered in Spain.",
    "Keep digital copies of all documents — you'll need them for the online portal.",
    "Documents with validity periods should be obtained last to maximize their validity window.",
  ];

  tips.forEach((tip) => {
    doc
      .fontSize(9)
      .font("Helvetica")
      .fillColor([...GRAY_600])
      .text(`•  ${tip}`, 50, yPos, { width: contentWidth, lineGap: 1.5 });
    yPos = doc.y + 5;
  });

  // ─── Footer CTA ───
  if (yPos > 700) {
    doc.addPage();
    yPos = 50;
  }

  yPos += 10;

  // CTA box
  doc.rect(50, yPos, contentWidth, 60).fill([...NAVY]);

  doc
    .fontSize(12)
    .font("Helvetica-Bold")
    .fillColor([...WHITE])
    .text("Ready to start your application?", 70, yPos + 12, {
      width: contentWidth - 40,
    });

  doc
    .fontSize(9)
    .font("Helvetica")
    .fillColor([200, 200, 210])
    .text(
      "Take our free 60-second eligibility assessment at spainporfavor.com/free-assessment",
      70,
      yPos + 30,
      { width: contentWidth - 40 }
    );

  // Bottom disclaimer
  yPos += 75;
  doc
    .fontSize(7)
    .font("Helvetica")
    .fillColor([...GRAY_400])
    .text(
      "© 2026 SpainPorFavor. This checklist is for informational purposes only and does not constitute legal advice. Requirements may change — verify with your Gestor before submission.",
      50,
      yPos,
      { width: contentWidth, align: "center" }
    );

  return doc;
}

/**
 * Register the PDF checklist download routes.
 */
export function registerChecklistRoutes(app: Express) {
  app.get("/api/checklists/:visaType", (req: Request, res: Response) => {
    const { visaType } = req.params;

    if (!VALID_VISA_TYPES.includes(visaType)) {
      res.status(400).json({
        error: `Invalid visa type. Valid types: ${VALID_VISA_TYPES.join(", ")}`,
      });
      return;
    }

    const meta = VISA_METADATA[visaType];
    const filename = `SpainPorFavor-${visaType}-checklist.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    const doc = generateChecklistPDF(visaType);
    doc.pipe(res);
    doc.end();
  });
}
