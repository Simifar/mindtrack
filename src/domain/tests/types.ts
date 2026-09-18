export type Severity =
  | "none"
  | "mild"
  | "moderate"
  | "moderately_severe"
  | "severe"
  | "positive"
  | "negative"
  | "context";

export interface TestOption {
  value: number;
  label: string;
}

export interface TestBand {
  max: number;
  severity: Severity;
  label: string;
  advice: string;
}

export interface TestSource {
  title: string;
  url: string;
  version: string;
  translation: string;
  licensing: string;
}

interface BaseTestScoring {
  crisisQuestionIndexes?: number[];
}

export interface SumScoring extends BaseTestScoring {
  mode: "sum";
  bands?: TestBand[];
  reverseQuestionIndexes?: number[];
  normalizedScore?: { multiplier: number; max: number; label: string };
}

export interface ThresholdScoring extends BaseTestScoring {
  mode: "threshold";
  minValuePerItem?: number;
  minItemsMeetingThreshold?: number;
  itemThresholds?: number[];
  displayMaxScore?: number;
  positiveSeverity?: Severity;
  positiveLabel?: string;
  positiveAdvice?: string;
  negativeSeverity?: Severity;
  negativeLabel?: string;
  negativeAdvice?: string;
}

export interface MdqScoring extends BaseTestScoring {
  mode: "mdq";
  displayMaxScore?: number;
  minItemsMeetingThreshold?: number;
  positiveSeverity?: Severity;
  positiveLabel?: string;
  positiveAdvice?: string;
  negativeSeverity?: Severity;
  negativeLabel?: string;
  negativeAdvice?: string;
}

export type TestScoring = SumScoring | ThresholdScoring | MdqScoring;

export interface TestDefinition {
  code: string;
  name: string;
  short: string;
  description: string;
  timeframe: string;
  periodicity: string;
  estimatedMinutes?: number;
  ageGroup?: string;
  questions: string[];
  questionOptions?: TestOption[][];
  options: TestOption[];
  scoreUnit?: string;
  scoring: TestScoring;
  source: string;
  sourceInfo: TestSource;
}

export interface ScoreResult {
  totalScore: number;
  severity: Severity;
  label: string;
  advice: string;
  crisisDetected: boolean;
  normalizedScore?: number;
  details?: { symptomCount: number; coOccurred: boolean; impact: number };
}
