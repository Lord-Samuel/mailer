const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { sendFeed } = require('./src/sendEmail');
const { Logger } = require('./src/logger');

const app = express();
const logger = new Logger("Server");
const emailService = new sendFeed();

app.use(helmet());
app.use(cors());

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const feedbackLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, 
  max: 5, 
  message: {
    success: false,
    message: 'Too many feedback submissions from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(generalLimiter); 

app.use(express.json({
  limit: '10kb' 
}));
app.use(express.urlencoded({
  extended: true,
  limit: '10kb'
}));

const validateFeedback = (req, res, next) => {
  const { name, email, waNum, message } = req.body;
  
  if (!name || !email || !message) {
    return res.status(400).json({
      success: false,
      message: 'Name, email, and message are required'
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid email address'
    });
  }

  if (name.length > 100) {
    return res.status(400).json({
      success: false,
      message: 'Name must be less than 100 characters'
    });
  }

  if (message.length > 1000) {
    return res.status(400).json({
      success: false,
      message: 'Message must be less than 1000 characters'
    });
  }

  if (waNum && !/^[\d\s\-\+\(\)]{10,20}$/.test(waNum)) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid WhatsApp number'
    });
  }

  req.body.name = name.trim().substring(0, 100);
  req.body.message = message.trim().substring(0, 1000);
  if (waNum) {
    req.body.waNum = waNum.trim().substring(0, 20);
  }

  next();
};

app.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Email Feedback API is running',
    timestamp: new Date().toISOString()
  });
});

app.post('/api/feedback', feedbackLimiter, validateFeedback, async (req, res) => {
  try {
    const { name, email, waNum, message } = req.body;

    await emailService.sendFeedback(name, email, waNum, message);

    logger.info(`Feedback sent successfully from ${email}`);

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
      name: 'string (required, max 100 chars)',
      email: 'string (required, valid email format)', 
      waNum: 'string (optional, max 20 chars)',
      message: 'string (required, max 1000 chars)'
    },
    rate_limits: '100 requests per 15 minutes'
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Email feedback server running on port ${PORT}`);
});

module.exports = app;
