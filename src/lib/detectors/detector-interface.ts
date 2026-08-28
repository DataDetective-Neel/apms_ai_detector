export type NormalizedClassification = 'AI' | 'REAL' | 'INCONCLUSIVE' | 'ERROR';

export interface DetectorResult {
  detectorId: string;
  modelId: string;
  modelVersion?: string;
  provider: 'huggingface' | 'local-worker' | 'custom';
  classification: NormalizedClassification;
  aiScore: number;
  realScore: number;
  confidence: number;
  explanation: string;
  processingTimeMs: number;
  timestamp: string;
  rawResponse?: any;
  deadbandGated?: boolean;
  error?: string | null;
}

export interface AIImageDetector {
  id: string;
  modelId: string;
  providerName: string;
  analyze(imageBuffer: Buffer): Promise<DetectorResult>;
}

export type OverallResult = 
  | 'AI_SUSPECTED' 
  | 'LIKELY_AUTHENTIC' 
  | 'MANUAL_REVIEW' 
  | 'PARTIAL_ANALYSIS' 
  | 'ANALYSIS_UNAVAILABLE' 
  | 'PENDING';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'UNKNOWN';

export interface MajorityVoteDecision {
  overallResult: OverallResult;
  riskLevel: RiskLevel;
  aiVotes: number;
  realVotes: number;
  inconclusiveVotes: number;
  errorVotes: number;
  totalDetectors: number;
  recommendation: string;
  summaryExplanation: string;
  aiGenerationVerdict: string;
  aiEditDetectionStatus: string;
  detectorResults: DetectorResult[];
  disclaimer: string;
}
