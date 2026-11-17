const BUCKET = "resources";

function encodePath(path: string) {
  return path.split("/").map(encodeURIComponent).join("/");
}

export function publicFileUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${encodePath(path)}`;
}

/** Same URL, but the browser is asked to save it under the original file name. */
export function downloadUrl(path: string, fileName: string) {
  return `${publicFileUrl(path)}?download=${encodeURIComponent(fileName)}`;
}

export const RESOURCE_BUCKET = BUCKET;
