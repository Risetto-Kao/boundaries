import { redirect } from "next/navigation";
import { CreateSurveyForm } from "@/components/create-survey-form";
import { getCurrentUser } from "@/lib/auth/user";
import { getAccountDisplayName } from "@/lib/auth/display-name";
export default async function CreateTemplatePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/create");
  return <CreateSurveyForm signedIn displayName={getAccountDisplayName(user.user_metadata)} />;
}
