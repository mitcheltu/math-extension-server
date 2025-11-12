import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { OpenRouter } from '@openrouter/sdk';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const OPENROUTER_API_KEY = process.env.API_KEY;


if (!OPENROUTER_API_KEY) {
  console.warn("Warning: API_KEY is not set in .env");
}

// Initialize OpenRouter SDK
const openRouter = new OpenRouter({
  apiKey: OPENROUTER_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': 'http://localhost:3000',
    'X-Title': 'My LLM App',
  },
});

app.post("/api/llm", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const beginning_string = `You are a Mathnasium instructor assistant that helps instructors give effective hints to students. 
Your goal is to help the instructor guide the student toward the correct solution — not give away the final answer.

The student's answer key for their question is shown below:

---`;

    // Normalize strings for comparison (handle different line endings and whitespace)
    const normalize = (str) => str.replace(/\r\n/g, '\n').replace(/\s+/g, ' ').trim();
    const normalizedPrompt = normalize(prompt);
    const normalizedBeginning = normalize(beginning_string);

    if (!normalizedPrompt.startsWith(normalizedBeginning)) {
      console.log({normalizedPrompt: normalizedPrompt.substring(0, 100)});
      console.log({normalizedBeginning});
      return res.status(400).json({ error: "Invalid or incomplete prompt format." });
    }

    // Call OpenRouter with DeepSeek model
    const completion = await openRouter.chat.send({
      model: 'deepseek/deepseek-chat',  // Using DeepSeek through OpenRouter
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      stream: false
    });

    const generated = completion.choices?.[0]?.message?.content;

    console.log("LLM response received, length:", generated?.length);
    console.log("LLM response preview:", generated?.substring(0, 100) + "...");

    if (!generated) {
      console.error("Unexpected OpenRouter response:", completion);
      return res.status(500).json({ error: "Unexpected response", detail: completion });
    }

    res.json({ output: generated });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: error.message || "Something went wrong" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));