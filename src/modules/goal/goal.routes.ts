// src/modules/goal/goal.routes.ts

import { Router } from "express"
import { authMiddleware } from "../../middleware/auth.middleware"

import {
  createGoal,
  getGoals,
  deleteGoal
} from "./goal.controller"

const router = Router()

router.use(authMiddleware)

router.post("/", createGoal)
router.get("/", getGoals)
router.delete("/:id", deleteGoal)

export default router