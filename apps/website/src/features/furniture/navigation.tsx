import { Link } from "@tanstack/react-router";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/ui/components/breadcrumb";
import { defaultSearch, furniturePath, parseReturnTo } from "./model";

export function FurnitureHeading({
  title,
  sets = false,
  detail = false,
}: {
  title: string;
  sets?: boolean;
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
            {detail || sets ? (
              <BreadcrumbLink render={<Link to="/collection/furniture" />}>家具图鉴</BreadcrumbLink>
            ) : (
              <BreadcrumbPage>家具图鉴</BreadcrumbPage>
            )}
          </BreadcrumbItem>
          {sets && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {detail ? (
                  <BreadcrumbLink render={<Link to="/collection/furniture/sets" />}>
                    套组
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage>套组</BreadcrumbPage>
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
        <nav aria-label="家具图鉴导航" className="flex gap-4 text-sm">
          <Link
            to="/collection/furniture"
            activeOptions={{ exact: true }}
            className="underline underline-offset-4"
          >
            家具列表
          </Link>
          <Link to="/collection/furniture/sets" className="underline underline-offset-4">
            套组列表
          </Link>
        </nav>
      )}
    </header>
  );
}
export function ReturnLink({ returnTo, sets = false }: { returnTo?: string; sets?: boolean }) {
  const target = parseReturnTo(returnTo) ?? {
    path: sets ? ("/collection/furniture/sets" as const) : furniturePath,
    search: defaultSearch,
  };
  return (
    <Link to={target.path} search={target.search} className="text-sm underline underline-offset-4">
      ← 返回{target.path === furniturePath ? "家具" : "套组"}列表
    </Link>
  );
}
