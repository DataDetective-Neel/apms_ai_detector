import { DetectorResult, MajorityVoteDecision, OverallResult, RiskLevel } from './detector-interface';

const DISCLAIMER_TEXT =
  'Automated analysis is probabilistic and may produce false positives and false negatives. This result is intended to assist competition organizers and does not constitute definitive proof of AI generation or authenticity. Final competition decisions must be made by human organizers.';

/**
 * Evaluates results from 3 independent AI detectors using majority voting,
 * partial failure handling, deadband suppression, and separated AI-edit task reporting.
 */
export function calculateMajorityVote(results: DetectorResult[]): MajorityVoteDecision {
  const totalDetectors = results.length;
  let aiVotes = 0;
  let realVotes = 0;
  let inconclusiveVotes = 0;
  let errorVotes = 0;

  for (const res of results) {
    if (res.classification === 'AI') {
      aiVotes++;
    } else if (res.classification === 'REAL') {
      realVotes++;
    } else if (res.classification === 'INCONCLUSIVE') {
      inconclusiveVotes++;
    } else {
      errorVotes++;
    }
  }

  // 1. If all 3 failed:
  if (errorVotes === totalDetectors) {
    return {
      overallResult: 'ANALYSIS_UNAVAILABLE',
      riskLevel: 'UNKNOWN',
      aiVotes,
      realVotes,
      inconclusiveVotes,
      errorVotes,
      totalDetectors,
      recommendation: 'Analysis unavailable. All automated detectors failed to return valid outputs. Organizers must review this entry manually or re-run analysis.',
      summaryExplanation: 'None of the automated detectors were reachable. The image cannot be triaged automatically.',
      aiGenerationVerdict: 'ANALYSIS_UNAVAILABLE',
      aiEditDetectionStatus: 'NOT AVAILABLE (Requires manual forensic examination)',
      detectorResults: results,
      disclaimer: DISCLAIMER_TEXT,
    };
  }

  // 2. If at least 1 detector errored (PARTIAL ANALYSIS):
  if (errorVotes > 0) {
    return {
      overallResult: 'PARTIAL_ANALYSIS',
      riskLevel: 'UNKNOWN',
      aiVotes,
      realVotes,
      inconclusiveVotes,
      errorVotes,
      totalDetectors,
      recommendation: 'Partial analysis. At least one automated detector failed. A reliable 2-of-3 majority cannot be established. Flagged for Manual Review.',
      summaryExplanation: `${errorVotes} of ${totalDetectors} detectors encountered an error during inference. To prevent erroneous decisions, this photograph is marked for organizer review.`,
      aiGenerationVerdict: 'PARTIAL_ANALYSIS',
      aiEditDetectionStatus: 'NOT AVAILABLE',
      detectorResults: results,
      disclaimer: DISCLAIMER_TEXT,
    };
  }

  // 3. All 3 detectors succeeded with valid responses (AI, REAL, or INCONCLUSIVE)
  let overallResult: OverallResult = 'MANUAL_REVIEW';
  let riskLevel: RiskLevel = 'MEDIUM';
  let recommendation = '';
  let summaryExplanation = '';
  let aiGenerationVerdict = '';

  if (aiVotes >= 2) {
    overallResult = 'AI_SUSPECTED';
    riskLevel = aiVotes === 3 ? 'HIGH' : 'HIGH';
    aiGenerationVerdict = 'AI_SUSPECTED';
    recommendation = 'Flagged for Human Committee Review. Two or more independent automated detectors classified this photograph as potentially AI-generated.';
    summaryExplanation = `${aiVotes} of ${totalDetectors} automated detectors classified this photograph as exhibiting synthetic AI characteristics.`;
  } else if (realVotes >= 2) {
    overallResult = 'LIKELY_AUTHENTIC';
    riskLevel = realVotes === 3 ? 'LOW' : 'LOW';
    aiGenerationVerdict = 'LIKELY_AUTHENTIC';
    recommendation = 'Automated screening indicates natural photographic characteristics. Organizers may proceed with standard judging while verifying EXIF metadata.';
    summaryExplanation = `${realVotes} of ${totalDetectors} automated detectors classified this photograph as consistent with natural camera captures.`;
  } else {
    // Inconclusive or 1-1-1 split
    overallResult = 'MANUAL_REVIEW';
    riskLevel = 'MEDIUM';
    aiGenerationVerdict = 'MANUAL_REVIEW';
    recommendation = 'Inconclusive ensemble vote. Scores fell into the ambiguous deadband or detectors returned conflicting signals. Organizer manual inspection required.';
    summaryExplanation = `Detector vote split (${aiVotes} AI, ${realVotes} Real, ${inconclusiveVotes} Inconclusive). Automated consensus could not be established.`;
  }

  return {
    overallResult,
    riskLevel,
    aiVotes,
    realVotes,
    inconclusiveVotes,
    errorVotes,
    totalDetectors,
    recommendation,
    summaryExplanation,
    aiGenerationVerdict,
    aiEditDetectionStatus: 'NOT AVAILABLE (Full-image screening active; localized Generative Fill / Inpainting detection requires visual examination)',
    detectorResults: results,
    disclaimer: DISCLAIMER_TEXT,
  };
}
