export const GEMINI_CONFIG = {
  // API Key được tích hợp sẵn trong hệ thống Safe School
  apiKey: "AQ.Ab8RN6JK7UQeo0_TNAhjjZOVGQRQztzyed4eUUud4gXrSzwv1Q",

  // Danh sách các mô hình AI thế hệ mới có tốc độ phản hồi nhanh (1-3s) và độ ổn định cao nhất
  primaryModel: "gemini-flash-lite-latest",
  fallbackModel: "gemini-3.5-flash-lite",
  models: [
    "gemini-flash-lite-latest",
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash-lite",
    "gemini-3-flash-preview"
  ],
  
  baseUrl: "https://generativelanguage.googleapis.com/v1beta/models"
};
