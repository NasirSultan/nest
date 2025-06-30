import fetch from "node-fetch";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

const llm = new ChatGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY,
  model: "models/gemini-1.5-flash",
  temperature: 0.7,
  maxOutputTokens: 100,
});

function extractFileId(url) {
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)\//);
  return match?.[1] || null;
}

async function fetchPdfText(fileId) {
  const res = await fetch(`https://drive.google.com/uc?export=download&id=${fileId}`);
  const uint8Array = new Uint8Array(await res.arrayBuffer());
  const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise;

  let fullText = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    fullText += content.items.map(item => item.str).join(" ") + "\n\n";
  }
  return fullText.trim();
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end("Only POST allowed");

  try {
    const { driveUrl } = req.body;
    const fileId = extractFileId(driveUrl);
    if (!fileId) return res.status(400).json({ error: "Invalid Google Drive link" });

    const pdfText = await fetchPdfText(fileId);

    const analysisPrompt = `You are an expert resume analyst. Analyze the resume below and return the following:
- ATS score (out of 100)
- Strengths
- Weaknesses
- Missing sections
- Tailored suggestions for improvement based on profession
- ATS-relevant keywords that are missing or weak

Resume: ${pdfText}`;

    const analysis = await llm.invoke(analysisPrompt);
    res.status(200).json({
      atsAnalysis: analysis.content.trim(),
      pdfText,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
