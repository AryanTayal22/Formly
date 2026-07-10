"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { Form } from "../types";
import { Dashboard } from "../components/Dashboard";
import { Builder } from "../components/Builder";
import { PublicForm } from "../components/PublicForm";
import { Results } from "../components/Results";
import { Styles } from "../components/Shared";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export default function Home() {
  const [forms, setForms] = useState<Form[]>([]);
  const [view, setView] = useState<"dashboard" | "builder" | "public" | "results">("dashboard");
  const [activeId, setActiveId] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [toast, setToast] = useState("");
  const [isPreview, setIsPreview] = useState(false);
  const active = forms.find(form => form.id === activeId) ?? forms[0];

  useEffect(() => {
    fetch(`${API}/forms`).then(res => res.json()).then(data => {
      setForms(data.map((f: any) => ({ ...f, id: String(f.id), updatedAt: new Date(f.updated_at + "Z").toLocaleString(), questions: f.questions || [], submissions: new Array(f.response_count || 0).fill({}) })));
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    const shared = new URLSearchParams(window.location.search).get("form");
    if (loaded && shared) { 
      fetch(`${API}/public/forms/${shared}`).then(async res => {
        if (res.ok) {
          const data = await res.json();
          const form = { ...data, id: String(data.id), updatedAt: new Date(data.updated_at + "Z").toLocaleString(), submissions: new Array(data.response_count || 0).fill({}) };
          setForms(current => {
            if (current.some(f => f.id === shared)) return current.map(f => f.id === shared ? form : f);
            return [...current, form];
          });
          setActiveId(shared); 
          setIsPreview(false);
          setView("public"); 
          window.history.replaceState(null, "", "/");
        }
      });
    }
  }, [loaded]);

  useEffect(() => { if (!toast) return; const timeout = window.setTimeout(() => setToast(""), 2200); return () => window.clearTimeout(timeout); }, [toast]);

  const save = async (next: Form) => {
    setForms(current => current.map(form => form.id === next.id ? next : form));
    await fetch(`${API}/forms/${next.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: next.title, status: next.status, thank_you_message: next.thank_you_message ?? "Thank you for sharing.", questions: next.questions })
    });
  };

  const open = async (id: string) => { 
    const res = await fetch(`${API}/forms/${id}`);
    const data = await res.json();
    const form = { ...data, id: String(data.id), updatedAt: new Date(data.updated_at + "Z").toLocaleString(), submissions: new Array(data.response_count || 0).fill({}) };
    setForms(current => current.map(f => f.id === id ? form : f));
    setActiveId(id); 
    setSelectedId(form.questions[0]?.id || ""); 
    setView("builder"); 
  };

  const create = async () => { 
    const res = await fetch(`${API}/forms`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Untitled form", status: "draft", questions: [{ type: "short_text", title: "Your first question", required: true }] })
    });
    const data = await res.json();
    const form = { ...data, id: String(data.id), updatedAt: new Date(data.updated_at + "Z").toLocaleString(), submissions: [] };
    setForms(current => [form, ...current]); 
    setActiveId(form.id); 
    setSelectedId(form.questions[0].id); 
    setView("builder"); 
  };

  const submit = async (answers: Record<string, string>) => { 
    if (isPreview) return;
    const payload = { answers: Object.entries(answers).map(([question_id, value]) => ({ question_id: Number(question_id), value })) };
    const res = await fetch(`${API}/public/forms/${active.id}/responses`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
    });
    if (res.ok) setToast("Response received");
  };
  
  const removeForm = async (id: string) => {
    await fetch(`${API}/forms/${id}`, { method: "DELETE" });
    setForms(current => current.filter(form => form.id !== id));
    if (activeId === id) setActiveId(forms[0]?.id || "");
  };
  
  const duplicateForm = async (id: string) => {
    const res = await fetch(`${API}/forms/${id}`);
    const form = await res.json();
    if (!form) return;
    const res2 = await fetch(`${API}/forms`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: `${form.title} (Copy)`, status: "draft", questions: form.questions.map((q: any) => ({ type: q.type, title: q.title, description: q.description, required: q.required, options: q.options })) })
    });
    const duplicated = await res2.json();
    setForms(current => [{ ...duplicated, id: String(duplicated.id), submissions: [] }, ...current]);
  };

  return <main><Styles />
    {view === "dashboard" && <Dashboard forms={forms} create={create} open={open} remove={removeForm} duplicate={duplicateForm} />}
    {view === "builder" && <Builder form={active} selectedId={selectedId} setSelectedId={setSelectedId} save={save} back={() => setView("dashboard")} openPublic={() => { setIsPreview(true); setView("public"); }} openResults={() => setView("results")} notify={setToast} />}
    {view === "public" && <PublicForm form={active} isPreview={isPreview} close={() => { setView(isPreview ? "builder" : "dashboard"); setIsPreview(false); }} submit={submit} />}
    {view === "results" && <Results form={active} close={() => setView("builder")} />}
    {toast && <div className="notice"><Check size={16} />{toast}</div>}
  </main>;
}
