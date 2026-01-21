// API Key verification endpoint
const express = require('express');
const router = express.Router();
const { API_KEY } = require('../config/loadApiKey');

// POST /api/verify-key - Verify API key
router.post('/verify-key', (req, res) => {
  try {
    const { key } = req.body;

    if (!key) {
      return res.status(400).json({ 
        valid: false, 
        message: 'API key is required' 
      });
    }

    // So sánh với API key đã load từ config
    if (key === API_KEY) {
      return res.json({ 
        valid: true, 
        message: 'API key is valid' 
      });
    } else {
      return res.status(401).json({ 
        valid: false, 
        message: 'Invalid API key' 
      });
    }
  } catch (error) {
    console.error('Verify API key error:', error);
    res.status(500).json({ 
      valid: false, 
      message: 'Internal server error' 
    });
  }
});

module.exports = router;
