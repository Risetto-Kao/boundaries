"use client";

import Link from "next/link";
import { DropdownMenu } from "radix-ui";
import { FileText, LogIn, LogOut, Settings, Smartphone } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";
import { LoginLink } from "@/components/login-link";
import { Button } from "@/components/ui/button";

export function AccountMenu({ signedIn, displayName }: { signedIn: boolean; displayName: string | null }) {
  const { t } = useI18n();
  const itemClass = "flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm outline-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground";
  return <DropdownMenu.Root>
    <DropdownMenu.Trigger asChild>
      <Button variant="ghost" size="icon" aria-label={t("settings")} title={t("settings")}><Settings className="size-5" aria-hidden="true" /></Button>
    </DropdownMenu.Trigger>
    <DropdownMenu.Portal>
      <DropdownMenu.Content align="end" sideOffset={8} collisionPadding={16} className="z-50 w-60 max-w-[calc(100vw-32px)] rounded-xl border bg-popover p-2 text-popover-foreground shadow-lg">
        <DropdownMenu.Label className="px-3 py-2 text-sm font-semibold [overflow-wrap:anywhere]">{signedIn ? displayName || t("account") : t("settings")}</DropdownMenu.Label>
        {signedIn ? <DropdownMenu.Item asChild><Link href="/account" className={itemClass}><FileText className="size-4" aria-hidden="true" />{t("myForms")}</Link></DropdownMenu.Item>
          : <DropdownMenu.Item asChild><LoginLink className={itemClass}><LogIn className="size-4" aria-hidden="true" />{t("loginSave")}</LoginLink></DropdownMenu.Item>}
        <DropdownMenu.Item asChild><Link href="/install" className={itemClass}><Smartphone className="size-4" aria-hidden="true" />{t("install")}</Link></DropdownMenu.Item>
        {signedIn && <>
          <DropdownMenu.Separator className="my-1 h-px bg-border" />
          <form action="/auth/signout" method="post">
            <DropdownMenu.Item asChild onSelect={(event) => event.preventDefault()}><button type="submit" className={`${itemClass} w-full`}><LogOut className="size-4" aria-hidden="true" />{t("signOut")}</button></DropdownMenu.Item>
          </form>
        </>}
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  </DropdownMenu.Root>;
}
