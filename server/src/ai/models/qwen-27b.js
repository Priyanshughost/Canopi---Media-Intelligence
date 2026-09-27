import { ChatGroq } from "@langchain/groq";
import '../../config/env.js';

export const qwen27b = new ChatGroq({
    model: "qwen/qwen3.8-27b",
    temperature: 0,
    maxTokens: 800,
    maxRetries: 2,
    apiKey: process.env.GROQ_API_KEY || 'gsk_mock_fallback_key_for_testing'
});