import type { Metadata } from "next";
import { FormPortal } from "@/components/form-portal";
import { getAllSurveys } from "@/lib/surveys";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "表單入口 | Boundaries" };

export default async function HomePage() {
  let surveys: Awaited<ReturnType<typeof getAllSurveys>> = [];
  let unavailable = false;
  try {
    surveys = await getAllSurveys({ throwOnError: true });
  } catch {
    unavailable = true;
  }
  return <FormPortal unavailable={unavailable} surveys={surveys.map((survey) => ({
    id: survey.id,
    title: survey.title,
    description: survey.description,
    responses: survey._count.responses,
    createdAt: survey.createdAt.toISOString(),
  }))} />;
}
