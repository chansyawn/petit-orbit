import type { SearchSchemaInput } from "@tanstack/react-router";
import type { CreatureSearch } from "@/features/creatures/model";
import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import { CreatureListPage } from "@/features/creatures/list-page";
import { defaultSearch, parseSearch } from "@/features/creatures/model";
import { Route as CreatureRoute } from "./collection.creatures";

export const Route = createFileRoute("/collection/creatures/")({
  validateSearch: (search: SearchSchemaInput & Partial<CreatureSearch>) => parseSearch(search),
  search: { middlewares: [stripSearchParams(defaultSearch)] },
  component: CreatureList,
});
function CreatureList() {
  const catalog = CreatureRoute.useLoaderData();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <CreatureListPage
      catalog={catalog}
      search={search}
      onSearch={(next, replace) => void navigate({ search: next, replace })}
    />
  );
}
