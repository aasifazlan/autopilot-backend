// src/core/scheduling/timeSlotGenerator.ts

import { TimeSlot } from "../../shared/types"

export interface CalendarEvent {
  start: Date
  end: Date
}

// 🔧 Config (can later come from user preferences)
const DEFAULT_START_HOUR = 8   // 8 AM
const DEFAULT_END_HOUR = 22    // 10 PM
const SLOT_DURATION = 60       // 60 mins focus
const BREAK_DURATION = 15      // 15 mins break

// 🔥 Merge overlapping busy events
function mergeBusyEvents(events: CalendarEvent[]): CalendarEvent[] {
  if (events.length === 0) return []

  const sorted = [...events].sort(
    (a, b) => a.start.getTime() - b.start.getTime()
  )

  const merged: CalendarEvent[] = [ { ...sorted[0] } ]

  for (let i = 1; i < sorted.length; i++) {
    const last = merged[merged.length - 1]
    const current = sorted[i]

    if (current.start <= last.end) {
      // overlap → extend
      last.end = new Date(
        Math.max(last.end.getTime(), current.end.getTime())
      )
    } else {
      merged.push({ ...current })
    }
  }

  return merged
}

// 🔥 Split large free window into structured slots
function splitIntoSubSlots(
  start: Date,
  end: Date,
  slotDuration = SLOT_DURATION
): TimeSlot[] {

  const slots: TimeSlot[] = []

  // ❌ Ignore very small gaps
  if (
    end.getTime() - start.getTime() <
    slotDuration * 60000
  ) {
    return []
  }

  let pointer = new Date(start)

  while (
    pointer.getTime() + slotDuration * 60000 <= end.getTime()
  ) {
    const slotEnd = new Date(
      pointer.getTime() + slotDuration * 60000
    )

    slots.push({
      startTime: new Date(pointer),
      endTime: slotEnd,
      durationMinutes: slotDuration,
    })

    // Move pointer forward with break
    pointer = new Date(
      slotEnd.getTime() + BREAK_DURATION * 60000
    )
  }

  return slots
}

// 🚀 Main function
export function generateFreeTimeSlots(
  date: Date,
  busyEvents: CalendarEvent[],
  workStartHour = DEFAULT_START_HOUR,
  workEndHour = DEFAULT_END_HOUR
): TimeSlot[] {

  const dayStart = new Date(date)
  dayStart.setHours(workStartHour, 0, 0, 0)

  const dayEnd = new Date(date)
  dayEnd.setHours(workEndHour, 0, 0, 0)

  const slots: TimeSlot[] = []

  // 🔥 Filter + merge busy events inside working hours
  const relevantEvents = busyEvents.filter(
    e => e.end > dayStart && e.start < dayEnd
  )

  const mergedEvents = mergeBusyEvents(relevantEvents)

  let currentPointer = new Date(dayStart)

  // 🔁 Process gaps between busy events
  for (const event of mergedEvents) {

    // Free time before event
    if (event.start > currentPointer) {
      const freeStart = new Date(currentPointer)
      const freeEnd = new Date(event.start)

      slots.push(...splitIntoSubSlots(freeStart, freeEnd))
    }

    // Move pointer after event
    if (event.end > currentPointer) {
      currentPointer = new Date(event.end)
    }
  }

  // 🔁 Remaining time after last event
  if (currentPointer < dayEnd) {
    slots.push(...splitIntoSubSlots(currentPointer, dayEnd))
  }

  return slots
}