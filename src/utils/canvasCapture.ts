import html2canvas from 'html2canvas';

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
  await new Promise(r => setTimeout(r, 800));

  const targetHeight = element.scrollHeight || element.offsetHeight || 1150;

  try {
    const canvas = await html2canvas(element, {
      scale: 2, // High resolution output
      backgroundColor: '#ffffff',
      useCORS: true,
      allowTaint: true,
      width: targetWidth,
      windowWidth: targetWidth,
      x: 0,
      y: 0,
      scrollX: 0,
      scrollY: 0,
            onclone: (clonedDoc) => {
        const hiddenElements = clonedDoc.querySelectorAll('.print\\:hidden');
        hiddenElements.forEach(el => {
          (el as HTMLElement).style.display = 'none';
        });

        if (isPdf) {
          const clonedCard = (clonedDoc.getElementById('invoice-card') || clonedDoc.body.firstElementChild) as HTMLElement;
          if (clonedCard) {
            const cardWidth = targetWidth;
            const pageHeightPx = Math.floor(cardWidth * (297 / 210)); // ~1202px for 850px width

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
                  const spacer = clonedDoc.createElement('tr');
                  spacer.style.height = `${shiftNeeded + 2}px`;
                  const td = clonedDoc.createElement('td');
                  td.colSpan = 20;
                  td.style.border = 'none';
                  td.style.padding = '0';
                  td.style.backgroundColor = 'transparent';
                  spacer.appendChild(td);
                  if (el.parentNode) {
                    el.parentNode.insertBefore(spacer, el);
                  }
                } else {
                  const spacer = clonedDoc.createElement('div');
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
            // This prevents leftover float margin creating an unwanted blank page in jsPDF
            const rawHeight = clonedCard.scrollHeight || clonedCard.offsetHeight;
            const totalPages = Math.max(1, Math.ceil((rawHeight - 10) / pageHeightPx));
            const exactTargetHeight = totalPages * pageHeightPx;

            clonedCard.style.height = `${exactTargetHeight}px`;
            clonedCard.style.minHeight = `${exactTargetHeight}px`;
            clonedCard.style.maxHeight = `${exactTargetHeight}px`;
            clonedCard.style.boxSizing = 'border-box';
          }
        }
      }
    });
    
    // Clean up
    if (parent) {
       parent.style.opacity = '0.01';
       parent.style.zIndex = '-9999';
    }
    
    return canvas;
  } catch (error: any) {
    if (parent) {
       parent.style.opacity = '0.01';
       parent.style.zIndex = '-9999';
    }
    // Prevent circular JSON errors when logging to AI Studio console
    throw new Error(`html2canvas failed: ${error?.message || String(error)}`);
  }
}
