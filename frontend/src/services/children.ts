import api from "./api";
import type { Material } from "../types/material";

export interface Child {
  id: string;
  parent_id: string;
  name: string;
  difficulty_level: string;
  created_at: string;
}

export interface SolverData {
  child_name: string;
  difficulty_level: string;
  materials: Material[];
}

const BASE = "/api/v1/children";

export async function getChildren(): Promise<Child[]> {
  const res = await api.get(BASE);
  return res.data.data as Child[];
}

export async function createChild(name: string, difficulty_level: string): Promise<Child> {
  const res = await api.post(BASE, { name, difficulty_level });
  return res.data.data as Child;
}

export async function updateChild(
  childId: string,
  data: { name?: string; difficulty_level?: string }
): Promise<Child> {
  const res = await api.put(`${BASE}/${childId}`, data);
  return res.data.data as Child;
}

export async function deleteChild(childId: string): Promise<void> {
  await api.delete(`${BASE}/${childId}`);
}

export async function assignMaterialToChild(childId: string, materialId: string): Promise<void> {
  await api.post(`${BASE}/${childId}/assign`, { material_id: materialId });
}

export async function unassignMaterialFromChild(childId: string, materialId: string): Promise<void> {
  await api.delete(`${BASE}/${childId}/assign/${materialId}`);
}

export async function getChildAssignments(childId: string): Promise<Material[]> {
  const res = await api.get(`${BASE}/${childId}/assignments`);
  return res.data.data as Material[];
}

export async function getSolverAssignments(childId: string): Promise<SolverData> {
  const res = await api.get(`${BASE}/solve/${childId}`);
  return res.data.data as SolverData;
}
