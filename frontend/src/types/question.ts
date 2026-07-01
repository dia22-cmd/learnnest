export interface Question {
  id: string;
  material_id: string;
  type: 'mcq' | 'short_answer';
  question: string;
  options: string[] | null;
  answer: string;
  is_selected: boolean;
  created_at: string;
}
