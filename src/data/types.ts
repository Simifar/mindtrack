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
