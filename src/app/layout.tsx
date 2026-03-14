import type { Metadata } from "next";

import Header from "@/components/common/Header";
import Footer from "@/components/common/Footer";

import "./globals.css";

export const metadata: Metadata = {
  title: "house-pin | 내 자산으로 살 수 있는 집",
  description:
    "내 자산과 대출 가능 금액을 기반으로 실제 구매 가능한 부동산 매물을 추천해드립니다.",
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
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
