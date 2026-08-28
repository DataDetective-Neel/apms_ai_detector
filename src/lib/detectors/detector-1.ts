import { AIImageDetector, DetectorResult } from './detector-interface';
import { queryHuggingFaceModel } from './huggingface-client';

/**
 * Detector 1: Shifted Window Transformer v2 (SwinV2)
 * High precision, robust against WhatsApp compression and Lightroom grading.
 */
export class SwinV2Detector implements AIImageDetector {
  public id = 'detector-1';
  public modelId = process.env.AI_DETECTOR_MODEL_1 || 'haywoodsloan/ai-image-detector-deploy';
  public providerName = 'huggingface';

  async analyze(imageBuffer: Buffer): Promise<DetectorResult> {
    return queryHuggingFaceModel(imageBuffer, {
      detectorId: this.id,
      modelId: this.modelId,
      modelVersion: 'main',
      labelMap: {
        artificial: 'AI',
        real: 'REAL',
        FAKE: 'AI',
        REAL: 'REAL',
      },
    });
  }
}
