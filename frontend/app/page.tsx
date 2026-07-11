import { redirect } from "next/navigation";

export default function Home({ searchParams }: { searchParams: { form?: string } }) {
  if (searchParams.form) {
    redirect(`/forms/${searchParams.form}`);
  }
  redirect("/forms");
}
