import { createFileRoute, notFound } from "@tanstack/react-router";
import { MiscellanyDetailPage } from "@/features/miscellany/detail-page";
import { parseDetailSearch } from "@/features/miscellany/model";
import { parseId } from "@/features/catalog/model";

export const Route = createFileRoute("/collection/miscellany/$id")({
  validateSearch: parseDetailSearch,
  loader: async ({ params, parentMatchPromise }) => {
    const parent = await parentMatchPromise;
    const record = parent.loaderData?.items.find((record) => record.id === parseId(params.id));
    if (!record) throw notFound();
    return record;
  },
  component: MiscellanyDetail,
});
function MiscellanyDetail() {
  return (
    <MiscellanyDetailPage record={Route.useLoaderData()} returnTo={Route.useSearch().returnTo} />
  );
}
