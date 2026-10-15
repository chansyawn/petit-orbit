import { Link } from "@tanstack/react-router";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/ui/components/breadcrumb";
import { defaultSearch, parseReturnTo } from "./model";

export function PlantHeading({ title, detail = false }: { title: string; detail?: boolean }) {
  return (
    <header className="space-y-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link to="/items" />}>物品</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            {detail ? (
              <BreadcrumbLink render={<Link to="/collection/plants" />}>植物图鉴</BreadcrumbLink>
            ) : (
              <BreadcrumbPage>植物图鉴</BreadcrumbPage>
            )}
          </BreadcrumbItem>
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
    </header>
  );
}
export function ReturnLink({ returnTo }: { returnTo?: string }) {
  const target = parseReturnTo(returnTo) ?? { search: defaultSearch };
  return (
    <Link
      to="/collection/plants"
      search={target.search}
      className="text-sm underline underline-offset-4"
    >
      ← 返回植物列表
    </Link>
  );
}
