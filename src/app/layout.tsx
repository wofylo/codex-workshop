import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CCA-F Exam Prep",
  description: "Multi-user CCA-F study, quiz, and progress platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
