import { PriorityInput } from "../../shared/types"

export function calculatePriority(task: PriorityInput & { deadline: Date }): number {

  const today = new Date()
  const timeDiff = task.deadline.getTime() - today.getTime()
  const daysRemaining = Math.max(
    1,
    Math.ceil(timeDiff / (1000 * 60 * 60 * 24))
  )

  // 🔥 Deadline pressure factor
  const deadlineFactor = 1 / daysRemaining

  const baseScore =
    task.impactScore * 0.4 +
    task.urgencyScore * 0.3 +
    task.revenueScore * 0.3

  const timePenalty = task.estimatedMinutes / 60

  const finalScore =
    (baseScore * (1 + deadlineFactor)) / timePenalty

  return Number(finalScore.toFixed(2))
}