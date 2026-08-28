import crypto from 'crypto';
import sharp from 'sharp';

/**
 * Calculates SHA-256 cryptographic hash of image buffer for exact deduplication.
 */
export function calculateSha256(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Calculates Difference Hash (dHash) 64-bit string using sharp grayscale reduction.
 * Resizes image to 9x8 grayscale, compares adjacent horizontal pixels.
 */
export async function calculateDHash(buffer: Buffer): Promise<string> {
  try {
    const raw = await sharp(buffer)
      .grayscale()
      .resize(9, 8, { fit: 'fill' })
      .raw()
      .toBuffer();

    let binaryString = '';
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const left = raw[row * 9 + col];
        const right = raw[row * 9 + col + 1];
        binaryString += left > right ? '1' : '0';
      }
    }

    // Convert 64-bit binary to 16-character hex
    let hex = '';
    for (let i = 0; i < binaryString.length; i += 4) {
      const nibble = binaryString.substring(i, i + 4);
      hex += parseInt(nibble, 2).toString(16);
    }
    return hex;
  } catch (error) {
    console.error('Error calculating dHash:', error);
    return '0000000000000000';
  }
}

/**
 * Computes Hamming distance between two hex hash strings.
 */
export function hammingDistance(hash1: string, hash2: string): number {
  if (!hash1 || !hash2 || hash1.length !== hash2.length) {
    return 64;
  }

  let distance = 0;
  for (let i = 0; i < hash1.length; i++) {
    const n1 = parseInt(hash1[i], 16);
    const n2 = parseInt(hash2[i], 16);
    let xor = n1 ^ n2;
    while (xor > 0) {
      distance += xor & 1;
      xor >>= 1;
    }
  }
  return distance;
}

/**
 * Calculates percentage similarity based on 64-bit Hamming distance.
 * 0 distance = 100% similarity
 * 10 distance = ~84.4% similarity
 */
export function calculateSimilarity(hash1: string, hash2: string): number {
  const dist = hammingDistance(hash1, hash2);
  const similarity = Math.max(0, 100 - (dist / 64) * 100);
  return Number(similarity.toFixed(2));
}
