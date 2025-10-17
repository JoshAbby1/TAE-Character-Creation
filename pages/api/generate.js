export default async function handler(req, res) {
  try {
    if (req.method !== "POST")
      return res.status(405).json({ error: "Method not allowed" });

    const key = process.env.GEMINI_API_KEY;
    if (!key)
      return res.status(500).json({ error: "Missing GEMINI_API_KEY" });

    const {
      mode = "human",
      hair = "",
      hairType = "",
      skin = "",
      age = "",
      build = "",
      height = "",
      outfit = "",
      gender = "",
      personality = "",
      animalType = "rabbit",
      clothesTop = "hoodie",
      clothesBottom = "jeans",
      shoes = "sneakers",
      themeColour = "blue",
    } = req.body || {};

    const HUMAN_PREFIX = process.env.SECRET_PROMPT_PREFIX || "";
    const CARTOON_MASCOT_PREFIX = process.env.CARTOON_MASCOT_PREFIX || "";
    const CARTOON_HUMAN_PREFIX = process.env.CARTOON_HUMAN_PREFIX || "";

    let publicPrompt = "";
    let finalPrompt = "";

    if (mode === "human") {
      publicPrompt = [
        `Create a single realistic human character portrait.`,
        gender && `Gender: ${gender}.`,
        hair && `Hair colour: ${hair}.`,
        hairType && `Hair type: ${hairType}.`,
        skin && `Skin tone: ${skin}.`,
        age && `Age: ${age}.`,
        build && `Build: ${build}.`,
        height && `Height: ${height}.`,
        outfit && `Outfit: ${outfit}.`,
        personality && `Personality: ${personality}.`,
        `Framing: full standing figure, white seamless background, natural lighting.`,
      ]
        .filter(Boolean)
        .join(" ");
      finalPrompt = `${HUMAN_PREFIX} ${publicPrompt}`;
    } else if (mode === "animal") {
      publicPrompt = [
        `Create a cute 3D mascot animal character.`,
        `Animal: ${animalType}.`,
        `Outfit: ${clothesTop} (${themeColour} theme), ${clothesBottom}, ${shoes}.`,
        `Pose: standing, thumbs up, friendly expression.`,
        `Background: plain white studio.`,
        `Style: glossy materials, soft lighting, clean render.`,
      ].join(" ");
      finalPrompt = `${CARTOON_MASCOT_PREFIX} ${publicPrompt}`;
    } else if (mode === "cartoon") {
      publicPrompt = [
        `Create a 3D cartoon human character.`,
        gender && `Gender: ${gender}.`,
        hair && `Hair colour: ${hair}.`,
        hairType && `Hair type: ${hairType}.`,
        outfit && `Outfit: ${outfit}.`,
        `Pose: standing full-body, friendly stance.`,
        `Background: plain white.`,
        `Style: 3D cartoon with smooth shading.`,
      ]
        .filter(Boolean)
        .join(" ");
      finalPrompt = `${CARTOON_HUMAN_PREFIX} ${publicPrompt}`;
    }

    // Gemini Flash endpoint
    const url =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent";

    const body = {
      contents: [
        {
          role: "user",
          parts: [{ text: `Generate an image based on this prompt: ${finalPrompt}` }],
        },
      ],
      generationConfig: {
        temperature: 0.9,
      },
    };

    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "x-goog-api-key": key,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const details = await resp.text();
      return res.status(resp.status).json({ error: "Image generation failed", details });
    }

    const data = await resp.json();
    const base64 =
      data?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;

    if (!base64) {
      return res.status(500).json({ error: "No image returned", data });
    }

    return res.status(200).json({ publicPrompt, image: { base64 } });
  } catch (err) {
    return res.status(500).json({ error: "Server error", details: String(err) });
  }
}
