import type { Metadata, Viewport } from "next";

import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";

import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#FFFFFF",
};

export const metadata: Metadata = {
  title: "house-pin | 내 자산으로 살 수 있는 집",
  description:
    "자산 입력만으로 대출 가능액과 매입 가능 매물을 한눈에. 내 자산으로 살 수 있는 집을 찾아보세요.",
  icons: {
    icon: "/favicon.ico",
    apple: "/favicon.ico",
  },
  openGraph: {
    title: "house-pin | 내 자산으로 살 수 있는 집",
    description:
      "자산 입력만으로 대출 가능액과 매입 가능 매물을 한눈에. 내 자산으로 살 수 있는 집을 찾아보세요.",
    siteName: "house-pin",
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "house-pin | 내 자산으로 살 수 있는 집",
    description:
      "자산 입력만으로 대출 가능액과 매입 가능 매물을 한눈에. 내 자산으로 살 수 있는 집을 찾아보세요.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="flex min-h-screen flex-col antialiased">
        <Header />
        <main className="mx-auto w-full max-w-[640px] flex-1 px-4 sm:px-6">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
