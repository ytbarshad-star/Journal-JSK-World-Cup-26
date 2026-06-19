// src/lib/points.ts

export interface PointsResult {
  winner_correct: boolean;
  exact_score: boolean;
  points: number;
}

export function calculatePoints(
  actualA: number,
  actualB: number,
  predictedA: number,
  predictedB: number
): PointsResult {
  let points = 0;
  let winner_correct = false;
  let exact_score = false;

  // Exact score check
  if (predictedA === actualA && predictedB === actualB) {
    exact_score = true;
    points += 5;
  }

  // Winner / draw check
  const actualWinner =
    actualA > actualB ? 'A' : actualB > actualA ? 'B' : 'DRAW';
  const predictedWinner =
    predictedA > predictedB ? 'A' : predictedB > predictedA ? 'B' : 'DRAW';

  if (actualWinner === predictedWinner) {
    winner_correct = true;
    points += 5;
  }

  return { winner_correct, exact_score, points };
}
