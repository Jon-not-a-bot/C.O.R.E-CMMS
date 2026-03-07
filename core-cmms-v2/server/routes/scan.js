const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/scan-nameplate
// Accepts an image, sends to Claude vision, returns extracted fields
router.post('/', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image provided' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });

  try {
    const base64Image = req.file.buffer.toString('base64');
    const mediaType = req.file.mimetype || 'image/jpeg';

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: base64Image }
            },
            {
              type: 'text',
              text: `You are reading an equipment nameplate or ID plate. Extract all visible information and return ONLY a JSON object with these exact keys (use null for anything not visible):

{
  "manufacturer": "company name",
  "model": "model number or name",
  "serial_number": "serial number",
  "install_date": "YYYY-MM-DD format if visible, otherwise null",
  "name": "best guess at equipment name/type (e.g. 'Sit-Down Forklift', 'HVAC Unit', 'Electric Motor')",
  "notes": "any other useful technical specs visible (voltage, HP, capacity, refrigerant, weight, etc)"
}

Return ONLY the JSON object, no other text.`
            }
          ]
        }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Claude API error:', data);
      return res.status(500).json({ error: 'Vision API error', detail: data.error?.message });
    }

    const text = data.content[0]?.text || '';

    // Parse JSON from response
    let extracted = {};
    try {
      const clean = text.replace(/```json|```/g, '').trim();
      extracted = JSON.parse(clean);
    } catch (e) {
      return res.status(500).json({ error: 'Could not parse nameplate data', raw: text });
    }

    res.json({ success: true, fields: extracted });

  } catch (err) {
    console.error('Scan error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
