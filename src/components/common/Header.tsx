"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { label: "내 자산 분석", href: "/input" },
  { label: "매물 찾기", href: "/region" },
  { label: "시세 분석", href: "/analytics" },
] as const;

export default function Header() {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  // Close drawer on route change
  useEffect(() => {
    closeDrawer();
  }, [pathname, closeDrawer]);

  return (
    <>
      <header className="flex h-14 items-center justify-between border-b border-border px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.svg" alt="" width={36} height={36} />
            <span className="text-lg font-bold text-primary tracking-tight">
              하우스핀
            </span>
          </Link>

          {/* Desktop navigation */}
          <nav className="hidden sm:flex items-center gap-6">
            {NAV_ITEMS.map(({ label, href }) => {
              const isActive = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`text-sm font-medium transition-colors ${
                    isActive
                      ? "text-primary font-semibold"
                      : "text-secondary hover:text-primary"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="sm:hidden flex items-center justify-center w-10 h-10 -mr-2 rounded-lg text-primary hover:bg-surface transition-colors"
          onClick={() => setDrawerOpen(true)}
          aria-label="메뉴 열기"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </header>

      {/* Mobile drawer */}
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-50 bg-black/40 transition-opacity duration-300 ${
          drawerOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={closeDrawer}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        className={`fixed right-0 top-0 bottom-0 z-50 w-[280px] bg-background rounded-l-[16px] shadow-xl transition-transform duration-300 ease-in-out ${
          drawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="내비게이션 메뉴"
      >
        {/* Drawer header */}
        <div className="flex h-14 items-center justify-between px-4">
          <Link
            href="/"
            className="flex items-center gap-2"
            onClick={closeDrawer}
          >
            <Image src="/logo.svg" alt="" width={28} height={28} />
            <span className="text-base font-bold text-primary tracking-tight">
              하우스핀
            </span>
          </Link>

          <button
            type="button"
            className="flex items-center justify-center w-10 h-10 -mr-2 rounded-lg text-secondary hover:text-primary hover:bg-surface transition-colors"
            onClick={closeDrawer}
            aria-label="메뉴 닫기"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Drawer navigation */}
        <nav className="mt-2">
          {NAV_ITEMS.map(({ label, href }) => {
            const isActive = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={closeDrawer}
                className={`block px-6 py-4 text-base font-medium border-b border-border transition-colors ${
                  isActive
                    ? "text-accent bg-accent-light"
                    : "text-primary hover:bg-surface"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Drawer footer */}
        <div className="absolute bottom-0 left-0 right-0 px-6 py-6">
          <p className="text-xs text-secondary">하우스핀 v3</p>
        </div>
      </div>
    </>
  );
}
