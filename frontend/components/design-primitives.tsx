import { Check, Triangle, X } from "lucide-react";

const avatarColors = ["var(--violet)", "#16121F", "#5B5670", "#3B1BB8", "#7A5AF8", "#2E2A40"];
export function Avatar({ name, index, size = 36 }: { name: string; index: number; size?: 28 | 32 | 36 }) {
  return <span className="avatar" aria-hidden="true" style={{ width: size, height: size, background: avatarColors[index % avatarColors.length] }}>{Array.from(name.trim())[0]?.toLocaleUpperCase()}</span>;
}
export function StatusArt({ small = false }: { small?: boolean }) {
  return <div className={`status-art ${small ? "status-art-small" : ""}`} aria-hidden="true"><span className="answer-yes"><Check size={small ? 28 : 64} /></span><span className="answer-depends"><Triangle size={small ? 28 : 64} /></span><span className="answer-no"><X size={small ? 28 : 64} /></span></div>;
}
