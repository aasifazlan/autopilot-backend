import OpenAI from "openai"
import Bottleneck from "bottleneck"

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY as string,
  baseURL: "https://api.groq.com/openai/v1",
})

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

        const prompt = `
Break this goal into actionable tasks.

Goal: ${title}
Description: ${description || "None"}
Deadline: ${deadline || "None"}

Return ONLY valid JSON:
[
 { "title": "...", "estimatedMinutes": number, "importance": 1-5 }
]
`

        const response = await client.responses.create({
          model: "openai/gpt-oss-20b", // you can change this later
          input: prompt,
        })

        const text = response.output_text
        console.log("Groq raw output:", text)

        try {
          return JSON.parse(text)
        } catch {
          return generateFallbackTasks(title)
        }

      } catch (error) {
        console.error("❌ Groq Error:", error)
        console.log("AI failed → fallback used")

        return generateFallbackTasks(title)
      }

    })

  }

}