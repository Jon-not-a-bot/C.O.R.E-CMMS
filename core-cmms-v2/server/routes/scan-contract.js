const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const Anthropic = require('@anthropic-ai/sdk');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Use memory storage so we have the buffer before uploading to Cloudinary
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }
});

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

router.post('/', upload.single('document'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  try {
    const buffer = req.file.buffer;
    const base64 = buffer.toString('base64');
    const isPDF = req.file.mimetype === 'application/pdf' || 
                  req.file.originalname?.toLowerCase().endsWith('.pdf');
    const mediaType = isPDF ? 'application/pdf' : (req.file.mimetype || 'image/jpeg');

    // Upload to Cloudinary for storage
    const documentUrl = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'core-cmms/contracts', resource_type: 'auto' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result.secure_url);
        }
      );
      stream.end(buffer);
    });

    // Send to Claude for extraction using the buffer we already have
    const messageContent = isPDF ? [
      {
        type: 'document',
        source: { type: 'base64', media_type: 'application/pdf', data: base64 }
      },
      {
        type: 'text',
        text: `Extract contract information from this document. Return ONLY a valid JSON object with these exact fields (use null for anything not found):
{
  "name": "descriptive contract name",
  "type": "one of: Rental, Lease, Service Agreement, Maintenance, Warranty, SLA, Insurance, Other",
  "vendor_name": "vendor or company name",
  "value": numeric annual dollar value or null,
  "start_date": "YYYY-MM-DD or null",
  "end_date": "YYYY-MM-DD or null",
  "notice_period_days": numeric days notice required or null,
  "auto_renew": true or false,
  "notes": "key terms, important clauses, renewal conditions in 1-2 sentences"
}
Return ONLY the JSON, no markdown, no explanation.`
      }
    ] : [
      {
        type: 'image',
        source: { type: 'base64', media_type: mediaType, data: base64 }
      },
      {
        type: 'text',
        text: `Extract contract information from this document image. Return ONLY a valid JSON object with these exact fields (use null for anything not found):
{
  "name": "descriptive contract name",
  "type": "one of: Rental, Lease, Service Agreement, Maintenance, Warranty, SLA, Insurance, Other",
  "vendor_name": "vendor or company name",
  "value": numeric annual dollar value or null,
  "start_date": "YYYY-MM-DD or null",
  "end_date": "YYYY-MM-DD or null",
  "notice_period_days": numeric days notice required or null,
  "auto_renew": true or false,
  "notes": "key terms, important clauses, renewal conditions in 1-2 sentences"
}
Return ONLY the JSON, no markdown, no explanation.`
      }
    ];

    const message = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: messageContent }]
    });

    const text = message.content[0].text.trim();
    const clean = text.replace(/```json|```/g, '').trim();
    const fields = JSON.parse(clean);

    res.json({ fields, document_url: documentUrl });
  } catch (err) {
    console.error('Contract scan error:', err);
    res.status(500).json({ error: err.message || 'Failed to scan contract' });
  }
});

module.exports = router;
