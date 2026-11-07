/** `/dev/gallery` under any base path (the app is served from /Uzbekible/). */
export const isGalleryPath = (pathname: string): boolean => /\/dev\/gallery\/?$/.test(pathname);
