import type { MiscellaneousItem } from "@petit-orbit/content-schema";
import { Attributes, CatalogImage, qualityLabel } from "@/features/catalog/components";
import { MiscellanyHeading, ReturnLink } from "./navigation";

export function MiscellanyDetailPage({
  record,
  returnTo,
}: {
  record: MiscellaneousItem;
  returnTo?: string;
}) {
  return (
    <>
      <MiscellanyHeading title={record.name} detail />
      <ReturnLink returnTo={returnTo} />
      <section className="grid items-start gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <CatalogImage key={record.image} image={record.image} name={record.name} eager />
        <div className="min-w-0 space-y-6">
          <p className="text-sm text-muted-foreground">{qualityLabel(record.quality)}</p>
          <section className="space-y-2">
            <h2 className="font-semibold">描述</h2>
            <p className="whitespace-pre-wrap wrap-break-word">
              {record.description ?? "暂无资料"}
            </p>
          </section>
          <Attributes
            values={[
              ["ID", record.id],
              ["品质", record.quality],
            ]}
          />
        </div>
      </section>
    </>
  );
}
