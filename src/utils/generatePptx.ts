import PptxGenJS from 'pptxgenjs';
import type { PptxData, AiPptxContent } from '@/types';

import bakeryCoverUrl from '@/assets/bakery-cover.png';
import bakeryAccentUrl from '@/assets/bakery-accent.png';
import bakeryIngredientsUrl from '@/assets/bakery-ingredients.png';
import bakeryBgWarmUrl from '@/assets/bakery-bg-warm.jpg';
import bakeryCornerUrl from '@/assets/bakery-corner.png';
import bakeryDividerUrl from '@/assets/bakery-divider.png';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FONT = 'Microsoft JhengHei';

const C = {
  amber: '92700A',
  amberDark: '6B5108',
  amberLight: 'C49A1A',
  gold: 'D4A520',
  cream: 'FFF8ED',
  warmWhite: 'FFFDF8',
  parchment: 'FDF6EC',
  darkText: '3A2D1E',
  bodyText: '594834',
  muted: '9E8E7A',
  lightMuted: 'C7B9A8',
  white: 'FFFFFF',
  cardBg: 'FFF5EB',
  accentGreen: '4A7C59',
  accentBlue: '3D6B8E',
};

const ROLE_LABELS: Record<string, string> = {
  boss: '老闆 / 經營者',
  chef: '主廚 / 師傅',
  purchaser: '採購 / 總務',
  marketing: '行銷 / 企劃',
};

const FOOTER_TEXT =
  '苗林行 Miaolin Foods ─ 讓品味與食俱進 ｜ 為客戶的成功創造最大價值';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function imageToBase64(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

interface ValueProp {
  icon: string;
  title: string;
  description: string;
}

function getValueProps(product: string, clientFocus: string): ValueProp[] {
  const focusMap: Record<string, ValueProp> = {
    '降低成本': {
      icon: '💰',
      title: '成本優化方案',
      description: `透過苗林行的全球採購網路與規模優勢，為您的${product}原料取得最具競爭力的價格，同時維持頂級品質。`,
    },
    '提升品質': {
      icon: '🏆',
      title: '品質躍升計畫',
      description: `嚴選全球頂級${product}原料，搭配專業技術團隊支援，讓您的產品品質全面升級，贏得消費者信賴。`,
    },
    '開發新品': {
      icon: '🧪',
      title: '新品研發支援',
      description: `結合苗林行豐富的${product}產品線與研發資源，協助您快速開發創新產品，搶佔市場先機。`,
    },
    '穩定供貨': {
      icon: '🚚',
      title: '穩定供應保障',
      description: `透過多元供應鏈管理與充足庫存，確保${product}原料穩定供應，讓您的生產線永不斷料。`,
    },
    '差異化': {
      icon: '✨',
      title: '產品差異化策略',
      description: `運用苗林行獨家代理的${product}頂級原料，打造市場上獨一無二的風味，建立品牌護城河。`,
    },
    '品牌故事': {
      icon: '📖',
      title: '品牌加值敘事',
      description: `以苗林行代理的${product}歐洲頂級品牌為素材，為您的品牌注入動人故事，提升品牌價值與溢價能力。`,
    },
    '比賽用料': {
      icon: '🥇',
      title: '競賽級原料供應',
      description: `提供國際大賽指定使用的${product}頂級原料，助您在競賽中脫穎而出，建立專業權威形象。`,
    },
    '原廠風味': {
      icon: '🇫🇷',
      title: '原廠風味還原',
      description: `苗林行直接代理的${product}原廠原料，完整保留產地風味，讓您的作品呈現最正統的味道。`,
    },
  };

  const keywords = clientFocus
    .split(/[,，、\s]+/)
    .map((k) => k.trim())
    .filter(Boolean);

  const matched: ValueProp[] = [];
  for (const kw of keywords) {
    const prop = focusMap[kw];
    if (prop) matched.push(prop);
  }

  if (matched.length > 0) return matched;

  // Default value propositions
  return [
    {
      icon: '🌟',
      title: '頂級原料供應',
      description: `苗林行嚴選全球頂級${product}原料，為您的產品奠定卓越品質的基礎。`,
    },
    {
      icon: '🤝',
      title: '專業技術支援',
      description: `我們的技術團隊提供${product}完整的應用技術支援，協助您解決生產中的各種挑戰。`,
    },
    {
      icon: '📦',
      title: '穩定供應鏈',
      description: `透過全球佈局的供應網路，確保${product}原料穩定供應，讓您安心經營。`,
    },
  ];
}

// ---------------------------------------------------------------------------
// Slide decoration helpers
// ---------------------------------------------------------------------------

function addTopBar(slide: PptxGenJS.Slide) {
  slide.addShape('rect' as PptxGenJS.ShapeType, {
    x: 0,
    y: 0,
    w: '100%',
    h: 0.06,
    fill: { color: C.gold },
  });
}

function addFooter(slide: PptxGenJS.Slide) {
  slide.addText(FOOTER_TEXT, {
    x: 0.4,
    y: 5.15,
    w: 9.2,
    h: 0.3,
    fontSize: 7,
    fontFace: FONT,
    color: C.muted,
    align: 'center',
  });
}

function decorateSlide(slide: PptxGenJS.Slide) {
  addTopBar(slide);
  addFooter(slide);
}

function addSectionTitle(
  slide: PptxGenJS.Slide,
  title: string,
  opts?: { y?: number },
) {
  const y = opts?.y ?? 0.35;
  slide.addText(title, {
    x: 0.6,
    y,
    w: 8.8,
    h: 0.5,
    fontSize: 24,
    fontFace: FONT,
    color: C.amber,
    bold: true,
  });
  // underline accent
  slide.addShape('rect' as PptxGenJS.ShapeType, {
    x: 0.6,
    y: y + 0.52,
    w: 1.2,
    h: 0.04,
    fill: { color: C.gold },
  });
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export async function generatePptx(data: PptxData): Promise<void> {
  const { clientName, product, targetRole, clientFocus, questions, aiContent } =
    data;

  // Pre-load images as base64
  const [coverB64, accentB64, ingredientsB64, bgWarmB64, cornerB64, dividerB64] =
    await Promise.all([
      imageToBase64(bakeryCoverUrl).catch(() => ''),
      imageToBase64(bakeryAccentUrl).catch(() => ''),
      imageToBase64(bakeryIngredientsUrl).catch(() => ''),
      imageToBase64(bakeryBgWarmUrl).catch(() => ''),
      imageToBase64(bakeryCornerUrl).catch(() => ''),
      imageToBase64(bakeryDividerUrl).catch(() => ''),
    ]);

  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_16x9';
  pptx.author = '苗林行 Miaolin Foods';
  pptx.title = `${clientName} 合作提案 - 苗林行`;

  const roleLabel = ROLE_LABELS[targetRole] || targetRole;

  // -----------------------------------------------------------------------
  // Slide 1 – Cover
  // -----------------------------------------------------------------------
  {
    const slide = pptx.addSlide();
    slide.background = { fill: C.darkText };

    if (coverB64) {
      slide.addImage({
        data: coverB64,
        x: 0,
        y: 0,
        w: 10,
        h: 5.63,
        sizing: { type: 'cover', w: 10, h: 5.63 },
      });
    }

    // Dark overlay
    slide.addShape('rect' as PptxGenJS.ShapeType, {
      x: 0,
      y: 0,
      w: 10,
      h: 5.63,
      fill: { color: '000000', transparency: 50 },
    });

    addTopBar(slide);

    // Title
    slide.addText('合作提案', {
      x: 0.8,
      y: 1.2,
      w: 8.4,
      h: 0.9,
      fontSize: 40,
      fontFace: FONT,
      color: C.white,
      bold: true,
    });

    // Gold divider
    slide.addShape('rect' as PptxGenJS.ShapeType, {
      x: 0.8,
      y: 2.2,
      w: 2.0,
      h: 0.05,
      fill: { color: C.gold },
    });

    // Client name
    slide.addText(clientName, {
      x: 0.8,
      y: 2.5,
      w: 8.4,
      h: 0.6,
      fontSize: 28,
      fontFace: FONT,
      color: C.gold,
      bold: true,
    });

    // Product & role
    slide.addText(`${product}｜對象：${roleLabel}`, {
      x: 0.8,
      y: 3.2,
      w: 8.4,
      h: 0.4,
      fontSize: 16,
      fontFace: FONT,
      color: C.lightMuted,
    });

    // Brand
    slide.addText('苗林行 Miaolin Foods', {
      x: 0.8,
      y: 4.6,
      w: 8.4,
      h: 0.35,
      fontSize: 12,
      fontFace: FONT,
      color: C.muted,
    });

    if (cornerB64) {
      slide.addImage({ data: cornerB64, x: 8.2, y: 3.8, w: 1.4, h: 1.4 });
    }
  }

  // -----------------------------------------------------------------------
  // Slide 2 – About Miaolin
  // -----------------------------------------------------------------------
  {
    const slide = pptx.addSlide();
    slide.background = { fill: C.warmWhite };
    decorateSlide(slide);
    addSectionTitle(slide, '關於苗林行');

    const aboutItems = [
      {
        icon: '🌍',
        title: '全球頂級原料供應商',
        desc: '代理歐美日多國頂級烘焙原料品牌，為台灣烘焙業者提供最優質的選擇。',
      },
      {
        icon: '🔬',
        title: '專業技術支援',
        desc: '擁有專業技術團隊，提供產品應用、配方開發與技術諮詢服務。',
      },
      {
        icon: '📦',
        title: '穩定供應鏈',
        desc: '完善的倉儲物流體系，確保全台穩定供貨，讓客戶安心經營。',
      },
      {
        icon: '🤝',
        title: '共創夥伴關係',
        desc: '不只是供應商，更是您的事業夥伴，攜手共創烘焙新價值。',
      },
    ];

    aboutItems.forEach((item, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = 0.6 + col * 4.5;
      const y = 1.3 + row * 1.7;

      // Card background
      slide.addShape('roundRect' as PptxGenJS.ShapeType, {
        x,
        y,
        w: 4.1,
        h: 1.4,
        fill: { color: C.cardBg },
        rectRadius: 0.1,
      });

      slide.addText(item.icon, {
        x: x + 0.15,
        y: y + 0.15,
        w: 0.5,
        h: 0.5,
        fontSize: 24,
        fontFace: FONT,
      });

      slide.addText(item.title, {
        x: x + 0.7,
        y: y + 0.15,
        w: 3.2,
        h: 0.35,
        fontSize: 14,
        fontFace: FONT,
        color: C.amberDark,
        bold: true,
      });

      slide.addText(item.desc, {
        x: x + 0.7,
        y: y + 0.55,
        w: 3.2,
        h: 0.7,
        fontSize: 10,
        fontFace: FONT,
        color: C.bodyText,
        lineSpacingMultiple: 1.3,
      });
    });

    if (accentB64) {
      slide.addImage({ data: accentB64, x: 8.8, y: 4.5, w: 0.9, h: 0.9 });
    }
  }

  // -----------------------------------------------------------------------
  // Slide 3 – Understanding Needs
  // -----------------------------------------------------------------------
  {
    const slide = pptx.addSlide();
    slide.background = { fill: C.warmWhite };
    decorateSlide(slide);
    addSectionTitle(slide, `了解 ${clientName} 的需求`);

    slide.addText(`對象角色：${roleLabel}`, {
      x: 0.6,
      y: 1.15,
      w: 8.8,
      h: 0.35,
      fontSize: 12,
      fontFace: FONT,
      color: C.muted,
    });

    // Focus keywords as chips
    const keywords = clientFocus
      .split(/[,，、\s]+/)
      .map((k) => k.trim())
      .filter(Boolean);

    const chipColors = [C.amber, C.accentGreen, C.accentBlue, C.amberLight, C.amberDark];

    keywords.forEach((kw, i) => {
      const col = i % 4;
      const row = Math.floor(i / 4);
      const x = 0.6 + col * 2.3;
      const y = 1.8 + row * 0.7;
      const chipColor = chipColors[i % chipColors.length];

      slide.addShape('roundRect' as PptxGenJS.ShapeType, {
        x,
        y,
        w: 2.0,
        h: 0.45,
        fill: { color: chipColor, transparency: 12 },
        line: { color: chipColor, width: 1 },
        rectRadius: 0.22,
      });

      slide.addText(kw, {
        x,
        y,
        w: 2.0,
        h: 0.45,
        fontSize: 12,
        fontFace: FONT,
        color: chipColor,
        bold: true,
        align: 'center',
        valign: 'middle',
      });
    });

    // Questions preview
    if (questions.length > 0) {
      const previewY = 1.8 + Math.ceil(keywords.length / 4) * 0.7 + 0.3;
      slide.addText('訪談重點問題', {
        x: 0.6,
        y: previewY,
        w: 8.8,
        h: 0.35,
        fontSize: 13,
        fontFace: FONT,
        color: C.amberDark,
        bold: true,
      });

      questions.slice(0, 4).forEach((q, i) => {
        slide.addText(`${i + 1}. ${q.ask}`, {
          x: 0.8,
          y: previewY + 0.4 + i * 0.4,
          w: 8.4,
          h: 0.35,
          fontSize: 10,
          fontFace: FONT,
          color: C.bodyText,
        });
      });
    }

    if (dividerB64) {
      slide.addImage({ data: dividerB64, x: 0.6, y: 4.8, w: 8.8, h: 0.08 });
    }
  }

  // -----------------------------------------------------------------------
  // Slide 4+ – Value Propositions (max 3 per slide)
  // -----------------------------------------------------------------------
  {
    const valueProps = getValueProps(product, clientFocus);
    const perSlide = 3;
    const totalSlides = Math.ceil(valueProps.length / perSlide);

    for (let page = 0; page < totalSlides; page++) {
      const slide = pptx.addSlide();
      slide.background = { fill: C.warmWhite };
      decorateSlide(slide);

      const pageLabel =
        totalSlides > 1 ? ` (${page + 1}/${totalSlides})` : '';
      addSectionTitle(slide, `我們能為 ${clientName} 做什麼${pageLabel}`);

      const chunk = valueProps.slice(page * perSlide, (page + 1) * perSlide);

      chunk.forEach((vp, i) => {
        const y = 1.3 + i * 1.3;

        // Card
        slide.addShape('roundRect' as PptxGenJS.ShapeType, {
          x: 0.6,
          y,
          w: 8.8,
          h: 1.1,
          fill: { color: C.cardBg },
          rectRadius: 0.08,
        });

        // Icon
        slide.addText(vp.icon, {
          x: 0.8,
          y: y + 0.1,
          w: 0.6,
          h: 0.6,
          fontSize: 28,
          fontFace: FONT,
          align: 'center',
          valign: 'middle',
        });

        // Title
        slide.addText(vp.title, {
          x: 1.5,
          y: y + 0.1,
          w: 7.7,
          h: 0.35,
          fontSize: 15,
          fontFace: FONT,
          color: C.amberDark,
          bold: true,
        });

        // Description
        slide.addText(vp.description, {
          x: 1.5,
          y: y + 0.48,
          w: 7.7,
          h: 0.55,
          fontSize: 10,
          fontFace: FONT,
          color: C.bodyText,
          lineSpacingMultiple: 1.3,
        });
      });

      if (ingredientsB64 && page === 0) {
        slide.addImage({
          data: ingredientsB64,
          x: 8.5,
          y: 4.3,
          w: 1.2,
          h: 1.0,
        });
      }
    }
  }

  // -----------------------------------------------------------------------
  // Slide – Product Highlight
  // -----------------------------------------------------------------------
  {
    const slide = pptx.addSlide();
    slide.background = { fill: C.warmWhite };
    decorateSlide(slide);
    addSectionTitle(slide, `為什麼選擇苗林行的${product}`);

    const reasons = [
      {
        icon: '🏅',
        title: '國際認證品質',
        desc: '代理品牌皆通過歐盟食品安全認證，品質值得信賴。',
      },
      {
        icon: '🧑‍🍳',
        title: '專業技術團隊',
        desc: '駐廠技師與應用技術團隊，提供完整技術支援與配方優化。',
      },
      {
        icon: '💡',
        title: '創新研發能力',
        desc: '持續引進國際最新原料趨勢，助您走在市場前端。',
      },
      {
        icon: '📈',
        title: '成功案例見證',
        desc: '眾多知名品牌長期合作夥伴，共同成長的最佳見證。',
      },
    ];

    reasons.forEach((r, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = 0.6 + col * 4.5;
      const y = 1.3 + row * 1.7;

      slide.addShape('roundRect' as PptxGenJS.ShapeType, {
        x,
        y,
        w: 4.1,
        h: 1.4,
        fill: { color: C.cardBg },
        rectRadius: 0.1,
        shadow: {
          type: 'outer',
          blur: 6,
          offset: 2,
          color: C.lightMuted,
          opacity: 0.3,
        },
      });

      slide.addText(r.icon, {
        x: x + 0.2,
        y: y + 0.15,
        w: 0.5,
        h: 0.5,
        fontSize: 24,
        fontFace: FONT,
      });

      slide.addText(r.title, {
        x: x + 0.8,
        y: y + 0.15,
        w: 3.1,
        h: 0.35,
        fontSize: 14,
        fontFace: FONT,
        color: C.amber,
        bold: true,
      });

      slide.addText(r.desc, {
        x: x + 0.8,
        y: y + 0.55,
        w: 3.1,
        h: 0.7,
        fontSize: 10,
        fontFace: FONT,
        color: C.bodyText,
        lineSpacingMultiple: 1.3,
      });
    });
  }

  // -----------------------------------------------------------------------
  // AI Content Slides (optional)
  // -----------------------------------------------------------------------
  if (aiContent) {
    // --- Success Cases ---
    if (aiContent.successCases && aiContent.successCases.length > 0) {
      const slide = pptx.addSlide();
      slide.background = { fill: C.warmWhite };
      decorateSlide(slide);
      addSectionTitle(slide, '成功案例分享');

      aiContent.successCases.slice(0, 3).forEach((sc, i) => {
        const y = 1.3 + i * 1.3;

        slide.addShape('roundRect' as PptxGenJS.ShapeType, {
          x: 0.6,
          y,
          w: 8.8,
          h: 1.1,
          fill: { color: C.cardBg },
          rectRadius: 0.08,
        });

        // Brand badge
        slide.addShape('roundRect' as PptxGenJS.ShapeType, {
          x: 0.8,
          y: y + 0.12,
          w: 1.6,
          h: 0.32,
          fill: { color: C.amber },
          rectRadius: 0.16,
        });

        slide.addText(sc.brand, {
          x: 0.8,
          y: y + 0.12,
          w: 1.6,
          h: 0.32,
          fontSize: 10,
          fontFace: FONT,
          color: C.white,
          bold: true,
          align: 'center',
          valign: 'middle',
        });

        slide.addText(sc.industry, {
          x: 2.6,
          y: y + 0.12,
          w: 2.0,
          h: 0.32,
          fontSize: 9,
          fontFace: FONT,
          color: C.muted,
          valign: 'middle',
        });

        slide.addText(`挑戰：${sc.challenge}`, {
          x: 0.8,
          y: y + 0.5,
          w: 4.0,
          h: 0.25,
          fontSize: 9,
          fontFace: FONT,
          color: C.bodyText,
        });

        slide.addText(`方案：${sc.solution}`, {
          x: 4.8,
          y: y + 0.5,
          w: 4.4,
          h: 0.25,
          fontSize: 9,
          fontFace: FONT,
          color: C.bodyText,
        });

        slide.addText(`成果：${sc.result}`, {
          x: 0.8,
          y: y + 0.78,
          w: 8.4,
          h: 0.25,
          fontSize: 9,
          fontFace: FONT,
          color: C.accentGreen,
          bold: true,
        });
      });
    }

    // --- ROI Analysis ---
    if (aiContent.roiAnalysis) {
      const slide = pptx.addSlide();
      slide.background = { fill: C.warmWhite };
      decorateSlide(slide);
      addSectionTitle(slide, aiContent.roiAnalysis.title || '投資報酬分析');

      const metrics = aiContent.roiAnalysis.metrics.slice(0, 4);

      metrics.forEach((m, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const x = 0.6 + col * 4.5;
        const y = 1.3 + row * 1.7;

        slide.addShape('roundRect' as PptxGenJS.ShapeType, {
          x,
          y,
          w: 4.1,
          h: 1.4,
          fill: { color: C.cardBg },
          rectRadius: 0.1,
        });

        slide.addText(m.value, {
          x,
          y: y + 0.1,
          w: 4.1,
          h: 0.55,
          fontSize: 28,
          fontFace: FONT,
          color: C.amber,
          bold: true,
          align: 'center',
        });

        slide.addText(m.label, {
          x,
          y: y + 0.6,
          w: 4.1,
          h: 0.3,
          fontSize: 13,
          fontFace: FONT,
          color: C.amberDark,
          bold: true,
          align: 'center',
        });

        slide.addText(m.description, {
          x: x + 0.3,
          y: y + 0.9,
          w: 3.5,
          h: 0.4,
          fontSize: 9,
          fontFace: FONT,
          color: C.bodyText,
          align: 'center',
          lineSpacingMultiple: 1.2,
        });
      });
    }

    // --- Promo Offer ---
    if (aiContent.promoOffer) {
      const slide = pptx.addSlide();
      slide.background = { fill: C.parchment };
      decorateSlide(slide);
      addSectionTitle(slide, aiContent.promoOffer.title || '限時優惠方案');

      const items = aiContent.promoOffer.items.slice(0, 5);

      items.forEach((item, i) => {
        const y = 1.3 + i * 0.65;

        slide.addShape('roundRect' as PptxGenJS.ShapeType, {
          x: 0.6,
          y,
          w: 8.8,
          h: 0.52,
          fill: { color: C.white },
          rectRadius: 0.06,
        });

        slide.addText(`${item.icon}  ${item.text}`, {
          x: 0.8,
          y,
          w: 8.4,
          h: 0.52,
          fontSize: 12,
          fontFace: FONT,
          color: C.bodyText,
          valign: 'middle',
        });
      });

      const bottomY = 1.3 + items.length * 0.65 + 0.3;

      // Deadline
      slide.addText(`⏰ 優惠期限：${aiContent.promoOffer.deadline}`, {
        x: 0.6,
        y: bottomY,
        w: 8.8,
        h: 0.35,
        fontSize: 11,
        fontFace: FONT,
        color: C.amber,
        bold: true,
      });

      // CTA button
      slide.addShape('roundRect' as PptxGenJS.ShapeType, {
        x: 3.0,
        y: bottomY + 0.5,
        w: 4.0,
        h: 0.55,
        fill: { color: C.amber },
        rectRadius: 0.27,
      });

      slide.addText(aiContent.promoOffer.cta, {
        x: 3.0,
        y: bottomY + 0.5,
        w: 4.0,
        h: 0.55,
        fontSize: 14,
        fontFace: FONT,
        color: C.white,
        bold: true,
        align: 'center',
        valign: 'middle',
      });
    }
  }

  // -----------------------------------------------------------------------
  // Slide – Next Steps
  // -----------------------------------------------------------------------
  {
    const slide = pptx.addSlide();
    slide.background = { fill: C.warmWhite };
    decorateSlide(slide);
    addSectionTitle(slide, '合作下一步');

    const steps = [
      { num: '01', title: '需求確認', desc: '深入了解您的需求與目標' },
      { num: '02', title: '樣品試用', desc: '免費提供產品樣品試做' },
      { num: '03', title: '技術支援', desc: '專業團隊到場技術輔導' },
      { num: '04', title: '長期合作', desc: '客製化供應方案啟動' },
    ];

    const startX = 0.5;
    const stepWidth = 2.2;
    const circleY = 2.0;

    steps.forEach((step, i) => {
      const cx = startX + i * (stepWidth + 0.2) + stepWidth / 2;

      // Connecting line (between circles)
      if (i < steps.length - 1) {
        const lineStartX = cx + 0.35;
        const lineEndX = cx + stepWidth + 0.2 - 0.35;
        slide.addShape('rect' as PptxGenJS.ShapeType, {
          x: lineStartX,
          y: circleY + 0.33,
          w: lineEndX - lineStartX,
          h: 0.04,
          fill: { color: C.gold },
        });
      }

      // Circle
      slide.addShape('ellipse' as PptxGenJS.ShapeType, {
        x: cx - 0.35,
        y: circleY,
        w: 0.7,
        h: 0.7,
        fill: { color: C.amber },
      });

      // Number
      slide.addText(step.num, {
        x: cx - 0.35,
        y: circleY,
        w: 0.7,
        h: 0.7,
        fontSize: 16,
        fontFace: FONT,
        color: C.white,
        bold: true,
        align: 'center',
        valign: 'middle',
      });

      // Title
      slide.addText(step.title, {
        x: cx - stepWidth / 2,
        y: circleY + 0.9,
        w: stepWidth,
        h: 0.35,
        fontSize: 14,
        fontFace: FONT,
        color: C.amberDark,
        bold: true,
        align: 'center',
      });

      // Description
      slide.addText(step.desc, {
        x: cx - stepWidth / 2,
        y: circleY + 1.3,
        w: stepWidth,
        h: 0.35,
        fontSize: 10,
        fontFace: FONT,
        color: C.bodyText,
        align: 'center',
      });
    });
  }

  // -----------------------------------------------------------------------
  // Slide – Brand Closing
  // -----------------------------------------------------------------------
  {
    const slide = pptx.addSlide();
    slide.background = { fill: C.darkText };

    if (bgWarmB64) {
      slide.addImage({
        data: bgWarmB64,
        x: 0,
        y: 0,
        w: 10,
        h: 5.63,
        sizing: { type: 'cover', w: 10, h: 5.63 },
      });
    }

    // Dark overlay
    slide.addShape('rect' as PptxGenJS.ShapeType, {
      x: 0,
      y: 0,
      w: 10,
      h: 5.63,
      fill: { color: '000000', transparency: 55 },
    });

    addTopBar(slide);

    // Slogan
    slide.addText('讓品味與食俱進', {
      x: 1.0,
      y: 1.5,
      w: 8.0,
      h: 1.0,
      fontSize: 36,
      fontFace: FONT,
      color: C.gold,
      bold: true,
      align: 'center',
    });

    // Gold divider
    slide.addShape('rect' as PptxGenJS.ShapeType, {
      x: 4.0,
      y: 2.65,
      w: 2.0,
      h: 0.04,
      fill: { color: C.gold },
    });

    // Sub text
    slide.addText('苗林行 Miaolin Foods', {
      x: 1.0,
      y: 2.9,
      w: 8.0,
      h: 0.5,
      fontSize: 18,
      fontFace: FONT,
      color: C.white,
      align: 'center',
    });

    slide.addText(`感謝 ${clientName} 的寶貴時間\n期待與您攜手共創美味新篇章`, {
      x: 1.0,
      y: 3.6,
      w: 8.0,
      h: 0.8,
      fontSize: 14,
      fontFace: FONT,
      color: C.lightMuted,
      align: 'center',
      lineSpacingMultiple: 1.5,
    });

    // Footer on closing slide (lighter style)
    slide.addText(FOOTER_TEXT, {
      x: 0.4,
      y: 5.15,
      w: 9.2,
      h: 0.3,
      fontSize: 7,
      fontFace: FONT,
      color: C.muted,
      align: 'center',
    });
  }

  // -----------------------------------------------------------------------
  // Save
  // -----------------------------------------------------------------------
  const fileName = `${clientName}_合作提案_苗林行.pptx`;
  await pptx.writeFile({ fileName });
}
