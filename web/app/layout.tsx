import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nexa — задачи бизнеса для студенческих команд",
  description: "AI помогает бизнесу сформулировать задачу, а студенческим командам — найти вызов и предложить решение.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="antialiased">{children}</body>
    </html>
  );
}
