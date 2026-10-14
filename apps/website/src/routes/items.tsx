import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/components/card";
import { ArmchairIcon, ShirtIcon, BugIcon } from "lucide-react";
import { WikiLayout } from "@/features/layout/wiki-layout";

export const Route = createFileRoute("/items")({ component: ItemsPage });
function ItemsPage() {
  return (
    <WikiLayout>
      <section className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-4 md:p-8">
        <header className="space-y-2">
          <p className="text-sm text-muted-foreground">星布谷地 Wiki</p>
          <h1 className="text-3xl font-semibold">物品图鉴</h1>
          <p className="text-muted-foreground">查找家具、服饰与生物资料，浏览套组、套装与外观。</p>
        </header>
        <Link
          to="/collection/furniture"
          className="max-w-lg rounded-xl focus-visible:outline-2 focus-visible:outline-ring"
        >
          <Card className="flex-row items-center gap-4 rounded-xl border p-6 shadow-none ring-0 hover:bg-muted/50">
            <CardContent className="shrink-0 px-0">
              <ArmchairIcon aria-hidden="true" className="size-10 text-primary-foreground" />
            </CardContent>
            <CardHeader className="min-w-0 flex-1 px-0">
              <CardTitle>
                <h2 className="text-xl font-semibold">家具图鉴</h2>
              </CardTitle>
              <CardDescription>浏览家具、筛选属性、查看套组 →</CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link
          to="/collection/clothing"
          className="max-w-lg rounded-xl focus-visible:outline-2 focus-visible:outline-ring"
        >
          <Card className="flex-row items-center gap-4 rounded-xl border p-6 shadow-none ring-0 hover:bg-muted/50">
            <CardContent className="shrink-0 px-0">
              <ShirtIcon aria-hidden="true" className="size-10 text-primary-foreground" />
            </CardContent>
            <CardHeader className="min-w-0 flex-1 px-0">
              <CardTitle>
                <h2 className="text-xl font-semibold">服饰图鉴</h2>
              </CardTitle>
              <CardDescription>浏览服饰、套装与外观 →</CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link
          to="/collection/creatures"
          className="max-w-lg rounded-xl focus-visible:outline-2 focus-visible:outline-ring"
        >
          <Card className="flex-row items-center gap-4 rounded-xl border p-6 shadow-none ring-0 hover:bg-muted/50">
            <CardContent className="shrink-0 px-0">
              <BugIcon aria-hidden="true" className="size-10 text-primary-foreground" />
            </CardContent>
            <CardHeader className="min-w-0 flex-1 px-0">
              <CardTitle>
                <h2 className="text-xl font-semibold">生物图鉴</h2>
              </CardTitle>
              <CardDescription>浏览生物、筛选系列与活动条件 →</CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link to="/collection/furniture/sets" className="text-sm underline">
          浏览家具套组 →
        </Link>
      </section>
    </WikiLayout>
  );
}
