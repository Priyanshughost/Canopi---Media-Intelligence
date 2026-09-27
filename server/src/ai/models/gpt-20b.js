import { ChatGroq } from "@langchain/groq";
import '../../config/env.js';

export const gpt20b = new ChatGroq({
    model: "openai/gpt-oss-20b",
    temperature: 0,
    maxTokens: undefined,
    maxRetries: 2,
    apiKey: process.env.GROQ_API_KEY || 'gsk_mock_fallback_key_for_testing'
});