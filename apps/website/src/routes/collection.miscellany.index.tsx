import type { SearchSchemaInput } from "@tanstack/react-router";
import type { MiscellanySearch } from "@/features/miscellany/model";
import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import { MiscellanyListPage } from "@/features/miscellany/list-page";
import { defaultSearch, parseSearch } from "@/features/miscellany/model";
import { Route as MiscellanyRoute } from "./collection.miscellany";

export const Route = createFileRoute("/collection/miscellany/")({
  validateSearch: (search: SearchSchemaInput & Partial<MiscellanySearch>) => parseSearch(search),
  search: { middlewares: [stripSearchParams(defaultSearch)] },
  component: MiscellanyList,
});
function MiscellanyList() {
  const catalog = MiscellanyRoute.useLoaderData();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <MiscellanyListPage
      catalog={catalog}
      search={search}
      onSearch={(next, replace) => void navigate({ search: next, replace })}
    />
  );
}
