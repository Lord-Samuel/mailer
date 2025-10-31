const express = require('express');
const cors = require('cors');
const { sendFeed } = require('./sendEmail');
const { Logger } = require('./logger');

const app = express();
const logger = new Logger("Server");
const emailService = new sendFeed();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Email Feedback API is running',
    timestamp: new Date().toISOString()
  });
});

// Feedback endpoint
app.post('/api/feedback', async (req, res) => {
  try {
    const { name, email, waNum, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and message are required'
      });
    }

    await emailService.sendFeedback(name, email, waNum, message);

    res.json({
      success: true,
      message: 'Feedback sent successfully'
    });

  } catch (error) {
    logger.error("Feedback endpoint error", error);
    res.status(500).json({
      success: false,
      message: 'Failed to send feedback'
    });
  }
});

// Get server info
app.get('/api/info', (req, res) => {
  res.json({
    name: 'Email Feedback API',
    version: '1.0.0',
    endpoints: {
      feedback: 'POST /api/feedback',
      health: 'GET /',
      info: 'GET /api/info'
    },
    required_fields: {
      name: 'string (required)',
      email: 'string (required)', 
      waNum: 'string (optional)',
      message: 'string (required)'
    }
  });
});


app.use((err, req, res, next) => {
  logger.error("Unhandled error", err);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});


app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Email feedback server running on port ${PORT}`);
});

module.exports = app;
