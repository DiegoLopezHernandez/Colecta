/**
 * Distancia de Levenshtein normalizada a [0..100] (100 = idénticos).
 */
export function similarityPercent(a: string, b: string): number {
  const s1 = a.trim().toLowerCase();
  const s2 = b.trim().toLowerCase();
  if (s1 === s2) return 100;
  if (!s1 || !s2) return 0;
  const d = levenshtein(s1, s2);
  const maxLen = Math.max(s1.length, s2.length);
  return Math.round(((maxLen - d) / maxLen) * 100);
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp: number[] = new Array(n + 1);
  for (let j = 0; j <= n; j++) dp[j] = j;
  for (let i = 1; i <= m; i++) {
    let prev = dp[0]!;
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j]!;
      dp[j] = a[i - 1] === b[j - 1]
        ? prev
        : Math.min(prev + 1, dp[j]! + 1, dp[j - 1]! + 1);
      prev = tmp;
    }
  }
  return dp[n]!;
}
