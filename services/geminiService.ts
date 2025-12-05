import { GoogleGenAI, Content, Part } from "@google/genai";
import { Role, ChatMessage } from "../types";
import { SYSTEM_INSTRUCTION } from "../constants";

// Initialize Gemini
// NOTE: API key must be provided via process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Explicitly use gemini-2.5-flash for best multimodal compatibility
const MODEL_NAME = 'gemini-2.5-flash';

/**
 * Converts internal chat history to Gemini API 'Content' format.
 */
const formatHistoryForGemini = (history: ChatMessage[]): Content[] => {
  return history
    .map((msg) => {
      const parts: Part[] = [];

      // Add text part only if it contains non-whitespace characters
      if (msg.text && msg.text.trim().length > 0) {
        parts.push({ text: msg.text });
      }

      // Add image part if exists
      if (msg.image) {
        try {
          // Remove data URL prefix if present (data:image/jpeg;base64,)
          // We split by comma and take the last part to handle potential variations
          const base64Data = msg.image.includes(',') 
            ? msg.image.split(',')[1] 
            : msg.image;
            
          if (base64Data) {
            parts.push({
              inlineData: {
                mimeType: 'image/jpeg',
                data: base64Data
              }
            });
          }
        } catch (e) {
          console.warn("Failed to process image data:", e);
        }
      }

      // If a message ends up with no parts (e.g. empty text and invalid image),
      // we must filter it out to avoid 400 errors.
      if (parts.length === 0) {
        return null;
      }

      return {
        role: msg.role === Role.USER ? 'user' : 'model',
        parts: parts
      };
    })
    .filter((content): content is Content => content !== null);
};

export const sendMessageToTutor = async (
  currentHistory: ChatMessage[],
  newMessageText: string,
  newMessageImage?: string
): Promise<string> => {
  try {
    // 1. Construct the new user message
    const userMessage: ChatMessage = {
      id: 'temp-sending',
      role: Role.USER,
      text: newMessageText,
      image: newMessageImage
    };

    // 2. Combine previous history + new message
    const fullHistory = [...currentHistory, userMessage];
    const formattedContents = formatHistoryForGemini(fullHistory);

    // Guard: Ensure we have at least one valid message to send
    if (formattedContents.length === 0) {
      console.error("No valid content to send to Gemini.");
      return "I couldn't send that message. Please try adding some text or an image.";
    }

    // 3. Call Gemini
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: formattedContents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      }
    });

    // 4. Extract text
    if (response.text) {
      return response.text;
    }

    return "I analyzed the problem but couldn't generate a text explanation. Please try asking a specific question about it.";

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    // Provide more specific error messages if possible
    if (error.status === 400 || (error.message && error.message.includes("INVALID_ARGUMENT"))) {
       return "I had trouble understanding that input. Please try retaking the photo or rephrasing your question.";
    }
    
    return "Sorry, I had trouble connecting to my brain. Please check your internet connection or try again.";
  }
};