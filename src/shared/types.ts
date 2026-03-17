// Goal Domain Model
export interface Goal {
  id: string
  title: string
  description?: string
  deadline: Date
  dailyAvailableMinutes: number
  preferredFocusWindow?: "morning" | "afternoon" | "evening"
  status: "active" | "completed"
  createdAt: Date
}

// Task Domain Model
export interface Task {
  id: string
  userId: string
  goalId: string
  title: string
  description?: string
  estimatedMinutes: number
  impactScore: number     // 1–5
  urgencyScore: number    // 1–5
  revenueScore: number    // 1–5
  priorityScore: number
  status: "pending" | "scheduled" | "completed"
  createdAt: Date
  deadline: Date
}

// Scheduled Block
export interface ScheduleBlock {
  id: string
  taskId: string
  startTime: Date
  endTime: Date
  calendarEventId?: string
  status: "scheduled" | "completed" | "missed"
}

// Priority Calculation Input (Domain Subset)
export interface PriorityInput {
  estimatedMinutes: number
  impactScore: number
  urgencyScore: number
  revenueScore: number
}

export interface TimeSlot {
  startTime: Date
  endTime: Date
  durationMinutes: number
}