"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

interface CopyLinkButtonProps {
  label: string;
  path?: string;
}

export function CopyLinkButton({ label, path }: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      const url = path ? `${window.location.origin}${path}` : window.location.href;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleCopy}>
      {copied ? "已複製" : label}
    </Button>
  );
}
