import sitesData from "../data/sites.json";
import summaryData from "../data/mission_summary_matrix.json";
import seasonalData from "../data/seasonal_benchmark_analysis.json";
import isruData from "../data/sites_isru_analysis.json";
import timelineEpochsData from "../data/timeline_epochs.json";
import telemetryBySiteData from "../data/telemetry_by_site.json";

import {
  CandidateSite,
  SiteSummary,
  SeasonalBenchmark,
  SiteIsruAnalysis,
  TimelineEpoch,
  TelemetryPoint,
} from "./types";

export const CANDIDATE_SITES: CandidateSite[] = sitesData as CandidateSite[];
export const MISSION_SUMMARIES: SiteSummary[] = summaryData as SiteSummary[];
export const SEASONAL_BENCHMARKS: SeasonalBenchmark[] = seasonalData as SeasonalBenchmark[];
export const SITES_ISRU_ANALYSIS: SiteIsruAnalysis[] = isruData as SiteIsruAnalysis[];
export const TIMELINE_EPOCHS: TimelineEpoch[] = timelineEpochsData as TimelineEpoch[];
export const TELEMETRY_BY_SITE: Record<string, TelemetryPoint[]> = telemetryBySiteData as unknown as Record<string, TelemetryPoint[]>;

export function getSiteById(siteId: string): CandidateSite | undefined {
  return CANDIDATE_SITES.find((s) => s.id === siteId);
}

export function getSummaryById(siteId: string): SiteSummary | undefined {
  return MISSION_SUMMARIES.find((s) => s.site_id === siteId);
}

export function getTelemetryForSite(siteId: string): TelemetryPoint[] {
  return TELEMETRY_BY_SITE[siteId] || [];
}

export function getIsruForSite(siteId: string): SiteIsruAnalysis | undefined {
  return SITES_ISRU_ANALYSIS.find((s) => s.site_id === siteId);
}
