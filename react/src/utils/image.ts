// Helper to check if an image string is displayable
export const isRenderableImage = (src?: string): boolean =>
  !!src && (/^data:image\//i.test(src) || src.startsWith("/api/"));