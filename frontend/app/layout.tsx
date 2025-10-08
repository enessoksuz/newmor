import type { Metadata } from "next";
import { Nunito, Lora } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const nunito = Nunito({ 
  subsets: ["latin"],
  variable: "--font-nunito",
  display: "swap",
});

const lora = Lora({ 
  subsets: ["latin"],
  variable: "--font-lora",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Mor Fikirler - Girişimcilik ve İş Fikirleri",
  description: "Girişimcilik, yatırımcılık ve iş fikirleri hakkında güncel içerikler",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={`${nunito.variable} ${lora.variable}`}>
      <body className={`${nunito.className} antialiased`}>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
