import { Empty, EmptyDescription, EmptyHeader } from "@/ui/components/empty";
import { Link } from "@tanstack/react-router";
import type { FurnitureItem, FurnitureSet } from "@petit-orbit/content-schema";
import {
  Attributes,
  CatalogCard,
  CatalogGrid,
  CatalogImage,
  qualityLabel,
} from "@/features/catalog/components";
import { createRelations } from "./model";
import type { FurnitureCatalog } from "./model";
import { FurnitureHeading, ReturnLink } from "./navigation";

export function FurnitureDetailPage({
  catalog,
  record,
  returnTo,
}: {
  catalog: FurnitureCatalog;
  record: FurnitureItem | FurnitureSet;
  returnTo?: string;
}) {
  const sets = "componentIds" in record;
  const relations = createRelations(catalog);
  const related = sets ? relations.membersOf(record) : relations.setsFor(record.id);
  const properties: [string, string | number | null][] = [
    ["ID", record.id],
    ["品质", record.quality],
  ];
  if (sets)
    properties.push(
      ["系列名称", record.seriesName],
      [
        "成员 ID",
        record.componentIds === null
          ? null
          : record.componentIds.length
            ? record.componentIds.join("，")
            : "无",
      ],
    );
  else
    properties.push(
      ["分类", record.category],
      ["类型", record.type],
      ["尺寸", record.size],
      ["颜色", record.colors],
      ["材质", record.materials],
      ["来源", record.sources],
    );
  return (
    <>
      <FurnitureHeading title={record.name} sets={sets} detail />
      <ReturnLink returnTo={returnTo} sets={sets} />
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
          <Attributes values={properties} />
        </div>
      </section>
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">
          {sets ? "套组成员" : "所属套组"}（{related.length}）
        </h2>
        {related.length ? (
          <CatalogGrid>
            {related.map((member) => (
              <Link
                key={member.id}
                aria-label={member.name}
                to={sets ? "/collection/furniture/$id" : "/collection/furniture/sets/$id"}
                params={{ id: String(member.id) }}
                search={{ returnTo }}
                className="min-w-0 rounded-xl focus-visible:outline-2 focus-visible:outline-ring"
              >
                <CatalogCard record={member} />
              </Link>
            ))}
          </CatalogGrid>
        ) : (
          <Empty className="rounded-xl bg-muted/50 p-8">
            <EmptyHeader>
              <EmptyDescription>{sets ? "暂无套组成员资料" : "暂无所属套组资料"}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </section>
    </>
  );
}
