import type { Metadata } from "next";
import { getI18n } from "@/lib/i18n/server";
import { getCurrentUser } from "@/lib/auth/user";
import { prisma } from "@/lib/prisma";
import { forms } from "@/lib/form-server";
import { detectSurveyLanguage } from "@/lib/design";
import { FormPortal } from "@/components/form-portal";
export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> { const { t } = await getI18n(); return { title: `${t("templates")} | Boundaries` }; }
export default async function HomePage() {
  let templates: Awaited<ReturnType<typeof forms.templates>> = []; let unavailable = false;
  try { templates = await forms.templates(); } catch { unavailable = true; }
  let user = null; try { user = await getCurrentUser(); } catch { /* Listing remains public. */ }
  const editable = new Set(user ? await prisma.template.findMany({ where: { ownerId: user.id, ownerType: "USER", deletedAt: null }, select: { id: true } }).then(rows => rows.map(row => row.id)).catch(() => []) : []);
  return <FormPortal unavailable={unavailable} surveys={templates.map(template => ({ id: template.id, title: template.title, description: template.description, authorName: template.authorName, official: template.ownerType === "OFFICIAL", createdAt: template.createdAt.toISOString(), language: detectSurveyLanguage(template.title, template.questions), canEdit: editable.has(template.id) }))} />;
}
