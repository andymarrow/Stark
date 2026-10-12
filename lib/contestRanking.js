/**
 * The contest ranking engine. One implementation, used by both the
 * organiser's Results Matrix and the public winners page.
 *
 * There used to be two. They disagreed, which is how a contest could show
 * one set of winners to the host and a different set to everyone else.
 * The public one also assumed every judge scored on the contest's default
 * rubric, so any judge with their own rubric had their scores looked up
 * under names that didn't exist — read as missing, counted as zero, and
 * shown as "-" in the per-judge breakdown.
 *
 * How a score is produced:
 *
 *  1. Each judge's scores are weighted using THEIR OWN rubric, giving one
 *     0-10 total per judge per project. Automatic metrics (likes, views)
 *     are computed from platform data, normalised against the best entry.
 *  2. Each judge's total is re-expressed as how far it sits from that
 *     judge's own average, in that judge's own spread, then placed back on
 *     the global scale. Judges score on very different scales — across the
 *     first hackathon their means ran from 2.04 to 5.30 out of 10 — so
 *     without this, which judges happened to review you mattered more than
 *     the work did.
 *  3. The project is pulled toward the global mean in proportion to how
 *     few judges saw it. Coverage is uneven in practice (half the field
 *     seen by two judges, half by eight) and a two-judge average is mostly
 *     noise, so a thin sample has to be exceptional rather than lucky.
 *
 * A judge who hasn't scored a project is excluded from it, never counted
 * as a zero.
 */

const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const stdDev = (xs, m) => (xs.length ? Math.sqrt(mean(xs.map((x) => (x - m) ** 2))) : 0);

/** Resolve one metric to a 0-10 value, or null when the judge didn't score it. */
export function scoreForMetric(metric, project, judgeScore, { maxLikes, maxViews }) {
  if (metric.type === "likes") return ((project.likes_count || 0) / maxLikes) * 10;
  if (metric.type === "views") return ((project.views || 0) / maxViews) * 10;
  const v = judgeScore?.scores?.[metric.name];
  return v !== undefined && v !== null ? v : null;
}

/** One judge's weighted 0-10 total for one project, on that judge's rubric. */
export function judgeWeightedTotal(rubric, project, judgeScore, maxes) {
  let total = 0;
  for (const m of rubric) {
    const v = scoreForMetric(m, project, judgeScore, maxes);
    total += (v || 0) * ((parseFloat(m.weight) || 0) / 100);
  }
  return total;
}

/**
 * @param shrinkage how many judges a project needs before its own average
 *        outweighs the field's. At 4: two judges keep a third of their own
 *        score, eight judges keep two thirds.
 */
export function buildContestRanking({ contest, judges = [], submissions = [], scores = [], shrinkage = 4 }) {
  const maxLikes = Math.max(...submissions.map((s) => s.project?.likes_count || 0), 1);
  const maxViews = Math.max(...submissions.map((s) => s.project?.views || 0), 1);
  const maxes = { maxLikes, maxViews };

  const rubricFor = (judge) => judge?.metrics_config || contest?.metrics_config || [];

  // Pass 1 — every (judge, project) total, so judge behaviour can be
  // measured before any project is compared with another.
  const rawTotals = [];
  for (const sub of submissions) {
    const project = sub.project;
    if (!project) continue;
    for (const j of judges) {
      const judgeScore = scores.find((s) => s.project_id === project.id && s.judge_id === j.id);
      if (!judgeScore) continue;
      rawTotals.push({
        judgeId: j.id,
        projectId: project.id,
        judgeScore,
        value: judgeWeightedTotal(rubricFor(j), project, judgeScore, maxes),
      });
    }
  }

  const globalMean = mean(rawTotals.map((r) => r.value));
  const globalSd = stdDev(rawTotals.map((r) => r.value), globalMean) || 1;

  const judgeStats = {};
  for (const j of judges) {
    const mine = rawTotals.filter((r) => r.judgeId === j.id).map((r) => r.value);
    if (!mine.length) continue;
    const m = mean(mine);
    judgeStats[j.id] = { mean: m, sd: stdDev(mine, m) || 1, count: mine.length };
  }

  const rows = submissions
    .filter((s) => s.project)
    .map((sub) => {
      const project = sub.project;
      const mine = rawTotals.filter((r) => r.projectId === project.id);

      const normalised = mine.map((r) => {
        const st = judgeStats[r.judgeId];
        if (!st) return r.value;
        return globalMean + ((r.value - st.mean) / st.sd) * globalSd;
      });

      const n = normalised.length;
      const adjusted = n
        ? (n / (n + shrinkage)) * mean(normalised) + (shrinkage / (n + shrinkage)) * globalMean
        : 0;

      // Per-judge detail for the drill-down, each on that judge's own
      // rubric so the numbers shown are the ones actually given.
      const judgeBreakdown = mine.map((r) => {
        const judge = judges.find((j) => j.id === r.judgeId);
        const rubric = rubricFor(judge);
        return {
          judgeId: r.judgeId,
          judge,
          rubric,
          weightedTotal: r.value,
          metrics: rubric.map((m) => ({
            name: m.name,
            weight: m.weight,
            type: m.type,
            value: scoreForMetric(m, project, r.judgeScore, maxes),
          })),
        };
      });

      // Column averages for the public table. Only judges whose rubric
      // actually contains a metric contribute to it — a metric nobody was
      // asked to score reads as null rather than a misleading zero.
      const metricAverages = {};
      for (const m of contest?.metrics_config || []) {
        if (m.type === "likes") { metricAverages[m.name] = (project.likes_count / maxLikes) * 10; continue; }
        if (m.type === "views") { metricAverages[m.name] = (project.views / maxViews) * 10; continue; }
        const vals = mine
          .map((r) => r.judgeScore?.scores?.[m.name])
          .filter((v) => v !== undefined && v !== null);
        metricAverages[m.name] = vals.length ? mean(vals) : null;
      }

      return {
        ...sub,
        project,
        projectScores: mine.map((r) => r.judgeScore),
        judgeBreakdown,
        metricAverages,
        judgesScored: n,
        rawAverage: Number(mean(mine.map((r) => r.value)).toFixed(2)),
        finalTotal: Number(Math.max(0, Math.min(10, adjusted)).toFixed(2)),
      };
    })
    .sort((a, b) => b.finalTotal - a.finalTotal);

  return { rows, globalMean, judgeStats };
}
