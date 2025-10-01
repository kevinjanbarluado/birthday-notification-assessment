# Birthday Notification System

A simple and reliable system that automatically sends birthday messages to your users at exactly 9am in their local timezone. Perfect for apps that need to send personalized birthday greetings!

## What This Does

- **Sends birthday messages** at 9am in each user's timezone
- **Never misses a birthday** with automatic recovery for missed notifications
- **Easy to use** REST API for managing users
- **Runs anywhere** with Docker support
- **Handles thousands of users** with smart scheduling

## Requirements

Before running this assessment, ensure you have the following software installed:

- **Docker**: Version 20.10+ (for containerization)
- **Docker Compose**: Version 2.0+ (for multi-container orchestration)
- **Node.js**: Version 18.0+ (for development and testing)
- **npm**: Version 8.0+ (comes with Node.js)

### Verify Installation
```bash
# Check Docker version
docker --version

# Check Docker Compose version
docker-compose --version

# Check Node.js version
node --version

# Check npm version
npm --version
```

## Quick Start (5 minutes)

### Step 1: Setup Environment
```bash
# Clone the project
git clone https://github.com/kevinjanbarluado/birthday-notification-assessment.git
cd birthday-notification-assessment

# Copy environment configuration
cp .env.sample .env
```

### Step 2: Start the Local Webhook Server
```bash
# Start the local webhook server (in a separate terminal)
npm run webhook
```

### Step 3: Start the Birthday System
```bash
# Start everything with Docker
docker-compose up -d
```

### Step 4: Test It Out
```bash
# Create a test user
curl -X POST http://localhost:3000/user \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe", 
    "birthday": "1990-05-15",
    "location": "New York",
    "timezone": "America/New_York"
  }'

# Check if it's working
curl http://localhost:3000/health
```

That's it! The system is now running and will send birthday messages to your webhook.site URL.

## How to Use

### Add Users
```bash
curl -X POST http://localhost:3000/user \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Jane",
    "lastName": "Smith",
    "birthday": "1985-12-25",
    "location": "London", 
    "timezone": "Europe/London"
  }'
```

### Update User Info
```bash
curl -X PUT http://localhost:3000/user/USER_ID \
  -H "Content-Type: application/json" \
  -d '{
    "location": "Paris",
    "timezone": "Europe/Paris"
  }'
```

### Get User Details
```bash
curl http://localhost:3000/user/USER_ID
```

### Delete a User
```bash
curl -X DELETE http://localhost:3000/user/USER_ID
```

## Local Webhook Server

We've included a simple local webhook server (`webhook-server.js`) for testing:

```bash
# Start the webhook server
npm run webhook

# View received webhooks
curl http://localhost:8080/webhooks

# Clear webhook history
curl -X DELETE http://localhost:8080/webhooks
```

The webhook server will display birthday notifications in the console and store them for review.

## Configuration

The system uses a simple `.env` file for configuration:

```bash
# Your webhook URL (local server for testing)
WEBHOOK_URL=http://localhost:8080/webhook

# Database settings (defaults work fine)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=birthday_notifications
DB_USER=postgres
DB_PASSWORD=password

# When to send notifications (default: 9am)
BIRTHDAY_NOTIFICATION_HOUR=9
BIRTHDAY_NOTIFICATION_MINUTE=0

# How often to check for missed notifications (default: every hour)
RECOVERY_CHECK_INTERVAL_MINUTES=60
```

## Docker Commands

```bash
# Start the system
docker-compose up -d

# Stop the system
docker-compose down

# View logs
docker-compose logs -f birthday-service

# Restart after changes
docker-compose restart birthday-service
```

## Development Setup

If you want to modify the code:

```bash
# Install dependencies
npm install

# Start the database
docker-compose -f docker-compose.dev.yml up -d postgres-dev

# Run in development mode
npm run dev

# Run tests
npm test
```

## What You'll See

When a birthday notification is sent, your webhook will receive:

```json
{
  "message": "Hey, John Doe it's your birthday",
  "userId": "user-id-here",
  "timestamp": "2025-05-15T09:00:00.000Z"
}
```

## Supported Timezones

The system supports all standard timezone formats:
- `America/New_York`
- `Europe/London` 
- `Asia/Tokyo`
- `Australia/Sydney`
- `UTC`
- And many more!

## Troubleshooting

### System won't start?
```bash
# Check if port 3000 is free
lsof -i :3000

# Kill any processes using the port
sudo kill -9 $(lsof -t -i:3000)

# Restart Docker
docker-compose down && docker-compose up -d
```

### No notifications being sent?
1. Check your webhook URL is correct in `.env`
2. Make sure the user's birthday is in the future
3. Verify the timezone is valid
4. Check the logs: `docker-compose logs birthday-service`

### Database issues?
```bash
# Reset the database
docker-compose down -v
docker-compose up -d
```

## How It Works

1. **User Creation**: When you add a user, the system schedules their next 5 birthdays
2. **Daily Check**: Every minute, the system checks for birthdays happening now
3. **Timezone Magic**: Uses the user's timezone to send at exactly 9am local time
4. **Recovery**: If something goes wrong, it retries up to 3 times
5. **Webhook Delivery**: Sends the message to your webhook URL

## Scaling

This system can handle:
- **Thousands of users** with efficient database queries
- **Multiple timezones** with smart scheduling
- **High availability** with automatic recovery
- **Easy deployment** with Docker containers

## Security

- Input validation on all API endpoints
- SQL injection protection
- Rate limiting to prevent abuse
- Secure headers and CORS configuration

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/user` | Create a new user |
| GET | `/user/:id` | Get user details |
| PUT | `/user/:id` | Update user info |
| DELETE | `/user/:id` | Delete a user |
| GET | `/health` | Check system health |

This is a Boomering test assessment by Kevin Jan Barluado.
