import { createFileRoute, notFound } from "@tanstack/react-router";
import { FurnitureDetailPage } from "@/features/furniture/detail-page";
import { parseDetailSearch, parseId } from "@/features/furniture/model";
import { Route as FurnitureRoute } from "./collection.furniture";

export const Route = createFileRoute("/collection/furniture/sets_/$id")({
  validateSearch: parseDetailSearch,
  loader: async ({ params, parentMatchPromise }) => {
    const parent = await parentMatchPromise;
    const record = parent.loaderData?.sets.find((set) => set.id === parseId(params.id));
    if (!record) throw notFound();
    return record;
  },
  component: SetDetail,
});
function SetDetail() {
  return (
    <FurnitureDetailPage
      catalog={FurnitureRoute.useLoaderData()}
      record={Route.useLoaderData()}
      returnTo={Route.useSearch().returnTo}
    />
  );
}
