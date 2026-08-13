import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getPlatformSettings } from "@/lib/platform";
import { PageContainer } from "@/components/layout/page-container";

export const dynamic = "force-static";

export default async function PrivacyPage() {
  const settings = await getPlatformSettings();
  const content = settings.privacy_policy;

  return (
    <PageContainer standalone width="narrow">
      <h1 className="mb-8 font-heading text-3xl text-foreground">Privacy Policy</h1>
      {content ? (
        <div className="prose prose-sm max-w-none text-foreground">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>
      ) : (
        <p className="text-warm-gray">
          Privacy Policy has not been published yet. Please check back later or
          contact the platform administrator.
        </p>
      )}
    </PageContainer>
  );
}