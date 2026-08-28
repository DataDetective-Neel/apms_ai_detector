import { SwinV2Detector } from './detector-1';
import { SigLipDetector } from './detector-2';
import { ViTDeepfakeDetector } from './detector-3';
import { calculateMajorityVote } from './majority-vote';
import { AIImageDetector, DetectorResult, MajorityVoteDecision } from './detector-interface';

export * from './detector-interface';
export * from './huggingface-client';
export * from './detector-1';
export * from './detector-2';
export * from './detector-3';
export * from './majority-vote';

/**
 * Runs the complete 3-detector ensemble against an analysis image buffer.
 */
export async function runEnsembleAnalysis(imageBuffer: Buffer): Promise<MajorityVoteDecision> {
  const detectors: AIImageDetector[] = [
    new SwinV2Detector(),
    new SigLipDetector(),
    new ViTDeepfakeDetector(),
  ];

  // Execute in parallel (throttled by the global concurrency semaphore)
  const results: DetectorResult[] = await Promise.all(
    detectors.map((d) => d.analyze(imageBuffer))
  );

  return calculateMajorityVote(results);
}
