import { useState, useCallback } from 'react';
import type { Question, FormData, AiPptxContent } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { generatePptx } from '@/utils/generatePptx';

export function useExport(formData: FormData, questions: Question[]) {
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingPptx, setExportingPptx] = useState(false);

  const exportPdf = useCallback(async (containerRef: React.RefObject<HTMLDivElement | null>) => {
    if (!containerRef.current) return;
    setExportingPdf(true);
    try {
      const A4_WIDTH_MM = 210;
      const A4_HEIGHT_MM = 297;
      const MARGIN_MM = 12;
      const CONTENT_WIDTH_MM = A4_WIDTH_MM - (MARGIN_MM * 2);
      const SECTION_GAP_MM = 3;
      const FOOTER_HEIGHT_MM = 8;

      const sections = Array.from(
        containerRef.current.querySelectorAll('[data-pdf-section]')
      ) as HTMLElement[];

      // Strip animations before capture
      const animatedEls = containerRef.current.querySelectorAll('.animate-fade-in, [style*="animationDelay"]');
      const originalStyles: { el: HTMLElement; style: string }[] = [];
      animatedEls.forEach((el) => {
        const htmlEl = el as HTMLElement;
        originalStyles.push({ el: htmlEl, style: htmlEl.getAttribute('style') || '' });
        htmlEl.style.animation = 'none';
        htmlEl.style.opacity = '1';
      });

      void containerRef.current.offsetHeight;

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 0, A4_WIDTH_MM, A4_HEIGHT_MM, 'F');

      const addPageFooter = (pageDoc: jsPDF) => {
        pageDoc.setFontSize(7);
        pageDoc.setTextColor(160, 160, 160);
        pageDoc.text('苗林行 — 讓品味與食俱進 ｜ 為客戶的成功創造最大價值', A4_WIDTH_MM / 2, A4_HEIGHT_MM - 5, { align: 'center' });
      };

      let currentY = MARGIN_MM;
      const usableHeight = A4_HEIGHT_MM - MARGIN_MM - FOOTER_HEIGHT_MM;

      for (const section of sections) {
        const canvas = await html2canvas(section, {
          scale: 2, useCORS: true, backgroundColor: '#FFFFFF', logging: false,
        });

        const scaleFactor = CONTENT_WIDTH_MM / (canvas.width / 2);
        const heightMM = (canvas.height / 2) * scaleFactor;
        const remainingSpace = usableHeight - currentY;

        if (heightMM > remainingSpace && currentY > MARGIN_MM) {
          addPageFooter(pdf);
          pdf.addPage();
          pdf.setFillColor(255, 255, 255);
          pdf.rect(0, 0, A4_WIDTH_MM, A4_HEIGHT_MM, 'F');
          currentY = MARGIN_MM;
        }

        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', MARGIN_MM, currentY, CONTENT_WIDTH_MM, heightMM);
        currentY += heightMM + SECTION_GAP_MM;
      }

      addPageFooter(pdf);

      // Restore animations
      originalStyles.forEach(({ el, style }) => {
        if (style) el.setAttribute('style', style);
        else el.removeAttribute('style');
      });

      const fileName = `${formData.clientName}_進攻策略.pdf`;

      if (navigator.share && navigator.canShare) {
        const pdfBlob = pdf.output('blob');
        const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
        if (navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({ title: `${formData.clientName} 進攻計畫`, files: [file] });
            return;
          } catch (e) {
            if ((e as DOMException).name === 'AbortError') return;
          }
        }
      }

      pdf.save(fileName);
    } catch (e) {
      console.error('PDF export failed:', e);
      alert('PDF 匯出失敗，請重試');
    } finally {
      setExportingPdf(false);
    }
  }, [formData]);

  const exportPptx = useCallback(async (clientResearch?: string | null) => {
    setExportingPptx(true);
    try {
      let aiContent: AiPptxContent | undefined;
      try {
        const { data, error } = await supabase.functions.invoke('generate-pptx-content', {
          body: {
            product: formData.product,
            clientName: formData.clientName,
            clientFocus: formData.clientFocus,
            researchContext: clientResearch || undefined,
          },
        });
        if (!error && data && !data.error) aiContent = data;
      } catch (aiErr) {
        console.warn('AI content generation failed, proceeding without:', aiErr);
      }

      await generatePptx({
        clientName: formData.clientName,
        product: formData.product,
        targetRole: formData.targetRole,
        clientFocus: formData.clientFocus,
        questions,
        aiContent,
      });
    } catch (e) {
      console.error('PPTX generation failed:', e);
      alert('簡報生成失敗，請重試');
    } finally {
      setExportingPptx(false);
    }
  }, [formData, questions]);

  return { exportPdf, exportPptx, exportingPdf, exportingPptx };
}
