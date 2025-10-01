#!/usr/bin/env node

const express = require('express');
const app = express();
const PORT = 8080;

// Middleware to parse JSON
app.use(express.json());

// Store received webhooks
const receivedWebhooks = [];

// Webhook endpoint
app.post('/webhook', (req, res) => {
  const timestamp = new Date().toISOString();
  const webhook = {
    timestamp,
    body: req.body,
    headers: req.headers
  };
  
  receivedWebhooks.push(webhook);
  
  console.log('\nBIRTHDAY NOTIFICATION RECEIVED!');
  console.log('=====================================');
  console.log(`Time: ${timestamp}`);
  console.log(`Message: ${req.body.message}`);
  console.log(`User ID: ${req.body.userId}`);
  console.log('=====================================\n');
  
  res.status(200).json({ 
    success: true, 
    message: 'Webhook received successfully',
    timestamp 
  });
});

// Get all received webhooks
app.get('/webhooks', (req, res) => {
  res.json({
    count: receivedWebhooks.length,
    webhooks: receivedWebhooks
  });
});

// Clear webhooks
app.delete('/webhooks', (req, res) => {
  receivedWebhooks.length = 0;
  res.json({ success: true, message: 'Webhooks cleared' });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    webhookCount: receivedWebhooks.length 
  });
});

// Start server
app.listen(PORT, () => {
  console.log('Birthday Webhook Server Started!');
  console.log('=====================================');
  console.log(`Server running on: http://localhost:${PORT}`);
  console.log(`Webhook endpoint: http://localhost:${PORT}/webhook`);
  console.log(`View webhooks: http://localhost:${PORT}/webhooks`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log('=====================================');
  console.log('Waiting for birthday notifications...\n');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down webhook server...');
  process.exit(0);
});
