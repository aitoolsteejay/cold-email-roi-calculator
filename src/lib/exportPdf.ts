/**
 * Export the results panel as a PDF. html2canvas + jsPDF, same approach as the LinkedIn calculator.
 * Rendered on the site's cream background with the Myntmore logo in the header.
 */
const CREAM: [number, number, number] = [248, 246, 242];
const CREAM_HEX = "#F8F6F2";

/** Load the logo and downscale it, so a large source PNG does not bloat the PDF. */
function loadLogo(src: string, maxWidth = 480): Promise<{ data: string; ratio: number } | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const ratio = img.naturalWidth / img.naturalHeight;
      const w = Math.min(maxWidth, img.naturalWidth);
      const c = document.createElement("canvas");
      c.width = w;
      c.height = Math.round(w / ratio);
      const ctx = c.getContext("2d");
      if (!ctx) return resolve(null);
      ctx.fillStyle = CREAM_HEX;
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0, c.width, c.height);
      resolve({ data: c.toDataURL("image/jpeg", 0.92), ratio });
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export interface PdfMeta {
  title: string;
  subtitle: string;
  /** Assumption lines printed above the results. Plain ASCII so the built-in PDF font can render them. */
  assumptions: string[];
  footnote: string;
  fileName: string;
  logoSrc: string;
}

type Html2Canvas = (typeof import("html2canvas"))["default"];

/** Render one section and record its card edges, so page breaks fall between cards. */
async function capture(html2canvas: Html2Canvas, element: HTMLElement, scale: number) {
  const rootTop = element.getBoundingClientRect().top;
  const breakpoints = Array.from(element.querySelectorAll<HTMLElement>(":scope > *, :scope > * > *"))
    .filter((el) => !el.parentElement?.closest("[data-pdf-keep]"))
    .map((el) => (el.getBoundingClientRect().bottom - rootTop) * scale)
    .sort((a, b) => a - b);

  const canvas = await html2canvas(element, {
    backgroundColor: CREAM_HEX,
    scale,
    useCORS: true,
    logging: false,
    ignoreElements: (el) => el instanceof HTMLElement && el.dataset.pdfIgnore !== undefined,
    // html2canvas draws inset shadows as stripes, so flatten them in the export copy.
    onclone: (doc) => {
      doc.querySelectorAll<HTMLElement>("[data-pdf-flat]").forEach((el) => {
        el.style.boxShadow = "none";
      });
    },
  });
  return { canvas, breakpoints };
}

/** Export one or more page sections, in order, under a header with the logo and the assumptions. */
export async function exportResultsPdf(elements: HTMLElement[], meta: PdfMeta) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);

  const scale = 2;
  const sections = [];
  for (const el of elements) sections.push(await capture(html2canvas, el, scale));

  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 12;
  const contentW = pageW - margin * 2;
  const bottom = pageH - margin - 8;
  const gap = 4;

  const paintBackground = () => {
    pdf.setFillColor(...CREAM);
    pdf.rect(0, 0, pageW, pageH, "F");
  };

  paintBackground();

  // Header: logo, title, date.
  let y = margin;
  const logo = await loadLogo(meta.logoSrc);
  if (logo) {
    const h = 14;
    pdf.addImage(logo.data, "JPEG", margin, y, logo.ratio * h, h);
  }
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.setTextColor(0, 0, 0);
  pdf.text(meta.title, pageW - margin, y + 6, { align: "right" });
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(96, 96, 96);
  pdf.text(meta.subtitle, pageW - margin, y + 11, { align: "right" });
  y += 20;

  // Assumptions in two columns.
  pdf.setDrawColor(232, 226, 217);
  pdf.line(margin, y, pageW - margin, y);
  y += 5;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(0, 0, 0);
  pdf.text("Assumptions", margin, y);
  y += 5;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8.5);
  pdf.setTextColor(61, 61, 61);
  const half = Math.ceil(meta.assumptions.length / 2);
  meta.assumptions.forEach((line, i) => {
    const col = i < half ? 0 : 1;
    const row = i < half ? i : i - half;
    pdf.text(line, margin + col * (contentW / 2), y + row * 4.2);
  });
  y += half * 4.2 + 3;

  const newPage = () => {
    pdf.addPage();
    paintBackground();
    y = margin;
  };

  // Each section continues on the current page and is sliced at card edges when it runs over.
  for (const { canvas, breakpoints } of sections) {
    const pxPerMm = canvas.width / contentW;
    let srcY = 0;
    while (srcY < canvas.height) {
      let maxSlice = Math.floor((bottom - y) * pxPerMm);
      // Too little room left for even the first card: start a fresh page.
      const firstBreak = breakpoints.find((b) => b > srcY) ?? canvas.height;
      if (maxSlice < Math.min(firstBreak - srcY, canvas.height - srcY) && y > margin) {
        newPage();
        maxSlice = Math.floor((bottom - y) * pxPerMm);
      }
      let slicePx = Math.min(canvas.height - srcY, maxSlice);
      if (srcY + slicePx < canvas.height) {
        const clean = breakpoints.filter((b) => b > srcY + maxSlice * 0.3 && b <= srcY + maxSlice).pop();
        if (clean) slicePx = Math.ceil(clean - srcY + 4 * scale);
      }
      const slice = document.createElement("canvas");
      slice.width = canvas.width;
      slice.height = slicePx;
      const ctx = slice.getContext("2d");
      if (!ctx) break;
      ctx.fillStyle = CREAM_HEX;
      ctx.fillRect(0, 0, slice.width, slice.height);
      ctx.drawImage(canvas, 0, srcY, canvas.width, slicePx, 0, 0, canvas.width, slicePx);
      pdf.addImage(slice.toDataURL("image/jpeg", 0.85), "JPEG", margin, y, contentW, slicePx / pxPerMm);
      y += slicePx / pxPerMm;
      srcY += slicePx;
      if (srcY < canvas.height) newPage();
    }
    y += gap;
  }

  // Footnote on every page.
  const pages = pdf.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    pdf.setPage(p);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    pdf.setTextColor(113, 103, 94);
    pdf.text(pdf.splitTextToSize(meta.footnote, contentW - 45), margin, pageH - 9);
    pdf.text(`myntmore.com  |  ${p}/${pages}`, pageW - margin, pageH - 7, { align: "right" });
  }

  pdf.save(meta.fileName);
}
