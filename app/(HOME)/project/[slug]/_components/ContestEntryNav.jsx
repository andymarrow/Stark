import Link from "next/link";
import { ChevronLeft, ChevronRight, Trophy } from "lucide-react";

/**
 * Prev/next walk through a contest's entries, shown only on projects that
 * are actually submitted to one. Built for reviewers going through the
 * list in order — "back to entries" returns to the entries tab itself,
 * not the contest's description.
 */
export default function ContestEntryNav({ nav }) {
  if (!nav || nav.total < 2) return null;

  const { contestTitle, contestSlug, position, total, prev, next } = nav;

  const arrowBase =
    "flex items-center gap-1.5 px-3 py-2 text-[10px] font-mono uppercase tracking-widest border transition-colors";
  const enabled =
    "border-border text-muted-foreground hover:text-accent hover:border-accent";
  const disabled = "border-border/40 text-muted-foreground/30 cursor-not-allowed";

  return (
    <nav className="border-b border-border/40 bg-secondary/5">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between gap-3">
        <Link
          href={`/contests/${contestSlug}?tab=entries`}
          className="flex items-center gap-2 min-w-0 text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:text-accent transition-colors"
        >
          <Trophy size={12} className="text-yellow-500 shrink-0" />
          <span className="truncate hidden sm:inline">{contestTitle}</span>
          <span className="sm:hidden">Entries</span>
        </Link>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground tabular-nums">
            {position} / {total}
          </span>

          {prev ? (
            <Link href={`/project/${prev.slug}`} className={`${arrowBase} ${enabled}`} title={prev.title}>
              <ChevronLeft size={12} />
              <span className="hidden sm:inline">Prev</span>
            </Link>
          ) : (
            <span className={`${arrowBase} ${disabled}`} aria-disabled="true">
              <ChevronLeft size={12} />
              <span className="hidden sm:inline">Prev</span>
            </span>
          )}

          {next ? (
            <Link href={`/project/${next.slug}`} className={`${arrowBase} ${enabled}`} title={next.title}>
              <span className="hidden sm:inline">Next</span>
              <ChevronRight size={12} />
            </Link>
          ) : (
            <span className={`${arrowBase} ${disabled}`} aria-disabled="true">
              <span className="hidden sm:inline">Next</span>
              <ChevronRight size={12} />
            </span>
          )}
        </div>
      </div>
    </nav>
  );
}
