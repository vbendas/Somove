import type { z } from "zod";
import type { dividerSchemaDef } from "./schema";

type DividerData = z.infer<(typeof dividerSchemaDef)["schema"]>;

export function DividerRenderer({ data }: { data: DividerData }) {
  if (data.style === "space") {
    return <div className="h-12 sm:h-20" aria-hidden="true" />;
  }

  return (
    <div className="container-wide">
      <hr className="border-border" />
    </div>
  );
}
