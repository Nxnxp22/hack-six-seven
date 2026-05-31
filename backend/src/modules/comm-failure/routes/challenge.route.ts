import { Router } from "express";
import { ChallengeController } from "../controllers/challenge.controller";

const router = Router();

router.get("/",       ChallengeController.getMany);
router.get("/all",    ChallengeController.getAll);
router.post("/",      ChallengeController.create);
router.patch("/:id",  ChallengeController.update);
router.delete("/:id", ChallengeController.remove);

export default router;