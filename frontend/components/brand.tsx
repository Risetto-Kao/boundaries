import Image from "next/image";
import Link from "next/link";

export function Brand() {
  return (
    <Link href="/" className="inline-flex min-h-11 shrink-0 items-center gap-3 rounded-lg" aria-label="Boundaries">
      <Image src="/assets/brand/boundaries-mark.svg" width={28} height={30} alt="" priority />
      <span className="brand-wordmark">Boundaries</span>
    </Link>
  );
}
