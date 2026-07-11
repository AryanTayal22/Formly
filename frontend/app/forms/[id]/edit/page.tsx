"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Form } from "../../../../types";
import { Builder } from "../../../../components/Builder";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export default function BuilderPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [form, setForm] = useState<Form | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    fetch(`${API}/forms/${params.id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => {
        const fetchedForm = {
          ...data,
          id: String(data.id),
          updatedAt: new Date(data.updated_at + "Z").toLocaleString(),
          submissions: new Array(data.response_count || 0).fill({})
        };
        setForm(fetchedForm);
        setSelectedId(fetchedForm.questions[0]?.id || "");
      })
      .catch(() => {
        router.push("/forms");
      });
  }, [params.id, router]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(""), 2200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const save = async (next: Form) => {
    setForm(next);
    await fetch(`${API}/forms/${next.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: next.title,
        status: next.status,
        thank_you_message: next.thank_you_message ?? "Thank you for sharing.",
        questions: next.questions
      })
    });
  };

  if (!form) return <div style={{ padding: 40 }}>Loading builder...</div>;

  return (
    <>
      <Builder
        form={form}
        selectedId={selectedId}
        setSelectedId={setSelectedId}
        save={save}
        back={() => router.push("/forms")}
        openPublic={() => router.push(`/forms/${form.id}?preview=true`)}
        openResults={() => router.push(`/forms/${form.id}/results`)}
        notify={(msg) => setToast(msg)}
      />
      {toast && (
        <div className="toast">
          <Check size={18} /> {toast}
        </div>
      )}
    </>
  );
}
