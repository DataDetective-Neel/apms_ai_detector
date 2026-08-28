import { AIImageDetector, DetectorResult } from './detector-interface';
import { queryHuggingFaceModel } from './huggingface-client';

/**
 * Detector 2: SigLIP Vision-Language Classifier
 * Contrastive vision-language representation for semantic and visual feature evaluation.
 */
export class SigLipDetector implements AIImageDetector {
  public id = 'detector-2';
  public modelId = process.env.AI_DETECTOR_MODEL_2 || 'Ateeqq/ai-vs-human-image-detector';
  public providerName = 'huggingface';

  async analyze(imageBuffer: Buffer): Promise<DetectorResult> {
    return queryHuggingFaceModel(imageBuffer, {
      detectorId: this.id,
      modelId: this.modelId,
      modelVersion: 'main',
      labelMap: {
        ai: 'AI',
        hum: 'REAL',
        human: 'REAL',
        fake: 'AI',
        real: 'REAL',
      },
    });
  }
}
