import type { SearchSchemaInput } from "@tanstack/react-router";
import type { CatalogSearch } from "@/features/furniture/model";
import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import { FurnitureListPage } from "@/features/furniture/list-page";
import { defaultSearch, parseSearch } from "@/features/furniture/model";
import { Route as FurnitureRoute } from "./collection.furniture";

export const Route = createFileRoute("/collection/furniture/sets")({
  validateSearch: (search: SearchSchemaInput & Partial<CatalogSearch>) => parseSearch(search),
  search: { middlewares: [stripSearchParams(defaultSearch)] },
  component: SetList,
});
function SetList() {
  const catalog = FurnitureRoute.useLoaderData();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <FurnitureListPage
      catalog={catalog}
      search={search}
      sets
      onSearch={(next, replace) => void navigate({ search: next, replace })}
    />
  );
}
