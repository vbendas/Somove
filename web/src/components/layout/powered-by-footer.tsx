import { getPlatformSettings } from "@/lib/platform";

export default async function PoweredByFooter() {
  const settings = await getPlatformSettings();

  return (
    <footer className="border-t bg-background/50 py-4">
      <div className="mx-auto max-w-7xl px-4 text-center">
        <p className="text-xs text-muted-foreground">
          Powered by{" "}
          <a
            href="https://github.com/anomalyco/Somove"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary hover:underline"
          >
            {settings.platform_name}
          </a>
          {settings.platform_tagline && (
            <span> — {settings.platform_tagline}</span>
          )}
        </p>
      </div>
    </footer>
  );
}
