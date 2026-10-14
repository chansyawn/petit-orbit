import type { FurnitureItem, FurnitureSet } from "@petit-orbit/content-schema";
import { useEffect, useEffectEvent, useId, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/components/select";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/ui/components/empty";
import { Button } from "@/ui/components/button";
import { CatalogCard, CatalogGrid, CatalogPagination } from "@/features/catalog/components";
import { FurnitureHeading } from "./navigation";
import {
  defaultSearch,
  filterFurniture,
  filterOptions,
  furniturePath,
  listHref,
  paginate,
  setsPath,
} from "./model";
import type { CatalogSearch, FurnitureCatalog } from "./model";

type ListProps = {
  catalog: FurnitureCatalog;
  search: CatalogSearch;
  onSearch: (search: CatalogSearch, replace?: boolean) => void;
  sets?: boolean;
};
export function FurnitureListPage({ catalog, search, onSearch, sets = false }: ListProps) {
  const filterId = useId();
  const options = filterOptions(catalog.items);
  const matches: (FurnitureItem | FurnitureSet)[] = sets
    ? catalog.sets.filter((set) => set.name.toLowerCase().includes(search.q.toLowerCase()))
    : filterFurniture(catalog.items, search);
  const result = paginate(matches, search.page);
  const normalizePage = useEffectEvent(() => onSearch({ ...search, page: result.page }, true));
  useEffect(() => {
    if (search.page !== result.page) normalizePage();
  }, [search.page, result.page]);
  const update = (patch: Partial<CatalogSearch>) => onSearch({ ...search, ...patch, page: 1 });
  const returnTo = listHref(sets ? setsPath : furniturePath, { ...search, page: result.page });
  return (
    <>
      <FurnitureHeading title={sets ? "家具套组" : "家具图鉴"} sets={sets} />
      <section aria-label="搜索与筛选" className="space-y-4 rounded-xl border bg-muted/30 p-4">
        <NameSearch key={search.q} query={search.q} sets={sets} onSearch={(q) => update({ q })} />
        {!sets && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(
              [
                ["category", "分类"],
                ["type", "类型"],
                ["quality", "品质"],
                ["color", "颜色"],
                ["material", "材质"],
              ] as const
            ).map(([field, label]) => {
              const items = [
                { value: "", label: `全部${label}` },
                ...(search[field] && !options[field].includes(search[field])
                  ? [{ value: search[field], label: `${search[field]}（无匹配选项）` }]
                  : []),
                ...options[field].map((value) => ({
                  value,
                  label: field === "quality" ? `品质 ${value}` : value,
                })),
              ];
              return (
                <div key={field} className="flex min-w-0 flex-col gap-2 text-sm">
                  <Label htmlFor={`${filterId}-${field}`}>{label}</Label>
                  <Select
                    value={search[field]}
                    items={items}
                    onValueChange={(value) => update({ [field]: value ?? "" })}
                  >
                    <SelectTrigger id={`${filterId}-${field}`} className="h-10 w-full min-w-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent alignItemWithTrigger={false}>
                      {items.map(({ value, label: optionLabel }) => (
                        <SelectItem key={value} value={value}>
                          {optionLabel}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              );
            })}
          </div>
        )}
        <Button variant="outline" onClick={() => onSearch(defaultSearch)}>
          清除筛选
        </Button>
      </section>
      <p role="status" className="text-sm text-muted-foreground">
        匹配 {result.total} {sets ? "个套组" : "件家具"}
      </p>
      {result.total === 0 ? (
        <Empty className="rounded-xl bg-muted/50 p-8">
          <EmptyHeader>
            <EmptyTitle>
              <h2>没有找到匹配的{sets ? "套组" : "家具"}</h2>
            </EmptyTitle>
            <EmptyDescription>试试其他关键词，或清除筛选。</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <CatalogGrid>
          {result.items.map((record) => (
            <Link
              key={record.id}
              aria-label={record.name}
              to={sets ? "/collection/furniture/sets/$id" : "/collection/furniture/$id"}
              params={{ id: String(record.id) }}
              search={{ returnTo }}
              className="min-w-0 rounded-xl focus-visible:outline-2 focus-visible:outline-ring"
            >
              <CatalogCard record={record}>
                {"category" in record && (
                  <p className="text-sm text-muted-foreground">
                    {record.category ?? "分类暂无资料"}
                  </p>
                )}
              </CatalogCard>
            </Link>
          ))}
        </CatalogGrid>
      )}
      <CatalogPagination
        page={result.page}
        pages={result.pages}
        onChange={(page) => onSearch({ ...search, page })}
      />
    </>
  );
}

function NameSearch({
  query,
  sets,
  onSearch,
}: {
  query: string;
  sets: boolean;
  onSearch: (query: string) => void;
}) {
  const [draft, setDraft] = useState(query);
  const inputId = useId();
  return (
    <form
      className="flex flex-col gap-3 sm:flex-row sm:items-end"
      onSubmit={(event) => {
        event.preventDefault();
        onSearch(draft);
      }}
    >
      <div className="flex flex-1 flex-col gap-2 text-sm">
        <Label htmlFor={inputId}>按名称搜索</Label>
        <Input
          id={inputId}
          type="search"
          value={draft}
          placeholder={sets ? "搜索套组名称" : "搜索家具名称"}
          onChange={(event) => setDraft(event.target.value)}
        />
      </div>
      <Button type="submit">搜索</Button>
    </form>
  );
}
