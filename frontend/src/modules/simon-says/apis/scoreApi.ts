const BASE = '/api/simon-says/scores';

export interface ScoreRecord {
  id: number;
  playerName: string;
  difficulty: string;
  score: number;
  win: boolean;
  timeTakenMs: number;
  createdAt: string;
}

export async function createScore(data: Omit<ScoreRecord, 'id' | 'createdAt'>) {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to save score');
  return res.json();
}

export async function getAllScores(): Promise<ScoreRecord[]> {
  const res = await fetch(BASE);
  if (!res.ok) throw new Error('Failed to fetch scores');
  return res.json();
}

export async function updateScore(id: number, data: Partial<ScoreRecord>) {
  const res = await fetch(`${BASE}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update score');
  return res.json();
}

export async function deleteScore(id: number): Promise<void> {
  const res = await fetch(`${BASE}/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete score');
}