import { ChatGroq } from "@langchain/groq"

export const gptsafeguard20b = new ChatGroq({
    model: "openai/gpt-oss-safeguard-20b",
    temperature: 0,
    maxTokens: undefined,
    maxRetries: 2,
    apiKey: process.env.GROQ_API_KEY
})