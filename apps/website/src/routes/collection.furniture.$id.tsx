import { createFileRoute, notFound } from "@tanstack/react-router";
import { FurnitureDetailPage } from "@/features/furniture/detail-page";
import { parseDetailSearch, parseId } from "@/features/furniture/model";
import { Route as FurnitureRoute } from "./collection.furniture";

export const Route = createFileRoute("/collection/furniture/$id")({
  validateSearch: parseDetailSearch,
  loader: async ({ params, parentMatchPromise }) => {
    const parent = await parentMatchPromise;
    const record = parent.loaderData?.items.find((item) => item.id === parseId(params.id));
    if (!record) throw notFound();
    return record;
  },
  component: FurnitureDetail,
});
function FurnitureDetail() {
  return (
    <FurnitureDetailPage
      catalog={FurnitureRoute.useLoaderData()}
      record={Route.useLoaderData()}
      returnTo={Route.useSearch().returnTo}
    />
  );
}
