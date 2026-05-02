import { model } from "./gemini";

export const summarizePost = async (text) => {
  try {
    const result = await model.generateContent([
      `Summarize this for students in 2-3 short lines:
      
      ${text}
      `,
    ]);

    return result.response.text();
  } catch (err) {
    return text.slice(0, 150) + "...";
  }
};