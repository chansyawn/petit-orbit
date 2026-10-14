import { useState } from "react";
import type { ReactNode } from "react";
import type { BasicRecord } from "@petit-orbit/content-schema";
import { ImageOffIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/components/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia } from "@/ui/components/empty";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/ui/components/pagination";

export function CatalogImage({
  image,
  name,
  eager = false,
}: {
  image: string | null;
  name: string;
  eager?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="flex aspect-square items-center justify-center rounded-xl bg-muted/50 p-4">
      {image && !failed ? (
        <img
          src={`/resources/${image}`}
          alt={name}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          width={320}
          height={320}
          className="h-full w-full object-contain"
          ref={(element) => {
            if (element?.complete && element.naturalWidth === 0) setFailed(true);
          }}
          onError={() => setFailed(true)}
        />
      ) : (
        <Empty className="gap-2 p-0">
          <EmptyHeader>
            <EmptyMedia className="mb-0 text-muted-foreground">
              <ImageOffIcon aria-hidden="true" className="size-8" />
            </EmptyMedia>
            <EmptyDescription>{failed ? "图片加载失败" : "暂无图片"}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </div>
  );
}
export function qualityLabel(quality: number | null) {
  return quality === null ? "品质暂无资料" : `品质 ${quality}`;
}
export function CatalogCard({ record, children }: { record: BasicRecord; children?: ReactNode }) {
  return (
    <article className="h-full">
      <Card
        size="sm"
        className="h-full gap-3 rounded-xl border p-3 shadow-none ring-0 transition-colors hover:border-primary"
      >
        <CardContent className="px-0">
          <CatalogImage key={record.image} image={record.image} name={record.name} />
        </CardContent>
        <CardHeader className="px-0">
          <CardTitle>
            <h2 className="font-semibold wrap-break-word">{record.name}</h2>
          </CardTitle>
          <CardDescription>{qualityLabel(record.quality)}</CardDescription>
        </CardHeader>
        {children && <CardContent className="px-0">{children}</CardContent>}
      </Card>
    </article>
  );
}
export function Attributes({ values }: { values: [string, string | number | null][] }) {
  return (
    <dl className="grid gap-4 sm:grid-cols-2">
      {values.map(([label, value]) => (
        <div key={label} className="min-w-0 border-b pb-3">
          <dt className="mb-1 text-sm text-muted-foreground">{label}</dt>
          <dd className="whitespace-pre-wrap wrap-break-word">{value ?? "暂无资料"}</dd>
        </div>
      ))}
    </dl>
  );
}
export function CatalogPagination({
  page,
  pages,
  onChange,
}: {
  page: number;
  pages: number;
  onChange: (page: number) => void;
}) {
  return (
    <Pagination aria-label="分页">
      <PaginationContent className="flex-wrap justify-center gap-4">
        <PaginationItem>
          <PaginationPrevious
            text="上一页"
            aria-label="上一页"
            variant="outline"
            render={<button type="button" />}
            nativeButton
            disabled={page <= 1}
            onClick={() => onChange(page - 1)}
          />
        </PaginationItem>
        <PaginationItem>
          <span className="text-sm">
            第 {page} / {pages} 页
          </span>
        </PaginationItem>
        <PaginationItem>
          <PaginationNext
            text="下一页"
            aria-label="下一页"
            variant="outline"
            render={<button type="button" />}
            nativeButton
            disabled={page >= pages}
            onClick={() => onChange(page + 1)}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
export function CatalogGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
      {children}
    </div>
  );
}
