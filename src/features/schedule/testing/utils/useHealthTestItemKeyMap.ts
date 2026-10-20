import { useCallback, useEffect, useState } from 'react';
import {
  listHealthTestItemKeyMapWithObjValueDes,
  type HealthTestItemKeyMap,
} from '@/api/healthTestItemKeyMap';
import { apiResourceData, isResourceApiOk } from '@/src/utils/apiHelpers';

let cachedKeyMapList: HealthTestItemKeyMap[] | null = null;
let inflight: Promise<HealthTestItemKeyMap[]> | null = null;

async function fetchHealthTestItemKeyMapList(): Promise<HealthTestItemKeyMap[]> {
  if (cachedKeyMapList) return cachedKeyMapList;
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const res = await listHealthTestItemKeyMapWithObjValueDes();
      if (!isResourceApiOk(res as { code?: number })) {
        cachedKeyMapList = [];
        return cachedKeyMapList;
      }
      const data = apiResourceData<HealthTestItemKeyMap[]>(res as never);
      cachedKeyMapList = Array.isArray(data) ? data : [];
      return cachedKeyMapList;
    } catch {
      cachedKeyMapList = [];
      return cachedKeyMapList;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}

/** 加载「多值填写」健康测试项 key 映射（带内存缓存） */
export function useHealthTestItemKeyMap() {
  const [list, setList] = useState<HealthTestItemKeyMap[]>(cachedKeyMapList ?? []);
  const [loading, setLoading] = useState(!cachedKeyMapList);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const next = await fetchHealthTestItemKeyMapList();
      setList(next);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { list, loading, reload };
}
