// src/core/scheduling/timeSlotGenerator.ts

import { TimeSlot } from "../../shared/types"

export interface CalendarEvent {
  start: Date
  end: Date
}


export function generateFreeTimeSlots(
  date: Date,
  busyEvents: CalendarEvent[],
  workStartHour = 10,
  workEndHour = 16
): TimeSlot[] {

  const dayStart = new Date(date)
  dayStart.setHours(workStartHour, 0, 0, 0)

  const dayEnd = new Date(date)
  dayEnd.setHours(workEndHour, 0, 0, 0)

  const slots: TimeSlot[] = []

  // Sort busy events by start time
  const sortedEvents = busyEvents
    .filter(e => e.end > dayStart && e.start < dayEnd)
    .sort((a, b) => a.start.getTime() - b.start.getTime())

  let currentPointer = new Date(dayStart)

  for (const event of sortedEvents) {

    if (event.start > currentPointer) {
      const duration = (
        event.start.getTime() - currentPointer.getTime()
      ) / 60000

      slots.push({
        startTime: new Date(currentPointer),
        endTime: new Date(event.start),
        durationMinutes: duration,
      })
    }

    if (event.end > currentPointer) {
      currentPointer = new Date(event.end)
    }
  }

  // Remaining time after last event
  if (currentPointer < dayEnd) {
    const duration = (
      dayEnd.getTime() - currentPointer.getTime()
    ) / 60000

    slots.push({
      startTime: new Date(currentPointer),
      endTime: new Date(dayEnd),
      durationMinutes: duration,
    })
  }

  return slots
}
