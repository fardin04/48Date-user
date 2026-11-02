import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { QueryProvider } from "@/components/pieces/shells/query-provider";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "48Date — Your next story starts with hello", template: "%s · 48Date" },
  description:
    "Discover people who share your interests, connect through a mutual match, and make the next 48 hours count.",
};

/** Marks the document as scripted so the Reveal piece may hide content until it scrolls into view. */
const scriptedFlag = "document.documentElement.classList.add('js')";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={manrope.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: scriptedFlag }} />
      </head>
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
