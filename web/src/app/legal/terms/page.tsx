import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getPlatformSettings } from "@/lib/platform";
import { PageContainer } from "@/components/layout/page-container";

export const dynamic = "force-static";

export default async function TermsPage() {
  const settings = await getPlatformSettings();
  const content = settings.terms_of_service;

  return (
    <PageContainer standalone width="narrow">
      <h1 className="mb-8 font-heading text-3xl text-foreground">Terms of Service</h1>
      {content ? (
        <div className="prose prose-sm max-w-none text-foreground">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>
      ) : (
        <p className="text-warm-gray">
          Terms of Service have not been published yet. Please check back later or
          contact the platform administrator.
        </p>
      )}
    </PageContainer>
  );
}