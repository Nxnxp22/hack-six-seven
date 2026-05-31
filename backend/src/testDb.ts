import db from './db.js';

try {
  console.log("Querying database...");
  const scores = await db.simonSaysScore.findMany();
  console.log("SUCCESS! Scores:", scores);
} catch (err: any) {
  console.error("ERROR QUERYING DATABASE:");
  console.error(err);
}
