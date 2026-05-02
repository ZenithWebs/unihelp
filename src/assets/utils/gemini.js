import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI("AIzaSyD9q7oBhwbcpwDb4PYfB7bR8hKHr_Ug5Y0");

export const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});
//AIzaSyD9q7oBhwbcpwDb4PYfB7bR8hKHr_Ug5Y0
//AIzaSyAtXiNLa8JElS8CsMH91uL1gpw63GPJKks