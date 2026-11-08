/** `/dev/soxta` under any base path. */
export const isSoxtaPreviewPath = (pathname: string): boolean => /\/dev\/soxta\/?$/.test(pathname);
