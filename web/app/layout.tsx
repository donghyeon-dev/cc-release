import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const themeInitScript = `
(() => {
  try {
    const saved = window.localStorage.getItem("cc-release-theme");
    const theme = saved === "white" || saved === "black"
      ? saved
      : window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "black"
        : "white";
    document.documentElement.dataset.theme = theme;
  } catch {
    document.documentElement.dataset.theme = "white";
  }
})();
`;

export const metadata: Metadata = {
  title: "Claude Code 릴리즈 요약",
  description:
    "Claude Code 릴리즈를 개발자 관점에서 한국어로 요약한 일일 업데이트 페이지.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      data-theme="white"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
