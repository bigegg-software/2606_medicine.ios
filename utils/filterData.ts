type HealthKitMetadataItem = {
  quantity?: number;
  sourceId?: string;
  sourceName?: string;
};

function pickSourceFromMetadata(metadata: unknown): {
  sourceId?: string;
  sourceName?: string;
} {
  if (!Array.isArray(metadata) || metadata.length === 0) {
    return {};
  }
  const first = metadata[0] as HealthKitMetadataItem | null | undefined;
  if (!first || typeof first !== 'object') {
    return {};
  }
  return {
    sourceId: typeof first.sourceId === 'string' ? first.sourceId : undefined,
    sourceName: typeof first.sourceName === 'string' ? first.sourceName : undefined,
  };
}

export default function filterData<T>(value: T): T {
  if (!Array.isArray(value)) {
    if (value && typeof value === 'object') {
      const next = { ...value } as Record<string, unknown>;
      const source = pickSourceFromMetadata(next.metadata);
      if (source.sourceId != null) next.sourceId = source.sourceId;
      if (source.sourceName != null) next.sourceName = source.sourceName;
      delete next.metadata;
      return next as T;
    }
    return value;
  }
  return value.map(item => {
    if (item && typeof item === 'object') {
      const next = { ...item } as Record<string, unknown>;
      const source = pickSourceFromMetadata(next.metadata);
      if (source.sourceId != null) next.sourceId = source.sourceId;
      if (source.sourceName != null) next.sourceName = source.sourceName;
      delete next.metadata;
      return next;
    }
    return item;
  }) as T;
}
