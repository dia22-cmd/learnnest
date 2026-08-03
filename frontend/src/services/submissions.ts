import api from "./api";
import type { Submission, SubmissionDetail } from "../types/submission";

const BASE = "/api/v1/submissions";

export async function submitAnswer(
  questionId: string,
  childName: string,
  answerGiven: string,
  childId?: string | null
): Promise<Submission> {
  const res = await api.post(`${BASE}/`, {
    question_id: questionId,
    child_name: childName,
    answer_given: answerGiven,
    child_id: childId,
  });
  return res.data.data as Submission;
}

export async function getSubmissions(materialId: string): Promise<SubmissionDetail[]> {
  const res = await api.get(`${BASE}/${materialId}`);
  return res.data.data as SubmissionDetail[];
}
