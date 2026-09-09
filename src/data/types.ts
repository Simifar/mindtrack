export type ReviewStatus = "assessed" | "pending" | "unassessed";

export type Topic = {
  id: string;
  slug: string;
  title: string;
  description: string;
  status: ReviewStatus;
};

export type Scale = {
  id: string;
  slug: string;
  title: string;
  shortTitle: string;
  summary: string;
  description: string;
  topicIds: string[];
  audience: string;
  durationMinutes: number;
  sourceUrl: string | null;
  reviewStatus: ReviewStatus;
  tags: string[];
};

export type TestResult = {
  id: string;
  scaleId: string;
  date: string;
  score: number;
  note: string;
  importedAt: string;
};

export type Emotion = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  signs: string[];
  bodySignals: string[];
  commonThoughts: string[];
  possibleNeeds: string[];
  similarStates: string[];
  tryNow: string[];
  reviewStatus: ReviewStatus;
};

export type Tool = {
  id: string;
  slug: string;
  title: string;
  purpose: string;
  durationMinutes: number;
  steps: string[];
  suitableFor: string[];
  cautions: string[];
  reviewStatus: ReviewStatus;
};

export type Situation = {
  id: string;
  slug: string;
  title: string;
  description: string;
  emotionIds: string[];
  toolIds: string[];
  nextSteps: string[];
  helpLevel: "self-help" | "consider-help" | "urgent-help";
  reviewStatus: ReviewStatus;
};
