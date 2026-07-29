import api from "./api";

export interface WorksheetAttempt {
  material_id: string;
  title: string;
  average_score: number;
  submitted_at: string;
}

export interface ChildStats {
  child_name: string;
  average_score: number;
  total_worksheets: number;
  total_questions: number;
  history: WorksheetAttempt[];
}

export async function getAnalyticsOverview(): Promise<Record<string, ChildStats>> {
  const res = await api.get("/api/v1/analytics/overview");
  return res.data.data;
}
