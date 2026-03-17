import { GoogleGenerativeAI } from "@google/generative-ai"
import Bottleneck from "bottleneck"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string)

/*
Rate limiter
3 requests per minute
*/
const limiter = new Bottleneck({
  minTime: 20000 // 20 seconds between requests
})

function generateFallbackTasks(goal: string) {
  return [
    { title: `Research ${goal}`, estimatedMinutes: 60, importance: 3 },
    { title: `Plan architecture for ${goal}`, estimatedMinutes: 90, importance: 4 },
    { title: `Implement core feature for ${goal}`, estimatedMinutes: 120, importance: 5 }
  ]
}

export class AIService {

  async generateTasks(
    title: string,
    description?: string,
    deadline?: Date
  ) {

    return limiter.schedule(async () => {

      try {

        const model = genAI.getGenerativeModel({
          model: "gemini-1.5-flash"
        })

        const prompt = `
Break this goal into actionable tasks.

Goal: ${title}
Description: ${description || "None"}
Deadline: ${deadline || "None"}

Return JSON:
[
 { "title": "...", "estimatedMinutes": number, "importance": 1-5 }
]
`

        const result = await model.generateContent(prompt)

        const text = result.response.text()

        try {
          return JSON.parse(text)
        } catch {
          return generateFallbackTasks(title)
        }

      } catch (error) {

        console.log("AI failed → fallback used")

        return generateFallbackTasks(title)

      }

    })

  }

}