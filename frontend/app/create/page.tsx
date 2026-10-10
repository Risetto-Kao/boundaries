import { CreateSurveyForm } from "@/components/create-survey-form";
import { getCurrentUser } from "@/lib/auth/user";
import { getAccountDisplayName } from "@/lib/auth/display-name";

export default async function CreateSurveyPage() {
  let user;
  try { user = await getCurrentUser(); } catch { /* Submission retains session error handling. */ }
  return <CreateSurveyForm signedIn={Boolean(user)} displayName={getAccountDisplayName(user?.user_metadata)} />;
}
