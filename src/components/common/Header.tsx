import Link from "next/link";
import Image from "next/image";

export default function Header() {
  return (
    <header className="flex h-14 items-center border-b border-border px-4 sm:px-6">
      <Link href="/" className="flex items-center gap-2">
        <Image src="/logo.svg" alt="" width={36} height={36} />
        <span className="text-lg font-bold text-primary tracking-tight">
          하우스핀
        </span>
      </Link>
    </header>
  );
}
