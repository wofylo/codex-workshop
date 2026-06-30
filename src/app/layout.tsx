import type { Metadata } from "next";
import "./globals.css";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { BugReportButton } from "@/components/bug-report/bug-report-button";

export const metadata: Metadata = {
  title: "CCA-F Exam Prep",
  description: "Multi-user CCA-F study, quiz, and progress platform.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let isAuthenticated = false;
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    isAuthenticated = !!user;
  } catch {
    // Not authenticated or cookie unavailable — keep isAuthenticated = false
  }

  return (
    <html lang="en">
      <body>
        {children}
        {isAuthenticated && <BugReportButton />}
      </body>
    </html>
  );
}
