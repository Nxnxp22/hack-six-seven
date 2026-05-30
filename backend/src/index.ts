import "dotenv/config";
import express from "express";
import cors from "cors";
import challengesRouter from "./modules/comm-failure/routes/challenge.route";

const app  = express();
const PORT = process.env.PORT ?? 3000;

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

app.use("/api/challenges", challengesRouter);

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});