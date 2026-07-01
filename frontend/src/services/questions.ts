import api from "./api";
import type { Question } from "../types/question";

const BASE = "/api/v1/questions";

export async function generateQuestions(materialId: string, count: number): Promise<Question[]> {
  const res = await api.post(`${BASE}/generate/${materialId}`, { count });
  return res.data.data as Question[];
}

export async function getQuestions(materialId: string): Promise<Question[]> {
  const res = await api.get(`${BASE}/${materialId}`);
  return res.data.data as Question[];
}

export async function selectQuestion(questionId: string, isSelected: boolean): Promise<{ id: string; is_selected: boolean }> {
  const res = await api.patch(`${BASE}/${questionId}/select`, { is_selected: isSelected });
  return res.data.data as { id: string; is_selected: boolean };
}
