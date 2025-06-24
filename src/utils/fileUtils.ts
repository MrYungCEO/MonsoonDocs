import { saveAs } from 'file-saver';
import domtoimage from 'dom-to-image';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const exportMarkdown = (content: string): void => {
  if (!content || content.trim() === '') {
    alert('No content to export');
    return;
  }

  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  saveAs(blob, 'generated-document.md');
};

export interface PdfExportOptions {
  orientation?: 'portrait' | 'landscape';
  format?: 'letter' | 'a4';
  quality?: number;
}

export const exportAsPdf = async (
  element: HTMLElement, 
  options: PdfExportOptions = {}
): Promise<void> => {
  if (!element) {
    alert('No content to export');
    return;
  }

  const {
    orientation = 'portrait',
    format = 'letter',
    quality = 2
  } = options;

  try {
    // Show loading indicator
    const loadingDiv = document.createElement('div');
    loadingDiv.innerHTML = `
      <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 9999; display: flex; align-items: center; justify-content: center; color: white; font-family: Arial, sans-serif;">
        <div style="text-align: center;">
          <div style="width: 40px; height: 40px; border: 4px solid #8b5cf6; border-top: 4px solid transparent; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 16px;"></div>
          <div>Generating PDF (${orientation} ${format})...</div>
          <div style="font-size: 12px; opacity: 0.8; margin-top: 8px;">This may take a moment for large documents</div>
        </div>
      </div>
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    `;
    document.body.appendChild(loadingDiv);

    // Get the content element (the white document area)
    const contentElement = element.querySelector('.bg-white.m-8') as HTMLElement;
    if (!contentElement) {
      throw new Error('Content element not found');
    }

    // Store original styles
    const originalStyles = {
      width: contentElement.style.width,
      maxWidth: contentElement.style.maxWidth,
      margin: contentElement.style.margin,
      padding: contentElement.style.padding,
      boxShadow: contentElement.style.boxShadow,
      borderRadius: contentElement.style.borderRadius,
      transform: contentElement.style.transform,
      position: contentElement.style.position,
      overflow: contentElement.style.overflow
    };

    // Calculate optimal dimensions for PDF export
    let pdfWidth: number, pdfHeight: number, contentWidth: number;
    
    if (format === 'letter') {
      pdfWidth = 216; // 8.5 inches in mm
      pdfHeight = orientation === 'portrait' ? 279 : 216; // 11 inches in mm
      contentWidth = orientation === 'portrait' ? 612 : 792; // pixels at 72 DPI
    } else { // A4
      pdfWidth = orientation === 'portrait' ? 210 : 297;
      pdfHeight = orientation === 'portrait' ? 297 : 210;
      contentWidth = orientation === 'portrait' ? 595 : 842; // pixels at 72 DPI
    }

    // Set optimal styles for PDF generation - key is to set a fixed pixel width
    contentElement.style.width = `${contentWidth}px`;
    contentElement.style.maxWidth = `${contentWidth}px`;
    contentElement.style.margin = '0';
    contentElement.style.padding = '48px'; // Reasonable margins in pixels
    contentElement.style.boxShadow = 'none';
    contentElement.style.borderRadius = '0';
    contentElement.style.backgroundColor = 'white';
    contentElement.style.transform = 'scale(1)';
    contentElement.style.position = 'relative';
    contentElement.style.overflow = 'visible';

    // Force layout recalculation
    contentElement.offsetHeight;

    // Wait for layout to settle
    await new Promise(resolve => setTimeout(resolve, 200));

    // Use html2canvas with optimized settings for PDF
    const canvas = await html2canvas(contentElement, {
      scale: 1, // Use scale 1 for consistent sizing
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: contentElement.scrollWidth,
      height: contentElement.scrollHeight,
      scrollX: 0,
      scrollY: 0,
      windowWidth: contentElement.scrollWidth,
      windowHeight: contentElement.scrollHeight,
      onclone: (clonedDoc) => {
        // Ensure fonts are loaded in the cloned document
        const clonedElement = clonedDoc.querySelector('.bg-white') as HTMLElement;
        if (clonedElement) {
          clonedElement.style.fontFamily = 'Georgia, "Times New Roman", serif';
          // Ensure all text is properly sized
          const allElements = clonedElement.querySelectorAll('*');
          allElements.forEach((el: any) => {
            if (el.style) {
              el.style.webkitPrintColorAdjust = 'exact';
            }
          });
        }
      }
    });

    // Restore original styles immediately
    Object.assign(contentElement.style, originalStyles);

    // Create PDF with specified format and orientation
    const pdf = new jsPDF({
      orientation: orientation,
      unit: 'mm',
      format: format === 'letter' ? [216, 279] : 'a4'
    });

    // Get PDF page dimensions
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Convert canvas to image data
    const imgData = canvas.toDataURL('image/png', 1.0);
    
    // Calculate image dimensions in mm
    // We know our content width was set to match the PDF page, so we can calculate the scale
    const imgWidthMm = pageWidth - 20; // Leave 10mm margin on each side
    const imgHeightMm = (canvas.height / canvas.width) * imgWidthMm;

    // Position to center horizontally with margins
    const xPosition = 10; // 10mm left margin
    const yPosition = 10; // 10mm top margin

    // Handle multi-page documents
    if (imgHeightMm > pageHeight - 20) { // Account for top and bottom margins
      const usablePageHeight = pageHeight - 20; // 10mm margins top and bottom
      const totalPages = Math.ceil(imgHeightMm / usablePageHeight);
      
      for (let i = 0; i < totalPages; i++) {
        if (i > 0) {
          pdf.addPage();
        }
        
        // Calculate the portion of the image for this page
        const sourceYRatio = (usablePageHeight * i) / imgHeightMm;
        const sourceHeightRatio = Math.min(usablePageHeight / imgHeightMm, 1 - sourceYRatio);
        
        const sourceY = canvas.height * sourceYRatio;
        const sourceHeight = canvas.height * sourceHeightRatio;
        
        // Create a temporary canvas for this page
        const pageCanvas = document.createElement('canvas');
        const pageCtx = pageCanvas.getContext('2d');
        pageCanvas.width = canvas.width;
        pageCanvas.height = sourceHeight;
        
        if (pageCtx) {
          pageCtx.fillStyle = 'white';
          pageCtx.fillRect(0, 0, canvas.width, sourceHeight);
          pageCtx.drawImage(canvas, 0, sourceY, canvas.width, sourceHeight, 0, 0, canvas.width, sourceHeight);
          
          const pageImgData = pageCanvas.toDataURL('image/png', 1.0);
          const pageHeightMm = (sourceHeight / canvas.width) * imgWidthMm;
          
          pdf.addImage(pageImgData, 'PNG', xPosition, yPosition, imgWidthMm, pageHeightMm);
        }
      }
    } else {
      // Single page
      pdf.addImage(imgData, 'PNG', xPosition, yPosition, imgWidthMm, imgHeightMm);
    }

    // Add metadata
    pdf.setProperties({
      title: 'Generated Document',
      subject: 'Document created with MonsoonDocs',
      author: 'MonsoonDocs',
      creator: 'MonsoonDocs AI Document Generator'
    });

    // Generate filename with format and orientation info
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `document-${format}-${orientation}-${timestamp}.pdf`;

    // Save the PDF
    pdf.save(filename);

    // Remove loading indicator
    document.body.removeChild(loadingDiv);

  } catch (error) {
    // Remove loading indicator if it exists
    const loadingDiv = document.querySelector('[style*="position: fixed"]');
    if (loadingDiv && loadingDiv.parentNode) {
      document.body.removeChild(loadingDiv);
    }
    
    console.error('Error generating PDF:', error);
    alert(`Error exporting as PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const exportAsImage = async (element: HTMLElement): Promise<void> => {
  if (!element) {
    alert('No content to export');
    return;
  }

  try {
    // Configure dom-to-image options for better quality
    const options = {
      quality: 0.95,
      width: element.offsetWidth,
      height: element.offsetHeight,
      style: {
        transform: 'scale(1)',
        transformOrigin: 'top left',
        backgroundColor: 'white'
      }
    };

    const blob = await domtoimage.toBlob(element, options);
    saveAs(blob, 'generated-document.png');
  } catch (error) {
    console.error('Error generating image:', error);
    alert(`Error exporting as image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const readFileAsDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        resolve(e.target.result as string);
      } else {
        reject(new Error('Failed to read file'));
      }
    };
    reader.onerror = () => reject(new Error('Error reading file'));
    reader.readAsDataURL(file);
  });
};