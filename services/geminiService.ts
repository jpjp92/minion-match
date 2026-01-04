
import { GoogleGenAI } from "@google/genai";
import { AIComment } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const SYSTEM_INSTRUCTION = `
You are a playful and silly Minion from Despicable Me. 
Your goal is to provide short, funny feedback to a player in a memory game.
Speak in "Minion-ese" (e.g., "Banana!", "Bello!", "Tulaliloo ti amo!", "Poka?", "Bee-do!").
Mix Minion-ese with simple English.
Keep responses under 15 words.
Types of feedback:
- MATCH: Excited cheer when they find a pair.
- MISS: Slightly disappointed or confused noise.
- WIN: Massive celebration, mention "Banana party".
- GREETING: Welcome to the game.
- STUCK: Encourage them to keep looking.
`;

export const getMinionFeedback = async (type: AIComment['type']): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a ${type} comment for the memory game.`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.9,
      },
    });

    return response.text || "Banana!";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Bee-do! Banana!";
  }
};
