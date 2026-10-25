/**
 * Cấu hình Google Gemini AI cho SafeBot
 * Safe School Project
 * Tích hợp sẵn Gemini AI đời mới nhất (Gemini 3.8 Flash)
 */

export const GEMINI_CONFIG = {
  // API Key được tích hợp sẵn bảo mật trong code
  apiKey: "AQ.Ab8RN6IqHFz5elQgGkCZN6a6f9Y4xmgCJ-yHLJ2DnMw1eFUVyw",
  
  // Model đời mới nhất của Google Gemini AI
  primaryModel: "gemini-3.8-flash",
  fallbackModel: "gemini-flash-latest",
  
  // Endpoint chính thức của Google Generative Language API
  baseUrl: "https://generativelanguage.googleapis.com/v1beta/models"
};
