import type { z } from "zod";
import Link from "next/link";
import { HeartHandshake } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { crisisBannerSchemaDef } from "./schema";

type CrisisBannerData = z.infer<(typeof crisisBannerSchemaDef)["schema"]>;

export function CrisisBannerRenderer({ data }: { data: CrisisBannerData }) {
  const linkLabel = data.linkLabel || "View crisis resources";

  return (
    <div className="container-wide section-padding">
      <Alert className="mx-auto max-w-2xl border-soft-rose/40 bg-soft-rose/10 text-center [&>svg]:static [&>svg]:mx-auto [&>svg]:mb-3 [&>svg~*]:pl-0">
        <HeartHandshake className="h-6 w-6 text-soft-rose" aria-hidden="true" />
        <AlertTitle className="font-heading text-lg font-normal">{data.heading}</AlertTitle>
        {data.body && <AlertDescription className="mt-1">{data.body}</AlertDescription>}
        {data.linkHref && (
          <Link href={data.linkHref} className="mt-4 inline-block font-body text-sm font-medium text-primary hover:underline">
            {linkLabel}
          </Link>
        )}
      </Alert>
    </div>
  );
}
