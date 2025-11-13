
import { OpenRouter } from '@openrouter/sdk';

// Initialize OpenRouter client once
const openRouter = new OpenRouter({
  apiKey: process.env.API_KEY,
  defaultHeaders: {
    'HTTP-Referer': 'https://math-ext-serverless-function.vercel.app',
    'X-Title': 'Mathnasium LLM Gateway',
  },
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const beginning_string = `You are a Mathnasium instructor assistant that helps instructors give effective hints to students. 
Your goal is to help the instructor guide the student toward the correct solution — not give away the final answer.
A
The student's answer key for their question is shown below:

---`;

    // Normalize input for comparison
    const normalize = (str) => str.replace(/\r\n/g, '\n').replace(/\s+/g, ' ').trim();
    const normalizedPrompt = normalize(prompt);
    const normalizedBeginning = normalize(beginning_string);

    if (!normalizedPrompt.startsWith(normalizedBeginning)) {
      return res.status(400).json({ error: "Invalid or incomplete prompt format." });
    }

    // Call OpenRouter
    const completion = await openRouter.chat.send({
      model: 'deepseek/deepseek-chat',
      messages: [
        { role: 'user', content: prompt }
      ],
      stream: false
    });

    const generated = completion.choices?.[0]?.message?.content;
    if (!generated) {
      return res.status(500).json({ error: "No content returned from LLM" });
    }

    console.log("LLM response:", generated.substring(0, 100) + "...");
    return res.status(200).json({ output: generated });

  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({ error: error.message || "Something went wrong" });
  }
}
