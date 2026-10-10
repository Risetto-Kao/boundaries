"use client";

import { usePathname } from "next/navigation";
import { safeReturnTo } from "@/lib/auth/config";

export function LoginLink({ children, onClick, onAuxClick, ...props }: Omit<React.ComponentProps<"a">, "href">) {
  const pathname = usePathname();
  const preserveDestination = (event: React.MouseEvent<HTMLAnchorElement>) => {
    const { pathname, search, hash } = window.location;
    const href = `/login?next=${encodeURIComponent(safeReturnTo(`${pathname}${search}${hash}`))}`;
    event.currentTarget.href = href;
  };
  return <a {...props} href={`/login?next=${encodeURIComponent(safeReturnTo(pathname))}`}
    onClick={(event) => { preserveDestination(event); onClick?.(event); }}
    onAuxClick={(event) => { preserveDestination(event); onAuxClick?.(event); }}>{children}</a>;
}
