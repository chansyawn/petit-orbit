import type { SearchSchemaInput } from "@tanstack/react-router";
import type { DishSearch } from "@/features/dishes/model";
import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import { DishListPage } from "@/features/dishes/list-page";
import { defaultSearch, parseSearch } from "@/features/dishes/model";
import { Route as DishRoute } from "./collection.dishes";

export const Route = createFileRoute("/collection/dishes/")({
  validateSearch: (search: SearchSchemaInput & Partial<DishSearch>) => parseSearch(search),
  search: { middlewares: [stripSearchParams(defaultSearch)] },
  component: DishList,
});
function DishList() {
  const catalog = DishRoute.useLoaderData();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <DishListPage
      catalog={catalog}
      search={search}
      onSearch={(next, replace) => void navigate({ search: next, replace })}
    />
  );
}
