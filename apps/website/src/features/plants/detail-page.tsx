import { Link } from "@tanstack/react-router";
import type { PlantItem } from "@petit-orbit/content-schema";
import { Attributes, CatalogImage, qualityLabel } from "@/features/catalog/components";
import { Empty, EmptyDescription, EmptyHeader } from "@/ui/components/empty";
import { createRelations, defaultSearch } from "./model";
import type { PlantCatalog } from "./model";
import { PlantHeading, ReturnLink } from "./navigation";

export function PlantDetailPage({
  catalog,
  record,
  returnTo,
}: {
  catalog: PlantCatalog;
  record: PlantItem;
  returnTo?: string;
}) {
  const series = createRelations(catalog).seriesFor(record.id);
  return (
    <>
      <PlantHeading title={record.name} detail />
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
              ["分类", record.category],
              ["原产星系", record.originGalaxy],
              ["成熟周期", record.maturityPeriod],
              ["收获次数", record.harvestCount],
            ]}
          />
        </div>
      </section>
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">所属系列（{series.length}）</h2>
        {series.length ? (
          <div className="flex flex-wrap gap-4">
            {series.map((series) => (
              <Link
                key={series.id}
                to="/collection/plants"
                search={{ ...defaultSearch, series: String(series.id) }}
                className="underline underline-offset-4"
              >
                {series.name}
              </Link>
            ))}
          </div>
        ) : (
          <Empty className="rounded-xl bg-muted/50 p-8">
            <EmptyHeader>
              <EmptyDescription>暂无所属系列资料</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </section>
    </>
  );
}
