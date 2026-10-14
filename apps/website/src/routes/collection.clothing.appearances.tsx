import type { SearchSchemaInput } from "@tanstack/react-router";
import type { ClothingSearch } from "@/features/clothing/model";
import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import { ClothingListPage } from "@/features/clothing/list-page";
import { defaultSearch, parseSearch } from "@/features/clothing/model";
import { Route as ClothingRoute } from "./collection.clothing";

export const Route = createFileRoute("/collection/clothing/appearances")({
  validateSearch: (search: SearchSchemaInput & Partial<ClothingSearch>) =>
    parseSearch(search, "appearances"),
  search: { middlewares: [stripSearchParams(defaultSearch)] },
  component: ClothingList,
});
function ClothingList() {
  const catalog = ClothingRoute.useLoaderData();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <ClothingListPage
      catalog={catalog}
      search={search}
      kind="appearances"
      onSearch={(next, replace) => void navigate({ search: next, replace })}
    />
  );
}
