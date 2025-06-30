import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

const llm = new ChatGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY,
  model: "models/gemini-1.5-flash",
  temperature: 0.7,
  maxOutputTokens: 100,
});

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end("Only POST allowed");

  try {
    const { resumeText } = req.body;
    if (!resumeText) return res.status(400).json({ error: "Resume text is required." });

    const achievementsPrompt = `Read the following resume and suggest industry-specific achievements or enhancements. Tailor examples to the candidate's field, whether teaching, civil engineering, or software. Use real-world metrics where possible.

Resume: ${resumeText}`;

    const achievementSuggestions = await llm.invoke(achievementsPrompt);
    res.status(200).json({
      suggestedAchievements: achievementSuggestions.content.trim(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
