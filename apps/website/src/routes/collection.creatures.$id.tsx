import { createFileRoute, notFound } from "@tanstack/react-router";
import { CreatureDetailPage } from "@/features/creatures/detail-page";
import { parseDetailSearch } from "@/features/creatures/model";
import { parseId } from "@/features/catalog/model";
import { Route as CreatureRoute } from "./collection.creatures";

export const Route = createFileRoute("/collection/creatures/$id")({
  validateSearch: parseDetailSearch,
  loader: async ({ params, parentMatchPromise }) => {
    const parent = await parentMatchPromise;
    const record = parent.loaderData?.items.find((record) => record.id === parseId(params.id));
    if (!record) throw notFound();
    return record;
  },
  component: CreatureDetail,
});
function CreatureDetail() {
  return (
    <CreatureDetailPage
      catalog={CreatureRoute.useLoaderData()}
      record={Route.useLoaderData()}
      returnTo={Route.useSearch().returnTo}
    />
  );
}
