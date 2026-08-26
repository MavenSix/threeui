const PUBLIC_MEDIA_PATH = /^\/(?:previews|thumbnails)\//;

function runtimeEnv(name) {
  const value = import.meta.env?.[name];
  return typeof value === "string" ? value.trim() : "";
}

function normalizedBaseUrl(value) {
  return typeof value === "string" ? value.trim().replace(/\/+$/, "") : "";
}

function mediaOptions(options = {}) {
  return {
    baseUrl: normalizedBaseUrl(
      Object.hasOwn(options, "baseUrl") ? options.baseUrl : runtimeEnv("VITE_MEDIA_BASE_URL"),
    ),
    cacheNonce: String(
      Object.hasOwn(options, "cacheNonce") ? options.cacheNonce ?? "" : runtimeEnv("VITE_MEDIA_CACHE_NONCE"),
    ).trim(),
  };
}

export function isPublicMediaPath(value) {
  return typeof value === "string" && PUBLIC_MEDIA_PATH.test(value);
}

export function resolvePublicMediaUrl(localPath, options) {
  if (!isPublicMediaPath(localPath)) return localPath;
  const { baseUrl, cacheNonce } = mediaOptions(options);
  if (!baseUrl) return localPath;

  const url = new URL(localPath.replace(/^\/+/, ""), `${baseUrl}/`);
  if (cacheNonce) url.searchParams.set("cacheNonce", cacheNonce);
  return url.href;
}

export function localPublicMediaPath(value, options) {
  if (isPublicMediaPath(value)) return value;
  const { baseUrl } = mediaOptions(options);
  if (!baseUrl || typeof value !== "string" || !value.startsWith(`${baseUrl}/`)) return value;

  const url = new URL(value);
  return `/${url.pathname.slice(new URL(`${baseUrl}/`).pathname.length).replace(/^\/+/, "")}`;
}

export function fallbackToLocalMedia(element, localPath) {
  if (!element || !isPublicMediaPath(localPath) || element.dataset.mediaFallback === "local") return;
  element.dataset.mediaFallback = "local";
  element.src = localPath;

  if (typeof HTMLVideoElement !== "undefined" && element instanceof HTMLVideoElement) {
    element.load();
    if (element.autoplay) void element.play().catch(() => undefined);
  }
}
