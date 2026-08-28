import sharp from 'sharp';

export interface ImageAnalysisInfo {
  originalWidth: number;
  originalHeight: number;
  originalFormat: string;
  originalSizeBytes: number;
  analysisBuffer: Buffer;
  analysisWidth: number;
  analysisHeight: number;
}

/**
 * Inspects pristine original photo and generates a standardized, clamped 768px JPEG
 * analysis copy for lightweight inference while preserving the original intact.
 */
export async function prepareAnalysisImage(originalBuffer: Buffer): Promise<ImageAnalysisInfo> {
  const metadata = await sharp(originalBuffer).metadata();

  const originalWidth = metadata.width || 0;
  const originalHeight = metadata.height || 0;
  const originalFormat = metadata.format || 'jpeg';
  const originalSizeBytes = originalBuffer.length;

  // Max dimension 768px for inference
  const maxDim = 768;
  let targetWidth = originalWidth;
  let targetHeight = originalHeight;

  if (originalWidth > maxDim || originalHeight > maxDim) {
    if (originalWidth >= originalHeight) {
      targetWidth = maxDim;
      targetHeight = Math.round((originalHeight * maxDim) / originalWidth);
    } else {
      targetHeight = maxDim;
      targetWidth = Math.round((originalWidth * maxDim) / originalHeight);
    }
  }

  const analysisBuffer = await sharp(originalBuffer)
    .rotate() // Auto-orient based on EXIF orientation
    .resize(targetWidth, targetHeight, { fit: 'inside' })
    .toFormat('jpeg', { quality: 85 })
    .toBuffer();

  return {
    originalWidth,
    originalHeight,
    originalFormat,
    originalSizeBytes,
    analysisBuffer,
    analysisWidth: targetWidth,
    analysisHeight: targetHeight,
  };
}
