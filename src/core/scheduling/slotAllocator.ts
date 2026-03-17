// src/core/scheduling/slotAllocator.ts

import { Task, TimeSlot } from "../../shared/types"

export interface AllocationResult {
  taskId: string
  startTime: Date
  endTime: Date
  durationMinutes: number
}

export function allocateTasksToSlots(
  tasks: Task[],
  freeSlots: TimeSlot[]
): AllocationResult[] {

  const allocations: AllocationResult[] = []

  // Clone slots so we don't mutate original
  const slots = [...freeSlots]

  for (const task of tasks) {

    let remainingMinutes = task.estimatedMinutes

    for (const slot of slots) {

      if (remainingMinutes <= 0) break

      if (slot.durationMinutes <= 0) continue

      const allocationMinutes = Math.min(
        remainingMinutes,
        slot.durationMinutes
      )

      const startTime = new Date(slot.startTime)
      const endTime = new Date(startTime.getTime() + allocationMinutes * 60000)
      const durationMinutes =
      (endTime.getTime() - startTime.getTime()) / 60000

      allocations.push({
        taskId: task.id,
        startTime,
        endTime,
        durationMinutes
      })

      // Reduce slot
      slot.startTime = endTime
      slot.durationMinutes -= allocationMinutes

      remainingMinutes -= allocationMinutes
    }
  }

  return allocations
}
