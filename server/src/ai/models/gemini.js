import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

export const gemini_3_8_flash = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-pro",
    apiKey: process.env.GEMINI_API_KEY_PRO
});