import { Link, Outlet, useLocation, useRouter, useSearch } from "@tanstack/react-router";
import { WikiLayout } from "@/features/layout/wiki-layout";
import { Button } from "@/ui/components/button";
import { ClothingHeading, ReturnLink } from "./navigation";
import { parseReturnTo } from "./model";

export function ClothingLayout() {
  return (
    <WikiLayout>
      <section className="mx-auto flex w-full min-w-0 max-w-7xl flex-1 flex-col gap-6 p-4 md:p-8">
        <Outlet />
      </section>
    </WikiLayout>
  );
}
export function ClothingError() {
  const router = useRouter();
  return (
    <WikiLayout>
      <section className="space-y-4 p-8">
        <h1 className="text-2xl font-semibold">服饰资料加载失败</h1>
        <p>暂时无法读取图鉴，请重试。</p>
        <Button onClick={() => void router.invalidate()}>重试</Button>
        <Link to="/items" className="ml-4 underline">
          返回物品入口
        </Link>
      </section>
    </WikiLayout>
  );
}
export function ClothingNotFound() {
  const pathname = useLocation().pathname;
  const kind = pathname.includes("/sets/")
    ? "sets"
    : pathname.includes("/appearances/")
      ? "appearances"
      : "items";
  const search = useSearch({ strict: false });
  const returnTo = "returnTo" in search ? parseReturnTo(search.returnTo)?.href : undefined;
  return (
    <WikiLayout>
      <section className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-8">
        <ClothingHeading title="未找到该服饰、套装或外观" kind={kind} detail />
        <p className="text-muted-foreground">404 · 请检查链接中的 ID。</p>
        <ReturnLink returnTo={returnTo} kind={kind} />
      </section>
    </WikiLayout>
  );
}
