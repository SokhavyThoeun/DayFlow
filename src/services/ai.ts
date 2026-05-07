import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || '' 
});

export async function getCoachResponse(prompt: string, context?: any) {
  const isPlanning = prompt.toLowerCase().includes('plan') || prompt.includes('រៀបចំ');
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
        systemInstruction: `You are "FlowCoach", a smart, friendly, and helpful productivity coach for a Gen Z user in Cambodia. 
        Your tone is encouraging, slightly informal, and very relatable to a young Cambodian student or entrepreneur.
        
        If the user asks to "Plan my day" or similar, you should provide a structured itinerary.
        
        ${isPlanning ? `IMPORTANT: For planning requests, YOU MUST RETURN JSON format.
        The JSON should contain:
        1. "intro": A short encouraging message in FlowCoach style.
        2. "suggestions": An array of task objects, each with:
           - "title": string (the task name)
           - "category": "Study" | "Business" | "Personal" | "Health"
           - "priority": "High" | "Medium" | "Low"
           - "time": "HH:mm" (suggested start time)
           - "reason": A short 1-sentence tip why this task is good.
        3. "outro": A short closing message.` : ""}
        
        General Guidelines:
        - Keep responses concise and scannable.
        - Include small Khmer phrases (e.g., "Sua s'dei", "Bach p'yayam").
        - If not planning, talk normally but concisely.
        `,
        responseMimeType: isPlanning ? "application/json" : "text/plain",
        ...(isPlanning ? {
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              intro: { type: Type.STRING },
              suggestions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    category: { type: Type.STRING },
                    priority: { type: Type.STRING },
                    time: { type: Type.STRING },
                    reason: { type: Type.STRING }
                  },
                  required: ["title", "category", "priority", "time"]
                }
              },
              outro: { type: Type.STRING }
            },
            required: ["intro", "suggestions", "outro"]
          }
        } : {})
      }
    });

    return response.text || "I'm having trouble thinking right now. Let's try again!";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Something went wrong with my circuits. Can you repeat that?";
  }
}
