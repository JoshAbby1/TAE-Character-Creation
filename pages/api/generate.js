export default async function handler(req, res) {
  try {
    const { category, traits } = req.body;

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      return res.status(400).json({ error: 'Missing GEMINI_API_KEY' });
    }

    // pick correct prefix
    let prefix = '';
    if (category === 'human') prefix = process.env.SECRET_PROMPT_PREFIX;
    else if (category === 'animal') prefix = process.env.CARTOON_MASCOT_PREFIX;
    else if (category === 'cartoon') prefix = process.env.CARTOON_HUMAN_PREFIX;

    const finalPrompt = `${prefix} ${traits}. White background studio lighting.`;

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=" + GEMINI_API_KEY,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: finalPrompt }] }],
        }),
      }
    );

    const data = await response.json();

    res.status(200).json({ result: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
