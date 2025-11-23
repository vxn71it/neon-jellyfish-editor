import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface GeneratedImageResult {
  imageUrl: string | null;
  text: string | null;
}

/**
 * Edits an image using the Gemini 2.5 Flash Image model based on a text prompt.
 * Maps "Nano banana" requests to 'gemini-2.5-flash-image'.
 */
export const editImageWithGemini = async (
  base64Data: string,
  mimeType: string,
  prompt: string
): Promise<GeneratedImageResult> => {
  try {
    // Clean base64 string if it contains header
    const cleanBase64 = base64Data.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

    // Enhance prompt to ensure the model understands it should edit/generate an image
    // and not just describe it.
    const finalPrompt = `Edit this image. ${prompt}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: mimeType,
            },
          },
          {
            text: finalPrompt,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1", // Default to square for stability, matching the user's 1200x1200 request style
        }
      }
    });

    let imageUrl: string | null = null;
    let text: string | null = null;

    if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          imageUrl = `data:image/png;base64,${part.inlineData.data}`;
        } else if (part.text) {
          text = part.text;
        }
      }
    }

    return { imageUrl, text };
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
