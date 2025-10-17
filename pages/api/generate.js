// pages/api/generate.js
export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const key = process.env.GEMINI_API_KEY;
    if (!key) return res.status(500).json({ error: 'Missing GEMINI_API_KEY' });

    // form fields
    const {
      mode = 'human', // 'human' | 'animal' | 'cartoon'
      // human/cartoon
      hair = '', hairType = '', skin = '', age = '', build = '', height = '',
      outfit = '', gender = '', personality = '',
      // animal
      animalType = 'rabbit', clothesTop = 'hoodie', clothesBottom = 'jeans', shoes = 'sneakers', themeColour = 'blue'
    } = req.body || {};

    // server-side style blocks
    const HUMAN_PREFIX = process.env.SECRET_PROMPT_PREFIX || '';
    const CARTOON_MASCOT_PREFIX =
      process.env.CARTOON_MASCOT_PREFIX ||
      '3D stylized mascot character, friendly rounded proportions, smooth glossy materials, soft studio lighting, minimal white background, high-quality render.';
    const CARTOON_HUMAN_PREFIX =
      process.env.CARTOON_HUMAN_PREFIX ||
      'High-quality 3D cartoon human character, friendly proportions, soft studio lighting, clean materials, minimal white background.';

    let publicPrompt = '';
    let finalPrompt = '';
    // Imagen params we’ll send along with the prompt
    let parameters = {
      sampleCount: 1,
      aspectRatio: '3:4',
      imageSize: '1K',
      personGeneration: 'block_all'
    };

    if (mode === 'human') {
      if (!HUMAN_PREFIX) {
        return res.status(500).json({ error: 'Missing SECRET_PROMPT_PREFIX' });
      }

      publicPrompt = [
        'Create a single realistic human character portrait.',
        gender && `Gender: ${gender}.`,
        hair && `Hair colour: ${hair}.`,
        hairType && `Hair type: ${hairType}.`,
        skin && `Skin tone: ${skin}.`,
        age && `Age: ${age}.`,
        build && `Build: ${build}.`,
        height && `Height: ${height}.`,
        outfit && `Outfit: ${outfit}.`,
        personality && `Personality: ${personality}.`,
        'Pose: full standing, relaxed confident stance.',
        'Background: pure white seamless studio backdrop.',
        'Lighting: soft cinematic key with gentle fill; natural shadows.'
      ].filter(Boolean).join(' ');

      finalPrompt = `${HUMAN_PREFIX} ${publicPrompt}`;
      parameters.personGeneration = 'allow_adult';
      parameters.aspectRatio = '3:4';

    } else if (mode === 'animal') {
      publicPrompt = [
        'Create a cute, friendly 3D mascot animal character.',
        `Animal: ${animalType}.`,
        `Outfit: ${clothesTop} (${themeColour} theme), ${clothesBottom}, ${shoes}.`,
        'Pose: standing, one hand giving a thumbs-up, playful confident energy.',
        'Background: pure white seamless studio backdrop.',
        'Style: clean product-mascot render; smooth glossy materials; soft shadows.'
      ].join(' ');

      finalPrompt = `${CARTOON_MASCOT_PREFIX} ${publicPrompt}`;
      parameters.personGeneration = 'block_all';
      parameters.aspectRatio = '1:1';

    } else if (mode === 'cartoon') {
      publicPrompt = [
        'Create a single 3D cartoon human character.',
        gender && `Gender: ${gender}.`,
        hair && `Hair colour: ${hair}.`,
        hairType && `Hair type: ${hairType}.`,
        skin && `Skin tone: ${skin}.`,
        age && `Age: ${age}.`,
        build && `Build: ${build}.`,
        height && `Height: ${height}.`,
        outfit && `Outfit: ${outfit}.`,
        personality && `Personality: ${personality}.`,
        'Pose: full standing, friendly confident stance.',
        'Background: pure white seamless studio backdrop.',
        'Style: modern 3D cartoon with clean materials and soft lighting.'
      ].filter(Boolean).join(' ');

      finalPrompt = `${CARTOON_HUMAN_PREFIX} ${publicPrompt}`;
      parameters.personGeneration = 'allow_adult';
      parameters.aspectRatio = '3:4';

    } else {
      return res.status(400).json({ error: 'Unknown mode' });
    }

    // ✅ Updated Gemini Images endpoint
    const url = 'https://generativelanguage.googleapis.com/v1beta/models/imagegeneration:predict';

    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'x-goog-api-key': key,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        instances: [{ prompt: finalPrompt }],
        parameters
      })
    });

    if (!resp.ok) {
      const details = await resp.text();
      return res.status(resp.status).json({ error: 'Imagen request failed', details });
    }

    const data = await resp.json();
    // Different responses may use different fields; check safely
    const pred = data?.predictions?.[0] || data?.images?.[0] || {};
    const base64 =
      pred.bytesBase64 ||
      pred.imageBytes ||
      pred?.image?.imageBytes ||
      null;

    if (!base64) {
      return res.status(502).json({ error: 'No image returned from provider', raw: data });
    }

    return res.status(200).json({
      publicPrompt,
      image: { base64, url: null }
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error', details: String(err) });
  }
}
