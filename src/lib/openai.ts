import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.XAI_API_KEY || "dummy-key-for-build",
  baseURL: "https://api.x.ai/v1",
});

export default openai;
