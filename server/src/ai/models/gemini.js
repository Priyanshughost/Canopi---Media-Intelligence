import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

export const gemini_2_5_flash = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    apiKey: process.env.GEMINI_API_KEY
});