import type { z } from "zod";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { imageSchemaDef } from "./schema";

type ImageData = z.infer<(typeof imageSchemaDef)["schema"]>;

export function ImageRenderer({ data }: { data: ImageData }) {
  return (
    <figure>
      <div className={cn(!data.fullBleed && "container-wide")}>
        <div
          className={cn(
            "relative aspect-[16/9] w-full overflow-hidden bg-surface",
            !data.fullBleed && "rounded-card-lg"
          )}
        >
          <Image src={data.image.url} alt={data.image.alt || ""} fill className="object-cover" sizes="100vw" />
        </div>
      </div>
      {data.caption && (
        <figcaption className="container-wide mt-3 text-center font-body text-sm text-muted-foreground">
          {data.caption}
        </figcaption>
      )}
    </figure>
  );
}
