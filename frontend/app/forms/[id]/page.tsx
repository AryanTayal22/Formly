"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Form } from "../../../types";
import { PublicForm } from "../../../components/PublicForm";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export default function PublicFormPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isPreview = searchParams.get("preview") === "true";
  
  const [form, setForm] = useState<Form | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    // If it's a preview, we can fetch from the internal /forms/{id} endpoint which ignores draft status
    // Otherwise we fetch from /public/forms/{id} which enforces 'published' status
    const endpoint = isPreview ? `/forms/${params.id}` : `/public/forms/${params.id}`;
    
    fetch(`${API}${endpoint}`)
      .then(async (res) => {
        if (!res.ok) {
          setError("Form not found or is not published yet.");
          return;
        }
        const data = await res.json();
        setForm({
          ...data,
          id: String(data.id),
          updatedAt: new Date(data.updated_at + "Z").toLocaleString(),
          submissions: new Array(data.response_count || 0).fill({})
        });
      })
      .catch(() => setError("Failed to load form"));
  }, [params.id, isPreview]);

  const submit = async (answers: Record<string, string>) => {
    if (isPreview || !form) return;
    const payload = {
      answers: Object.entries(answers).map(([question_id, value]) => ({
        question_id: Number(question_id),
        value
      }))
    };
    await fetch(`${API}/public/forms/${form.id}/responses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  };

  const close = () => {
    if (isPreview) {
      router.push(`/forms/${params.id}/edit`);
    } else {
      router.push("/");
    }
  };

  if (error) {
    return <div style={{ padding: 50, textAlign: "center" }}><h2>{error}</h2></div>;
  }

  if (!form) {
    return <div style={{ padding: 50, textAlign: "center" }}>Loading form...</div>;
  }

  return (
    <PublicForm
      form={form}
      close={close}
      submit={submit}
      isPreview={isPreview}
    />
  );
}
