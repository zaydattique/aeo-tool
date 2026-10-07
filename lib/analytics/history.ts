export type MetricHistoryPoint = {
  id: string;
  observedAt: Date;
  value: number;
};

export function sortMetricHistory(points: MetricHistoryPoint[]): MetricHistoryPoint[] {
  return [...points].sort((a, b) => {
    const time = a.observedAt.getTime() - b.observedAt.getTime();
    return time || a.id.localeCompare(b.id);
  });
}

export function paginateMetricHistory(
  points: MetricHistoryPoint[],
  pageSize: number,
  cursor?: string,
): { items: MetricHistoryPoint[]; nextCursor: string | null } {
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
    throw new Error("INVALID_PAGE_SIZE");
  }

  const ordered = sortMetricHistory(points);
  const start = cursor ? ordered.findIndex((point) => point.id === cursor) + 1 : 0;
  if (cursor && start === 0) throw new Error("INVALID_CURSOR");

  const items = ordered.slice(start, start + pageSize);
  const hasMore = start + pageSize < ordered.length;
  return {
    items,
    nextCursor: hasMore ? items[items.length - 1]?.id ?? null : null,
  };
}
