# Cal.com Email Extractor

A simple tool to extract host emails from Cal.com scheduling pages.

## Purpose
Automates extracting host emails from Cal.com scheduling links by simulating a booking interaction, making it easier for cold email outreach.

## Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/oseniabdulhaleem/Cal-booking
   cd Cal-booking
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Build and run:**
   ```bash
   npm run build
   npm start
   ```

## Usage
1. Visit `http://localhost:8080`
2. Enter a Cal.com scheduling link (e.g., `cal.com/username/30min`)
3. Click "Get Email"
4. Wait for the host's email to be displayed

## Docker Setup
```bash
docker build -t cal-email-extractor .
docker run -p 8080:8080 cal-email-extractor
```

## Tech Stack
- TypeScript
- Express.js
- Puppeteer
- Pug Templates

## Note
Please use responsibly and in accordance with applicable privacy laws and terms of service.