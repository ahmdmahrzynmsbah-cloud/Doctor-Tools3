import html2canvas from 'html2canvas';
import * as htmlToImage from 'html-to-image';

export async function captureElementToCanvas(containerEl: HTMLElement, customWidth = 850, isPdf = false): Promise<HTMLCanvasElement> {
  // Try to specifically target the invoice card
  let element = document.getElementById('invoice-card') as HTMLElement;
  
  if (!element) {
    element = (containerEl.querySelector('#invoice-card') as HTMLElement) ||
           (containerEl.querySelector('#pdf-export-card') as HTMLElement) ||
           (containerEl.id === 'invoice-card' ? containerEl : null) ||
           (containerEl.firstElementChild as HTMLElement) ||
           containerEl;
  }

  if (!element) {
    throw new Error('Element to capture not found');
  }

  // Force wrapper to visible if using the hidden share print ref
  const parent = element.closest('#hidden-share-invoice-print') as HTMLElement;
  if (parent) {
     parent.style.opacity = '1';
     parent.style.zIndex = '9999';
  }

  const targetWidth = customWidth || 850;
  
  // Wait for all images within the card to fully load
  const images = Array.from(element.querySelectorAll('img'));
  await Promise.all(images.map((img) => {
    if (img.complete) return Promise.resolve();
    return new Promise((res) => { 
      img.onload = res; 
      img.onerror = res; 
    });
  }));
  
  // Wait for fonts to be ready
  if (document.fonts) {
    try { await document.fonts.ready; } catch (e) {}
  }
  
  // Give React additional time to finish any pending rendering cycles
  await new Promise(r => setTimeout(r, 600));

  const pageHeightPx = Math.floor(targetWidth * (297 / 210)); // ~1202px for 850px width (A4 ratio)

  try {
    if (isPdf) {
      // Create a clean, off-screen staging DOM container for PDF pagination & break calculations
      const staging = document.createElement('div');
      staging.id = 'pdf-staging-wrapper';
      staging.style.position = 'fixed';
      staging.style.left = '-9999px';
      staging.style.top = '0';
      staging.style.width = `${targetWidth}px`;
      staging.style.backgroundColor = '#ffffff';
      staging.style.zIndex = '-99999';
      staging.style.opacity = '1';

      const clonedCard = element.cloneNode(true) as HTMLElement;
      
      // Ensure hidden elements remain hidden
      clonedCard.querySelectorAll('.print\\:hidden').forEach(el => {
        (el as HTMLElement).style.display = 'none';
      });

      staging.appendChild(clonedCard);
      document.body.appendChild(staging);

      try {
        // Calculate breaks and insert spacers to avoid slicing rows
        const breakableElements = Array.from(clonedCard.querySelectorAll('tr, .break-inside-avoid'));
        breakableElements.forEach(el => {
          const cardRect = clonedCard.getBoundingClientRect();
          const elRect = el.getBoundingClientRect();

          const topRelativeToCard = elRect.top - cardRect.top;
          const bottomRelativeToCard = elRect.bottom - cardRect.top;

          const startPage = Math.floor(topRelativeToCard / pageHeightPx) + 1;
          const endPage = Math.floor(bottomRelativeToCard / pageHeightPx) + 1;

          if (endPage > startPage && topRelativeToCard < startPage * pageHeightPx) {
            const shiftNeeded = (startPage * pageHeightPx) - topRelativeToCard;
            
            if (el.tagName.toLowerCase() === 'tr') {
              const spacer = document.createElement('tr');
              spacer.style.height = `${shiftNeeded + 2}px`;
              const td = document.createElement('td');
              td.colSpan = 20;
              td.style.border = 'none';
              td.style.padding = '0';
              td.style.backgroundColor = 'transparent';
              spacer.appendChild(td);
              if (el.parentNode) {
                el.parentNode.insertBefore(spacer, el);
              }
            } else {
              const spacer = document.createElement('div');
              spacer.style.height = `${shiftNeeded + 2}px`;
              spacer.style.width = '100%';
              spacer.style.backgroundColor = 'transparent';
              if (el.parentNode) {
                el.parentNode.insertBefore(spacer, el);
              }
            }
          }
        });

        // Adjust cloned card height to exact integer multiple of A4 page height
        const rawHeight = clonedCard.scrollHeight || clonedCard.offsetHeight;
        const totalPages = Math.max(1, Math.ceil((rawHeight - 10) / pageHeightPx));
        const exactTargetHeight = totalPages * pageHeightPx;

        clonedCard.style.height = `${exactTargetHeight}px`;
        clonedCard.style.minHeight = `${exactTargetHeight}px`;
        clonedCard.style.maxHeight = `${exactTargetHeight}px`;
        clonedCard.style.boxSizing = 'border-box';

        // 1. Try html2canvas first (renders native Cairo font matching system UI perfectly)
        try {
          return await runHtml2Canvas(clonedCard, targetWidth, exactTargetHeight);
        } catch (h2cError) {
          console.warn('html2canvas failed, falling back to html-to-image:', h2cError);
          // 2. Fall back to html-to-image
          const canvas = await htmlToImage.toCanvas(clonedCard, {
            pixelRatio: 2,
            backgroundColor: '#ffffff',
            width: targetWidth,
            height: exactTargetHeight,
            canvasWidth: targetWidth * 2,
            canvasHeight: exactTargetHeight * 2,
            filter: (node) => !(node as HTMLElement)?.classList?.contains('print:hidden')
          });
          return canvas;
        }
      } finally {
        staging.remove();
      }
    } else {
      // Non-PDF capture (image download / sharing)
      try {
        return await runHtml2Canvas(element, targetWidth);
      } catch (h2cError) {
        console.warn('html2canvas failed, falling back to html-to-image:', h2cError);
        const canvas = await htmlToImage.toCanvas(element, {
          pixelRatio: 2,
          backgroundColor: '#ffffff',
          width: targetWidth,
          filter: (node) => !(node as HTMLElement)?.classList?.contains('print:hidden')
        });
        return canvas;
      }
    }
  } finally {
    if (parent) {
      parent.style.opacity = '0.01';
      parent.style.zIndex = '-9999';
    }
  }
}

async function runHtml2Canvas(element: HTMLElement, width: number, height?: number): Promise<HTMLCanvasElement> {
  return await html2canvas(element, {
    scale: 2,
    backgroundColor: '#ffffff',
    useCORS: true,
    allowTaint: true,
    width: width,
    height: height,
    windowWidth: width,
    windowHeight: height,
    x: 0,
    y: 0,
    scrollX: 0,
    scrollY: 0,
    onclone: (clonedDoc) => {
      try {
        // Ensure Cairo font is explicitly set on cloned document
        const fontStyle = clonedDoc.createElement('style');
        fontStyle.textContent = `
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap');
          body, #invoice-card, #invoice-card * {
            font-family: 'Cairo', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
          }
        `;
        clonedDoc.head?.appendChild(fontStyle);

        // Sanitize any style tags with oklab/oklch
        const styleTags = clonedDoc.querySelectorAll('style');
        styleTags.forEach(tag => {
          if (tag.textContent && (tag.textContent.includes('oklab') || tag.textContent.includes('oklch'))) {
            tag.textContent = tag.textContent
              .replace(/oklab\([^)]+\)/gi, '#1E293B')
              .replace(/oklch\([^)]+\)/gi, '#1E293B');
          }
        });

        // Sanitize inline styles
        const allElements = clonedDoc.querySelectorAll('*');
        allElements.forEach(el => {
          const htmlEl = el as HTMLElement;
          if (htmlEl && htmlEl.style) {
            ['color', 'backgroundColor', 'borderColor', 'outlineColor', 'fill', 'stroke'].forEach(prop => {
              const val = htmlEl.style.getPropertyValue(prop);
              if (val && (val.includes('oklab') || val.includes('oklch'))) {
                htmlEl.style.setProperty(prop, '#1E293B');
              }
            });
          }
        });

        const hiddenElements = clonedDoc.querySelectorAll('.print\\:hidden');
        hiddenElements.forEach(el => {
          (el as HTMLElement).style.display = 'none';
        });
      } catch (e) {
        console.warn('html2canvas onclone warning:', e);
      }
    }
  });
}
