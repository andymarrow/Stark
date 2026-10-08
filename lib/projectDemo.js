/**
 * "Can I actually try this thing?"
 *
 * Shared so the grid and the feed can't disagree: both the entries grid
 * and the list view show a "has demo" count, and if each decided for
 * itself what counted, the same contest would report two different
 * numbers depending on which view you were looking at.
 *
 * A project counts as having a demo if it filled in the dedicated demo
 * field, or added an extra link of type "website" — which is the same
 * thing entered in the other box.
 */
export function hasLiveDemo(project) {
  if (!project) return false;
  if (project.demo_link) return true;
  const extra = Array.isArray(project.additional_links) ? project.additional_links : [];
  return extra.some((l) => l?.url && l?.type === "website");
}
