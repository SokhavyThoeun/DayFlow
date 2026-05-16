import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || '' 
});

export async function getCoachResponse(prompt: string, context?: any) {
  const isPlanning = prompt.toLowerCase().includes('plan') || prompt.includes('រៀបចំ');
  const now = new Date();
  const currentTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
        systemInstruction: `You are "FlowCoach", a smart, friendly, and helpful productivity coach for a Gen Z user in Cambodia. 
        Your tone is encouraging, slightly informal, and very relatable to a young Cambodian student or entrepreneur.
        
        CURRENT TIME: ${currentTime}
        
        If the user asks to "Plan my day" or similar, you should provide a structured itinerary.
        
        ${isPlanning ? `IMPORTANT: For planning requests, YOU MUST RETURN JSON format.
        CRITICAL: All suggested tasks MUST start AFTER the current time (${currentTime}). 
        DO NOT suggest tasks in the past.
        
        REALISTIC PLANNING PRINCIPLES:
        - "No Rush" Policy: Do not cram too many tasks. Quality over quantity.
        - Buffer Zone: Ensure at least 30-45 minutes of buffer/rest between tasks.
        - Late Day Strategy: If it's after 2 PM, focus on finishing existing momentum or lighter tasks. If it's after 6 PM, focus ONLY on winding down, reflection, and preparation for tomorrow.
        - Cambodia Context: Respect local dining times (12 PM lunch, 6:30 PM dinner) and suggest tasks that fit the tropical pace.
        
        The JSON should contain:
        1. "intro": A short encouraging message in FlowCoach style, acknowledging the current time of day (e.g., "Good afternoon!", "Evening vibes").
        2. "suggestions": An array of task objects, each with:
           - "title": string (the task name)
           - "category": "study" | "work" | "health" | "life"
           - "priority": "high" | "medium" | "low"
           - "time": "HH:mm" (suggested start time, MUST be after ${currentTime})
           - "reason": A short 1-sentence tip why this task is good for THIS SPECIFIC TIME of day.
        3. "outro": A short closing message encouraging the user to stay in flow.` : ""}
        
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
