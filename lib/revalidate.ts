import { revalidatePath, updateTag } from "next/cache";

/** Call from a server action after any admin change that visitors can see: expires cached data and pages immediately. */
export function refreshCatalog() {
  updateTag("catalog");
  revalidatePath("/", "layout");
}
