/**
 * Ultra-robust PDF & Print Utilities for Waimao Tools Workspace
 * 
 * Accurately renders documents to PDF without modern color space crashes (oklab/oklch),
 * dark fallback artifact blocks, or accidental blank second pages.
 */

// Standard Tailwind Color Palette fallback dictionary to guarantee exact colors
const TAILWIND_COLOR_MAP: Record<string, string> = {
  'slate-50': 'rgb(248, 250, 252)',
  'slate-100': 'rgb(241, 245, 249)',
  'slate-200': 'rgb(226, 232, 240)',
  'slate-300': 'rgb(203, 213, 225)',
  'slate-400': 'rgb(148, 163, 184)',
  'slate-500': 'rgb(100, 116, 139)',
  'slate-600': 'rgb(71, 85, 105)',
  'slate-700': 'rgb(51, 65, 85)',
  'slate-800': 'rgb(30, 41, 59)',
  'slate-900': 'rgb(15, 23, 42)',
  'slate-950': 'rgb(2, 6, 23)',
  'blue-50': 'rgb(239, 246, 255)',
  'blue-100': 'rgb(219, 234, 254)',
  'blue-200': 'rgb(191, 219, 254)',
  'blue-500': 'rgb(59, 130, 246)',
  'blue-600': 'rgb(37, 99, 235)',
  'blue-700': 'rgb(29, 78, 216)',
  'blue-800': 'rgb(30, 64, 175)',
  'emerald-50': 'rgb(236, 253, 245)',
  'emerald-100': 'rgb(209, 250, 229)',
  'emerald-200': 'rgb(167, 243, 208)',
  'emerald-500': 'rgb(16, 185, 129)',
  'emerald-600': 'rgb(5, 150, 105)',
  'red-50': 'rgb(254, 242, 242)',
  'red-100': 'rgb(254, 226, 226)',
  'red-500': 'rgb(239, 68, 68)',
  'red-600': 'rgb(220, 38, 38)',
  'amber-50': 'rgb(255, 251, 235)',
  'amber-100': 'rgb(254, 243, 199)',
  'amber-500': 'rgb(245, 158, 11)',
  'white': 'rgb(255, 255, 255)',
  'black': 'rgb(0, 0, 0)',
  'transparent': 'rgba(0, 0, 0, 0)'
};

/**
 * OKLab to standard RGB [0..255]
 */
export function oklabToRgb(l: number, a: number, b: number): [number, number, number] {
  const L = Math.max(0, Math.min(1, l));
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;

  const lLinear = l_ * l_ * l_;
  const mLinear = m_ * m_ * m_;
  const sLinear = s_ * s_ * s_;

  const r = +4.0767416621 * lLinear - 3.3077115913 * mLinear + 0.2309699292 * sLinear;
  const g = -1.2684380046 * lLinear + 2.6097574011 * mLinear - 0.3413193965 * sLinear;
  const bVal = -0.0041960863 * lLinear - 0.7034186147 * mLinear + 1.7076214910 * sLinear;

  const f = (x: number) => (x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(Math.max(0, x), 1 / 2.4) - 0.055);

  const R = Math.round(Math.max(0, Math.min(1, f(r))) * 255);
  const G = Math.round(Math.max(0, Math.min(1, f(g))) * 255);
  const B = Math.round(Math.max(0, Math.min(1, f(bVal))) * 255);

  return [R, G, B];
}

/**
 * OKLCH to standard RGB [0..255]
 */
export function oklchToRgb(l: number, c: number, h: number): [number, number, number] {
  const hRad = (h * Math.PI) / 180;
  const a = c * Math.cos(hRad);
  const b = c * Math.sin(hRad);
  return oklabToRgb(l, a, b);
}

/**
 * Parses modern color string (oklch, oklab, color-mix, etc.) to standard rgb/rgba
 */
export function parseModernColor(raw: string): string | null {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();

  // Check direct Tailwind var matches
  for (const [key, val] of Object.entries(TAILWIND_COLOR_MAP)) {
    if (trimmed.includes(key)) {
      return val;
    }
  }

  // 1. color-mix(in oklab, <color1> <percentage>?, <color2> <percentage>?)
  if (trimmed.startsWith('color-mix')) {
    const mixMatch = trimmed.match(/color-mix\s*\(\s*in\s+[^,]+,\s*([^,]+?)\s*,\s*([^)]+)\s*\)/i);
    if (mixMatch) {
      const p1 = mixMatch[1].trim();
      const p2 = mixMatch[2].trim();
      
      // If mixed with transparent, extract alpha
      if (p2.includes('transparent') || p1.includes('transparent')) {
        const solidPart = p2.includes('transparent') ? p1 : p2;
        const alphaMatch = solidPart.match(/(\d+(?:\.\d+)?)%/);
        const alpha = alphaMatch ? parseFloat(alphaMatch[1]) / 100 : 0.5;
        const colorNameOnly = solidPart.replace(/\d+(?:\.\d+)?%/, '').trim();
        const baseRgb = parseModernColor(colorNameOnly) || 'rgb(248, 250, 252)';
        const rgbVals = baseRgb.match(/\d+/g);
        if (rgbVals && rgbVals.length >= 3) {
          return `rgba(${rgbVals[0]}, ${rgbVals[1]}, ${rgbVals[2]}, ${alpha})`;
        }
      }
      return parseModernColor(p1) || 'rgb(248, 250, 252)';
    }
    return 'rgb(248, 250, 252)';
  }

  // 2. oklch(L C H [/ alpha]?)
  const oklchMatch = trimmed.match(/^oklch\s*\((.+)\)$/i);
  if (oklchMatch) {
    try {
      const [colorPart, alphaPart] = oklchMatch[1].split('/');
      const parts = colorPart.replace(/,/g, ' ').trim().split(/\s+/);
      if (parts.length >= 3) {
        let l = parts[0].endsWith('%') ? parseFloat(parts[0]) / 100 : (parts[0] === 'none' ? 0 : parseFloat(parts[0]));
        let c = parts[1].endsWith('%') ? (parseFloat(parts[1]) / 100) * 0.4 : (parts[1] === 'none' ? 0 : parseFloat(parts[1]));
        let h = parts[2].endsWith('%') ? (parseFloat(parts[2]) / 100) * 360 : (parts[2] === 'none' ? 0 : parseFloat(parts[2]));
        let alpha = 1;
        if (alphaPart) {
          alpha = alphaPart.trim().endsWith('%') ? parseFloat(alphaPart) / 100 : (alphaPart.trim() === 'none' ? 1 : parseFloat(alphaPart));
        } else if (parts[3]) {
          alpha = parts[3].endsWith('%') ? parseFloat(parts[3]) / 100 : (parts[3] === 'none' ? 1 : parseFloat(parts[3]));
        }
        if (isNaN(l)) l = 0;
        if (isNaN(c)) c = 0;
        if (isNaN(h)) h = 0;
        if (isNaN(alpha)) alpha = 1;
        const [r, g, bVal] = oklchToRgb(l, c, h);
        return alpha >= 0.999 ? `rgb(${r}, ${g}, ${bVal})` : `rgba(${r}, ${g}, ${bVal}, ${alpha})`;
      }
    } catch (e) {
      return 'rgb(248, 250, 252)';
    }
  }

  // 3. oklab(L a b [/ alpha]?)
  const oklabMatch = trimmed.match(/^oklab\s*\((.+)\)$/i);
  if (oklabMatch) {
    try {
      const [colorPart, alphaPart] = oklabMatch[1].split('/');
      const parts = colorPart.replace(/,/g, ' ').trim().split(/\s+/);
      if (parts.length >= 3) {
        let l = parts[0].endsWith('%') ? parseFloat(parts[0]) / 100 : (parts[0] === 'none' ? 0 : parseFloat(parts[0]));
        let a = parts[1].endsWith('%') ? (parseFloat(parts[1]) / 100) * 0.4 : (parts[1] === 'none' ? 0 : parseFloat(parts[1]));
        let b = parts[2].endsWith('%') ? (parseFloat(parts[2]) / 100) * 0.4 : (parts[2] === 'none' ? 0 : parseFloat(parts[2]));
        let alpha = 1;
        if (alphaPart) {
          alpha = alphaPart.trim().endsWith('%') ? parseFloat(alphaPart) / 100 : (alphaPart.trim() === 'none' ? 1 : parseFloat(alphaPart));
        } else if (parts[3]) {
          alpha = parts[3].endsWith('%') ? parseFloat(parts[3]) / 100 : (parts[3] === 'none' ? 1 : parseFloat(parts[3]));
        }
        if (isNaN(l)) l = 0;
        if (isNaN(a)) a = 0;
        if (isNaN(b)) b = 0;
        if (isNaN(alpha)) alpha = 1;
        const [r, g, bVal] = oklabToRgb(l, a, b);
        return alpha >= 0.999 ? `rgb(${r}, ${g}, ${bVal})` : `rgba(${r}, ${g}, ${bVal}, ${alpha})`;
      }
    } catch (e) {
      return 'rgb(248, 250, 252)';
    }
  }

  return null;
}

/**
 * Replaces all modern CSS color occurrences in stylesheet text.
 */
export function convertAllModernColorsToRgb(cssText: string): string {
  if (!cssText || typeof cssText !== 'string') return cssText;

  let result = cssText;

  // Replace Tailwind color-mix(...)
  result = result.replace(/color-mix\s*\(([^()]+(?:\([^()]*\)[^()]*)*)\)/gi, (match) => {
    return parseModernColor(match) || 'rgba(248, 250, 252, 0.9)';
  });

  // Replace oklch(...)
  result = result.replace(/oklch\s*\(([^()]+(?:\([^()]*\)[^()]*)*)\)/gi, (match) => {
    return parseModernColor(match) || 'rgb(248, 250, 252)';
  });

  // Replace oklab(...)
  result = result.replace(/oklab\s*\(([^()]+(?:\([^()]*\)[^()]*)*)\)/gi, (match) => {
    return parseModernColor(match) || 'rgb(248, 250, 252)';
  });

  // Clean any remaining oklab/oklch declarations
  if (result.includes('oklch(') || result.includes('oklab(')) {
    result = result.replace(/oklch\s*\([^;}]+\)/gi, 'rgb(248, 250, 252)');
    result = result.replace(/oklab\s*\([^;}]+\)/gi, 'rgb(248, 250, 252)');
  }

  return result;
}

/**
 * Deep computed style inliner:
 * Directly transfers the live element's computed colors, backgrounds, borders, and fonts
 * to the cloned element. This completely bypasses stylesheet issues and prevents html2canvas crashes.
 */
function inlineElementComputedStyles(liveEl: HTMLElement, cloneEl: HTMLElement) {
  try {
    const computed = window.getComputedStyle(liveEl);
    if (!computed) return;

    // Apply crucial computed style properties directly to inline style
    const bg = computed.backgroundColor;
    if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent' && !bg.includes('okl')) {
      cloneEl.style.backgroundColor = bg;
    } else if (bg && bg.includes('okl')) {
      cloneEl.style.backgroundColor = convertAllModernColorsToRgb(bg);
    }

    const color = computed.color;
    if (color && !color.includes('okl')) {
      cloneEl.style.color = color;
    } else if (color && color.includes('okl')) {
      cloneEl.style.color = convertAllModernColorsToRgb(color);
    }

    const borderColor = computed.borderColor;
    if (borderColor && !borderColor.includes('okl')) {
      cloneEl.style.borderColor = borderColor;
    }

    // Preserve typography and spacing precision
    if (computed.fontSize) cloneEl.style.fontSize = computed.fontSize;
    if (computed.fontWeight) cloneEl.style.fontWeight = computed.fontWeight;
    if (computed.lineHeight) cloneEl.style.lineHeight = computed.lineHeight;
    if (computed.fontFamily) cloneEl.style.fontFamily = computed.fontFamily;
  } catch (e) {
    // Non-fatal per-element issue
  }
}

/**
 * Prepares and sanitizes the cloned document for html2canvas / html2pdf.
 */
export function prepareCloneForPDF(clonedDoc: Document, liveRootElement?: HTMLElement | null): void {
  try {
    // 1. Copy live input/select/textarea values into static text nodes
    const clonedInputs = Array.from(clonedDoc.querySelectorAll('input, select, textarea'));
    
    clonedInputs.forEach((clonedEl) => {
      let value = (clonedEl as any).value || '';
      if (!value) {
        value = clonedEl.getAttribute('placeholder') || '';
      }
      
      if (
        clonedEl.tagName === 'TEXTAREA' ||
        clonedEl.tagName === 'SELECT' ||
        (clonedEl.tagName === 'INPUT' && 
         !['checkbox', 'radio', 'file', 'submit', 'button', 'image'].includes((clonedEl as HTMLInputElement).type))
      ) {
        const replacement = clonedDoc.createElement('span');
        replacement.textContent = value;
        replacement.className = clonedEl.className;
        replacement.setAttribute('style', clonedEl.getAttribute('style') || '');
        
        replacement.style.display = 'inline-block';
        replacement.style.border = 'none';
        replacement.style.background = 'transparent';
        replacement.style.outline = 'none';
        replacement.style.padding = '0';
        replacement.style.whiteSpace = 'pre-wrap';
        
        if (clonedEl.parentNode) {
          clonedEl.parentNode.replaceChild(replacement, clonedEl);
        }
      } else if (clonedEl.tagName === 'INPUT' && (clonedEl as HTMLInputElement).type === 'checkbox') {
        const checkbox = clonedEl as HTMLInputElement;
        if (checkbox.checked) {
          checkbox.setAttribute('checked', 'checked');
        } else {
          checkbox.removeAttribute('checked');
        }
      }
    });

    // 2. If live element tree is available, transfer live computed styles to cloned tree
    if (liveRootElement) {
      const liveElements = Array.from(liveRootElement.querySelectorAll('*')) as HTMLElement[];
      const cloneTargetRoot = clonedDoc.getElementById(liveRootElement.id) || clonedDoc.body;
      const cloneElements = Array.from(cloneTargetRoot.querySelectorAll('*')) as HTMLElement[];

      const count = Math.min(liveElements.length, cloneElements.length);
      for (let i = 0; i < count; i++) {
        inlineElementComputedStyles(liveElements[i], cloneElements[i]);
      }
      inlineElementComputedStyles(liveRootElement, cloneTargetRoot as HTMLElement);
    }

    // 3. Extract, sanitize, and inline all document stylesheets
    try {
      const sheets = Array.from(document.styleSheets);
      sheets.forEach((sheet) => {
        try {
          let cssText = '';
          const rules = Array.from(sheet.cssRules || []);
          for (const rule of rules) {
            cssText += rule.cssText + '\n';
          }
          if (cssText) {
            const sanitized = convertAllModernColorsToRgb(cssText);
            const style = clonedDoc.createElement('style');
            style.textContent = sanitized;
            clonedDoc.head.appendChild(style);
          }
        } catch (e) {
          // Cross-origin stylesheet security restriction (safe to skip)
        }
      });
    } catch (e) {
      // safe
    }

    // 4. Sanitize all existing <style> elements in clonedDoc
    clonedDoc.querySelectorAll('style').forEach((styleEl) => {
      if (styleEl.textContent) {
        styleEl.textContent = convertAllModernColorsToRgb(styleEl.textContent);
      }
    });

    // 5. Remove all external <link rel="stylesheet"> from clonedDoc
    clonedDoc.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
      link.remove();
    });

    // 6. Convert inline styles & attributes on all elements
    clonedDoc.querySelectorAll('*').forEach((el) => {
      for (let i = 0; i < el.attributes.length; i++) {
        const attr = el.attributes[i];
        if (attr.value && (attr.value.includes('okl') || attr.value.includes('lab') || attr.value.includes('color(') || attr.value.includes('color-mix'))) {
          el.setAttribute(attr.name, convertAllModernColorsToRgb(attr.value));
        }
      }
    });

    // 7. Ensure raw SVG data URLs in img tags are clean
    clonedDoc.querySelectorAll('img').forEach((img) => {
      const src = img.getAttribute('src');
      if (src && src.startsWith('data:image/svg+xml')) {
        let rawSvg = src.replace(/^data:image\/svg\+xml;(utf8|charset=utf-8)?,?/, '');
        try {
          rawSvg = decodeURIComponent(rawSvg);
        } catch (e) {
          // already decoded
        }
        rawSvg = convertAllModernColorsToRgb(rawSvg);
        img.setAttribute('src', `data:image/svg+xml;charset=utf-8,${encodeURIComponent(rawSvg)}`);
      }
    });

    // 8. Inject baseline fallback styles to guarantee crisp borders & single-page fit
    const resetStyle = clonedDoc.createElement('style');
    resetStyle.textContent = `
      *, *::before, *::after {
        box-sizing: border-box !important;
        border-color: rgb(226, 232, 240);
      }
      body {
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        color: rgb(30, 41, 59) !important;
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
      }
      .hidden {
        display: block !important;
        visibility: visible !important;
      }
    `;
    clonedDoc.head.appendChild(resetStyle);
  } catch (err) {
    console.warn('prepareCloneForPDF non-fatal issue:', err);
  }
}

/**
 * Isolated, non-blocking print helper.
 * Renders document in a hidden iframe so the main UI never freezes.
 */
export function printDocument(elementId: string): void {
  const targetElement = document.getElementById(elementId);
  if (!targetElement) {
    window.print();
    return;
  }

  // Create isolated hidden iframe for printing
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.visibility = 'hidden';
  iframe.setAttribute('aria-hidden', 'true');
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) {
    if (document.body.contains(iframe)) {
      document.body.removeChild(iframe);
    }
    window.print();
    return;
  }

  // Collect and sanitize all styles from the current document
  let stylesHtml = '';
  try {
    const sheets = Array.from(document.styleSheets);
    sheets.forEach((sheet) => {
      try {
        let cssText = '';
        const rules = Array.from(sheet.cssRules || []);
        for (const rule of rules) {
          cssText += rule.cssText + '\n';
        }
        if (cssText) {
          stylesHtml += `<style>${convertAllModernColorsToRgb(cssText)}</style>`;
        }
      } catch (e) {
        // Cross-origin
      }
    });
  } catch (e) {
    // ignore
  }

  document.querySelectorAll('style').forEach((node) => {
    stylesHtml += `<style>${convertAllModernColorsToRgb(node.textContent || '')}</style>`;
  });

  // Clone element content
  const clone = targetElement.cloneNode(true) as HTMLElement;
  
  // Convert inputs to visible text in clone
  clone.querySelectorAll('input, select, textarea').forEach((inputEl) => {
    const val = (inputEl as any).value || (inputEl as any).placeholder || '';
    const span = document.createElement('span');
    span.textContent = val;
    span.className = inputEl.className;
    span.setAttribute('style', inputEl.getAttribute('style') || '');
    if (inputEl.parentNode) {
      inputEl.parentNode.replaceChild(span, inputEl);
    }
  });

  iframeDoc.open();
  iframeDoc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Print Document</title>
        ${stylesHtml}
        <style>
          @page {
            size: A4 portrait;
            margin: 0 !important;
          }
          *, *::before, *::after {
            box-sizing: border-box !important;
          }
          body {
            margin: 0 !important;
            padding: 8mm !important;
            background: #ffffff !important;
            color: #1e293b !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          }
          .bg-slate-50 {
            background-color: #f8fafc !important;
          }
          .border-slate-100 {
            border-color: #f1f5f9 !important;
          }
          .border-slate-200 {
            border-color: #e2e8f0 !important;
          }
        </style>
      </head>
      <body>
        ${clone.outerHTML}
      </body>
    </html>
  `);
  iframeDoc.close();

  // Trigger print cleanly after iframe has mounted
  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (e) {
      console.warn('Iframe print fallback to window.print():', e);
      window.print();
    } finally {
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 2500);
    }
  }, 250);
}

/**
 * Fast, non-blocking PDF generator that guarantees:
 * 1. Single-page precision without blank 2nd pages.
 * 2. Accurate light backgrounds (#f8fafc) without dark blue color artifacts.
 * 3. Pristine typography, borders, logos, and signatures.
 */
export async function exportDocumentToPDF(elementId: string, filename: string): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Print element #${elementId} not found`);
  }

  // @ts-ignore
  const html2pdfModule = await import('html2pdf.js');
  const html2pdf = (html2pdfModule.default || html2pdfModule) as any;

  const cleanFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;

  const opt = {
    margin: 0,
    filename: cleanFilename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      scrollY: 0,
      scrollX: 0,
      windowWidth: Math.max(element.offsetWidth || 0, 794),
      backgroundColor: '#ffffff',
      logging: false,
      letterRendering: true,
      onclone: (clonedDoc: Document) => {
        prepareCloneForPDF(clonedDoc, element);
        const target = clonedDoc.getElementById(elementId);
        if (target) {
          // Unhide target and all ancestors
          let curr: HTMLElement | null = target;
          while (curr && curr !== clonedDoc.body) {
            curr.classList.remove('hidden');
            curr.style.setProperty('display', 'block', 'important');
            curr.style.setProperty('visibility', 'visible', 'important');
            curr.style.setProperty('opacity', '1', 'important');
            curr = curr.parentElement;
          }
          target.style.margin = '0 auto';
          target.style.boxShadow = 'none';
          target.style.border = 'none';
          target.style.visibility = 'visible';
          target.style.display = 'block';
          target.style.width = '210mm';
          target.style.maxWidth = '210mm';
          target.style.minHeight = '295mm';
          target.style.maxHeight = '296.5mm';
          target.style.boxSizing = 'border-box';
          target.style.overflow = 'hidden';
          target.style.padding = '12mm';
          target.style.backgroundColor = '#ffffff';
        }
      }
    },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
  };

  try {
    await html2pdf().from(element).set(opt).save();
  } catch (pdfErr) {
    console.warn("Direct html2pdf generation failed, engaging print preview fallback:", pdfErr);
    printDocument(elementId);
    throw pdfErr;
  }
}
