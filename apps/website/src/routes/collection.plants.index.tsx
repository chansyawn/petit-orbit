import type { SearchSchemaInput } from "@tanstack/react-router";
import type { PlantSearch } from "@/features/plants/model";
import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import { PlantListPage } from "@/features/plants/list-page";
import { defaultSearch, parseSearch } from "@/features/plants/model";
import { Route as PlantRoute } from "./collection.plants";

export const Route = createFileRoute("/collection/plants/")({
  validateSearch: (search: SearchSchemaInput & Partial<PlantSearch>) => parseSearch(search),
  search: { middlewares: [stripSearchParams(defaultSearch)] },
  component: PlantList,
});
function PlantList() {
  const catalog = PlantRoute.useLoaderData();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <PlantListPage
      catalog={catalog}
      search={search}
      onSearch={(next, replace) => void navigate({ search: next, replace })}
    />
  );
}
