import PDFDocument from 'pdfkit';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, PageBreak } from 'docx';
import type { PassThrough } from 'stream';

interface ExportArticle {
  title: string;
  content_md: string;
  category?: string;
  publication?: string | null;
}

function mdToLines(md: string): { type: string; text: string; level?: number }[] {
  const lines: { type: string; text: string; level?: number }[] = [];
  for (const line of md.split('\n')) {
    const headingMatch = line.match(/^(#{1,3})\s+(.+)/);
    if (headingMatch) {
      lines.push({ type: 'heading', text: headingMatch[2], level: headingMatch[1].length });
    } else if (line.startsWith('> ')) {
      lines.push({ type: 'blockquote', text: line.slice(2) });
    } else if (line.match(/^[-*]\s+/)) {
      lines.push({ type: 'list', text: line.replace(/^[-*]\s+/, '') });
    } else if (line.match(/^\d+\.\s+/)) {
      lines.push({ type: 'olist', text: line.replace(/^\d+\.\s+/, '') });
    } else if (line.trim() === '') {
      lines.push({ type: 'empty', text: '' });
    } else {
      lines.push({ type: 'paragraph', text: line });
    }
  }
  return lines;
}

export function generatePDF(article: ExportArticle, stream: PassThrough) {
  const doc = new PDFDocument({ size: 'A4', margin: 72 });
  doc.pipe(stream);

  // Title
  doc.fontSize(24).font('Helvetica-Bold').text(article.title, { align: 'center' });
  doc.moveDown(0.5);

  if (article.publication) {
    doc.fontSize(12).font('Helvetica').fillColor('#666666')
      .text(article.publication, { align: 'center' });
    doc.fillColor('#000000');
  }
  doc.moveDown(1);

  // Content
  const lines = mdToLines(article.content_md);
  for (const line of lines) {
    switch (line.type) {
      case 'heading':
        doc.moveDown(0.5);
        doc.fontSize(line.level === 1 ? 20 : line.level === 2 ? 16 : 14)
          .font('Helvetica-Bold').text(line.text);
        doc.moveDown(0.3);
        break;
      case 'blockquote':
        doc.fontSize(11).font('Helvetica-Oblique').fillColor('#555555')
          .text(`  ${line.text}`, { indent: 20 });
        doc.fillColor('#000000');
        break;
      case 'list':
        doc.fontSize(12).font('Helvetica').text(`  •  ${line.text}`, { indent: 20 });
        break;
      case 'olist':
        doc.fontSize(12).font('Helvetica').text(`     ${line.text}`, { indent: 20 });
        break;
      case 'paragraph':
        doc.fontSize(12).font('Helvetica').text(line.text, { lineGap: 4 });
        break;
      case 'empty':
        doc.moveDown(0.4);
        break;
    }
  }

  doc.end();
}

export function generateBookPDF(title: string, chapters: { chapter_title: string; article: ExportArticle }[], stream: PassThrough) {
  const doc = new PDFDocument({ size: 'A4', margin: 72 });
  doc.pipe(stream);

  // Title page
  doc.moveDown(8);
  doc.fontSize(32).font('Helvetica-Bold').text(title, { align: 'center' });
  doc.moveDown(2);
  doc.fontSize(14).font('Helvetica').text(new Date().toLocaleDateString('zh-TW'), { align: 'center' });

  // Table of contents
  doc.addPage();
  doc.fontSize(20).font('Helvetica-Bold').text('目錄', { align: 'center' });
  doc.moveDown(1);
  chapters.forEach((ch, i) => {
    doc.fontSize(14).font('Helvetica').text(`${i + 1}. ${ch.chapter_title}`);
    doc.moveDown(0.3);
  });

  // Chapters
  for (let i = 0; i < chapters.length; i++) {
    doc.addPage();
    const ch = chapters[i];
    doc.fontSize(12).font('Helvetica').fillColor('#888888')
      .text(`第 ${i + 1} 章`, { align: 'center' });
    doc.fillColor('#000000');
    doc.fontSize(22).font('Helvetica-Bold').text(ch.chapter_title, { align: 'center' });
    doc.moveDown(1);

    const lines = mdToLines(ch.article.content_md);
    for (const line of lines) {
      switch (line.type) {
        case 'heading':
          doc.moveDown(0.5);
          doc.fontSize(line.level === 1 ? 18 : line.level === 2 ? 15 : 13)
            .font('Helvetica-Bold').text(line.text);
          doc.moveDown(0.3);
          break;
        case 'blockquote':
          doc.fontSize(11).font('Helvetica-Oblique').fillColor('#555555')
            .text(`  ${line.text}`, { indent: 20 });
          doc.fillColor('#000000');
          break;
        case 'list':
          doc.fontSize(12).font('Helvetica').text(`  •  ${line.text}`, { indent: 20 });
          break;
        case 'paragraph':
          doc.fontSize(12).font('Helvetica').text(line.text, { lineGap: 4 });
          break;
        case 'empty':
          doc.moveDown(0.4);
          break;
      }
    }
  }

  doc.end();
}

function stripMd(text: string): string {
  return text.replace(/\*\*/g, '').replace(/\*/g, '').replace(/`/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
}

export async function generateDocx(article: ExportArticle): Promise<Buffer> {
  const children: Paragraph[] = [];

  children.push(new Paragraph({
    text: article.title,
    heading: HeadingLevel.TITLE,
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
  }));

  if (article.publication) {
    children.push(new Paragraph({
      children: [new TextRun({ text: article.publication, color: '666666', size: 24 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }));
  }

  const lines = mdToLines(article.content_md);
  for (const line of lines) {
    switch (line.type) {
      case 'heading':
        children.push(new Paragraph({
          text: stripMd(line.text),
          heading: line.level === 1 ? HeadingLevel.HEADING_1 : line.level === 2 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3,
          spacing: { before: 240, after: 120 },
        }));
        break;
      case 'blockquote':
        children.push(new Paragraph({
          children: [new TextRun({ text: stripMd(line.text), italics: true, color: '555555' })],
          indent: { left: 720 },
          spacing: { after: 120 },
        }));
        break;
      case 'list':
        children.push(new Paragraph({
          children: [new TextRun({ text: `• ${stripMd(line.text)}` })],
          indent: { left: 720 },
          spacing: { after: 80 },
        }));
        break;
      case 'paragraph':
        children.push(new Paragraph({
          children: [new TextRun({ text: stripMd(line.text), size: 24 })],
          spacing: { after: 120, line: 360 },
        }));
        break;
      case 'empty':
        children.push(new Paragraph({ text: '' }));
        break;
    }
  }

  const doc = new Document({ sections: [{ children }] });
  return await Packer.toBuffer(doc);
}

export async function generateBookDocx(bookTitle: string, chapters: { chapter_title: string; article: ExportArticle }[]): Promise<Buffer> {
  const sections = [];

  // Title page
  sections.push({
    children: [
      new Paragraph({ text: '', spacing: { before: 4000 } }),
      new Paragraph({
        text: bookTitle,
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      }),
      new Paragraph({
        children: [new TextRun({ text: new Date().toLocaleDateString('zh-TW'), size: 24, color: '888888' })],
        alignment: AlignmentType.CENTER,
      }),
    ],
  });

  for (let i = 0; i < chapters.length; i++) {
    const ch = chapters[i];
    const children: Paragraph[] = [];

    children.push(new Paragraph({
      children: [new TextRun({ text: `第 ${i + 1} 章`, color: '888888', size: 24 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      pageBreakBefore: true,
    }));

    children.push(new Paragraph({
      text: ch.chapter_title,
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }));

    const lines = mdToLines(ch.article.content_md);
    for (const line of lines) {
      switch (line.type) {
        case 'heading':
          children.push(new Paragraph({
            text: stripMd(line.text),
            heading: line.level === 1 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3,
            spacing: { before: 240, after: 120 },
          }));
          break;
        case 'paragraph':
          children.push(new Paragraph({
            children: [new TextRun({ text: stripMd(line.text), size: 24 })],
            spacing: { after: 120, line: 360 },
          }));
          break;
        case 'blockquote':
          children.push(new Paragraph({
            children: [new TextRun({ text: stripMd(line.text), italics: true, color: '555555' })],
            indent: { left: 720 },
          }));
          break;
        case 'list':
          children.push(new Paragraph({
            children: [new TextRun({ text: `• ${stripMd(line.text)}` })],
            indent: { left: 720 },
          }));
          break;
        case 'empty':
          children.push(new Paragraph({ text: '' }));
          break;
      }
    }
    sections.push({ children });
  }

  const doc = new Document({ sections });
  return await Packer.toBuffer(doc);
}
