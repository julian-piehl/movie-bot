const cache = new Map<String, { timestamp: number; data: any }>();

export async function apiGet<T>(url: string): Promise<T> {
  if (cache.has(url)) {
    // Only return Cache if newer then 1 hour
    if (cache.get(url)!.timestamp > Date.now() - 1000 * 60 * 60) {
      return cache.get(url)!.data;
    } else {
      cache.delete(url);
    }
  }

  const response = await fetch(url).then((response) => {
    if (!response.ok) {
      throw new Error(response.statusText);
    }
    return response.json() as T;
  });

  cache.set(url, { timestamp: Date.now(), data: response });

  return response;
}
