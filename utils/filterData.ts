export default function filterData<T>(value: T): T {
  if (!Array.isArray(value)) {
    return value;
  }
  return value.map(item => {
    if (item && typeof item === 'object') {
      const next = { ...item } as Record<string, unknown>;
      delete next.metadata;
      return next;
    }
    return item;
  }) as T;
}
