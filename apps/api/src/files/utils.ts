function buildPublicUrl(storageKey: string): string {
  const base = process.env.ASSETS_BASE_URL;
  if (!base) throw new Error("ASSETS_BASE_URL is missing");
  return `${base}/${storageKey}`;
}
export function withFileUrl<
  T extends { [key: string]: unknown },
  K extends string,
>(
  entity: T,
  fileRelationKey: K,
  urlKey: string,
): Omit<T, K> & Record<string, string | null> {
  const file = entity[fileRelationKey] as { storageKey: string } | null;
  const { [fileRelationKey]: _omit, ...rest } = entity;

  return {
    ...rest,
    [urlKey]: file ? buildPublicUrl(file.storageKey) : null,
  } as Omit<T, K> & Record<string, string | null>;
}
