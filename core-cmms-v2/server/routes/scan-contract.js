const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Store contracts in Cloudinary
const storage = new CloudinaryStorage({
  cloudinary,
  params: { folder: 'core-cmms/contracts', allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'pdf'], resource_type: 'auto' }
});
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

router.post('/', upload.single('document'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  try {
    const documentUrl = req.file.path;
    const isPDF = req.file.mimetype === 'application/pdf' || req.file.originalname?.toLowerCase().endsWith('.pdf');

    let messageContent;

    if (isPDF) {
      // Fetch the PDF from Cloudinary and convert to base64
      const fetch = (await import('node-fetch')).default;
      const response = await fetch(documentUrl);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = buffer.toString('base64');

      messageContent = [
        {
          type: 'document',
          source: { type: 'base64', media_type: 'application/pdf', data: base64 }
        },
        {
          type: 'text',
          text: `You are extracting contract information from this document. Return ONLY a valid JSON object with these fields (use null for any field you cannot find):
{
  "name": "descriptive contract name",
  "type": "one of: Rental, Lease, Service Agreement, Maintenance, Warranty, SLA, Insurance, Other",
  "vendor_name": "vendor or company name",
  "value": numeric annual value in dollars or null,
  "start_date": "YYYY-MM-DD or null",
  "end_date": "YYYY-MM-DD or null",
  "notice_period_days": numeric days or null,
  "auto_renew": true or false,
  "notes": "key terms, important clauses, renewal conditions"
}
Return ONLY the JSON object, no other text.`
        }
      ];
    } else {
      // Image — fetch and base64 encode
      const fetch = (await import('node-fetch')).default;
      const response = await fetch(documentUrl);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = buffer.toString('base64');
      const mediaType = req.file.mimetype || 'image/jpeg';

      messageContent = [
        {
          type: 'image',
          source: { type: 'base64', media_type: mediaType, data: base64 }
        },
        {
          type: 'text',
          text: `You are extracting contract information from this document image. Return ONLY a valid JSON object with these fields (use null for any field you cannot find):
{
  "name": "descriptive contract name",
  "type": "one of: Rental, Lease, Service Agreement, Maintenance, Warranty, SLA, Insurance, Other",
  "vendor_name": "vendor or company name",
  "value": numeric annual value in dollars or null,
  "start_date": "YYYY-MM-DD or null",
  "end_date": "YYYY-MM-DD or null",
  "notice_period_days": numeric days or null,
  "auto_renew": true or false,
  "notes": "key terms, important clauses, renewal conditions"
}
Return ONLY the JSON object, no other text.`
        }
      ];
    }

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
