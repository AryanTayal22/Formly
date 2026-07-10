import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Formly — create forms people enjoy",
  description: "A conversational form builder"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
