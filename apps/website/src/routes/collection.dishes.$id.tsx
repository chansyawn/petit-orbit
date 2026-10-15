import { createFileRoute, notFound } from "@tanstack/react-router";
import { DishDetailPage } from "@/features/dishes/detail-page";
import { parseDetailSearch } from "@/features/dishes/model";
import { parseId } from "@/features/catalog/model";
import { Route as DishRoute } from "./collection.dishes";

export const Route = createFileRoute("/collection/dishes/$id")({
  validateSearch: parseDetailSearch,
  loader: async ({ params, parentMatchPromise }) => {
    const parent = await parentMatchPromise;
    const record = parent.loaderData?.items.find((record) => record.id === parseId(params.id));
    if (!record) throw notFound();
    return record;
  },
  component: DishDetail,
});
function DishDetail() {
  return (
    <DishDetailPage
      catalog={DishRoute.useLoaderData()}
      record={Route.useLoaderData()}
      returnTo={Route.useSearch().returnTo}
    />
  );
}
