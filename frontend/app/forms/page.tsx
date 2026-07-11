"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Form } from "../../types";
import { Dashboard } from "../../components/Dashboard";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export default function FormsPage() {
  const router = useRouter();
  const [forms, setForms] = useState<Form[]>([]);
  const [loaded, setLoaded] = useState(false);

  const fetchForms = () => {
    fetch(`${API}/forms`).then(res => res.json()).then(data => {
      setForms(data.map((f: any) => ({
        ...f,
        id: String(f.id),
        updatedAt: new Date(f.updated_at + "Z").toLocaleString(),
        questions: f.questions || [],
        submissions: new Array(f.response_count || 0).fill({})
      })));
      setLoaded(true);
    });
  };

  useEffect(() => {
    fetchForms();
  }, []);

  const create = async () => {
    const res = await fetch(`${API}/forms`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Untitled form",
        status: "draft",
        questions: [{ type: "short_text", title: "Your first question", required: true }]
      })
    });
    const data = await res.json();
    router.push(`/forms/${data.id}/edit`);
  };

  const open = (id: string) => {
    router.push(`/forms/${id}/edit`);
  };

  const removeForm = async (id: string) => {
    await fetch(`${API}/forms/${id}`, { method: "DELETE" });
    setForms(current => current.filter(form => form.id !== id));
  };

  const duplicateForm = async (id: string) => {
    const source = forms.find(f => f.id === id);
    if (!source) return;
    const res = await fetch(`${API}/forms`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: `${source.title} (Copy)`,
        status: "draft",
        questions: source.questions.map(q => ({ ...q, id: undefined }))
      })
    });
    if (res.ok) fetchForms();
  };

  if (!loaded) return <div style={{ padding: 40 }}>Loading workspace...</div>;

  return (
    <Dashboard
      forms={forms}
      create={create}
      open={open}
      remove={removeForm}
      duplicate={duplicateForm}
    />
  );
}
