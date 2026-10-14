import { createFileRoute, notFound } from "@tanstack/react-router";
import { ClothingDetailPage } from "@/features/clothing/detail-page";
import { parseDetailSearch } from "@/features/clothing/model";
import { parseId } from "@/features/catalog/model";
import { Route as ClothingRoute } from "./collection.clothing";

export const Route = createFileRoute("/collection/clothing/$id")({
  validateSearch: parseDetailSearch,
  loader: async ({ params, parentMatchPromise }) => {
    const parent = await parentMatchPromise;
    const record = parent.loaderData?.items.find((record) => record.id === parseId(params.id));
    if (!record) throw notFound();
    return record;
  },
  component: ClothingDetail,
});
function ClothingDetail() {
  return (
    <ClothingDetailPage
      catalog={ClothingRoute.useLoaderData()}
      record={Route.useLoaderData()}
      kind="items"
      returnTo={Route.useSearch().returnTo}
    />
  );
}
