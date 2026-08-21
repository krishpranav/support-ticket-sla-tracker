import "./globals.css";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Relay | Support operations", description: "Support ticket and SLA tracker" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
