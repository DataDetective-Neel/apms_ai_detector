import { AIImageDetector, DetectorResult } from './detector-interface';
import { queryHuggingFaceModel } from './huggingface-client';

/**
 * Detector 3: ViT-Base Deepfake / Photographic Artifact Classifier
 * Conservative sentry with very low false positive rate on complex scenes.
 */
export class ViTDeepfakeDetector implements AIImageDetector {
  public id = 'detector-3';
  public modelId = process.env.AI_DETECTOR_MODEL_3 || 'dima806/deepfake_vs_real_image_detection';
  public providerName = 'huggingface';

  async analyze(imageBuffer: Buffer): Promise<DetectorResult> {
    return queryHuggingFaceModel(imageBuffer, {
      detectorId: this.id,
      modelId: this.modelId,
      modelVersion: 'main',
      labelMap: {
        Fake: 'AI',
        Real: 'REAL',
        fake: 'AI',
        real: 'REAL',
      },
    });
  }
}
