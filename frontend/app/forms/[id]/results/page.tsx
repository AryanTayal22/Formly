"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Form } from "../../../../types";
import { Results } from "../../../../components/Results";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export default function ResultsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [form, setForm] = useState<Form | null>(null);

  useEffect(() => {
    fetch(`${API}/forms/${params.id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => {
        setForm({
          ...data,
          id: String(data.id),
          updatedAt: new Date(data.updated_at + "Z").toLocaleString(),
          submissions: new Array(data.response_count || 0).fill({})
        });
      })
      .catch(() => {
        router.push("/forms");
      });
  }, [params.id, router]);

  if (!form) return <div style={{ padding: 40 }}>Loading results...</div>;

  return (
    <Results
      form={form}
      close={() => router.push(`/forms/${form.id}/edit`)}
    />
  );
}
