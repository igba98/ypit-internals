/**
 * Browser-side image preparation for the Website CMS: shrink oversized photos
 * and (optionally) crop them to the shape the slot actually renders at, so a
 * 6 MB phone photo does not land on the public site at full size, and a
 * portrait shot does not get its head cut off in a 16:9 hero.
 */
export interface PrepareOptions {
  /** Longest edge of the output, in pixels. */
  maxWidth: number;
  /** Target width/height. Null keeps the original shape (logos). */
  aspect?: number | null;
  /** Which part to keep when cropping. */
  focus?: 'top' | 'center' | 'bottom';
  /** JPEG quality for photos. */
  quality?: number;
}

export interface PreparedImage {
  blob: Blob;
  width: number;
  height: number;
  type: string;
  name: string;
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

async function load(file: File): Promise<{ bitmap: ImageBitmap | HTMLImageElement; width: number; height: number }> {
  if (typeof createImageBitmap === 'function') {
    const bitmap = await createImageBitmap(file);
    return { bitmap, width: bitmap.width, height: bitmap.height };
  }
  // Fallback for browsers without createImageBitmap.
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Could not read that image.'));
      el.src = url;
    });
    return { bitmap: img, width: img.naturalWidth, height: img.naturalHeight };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Source rectangle to draw: the whole image, or the crop that matches `aspect`. */
function sourceRect(
  w: number,
  h: number,
  aspect: number | null | undefined,
  focus: 'top' | 'center' | 'bottom',
): { sx: number; sy: number; sw: number; sh: number } {
  if (!aspect) return { sx: 0, sy: 0, sw: w, sh: h };
  const current = w / h;
  if (Math.abs(current - aspect) < 0.01) return { sx: 0, sy: 0, sw: w, sh: h };
  if (current > aspect) {
    // Too wide: trim the sides, always centred horizontally.
    const sw = Math.round(h * aspect);
    return { sx: Math.round((w - sw) / 2), sy: 0, sw, sh: h };
  }
  // Too tall: trim top/bottom according to the chosen focus.
  const sh = Math.round(w / aspect);
  const extra = h - sh;
  const sy = focus === 'top' ? 0 : focus === 'bottom' ? extra : Math.round(extra / 2);
  return { sx: 0, sy, sw: w, sh };
}

export async function prepareImage(file: File, opts: PrepareOptions): Promise<PreparedImage> {
  const { maxWidth, aspect = null, focus = 'center', quality = 0.85 } = opts;
  const { bitmap, width, height } = await load(file);
  const { sx, sy, sw, sh } = sourceRect(width, height, aspect, focus);

  const scale = Math.min(1, maxWidth / sw);
  const outW = Math.max(1, Math.round(sw * scale));
  const outH = Math.max(1, Math.round(sh * scale));

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Your browser could not process the image.');
  ctx.imageSmoothingQuality = 'high';
  // PNG/SVG-ish sources may have transparency; JPEG output needs a white ground.
  const keepPng = file.type === 'image/png';
  if (!keepPng) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, outW, outH);
  }
  ctx.drawImage(bitmap as CanvasImageSource, sx, sy, sw, sh, 0, 0, outW, outH);
  if ('close' in bitmap && typeof bitmap.close === 'function') bitmap.close();

  const type = keepPng ? 'image/png' : 'image/jpeg';
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, type, keepPng ? undefined : quality),
  );
  if (!blob) throw new Error('Could not prepare the image.');

  const base = file.name.replace(/\.[^.]+$/, '').slice(0, 80) || 'image';
  return { blob, width: outW, height: outH, type, name: `${base}.${keepPng ? 'png' : 'jpg'}` };
}
