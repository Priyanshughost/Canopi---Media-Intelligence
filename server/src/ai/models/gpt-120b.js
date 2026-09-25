import { ChatGroq } from "@langchain/groq"

export const gpt120b = new ChatGroq({
    model: "openai/gpt-oss-120b",
    temperature: 0,
    maxTokens: undefined,
    maxRetries: 2,
    apiKey: process.env.GROQ_API_KEY
})