import Link from "next/link";

export default function Header() {
  return (
    <header className="flex h-14 items-center border-b border-border px-4 sm:px-6">
      <Link
        href="/"
        className="text-lg font-bold text-accent tracking-tight"
      >
        house-pin
      </Link>
    </header>
  );
}
