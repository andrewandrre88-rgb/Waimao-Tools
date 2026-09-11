/**
 * Image Compression & Optimization Utility
 * Prevents localStorage & Firestore document size limits (> 1MB) by downscaling
 * and compressing user-uploaded base64 images (logos, stamps, product photos, signatures).
 * Supports automatic white background removal and transparent alpha preservation for signatures & stamps.
 */

/**
 * Removes white / light backgrounds from an image and converts it into a transparent PNG.
 * Uses adaptive luminance feathering, corner background sampling, and ink enhancement.
 */
export function removeWhiteBackground(
  imageSource: string | File | Blob,
  threshold = 200
): Promise<string> {
  return new Promise((resolve) => {
    const processImage = (src: string) => {
      if (!src || src.startsWith('data:image/svg+xml') || src.includes('<svg')) {
        resolve(src);
        return;
      }

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 800;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(src);
          return;
        }

        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;

        // 1. Sample corner and border pixels to estimate background paper color
        const samplePoints = [
          [0, 0], [width - 1, 0], [0, height - 1], [width - 1, height - 1],
          [Math.floor(width / 2), 0], [Math.floor(width / 2), height - 1],
          [0, Math.floor(height / 2)], [width - 1, Math.floor(height / 2)],
          [4, 4], [width - 5, 4], [4, height - 5], [width - 5, height - 5]
        ];

        let totalR = 0, totalG = 0, totalB = 0, sampleCount = 0;
        samplePoints.forEach(([x, y]) => {
          if (x >= 0 && x < width && y >= 0 && y < height) {
            const idx = (y * width + x) * 4;
            const a = data[idx + 3];
            if (a > 50) {
              totalR += data[idx];
              totalG += data[idx + 1];
              totalB += data[idx + 2];
              sampleCount++;
            }
          }
        });

        const bgR = sampleCount > 0 ? totalR / sampleCount : 255;
        const bgG = sampleCount > 0 ? totalG / sampleCount : 255;
        const bgB = sampleCount > 0 ? totalB / sampleCount : 255;
        const bgLum = 0.299 * bgR + 0.587 * bgG + 0.114 * bgB;

        // Dynamic threshold based on background brightness
        const effectiveThreshold = Math.min(threshold, Math.max(165, bgLum - 18));
        const featherRange = 35;

        // Track bounding box of actual ink strokes
        let minX = width, minY = height, maxX = 0, maxY = 0;
        let hasInk = false;

        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4;
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];

            if (a === 0) continue;

            const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
            const colorDist = Math.sqrt((r - bgR) ** 2 + (g - bgG) ** 2 + (b - bgB) ** 2);

            // Check if pixel belongs to paper/background
            if (luminance >= effectiveThreshold || colorDist < 25) {
              data[i + 3] = 0; // 100% Transparent
            } else if (luminance > effectiveThreshold - featherRange) {
              // Smooth feathered transition
              const ratio = (luminance - (effectiveThreshold - featherRange)) / featherRange;
              const newAlpha = Math.round(a * (1 - ratio));
              data[i + 3] = newAlpha;
              if (newAlpha > 30) {
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
                hasInk = true;
              }
            } else {
              // Solid dark pen stroke / ink - enhance contrast
              data[i + 3] = 255;
              // Slightly deepen the ink for crisp high-contrast signature
              data[i] = Math.max(0, Math.round(r * 0.85));
              data[i + 1] = Math.max(0, Math.round(g * 0.85));
              data[i + 2] = Math.max(0, Math.round(b * 0.85));

              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
              hasInk = true;
            }
          }
        }

        ctx.putImageData(imgData, 0, 0);

        // If ink was found, crop tightly with small padding to center cleanly
        if (hasInk && maxX > minX && maxY > minY) {
          const pad = 10;
          const cropX = Math.max(0, minX - pad);
          const cropY = Math.max(0, minY - pad);
          const cropW = Math.min(width - cropX, (maxX - minX) + pad * 2);
          const cropH = Math.min(height - cropY, (maxY - minY) + pad * 2);

          const croppedCanvas = document.createElement('canvas');
          croppedCanvas.width = cropW;
          croppedCanvas.height = cropH;
          const croppedCtx = croppedCanvas.getContext('2d');
          if (croppedCtx) {
            croppedCtx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
            resolve(croppedCanvas.toDataURL('image/png'));
            return;
          }
        }

        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => resolve(src);
      img.src = src;
    };

    if (typeof imageSource === 'string') {
      processImage(imageSource);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => processImage((e.target?.result as string) || '');
      reader.onerror = () => resolve('');
      reader.readAsDataURL(imageSource);
    }
  });
}

export function compressImageFile(
  file: File | Blob,
  maxWidth = 500,
  maxHeight = 500,
  quality = 0.75,
  options?: { preserveTransparency?: boolean; autoRemoveBackground?: boolean }
): Promise<string> {
  return new Promise((resolve, reject) => {
    // SVGs do not need canvas compression
    if (file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = (e) => resolve((e.target?.result as string) || '');
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const src = (event.target?.result as string) || '';
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(src);
          return;
        }

        const preserveAlpha = options?.preserveTransparency || options?.autoRemoveBackground || file.type === 'image/png';

        if (!preserveAlpha) {
          // Fill background white for standard JPEGs (e.g. product photos)
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
        } else {
          ctx.clearRect(0, 0, width, height);
        }

        ctx.drawImage(img, 0, 0, width, height);

        if (options?.autoRemoveBackground) {
          const imgData = ctx.getImageData(0, 0, width, height);
          const data = imgData.data;
          const threshold = 215;

          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];

            if (a === 0) continue;

            const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
            if (luminance >= threshold) {
              data[i + 3] = 0;
            } else if (luminance > threshold - 40) {
              const ratio = (luminance - (threshold - 40)) / 40;
              data[i + 3] = Math.round(a * (1 - ratio));
            }
          }
          ctx.putImageData(imgData, 0, 0);
          resolve(canvas.toDataURL('image/png'));
          return;
        }

        if (preserveAlpha) {
          resolve(canvas.toDataURL('image/png'));
        } else {
          resolve(canvas.toDataURL('image/jpeg', quality));
        }
      };
      img.onerror = () => resolve(src);
      img.src = src;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function compressDataUrl(
  dataUrl: string,
  maxWidth = 400,
  maxHeight = 400,
  quality = 0.7,
  options?: { preserveTransparency?: boolean; autoRemoveBackground?: boolean }
): Promise<string> {
  return new Promise((resolve) => {
    if (
      !dataUrl ||
      !dataUrl.startsWith('data:image') ||
      dataUrl.includes('image/svg+xml') ||
      (dataUrl.length < 25000 && !options?.autoRemoveBackground) // Already small (<25KB)
    ) {
      if (options?.autoRemoveBackground) {
        removeWhiteBackground(dataUrl).then(resolve);
        return;
      }
      resolve(dataUrl);
      return;
    }

    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxWidth || height > maxHeight) {
        if (width / height > maxWidth / maxHeight) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      const preserveAlpha = options?.preserveTransparency || options?.autoRemoveBackground || dataUrl.startsWith('data:image/png');

      if (!preserveAlpha) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
      } else {
        ctx.clearRect(0, 0, width, height);
      }

      ctx.drawImage(img, 0, 0, width, height);

      if (options?.autoRemoveBackground) {
        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;
        const threshold = 215;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];

          if (a === 0) continue;

          const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
          if (luminance >= threshold) {
            data[i + 3] = 0;
          } else if (luminance > threshold - 40) {
            const ratio = (luminance - (threshold - 40)) / 40;
            data[i + 3] = Math.round(a * (1 - ratio));
          }
        }
        ctx.putImageData(imgData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
        return;
      }

      if (preserveAlpha) {
        resolve(canvas.toDataURL('image/png'));
      } else {
        resolve(canvas.toDataURL('image/jpeg', quality));
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/**
 * Traverses and compresses any large image fields inside AppData before saving to Firestore.
 */
export async function sanitizeAppDataForFirestore<T>(appData: T): Promise<T> {
  if (!appData || typeof appData !== 'object') return appData;

  const clone: any = JSON.parse(JSON.stringify(appData));

  // 1. Compress Company Settings images
  if (clone.settings) {
    if (clone.settings.logo && clone.settings.logo.length > 25000) {
      clone.settings.logo = await compressDataUrl(clone.settings.logo, 400, 150, 0.75, { preserveTransparency: true });
    }
    if (clone.settings.stamp && clone.settings.stamp.length > 25000) {
      clone.settings.stamp = await compressDataUrl(clone.settings.stamp, 300, 300, 0.75, { preserveTransparency: true, autoRemoveBackground: true });
    }
    if (clone.settings.secondaryStamp && clone.settings.secondaryStamp.length > 25000) {
      clone.settings.secondaryStamp = await compressDataUrl(clone.settings.secondaryStamp, 300, 300, 0.75, { preserveTransparency: true, autoRemoveBackground: true });
    }
    if (clone.settings.signature && clone.settings.signature.length > 25000) {
      clone.settings.signature = await compressDataUrl(clone.settings.signature, 350, 150, 0.75, { preserveTransparency: true, autoRemoveBackground: true });
    }
  }

  // 2. Compress Products images
  if (Array.isArray(clone.products)) {
    for (const p of clone.products) {
      if (p.image && p.image.length > 25000) {
        p.image = await compressDataUrl(p.image, 300, 300, 0.7);
      }
    }
  }

  // 3. Clean up duplicate/heavy line item images in historical documents
  const cleanLineItems = async (items: any[]) => {
    if (!Array.isArray(items)) return;
    for (const item of items) {
      if (item.image && item.image.length > 15000) {
        // Compress or strip line item images if huge
        item.image = await compressDataUrl(item.image, 200, 200, 0.6);
      }
    }
  };

  if (Array.isArray(clone.invoices)) {
    for (const inv of clone.invoices) {
      if (inv.items) await cleanLineItems(inv.items);
    }
  }

  if (Array.isArray(clone.proformaInvoices)) {
    for (const pfi of clone.proformaInvoices) {
      if (pfi.items) await cleanLineItems(pfi.items);
      if (pfi.customStamp && pfi.customStamp.length > 25000) {
        pfi.customStamp = await compressDataUrl(pfi.customStamp, 300, 300, 0.75, { preserveTransparency: true, autoRemoveBackground: true });
      }
      if (pfi.customSecondaryStamp && pfi.customSecondaryStamp.length > 25000) {
        pfi.customSecondaryStamp = await compressDataUrl(pfi.customSecondaryStamp, 300, 300, 0.75, { preserveTransparency: true, autoRemoveBackground: true });
      }
      if (pfi.customSignature && pfi.customSignature.length > 25000) {
        pfi.customSignature = await compressDataUrl(pfi.customSignature, 350, 150, 0.75, { preserveTransparency: true, autoRemoveBackground: true });
      }
    }
  }

  if (Array.isArray(clone.quotations)) {
    for (const qt of clone.quotations) {
      if (qt.items) await cleanLineItems(qt.items);
    }
  }

  if (Array.isArray(clone.packingLists)) {
    for (const pl of clone.packingLists) {
      if (pl.items) await cleanLineItems(pl.items);
    }
  }

  if (Array.isArray(clone.sampleInvoices)) {
    for (const si of clone.sampleInvoices) {
      if (si.items) await cleanLineItems(si.items);
    }
  }

  if (Array.isArray(clone.contracts)) {
    for (const cnt of clone.contracts) {
      if (cnt.items) await cleanLineItems(cnt.items);
      if (cnt.seller?.stamp && cnt.seller.stamp.length > 25000) {
        cnt.seller.stamp = await compressDataUrl(cnt.seller.stamp, 250, 250, 0.7, { preserveTransparency: true, autoRemoveBackground: true });
      }
      if (cnt.buyer?.stamp && cnt.buyer.stamp.length > 25000) {
        cnt.buyer.stamp = await compressDataUrl(cnt.buyer.stamp, 250, 250, 0.7, { preserveTransparency: true, autoRemoveBackground: true });
      }
    }
  }

  return clone as T;
}
