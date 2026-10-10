import { HistoryNotice } from "@/components/history-notice";

import { CreateSurveyForm } from "@/components/create-survey-form";

export default function CreateSurveyPage() {
  return (
    <main className="page-shell page-shell-narrow">
      <HistoryNotice returnTo="/create" />
      <CreateSurveyForm />
    </main>
  );
}
