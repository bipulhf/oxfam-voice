import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const july = localFont({
  src: [
    {
      path: "../public/fonts/July-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/July-Italic.ttf",
      weight: "400",
      style: "italic",
    },
    {
      path: "../public/fonts/July-Bold.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../public/fonts/July-Bold-Italic.ttf",
      weight: "700",
      style: "italic",
    },
  ],
  variable: "--font-july",
});

export const metadata: Metadata = {
  title: "ক্ষতিগ্রস্ত তথ্য সংগ্রহ",
  description: "Bengali Voice Survey System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn" className={july.variable}>
      <body className={`${july.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
