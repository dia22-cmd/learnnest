export interface Material {
  id: string;
  title: string;
  subject: string;
  file_url: string | null;
  created_at: string;
}

export interface MaterialDetail extends Material {
  raw_text: string;
}
