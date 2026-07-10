export type Kind = "short_text" | "long_text" | "multiple_choice" | "dropdown" | "email" | "number" | "yes_no" | "rating";
export type Question = { id: string; type: Kind; title: string; description?: string; required: boolean; options?: string[] };
export type Submission = { id: string; respondent: string; submittedAt: string; answers: Record<string, string> };
export type Form = { id: string; title: string; status: "draft" | "published"; updatedAt: string; questions: Question[]; submissions: Submission[]; thank_you_message?: string };
