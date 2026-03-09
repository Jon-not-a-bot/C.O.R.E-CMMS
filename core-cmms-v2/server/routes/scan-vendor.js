const express = require('express');
const router = express.Router();
const multer = require('multer');
const Anthropic = require('@anthropic-ai/sdk');
const sharp = require('sharp');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

router.post('/', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image provided' });

    // Resize and compress to stay under 5MB
    const compressed = await sharp(req.file.buffer)
      .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();

    const base64 = compressed.toString('base64');

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: 'image/jpeg', data: base64 }
          },
          {
            type: 'text',
            text: `Extract contact information from this image (business card, email signature, letterhead, or screenshot).
Return ONLY a raw JSON object with no markdown, no code fences, no explanation. Just the JSON:
{"name":"company or vendor name","primary_contact":"person full name and title","phone":"phone number","email":"email address","website":"website URL","scope":"type of service e.g. HVAC, Electrical, Flooring"}`
          }
        ]
      }]
    });

    const text = response.content[0].text.trim();
    const stripped = text.replace(/^```[\w]*\n?/m, '').replace(/```$/m, '').trim();
    const jsonMatch = stripped.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Could not parse response');
    const fields = JSON.parse(jsonMatch[0]);

    res.json({ fields });
  } catch (err) {
    console.error('Vendor scan error:', err);
    res.status(500).json({ error: 'Failed to scan image: ' + err.message });
  }
});

module.exports = router;
