import { unstable_cache } from "next/cache";
import { getCourseOptions } from "@/components/admin/course-options";
import { createPublicClient } from "@/lib/supabase/public";
import {
  getCourseWith, getCoursesForDepartmentWith, getDepartmentBySlugWith, getDepartmentsWith, getFeaturedResourcesWith,
  getFilterOptionsWith, getMostDownloadedWith, getPopularCoursesWith, getRecentResourcesWith, getResourceWith,
  searchResourcesWith, type ResourceSearch,
} from "@/lib/queries";

export type { ResourceSearch };

/**
 * Cached reads for the public site. Visitors share one copy instead of each hitting the database.
 * The cache is cleared the moment an admin changes anything (see lib/revalidate.ts) and otherwise
 * refreshes itself every minute, so download counts are at most about a minute behind.
 */
const TTL_SECONDS = 60;
function cached<A extends unknown[], R>(name: string, fn: (...args: A) => Promise<R>) {
  return unstable_cache(fn, ["catalog", name], { revalidate: TTL_SECONDS, tags: ["catalog"] });
}

export const searchResources = cached("search", (p: ResourceSearch, featuredOnly?: boolean) => searchResourcesWith(createPublicClient(), p, featuredOnly));
export const getRecentResources = cached("recent", (limit?: number) => getRecentResourcesWith(createPublicClient(), limit));
export const getFeaturedResources = cached("featured", (limit?: number) => getFeaturedResourcesWith(createPublicClient(), limit));
export const getMostDownloaded = cached("top-downloads", (limit?: number) => getMostDownloadedWith(createPublicClient(), limit));
export const getResource = cached("resource", (id: string) => getResourceWith(createPublicClient(), id));
export const getDepartments = cached("departments", (limit?: number) => getDepartmentsWith(createPublicClient(), limit));
export const getDepartmentBySlug = cached("department", (slug: string) => getDepartmentBySlugWith(createPublicClient(), slug));
export const getCoursesForDepartment = cached("dept-courses", (id: string) => getCoursesForDepartmentWith(createPublicClient(), id));
export const getCourse = cached("course", (id: string) => getCourseWith(createPublicClient(), id));
export const getPopularCourses = cached("popular-courses", (limit?: number) => getPopularCoursesWith(createPublicClient(), limit));
export const getFilterOptions = cached("filters", () => getFilterOptionsWith(createPublicClient()));
export const getCourseOptionsPublic = cached("course-options", () => getCourseOptions(createPublicClient()));
export const getDepartmentOptions = cached("department-options", async () => {
  const { data } = await createPublicClient().from("departments").select("id, name").order("name");
  return (data ?? []) as { id: string; name: string }[];
});
