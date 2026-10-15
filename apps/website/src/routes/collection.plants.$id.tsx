import { createFileRoute, notFound } from "@tanstack/react-router";
import { PlantDetailPage } from "@/features/plants/detail-page";
import { parseDetailSearch } from "@/features/plants/model";
import { parseId } from "@/features/catalog/model";
import { Route as PlantRoute } from "./collection.plants";

export const Route = createFileRoute("/collection/plants/$id")({
  validateSearch: parseDetailSearch,
  loader: async ({ params, parentMatchPromise }) => {
    const parent = await parentMatchPromise;
    const record = parent.loaderData?.items.find((record) => record.id === parseId(params.id));
    if (!record) throw notFound();
    return record;
  },
  component: PlantDetail,
});
function PlantDetail() {
  return (
    <PlantDetailPage
      catalog={PlantRoute.useLoaderData()}
      record={Route.useLoaderData()}
      returnTo={Route.useSearch().returnTo}
    />
  );
}
