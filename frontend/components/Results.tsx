import { useEffect, useState } from "react";
import { ChevronLeft, Link as LinkIcon, ChevronRight, X } from "lucide-react";
import { Form, Submission } from "../types";
import { Brand, Pill } from "./Shared";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

function ResponseDetail({ form, response, close }: { form: Form; response: Submission; close: () => void }) { return <div className="modal-backdrop" onMouseDown={close}><article className="response-detail" onMouseDown={event => event.stopPropagation()}><button className="close-modal" onClick={close}><X size={19} /></button><p className="eyebrow">INDIVIDUAL RESPONSE</p><h2>{response.respondent}</h2><p className="detail-time">Submitted {response.submittedAt}</p><div className="answer-list">{form.questions.map((question, index) => <div key={question.id}><span>{index + 1}. {question.title}</span><b>{response.answers[question.id] || "No answer"}</b></div>)}</div></article></div>; }

export function Results({ form, close }: { form: Form; close: () => void }) {
  const [selected, setSelected] = useState<Submission | null>(null);
  const [responses, setResponses] = useState<Submission[]>([]);
  const [counts, setCounts] = useState<{option: string, count: number}[]>([]);
  
  useEffect(() => {
    fetch(`${API}/forms/${form.id}/responses`).then(r => r.json()).then(data => {
      const mapped = data.map((r: any) => {
        const ansMap: Record<string, string> = {};
        let respondent = "Anonymous respondent";
        r.answers.forEach((a: any) => { ansMap[String(a.question_id)] = a.value; });
        if (form.questions[0] && ansMap[form.questions[0].id]) respondent = ansMap[form.questions[0].id];
        return { id: String(r.id), respondent, submittedAt: new Date(r.submitted_at + "Z").toLocaleString(), answers: ansMap };
      });
      setResponses(mapped);
    });
    fetch(`${API}/forms/${form.id}/analytics`).then(r => r.json()).then(data => {
      const firstChoice = form.questions.find(q => q.type === "multiple_choice" || q.type === "dropdown" || q.type === "yes_no");
      if (firstChoice && data.questions) {
        const summary = data.questions.find((q: any) => String(q.question_id) === String(firstChoice.id));
        if (summary) setCounts(Object.entries(summary.selection_counts).map(([option, count]) => ({ option, count: Number(count) })));
      }
    });
  }, [form.id]);

  const firstChoice = form.questions.find(question => question.type === "multiple_choice" || question.type === "dropdown" || question.type === "yes_no");
  return <div className="results"><header className="results-bar"><button className="back-button" onClick={close}><ChevronLeft size={20} /> Editor</button><Brand /><button className="button secondary"><LinkIcon size={16} /> Share form</button></header><section className="results-main"><p className="eyebrow">RESULTS</p><h1>{form.title}</h1><div className="metrics"><div><b>{responses.length}</b><span>Responses</span></div><div><b>84%</b><span>Completion rate</span></div><div><b>1m 24s</b><span>Average time</span></div></div><div className="response-table"><div className="section-heading"><div><h2>Responses</h2><p>Click a response to see every answer.</p></div></div>{responses.length === 0 ? <div className="empty">No responses yet. Publish your form to start collecting answers.</div> : <><div className="table-head"><span>RESPONDENT</span><span>STATUS</span><span>SUBMITTED</span><span /></div>{responses.map(response => <button className="table-row response-button" key={response.id} onClick={() => setSelected(response)}><span><i className="response-avatar">{response.respondent.slice(0, 1).toUpperCase()}</i>{response.respondent}</span><span><Pill tone="green">Completed</Pill></span><span>{response.submittedAt}</span><ChevronRight size={18} /></button>)}</>}</div>{firstChoice && <div className="chart-card"><h2>{firstChoice.title}</h2><p>Summary of selected answers</p>{counts.map(item => <div className="bar-row" key={item.option}><span>{item.option}</span><div><i style={{ width: `${responses.length ? (item.count / responses.length) * 100 : 0}%` }} /></div><b>{item.count}</b></div>)}</div>}</section>{selected && <ResponseDetail form={form} response={selected} close={() => setSelected(null)} />}</div>;
}
