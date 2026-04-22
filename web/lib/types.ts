export interface ReleaseSummary {
  headline: string;
  newFeatures: string[];
  changes: string[];
  fixes: string[];
  devImpact: string;
}

export interface Release {
  version: string;
  tagName: string;
  publishedAt: string;
  url: string;
  originalBody: string;
  summary: ReleaseSummary;
  summarizedAt: string;
  summaryModel: string;
}
