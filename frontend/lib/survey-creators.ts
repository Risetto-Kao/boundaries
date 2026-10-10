import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isAccountHistoryEnabled } from "@/lib/auth/config";
import { getAccountDisplayName } from "@/lib/auth/display-name";

export type SurveyCreator = { kind: "member" | "unrecorded" | "unavailable"; name: string | null };

// Resolve only names for the requested public forms. Auth metadata and IDs never
// leave this server module; no schema change or elevated browser key is needed.
export async function getSurveyCreators(surveyIds: string[]) {
  const creators = new Map<string, SurveyCreator>(surveyIds.map((id) => [id, { kind: "unrecorded", name: null }]));
  if (!surveyIds.length || !isAccountHistoryEnabled()) return creators;
  try {
    const rows = await prisma.$queryRaw<{ surveyId: string; hasOwner: boolean; metadata: Record<string, unknown> }[]>(Prisma.sql`
      SELECT s.id AS "surveyId", (s.owner_id IS NOT NULL) AS "hasOwner",
        jsonb_build_object(
          'full_name', u.raw_user_meta_data->'full_name',
          'name', u.raw_user_meta_data->'name',
          'display_name', u.raw_user_meta_data->'display_name'
        ) AS metadata
      FROM public.surveys s
      LEFT JOIN auth.users u ON u.id = s.owner_id
      WHERE s.id IN (${Prisma.join(surveyIds)})
    `);
    for (const row of rows) creators.set(row.surveyId, {
      kind: row.hasOwner ? "member" : "unrecorded",
      name: getAccountDisplayName(row.metadata),
    });
  } catch {
    // Attribution failure must not hide a shared form or misidentify its author.
    for (const id of surveyIds) creators.set(id, { kind: "unavailable", name: null });
  }
  return creators;
}
