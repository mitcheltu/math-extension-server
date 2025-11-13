import { OpenRouter } from '@openrouter/sdk';

console.log("llm.js loaded at " + new Date().toISOString());

// Initialize OpenRouter client once
const openRouter = new OpenRouter({
  apiKey: process.env.API_KEY,
  defaultHeaders: {
    'HTTP-Referer': process.env.REFERER_URL || 'https://your-vercel-app.vercel.app',
    'X-Title': process.env.APP_TITLE || 'LLM Gateway',
  },
});

export default async function handler(req, res) {
  // CORS headers for Chrome extension
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { prompt, model, temperature, maxTokens } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const beginning_string = `You are a Mathnasium instructor assistant that helps instructors give effective hints to students. 
Your goal is to help the instructor guide the student toward the correct solution - not give away the final answer.

The student's answer key for their question is shown below:

---`;

    // Normalize input for comparison (handle character encoding issues)
      const normalize = (str) => 
        str
          .replace(/\r\n/g, '\n')           // CRLF to LF
          .replace(/\s+/g, ' ')              // Collapse whitespace
          .trim();
    const normalizedPrompt = normalize(prompt);
    const normalizedBeginning = normalize(beginning_string);

      console.log('[llm.js] Prompt validation - startsWith check:', normalizedPrompt.startsWith(normalizedBeginning));

    if (!normalizedPrompt.startsWith(normalizedBeginning)) {
      return res.status(400).json({ error: "Invalid or incomplete prompt format." });
    }

    // Call OpenRouter with configurable parameters
    const completion = await openRouter.chat.send({
      model: model || 'deepseek/deepseek-chat',
      messages: [
        { role: 'user', content: prompt }
      ],
      temperature: temperature || 0.7,
      max_tokens: maxTokens || 1000,
      stream: false
    });

    const generated = completion.choices?.[0]?.message?.content;
    if (!generated) {
      return res.status(500).json({ error: "No content returned from LLM" });
    }

    console.log("LLM response:", generated.substring(0, 100) + "...");
    return res.status(200).json({ 
      output: generated,
      model: completion.model,
      usage: completion.usage
    });

  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({ 
      error: error.message || "Something went wrong",
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}