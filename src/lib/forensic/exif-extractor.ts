import exifr from 'exifr';

export interface ExtractedMetadata {
  hasExif: boolean;
  cameraMake?: string | null;
  cameraModel?: string | null;
  lensModel?: string | null;
  focalLength?: string | null;
  aperture?: string | null;
  shutterSpeed?: string | null;
  iso?: number | null;
  softwareTags?: string | null;
  colorSpace?: string | null;
  orientation?: number | null;
  dateTimeOriginal?: string | null;
  hasGps?: boolean;
  rawExif?: Record<string, any>;
  forensicNotes?: string[];
}

/**
 * Extracts EXIF, XMP, IPTC, and ICC metadata from photographic buffer.
 */
export async function extractMetadata(buffer: Buffer): Promise<ExtractedMetadata> {
  const notes: string[] = [];

  try {
    const parsed = await exifr.parse(buffer, {
      tiff: true,
      xmp: true,
      icc: true,
      iptc: true,
      jfif: true,
      pick: [
        'Make',
        'Model',
        'LensModel',
        'FocalLength',
        'FNumber',
        'ExposureTime',
        'ISO',
        'Software',
        'ColorSpace',
        'Orientation',
        'DateTimeOriginal',
        'CreateDate',
        'ModifyDate',
        'latitude',
        'longitude',
      ],
    });

    if (!parsed || Object.keys(parsed).length === 0) {
      notes.push('No EXIF metadata found. Notice: Photos saved via WhatsApp, Instagram, or compression tools typically have metadata stripped.');
      return {
        hasExif: false,
        rawExif: {},
        forensicNotes: notes,
      };
    }

    const cameraMake = parsed.Make ? String(parsed.Make).trim() : null;
    const cameraModel = parsed.Model ? String(parsed.Model).trim() : null;
    const lensModel = parsed.LensModel ? String(parsed.LensModel).trim() : null;
    const focalLength = parsed.FocalLength ? `${parsed.FocalLength} mm` : null;
    const aperture = parsed.FNumber ? `f/${parsed.FNumber}` : null;
    const shutterSpeed = parsed.ExposureTime
      ? parsed.ExposureTime < 1
        ? `1/${Math.round(1 / parsed.ExposureTime)}s`
        : `${parsed.ExposureTime}s`
      : null;
    const iso = parsed.ISO ? Number(parsed.ISO) : null;
    const softwareTags = parsed.Software ? String(parsed.Software).trim() : null;
    const colorSpace = parsed.ColorSpace === 1 ? 'sRGB' : parsed.ColorSpace === 2 ? 'Adobe RGB' : parsed.ColorSpace ? String(parsed.ColorSpace) : null;
    const orientation = parsed.Orientation ? Number(parsed.Orientation) : 1;
    const dateTimeOriginal = parsed.DateTimeOriginal ? new Date(parsed.DateTimeOriginal).toISOString() : null;
    const hasGps = Boolean(parsed.latitude && parsed.longitude);

    if (cameraMake || cameraModel) {
      notes.push(`Captured on ${cameraMake || ''} ${cameraModel || ''}`.trim());
    }

    if (softwareTags) {
      notes.push(`Edited/Exported with software: ${softwareTags} (Note: Standard editing in Lightroom/Photoshop is permitted).`);
    }

    return {
      hasExif: true,
      cameraMake,
      cameraModel,
      lensModel,
      focalLength,
      aperture,
      shutterSpeed,
      iso,
      softwareTags,
      colorSpace,
      orientation,
      dateTimeOriginal,
      hasGps,
      rawExif: parsed,
      forensicNotes: notes,
    };
  } catch (error) {
    console.error('Error parsing EXIF metadata:', error);
    notes.push('Failed to parse metadata block.');
    return {
      hasExif: false,
      rawExif: {},
      forensicNotes: notes,
    };
  }
}
