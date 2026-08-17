import api from "./api";
import type { Material, MaterialDetail } from "../types/material";

const BASE = "/api/v1/materials/";

export async function uploadMaterial(title: string, file: File, subject: string = "General"): Promise<Material> {
  const formData = new FormData();
  formData.append("title", title);
  formData.append("file", file);
  formData.append("subject", subject);

  const res = await api.post(`${BASE}upload`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data.data as Material;
}

export async function getMaterials(): Promise<Material[]> {
  const res = await api.get(BASE);
  return res.data.data as Material[];
}

export async function getMaterialDetail(id: string): Promise<MaterialDetail> {
  const res = await api.get(`${BASE}${id}`);
  return res.data.data as MaterialDetail;
}
