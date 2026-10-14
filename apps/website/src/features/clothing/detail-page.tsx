import { Link } from "@tanstack/react-router";
import {
  Attributes,
  CatalogCard,
  CatalogGrid,
  CatalogImage,
  qualityLabel,
} from "@/features/catalog/components";
import { Empty, EmptyDescription, EmptyHeader } from "@/ui/components/empty";
import { createRelations, detailPaths } from "./model";
import type { ClothingCatalog, ClothingKind, ClothingRecord } from "./model";
import { ClothingHeading, ReturnLink } from "./navigation";

export function ClothingDetailPage({
  catalog,
  record,
  kind,
  returnTo,
}: {
  catalog: ClothingCatalog;
  record: ClothingRecord;
  kind: ClothingKind;
  returnTo?: string;
}) {
  const relations = createRelations(catalog);
  const related =
    "componentIds" in record
      ? relations.membersOf(record)
      : kind === "items"
        ? relations.setsFor(record.id)
        : [];
  const properties: [string, string | number | null][] = [
    ["ID", record.id],
    ["品质", record.quality],
  ];
  if ("componentIds" in record)
    properties.push(
      ["套装名称", record.setName],
      [
        "成员 ID",
        record.componentIds === null
          ? null
          : record.componentIds.length
            ? record.componentIds.join("，")
            : "无",
      ],
    );
  if ("category" in record) properties.push(["分类", record.category]);
  if ("styles" in record)
    properties.push(
      ["颜色", record.colors],
      ["材质", record.materials],
      ["风格", record.styles],
      ["来源", record.sources],
    );
  return (
    <>
      <ClothingHeading title={record.name} kind={kind} detail />
      <ReturnLink returnTo={returnTo} kind={kind} />
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
      {kind !== "appearances" && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">
            {kind === "sets" ? "套装成员" : "所属套装"}（{related.length}）
          </h2>
          {related.length ? (
            <CatalogGrid>
              {related.map((member) => (
                <Link
                  key={member.id}
                  aria-label={member.name}
                  to={detailPaths[kind === "sets" ? "items" : "sets"]}
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
                <EmptyDescription>
                  {kind === "sets" ? "暂无套装成员资料" : "暂无所属套装资料"}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </section>
      )}
    </>
  );
}
