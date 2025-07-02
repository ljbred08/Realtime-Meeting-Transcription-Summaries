# Real-time Audio Transcription & Analysis App

A modern Vue.js application for real-time audio transcription with speaker diarization using Soniox API and AI-powered summary generation using Groq.

## Features

- **Real-time Transcription**: Live audio transcription with speaker diarization
- **Speaker Identification**: Automatic speaker separation and color-coded display
- **AI Summaries**: Generate intelligent meeting summaries using Groq AI
- **Export Functionality**: Export transcripts and summaries as text files
- **Modern UI**: Dark theme with teal accents and smooth animations
- **Real-time Updates**: WebSocket-based live transcript updates
- **Audio Visualization**: Live audio level monitoring during recording

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment Variables**
   Copy `.env.example` to `.env` and add your API keys:
   ```bash
   cp .env.example .env
   ```
   
   Get your API keys from:
   - [Soniox API](https://soniox.com/) for transcription
   - [Groq API](https://groq.com/) for AI summaries

3. **Start the Application**
   ```bash
   npm run dev
   ```
   
   This will start both the frontend (port 5173) and backend server (port 3001).

## API Keys Setup

### Soniox API
1. Sign up at [Soniox](https://soniox.com/)
2. Create a new project
3. Get your API key from the dashboard
4. Add it to your `.env` file as `SONIOX_API_KEY`

### Groq API
1. Sign up at [Groq](https://groq.com/)
2. Generate an API key
3. Add it to your `.env` file as `GROQ_API_KEY`

## Usage

1. **Start Recording**: Click the microphone button to begin real-time transcription
2. **Monitor Audio**: Watch the audio level indicator to ensure proper input
3. **View Transcript**: See live transcript with speaker identification and confidence scores
4. **Generate Summary**: Click "Generate Summary" to create an AI-powered meeting summary
5. **Export Data**: Use export buttons to save transcripts and summaries

## Architecture

- **Frontend**: Vue 3 + TypeScript + Vite
- **Backend**: Node.js + Express + Socket.IO
- **Real-time Communication**: WebSocket connections
- **Transcription**: Soniox WebSocket API
- **AI Summaries**: Groq API
- **Audio Processing**: Web Audio API

## Technology Stack

- Vue 3 with Composition API
- TypeScript for type safety
- Socket.IO for real-time communication
- Express.js backend server
- Soniox API for transcription
- Groq API for AI summaries
- Tailwind CSS for styling
- Web Audio API for audio processing

## Browser Requirements

- Modern browser with microphone access
- WebRTC support for audio capture
- WebSocket support for real-time updates

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details