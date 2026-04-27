// PHASE 2 ADDITION
// Sort professionals based on job quality score (answers.meta.score)

// After job is fetched, extract score
const jobScore = (job?.answers as any)?.meta?.score ?? 0;

// Modify matchedPros sorting before render
const sortedPros = [...matchedPros].sort((a, b) => {
  // Higher job quality increases weight of match_score
  const weight = jobScore >= 3 ? 1.2 : 1;
  const aScore = (a.match_score || 0) * weight;
  const bScore = (b.match_score || 0) * weight;
  return bScore - aScore;
});

// Replace matchedPros.map with sortedPros.map
