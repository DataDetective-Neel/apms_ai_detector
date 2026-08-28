import { DetectorResult, NormalizedClassification } from './detector-interface';

// Simple concurrency semaphore
class Semaphore {
  private current = 0;
  private queue: (() => void)[] = [];

  constructor(private max: number) {}

  async acquire(): Promise<void> {
    if (this.current < this.max) {
      this.current++;
      return;
    }
    return new Promise<void>((resolve) => {
      this.queue.push(resolve);
    });
  }

  release(): void {
    this.current--;
    if (this.queue.length > 0) {
      this.current++;
      const next = this.queue.shift();
      if (next) next();
    }
  }
}

const concurrencyLimit = parseInt(process.env.INFERENCE_CONCURRENCY || '2', 10);
const globalSemaphore = new Semaphore(concurrencyLimit);

export interface QueryHuggingFaceOptions {
  detectorId: string;
  modelId: string;
  modelVersion?: string;
  labelMap: Record<string, 'AI' | 'REAL'>;
  aiThreshold?: number;
  realThreshold?: number;
  retries?: number;
}

/**
 * Queries Hugging Face Inference Router with concurrency limiter, exponential backoff,
 * deadband gating, and raw response preservation.
 */
export async function queryHuggingFaceModel(
  imageBuffer: Buffer,
  options: QueryHuggingFaceOptions
): Promise<DetectorResult> {
  const {
    detectorId,
    modelId,
    modelVersion = 'main',
    labelMap,
    aiThreshold = parseFloat(process.env.AI_THRESHOLD || '0.70'),
    realThreshold = parseFloat(process.env.REAL_THRESHOLD || '0.30'),
    retries = 4,
  } = options;

  const token = process.env.HF_TOKEN;
  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  if (!token) {
    return {
      detectorId,
      modelId,
      modelVersion,
      provider: 'huggingface',
      classification: 'ERROR',
      aiScore: 0,
      realScore: 0,
      confidence: 0,
      explanation: 'Hugging Face API token (HF_TOKEN) is not configured.',
      processingTimeMs: 0,
      timestamp,
      error: 'Missing HF_TOKEN',
    };
  }

  await globalSemaphore.acquire();

  try {
    const url = `https://router.huggingface.co/hf-inference/models/${modelId}`;

    let rawResponse: any = null;
    let lastError: string | null = null;

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'image/jpeg',
          },
          body: new Uint8Array(imageBuffer),
        });

        if (response.status === 429 || response.status === 503) {
          const retryAfter = response.headers.get('Retry-After');
          const delaySec = retryAfter ? parseInt(retryAfter, 10) : Math.pow(2, attempt) + 1;
          console.warn(`[HF ${modelId}] Rate limited or loading (HTTP ${response.status}). Backing off for ${delaySec}s...`);
          await new Promise((r) => setTimeout(r, delaySec * 1000));
          continue;
        }

        if (!response.ok) {
          const errText = await response.text().catch(() => '');
          lastError = `HTTP ${response.status}: ${errText.substring(0, 150)}`;
          if (response.status >= 500 && attempt < retries - 1) {
            await new Promise((r) => setTimeout(r, 1500));
            continue;
          }
          break;
        }

        rawResponse = await response.json();
        break;
      } catch (err: any) {
        lastError = err?.message || 'Network error';
        if (attempt < retries - 1) {
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        }
      }
    }

    const processingTimeMs = Date.now() - startTime;

    if (!rawResponse || !Array.isArray(rawResponse) || rawResponse.length === 0) {
      return {
        detectorId,
        modelId,
        modelVersion,
        provider: 'huggingface',
        classification: 'ERROR',
        aiScore: 0,
        realScore: 0,
        confidence: 0,
        explanation: `Inference failed: ${lastError || 'Empty response received from provider'}`,
        processingTimeMs,
        timestamp,
        error: lastError || 'Empty response',
      };
    }

    // Extract normalized scores
    let aiScore = 0;
    let realScore = 0;

    for (const entry of rawResponse) {
      const lbl = String(entry.label || '');
      const scr = Number(entry.score || 0);
      const mapped = labelMap[lbl];

      if (mapped === 'AI') {
        aiScore = scr;
      } else if (mapped === 'REAL') {
        realScore = scr;
      }
    }

    // If only one score was populated
    if (realScore === 0 && aiScore > 0) {
      realScore = Math.max(0, 1.0 - aiScore);
    } else if (aiScore === 0 && realScore > 0) {
      aiScore = Math.max(0, 1.0 - realScore);
    }

    // Deadband Gating:
    // score >= aiThreshold (e.g. 0.70) => AI
    // score <= realThreshold (e.g. 0.30) => REAL
    // between => INCONCLUSIVE
    let classification: NormalizedClassification = 'INCONCLUSIVE';
    let explanation = '';

    if (aiScore >= aiThreshold) {
      classification = 'AI';
      explanation = `Model assigned a ${(aiScore * 100).toFixed(1)}% probability of synthetic / AI characteristics (exceeding confidence threshold of ${(aiThreshold * 100).toFixed(0)}%).`;
    } else if (aiScore <= realThreshold) {
      classification = 'REAL';
      explanation = `Model assigned a ${(realScore * 100).toFixed(1)}% probability of natural photographic characteristics (below threshold of ${(realThreshold * 100).toFixed(0)}%).`;
    } else {
      classification = 'INCONCLUSIVE';
      explanation = `Model score of ${(aiScore * 100).toFixed(1)}% fell into the ambiguous deadband (${(realThreshold * 100).toFixed(0)}%–${(aiThreshold * 100).toFixed(0)}%). Standardized as Inconclusive to minimize false accusations.`;
    }

    const confidence = Number(Math.max(aiScore, realScore).toFixed(4));

    return {
      detectorId,
      modelId,
      modelVersion,
      provider: 'huggingface',
      classification,
      aiScore: Number(aiScore.toFixed(4)),
      realScore: Number(realScore.toFixed(4)),
      confidence,
      explanation,
      processingTimeMs,
      timestamp,
      rawResponse,
      deadbandGated: true,
      error: null,
    };
  } finally {
    globalSemaphore.release();
  }
}
