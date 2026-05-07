export function interpretAnswers(answers: any) {
  const flags: string[] = [];
  const highlights: string[] = [];
  let score = 0;

  if (answers?.logistics?.budgetRange) {
    score += 2;
    highlights.push("Budget Defined");
  } else {
    flags.push("MISSING_BUDGET");
  }

  if (answers?.logistics?.budgetRange === 'over_5000') {
    flags.push("INSPECTION_REQUIRED");
    highlights.push("High Value Job");
    score += 2;
  }

  if (answers?.extras?.notes && answers.extras.notes.length > 20) {
    score += 2;
  } else {
    flags.push("WEAK_DESCRIPTION");
  }

  if ((answers?.extras?.photos?.length ?? 0) > 0) {
    highlights.push("Photos Provided");
    score += 1;
  }

  return { flags, highlights, score };
}
