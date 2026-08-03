export interface MatchItem {
  id: string;
  text: string;
}

export interface MatchFollowingOptions {
  left: MatchItem[];
  right: MatchItem[];
}

export type QuestionOptions = string[] | MatchFollowingOptions;

export interface Question {
  id: string;
  material_id: string;
  type: 'mcq' | 'short_answer' | 'true_false' | 'fill_blank' | 'match_following';
  question: string;
  options: QuestionOptions | null;
  answer: string;
  is_selected: boolean;
  created_at: string;
}
