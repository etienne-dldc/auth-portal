export function buildUrl(
  path: string,
  queryParams?: Record<string, string | number | boolean | undefined>,
): string {
  const params = new URLSearchParams();

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined) {
        params.append(key, String(value));
      }
    }
  }

  const queryString = params.toString();
  return queryString ? `${path}?${queryString}` : path;
}
