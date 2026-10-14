export const pageSize = 24;

export function splitValues(value: string | null): string[] {
  return [
    ...new Set(
      (value ?? "")
        .split("，")
        .map((part) => part.trim())
        .filter(Boolean),
    ),
  ];
}

export function paginate<T>(items: T[], requestedPage: number) {
  const pages = Math.max(1, Math.ceil(items.length / pageSize));
  const page = Math.min(pages, Math.max(1, requestedPage));
  return {
    items: items.slice((page - 1) * pageSize, page * pageSize),
    page,
    pages,
    total: items.length,
  };
}

export function parseId(value: string): number | undefined {
  const id = Number(value);
  return /^\d+$/.test(value) && Number.isSafeInteger(id) && id > 0 ? id : undefined;
}
