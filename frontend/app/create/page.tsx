import { HistoryNotice } from "@/components/history-notice";

import { CreateSurveyForm } from "@/components/create-survey-form";

export default function CreateSurveyPage() {
  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-10">
      <HistoryNotice returnTo="/create" />
      <CreateSurveyForm />
    </main>
  );
}
