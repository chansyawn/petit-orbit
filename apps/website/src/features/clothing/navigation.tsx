import { Link } from "@tanstack/react-router";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/ui/components/breadcrumb";
import { defaultSearch, labels, listPaths, parseReturnTo } from "./model";
import type { ClothingKind } from "./model";

export function ClothingHeading({
  title,
  kind,
  detail = false,
}: {
  title: string;
  kind: ClothingKind;
  detail?: boolean;
}) {
  return (
    <header className="space-y-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link to="/items" />}>物品</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            {detail || kind !== "items" ? (
              <BreadcrumbLink render={<Link to="/collection/clothing" />}>服饰图鉴</BreadcrumbLink>
            ) : (
              <BreadcrumbPage>服饰图鉴</BreadcrumbPage>
            )}
          </BreadcrumbItem>
          {kind !== "items" && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {detail ? (
                  <BreadcrumbLink render={<Link to={listPaths[kind]} />}>
                    {labels[kind]}
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage>{labels[kind]}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
            </>
          )}
          {detail && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{title}</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>
      <h1 className="text-3xl font-semibold tracking-tight wrap-break-word">{title}</h1>
      {!detail && (
        <nav aria-label="服饰图鉴导航" className="flex flex-wrap gap-4 text-sm">
          {(Object.keys(listPaths) as ClothingKind[]).map((kind) => (
            <Link
              key={kind}
              to={listPaths[kind]}
              activeOptions={{ exact: true }}
              className="underline underline-offset-4"
            >
              {labels[kind]}列表
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
export function ReturnLink({ returnTo, kind }: { returnTo?: string; kind: ClothingKind }) {
  const target = parseReturnTo(returnTo) ?? { kind, path: listPaths[kind], search: defaultSearch };
  return (
    <Link to={target.path} search={target.search} className="text-sm underline underline-offset-4">
      ← 返回{labels[target.kind]}列表
    </Link>
  );
}
