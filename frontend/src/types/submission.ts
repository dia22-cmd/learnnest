export interface Submission {
  id: string;
  question_id: string;
  child_name: string;
  answer_given: string;
  score: number | null;
  feedback: string | null;
  suggestions: string | null;
  submitted_at: string;
}

export interface SubmissionDetail extends Submission {
  question: string;
}
