
import { GoogleGenAI } from "@google/genai";
import { Difficulty } from "../types.ts";

const SYSTEM_INSTRUCTION = `
You are a very expressive and silly Minion (from Despicable Me). 
Your task is to comment on the player's progress in a memory game.
Rules:
1. Speak in Minion-ese (e.g., "Bello!", "Banana!", "Poopaye!", "Tulaliloo!") mixed with broken English.
2. Be VERY short (max 12 words).
3. React specifically to the context provided (moves, difficulty, or event type).
4. If the move count is high, act a bit worried or cheeky.
`;

export const getMinionFeedback = async (
  type: 'MATCH' | 'MISS' | 'WIN' | 'GREETING' | 'STUCK',
  moves: number,
  difficulty: Difficulty
): Promise<string> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) throw new Error("API Key missing");
    
    const ai = new GoogleGenAI({ apiKey });
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Context: Event Type is ${type}, Player has made ${moves} moves so far on ${difficulty} difficulty. Give me a funny reaction!`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 1,
        thinkingConfig: { thinkingBudget: 100 }
      },
    });

    return response.text?.trim() || "Banana! 🍌";
  } catch (error) {
    console.error("Gemini AI Error:", error);
    const fallbacks = ["Bee-do! Bee-do!", "Banana?", "Poka-poka!", "Tulaliloo!"];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }
};
