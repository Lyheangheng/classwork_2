import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lom Rak | Community Health Dashboard",
  description: "On-the-fly visualization of village and community treatment data."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
