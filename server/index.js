import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('generate-summary', async (transcriptData) => {
    if (!transcriptData || !transcriptData.length) {
      socket.emit('summary-error', 'No transcript available');
      return;
    }

    try {
      // Combine all transcript entries
      const fullTranscript = transcriptData
        .map(entry => `${entry.speaker}: ${entry.text}`)
        .join('\n');

      if (!fullTranscript.trim()) {
        socket.emit('summary-error', 'No transcript content available for summary');
        return;
      }

      console.log('Generating summary for transcript:', fullTranscript.substring(0, 200) + '...');

      // Generate summary using Groq
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that summarizes meeting transcripts. Provide a concise, well-structured summary with key points, decisions made, and action items if any."
          },
          {
            role: "user",
            content: `Please summarize this meeting transcript:\n\n${fullTranscript}`
          }
        ],
        model: "meta-llama/llama-4-maverick-17b-128e-instruct",
        temperature: 0.3,
        max_tokens: 1000
      });

      const summary = completion.choices[0]?.message?.content || 'Unable to generate summary';
      socket.emit('summary-generated', {
        summary,
        wordCount: fullTranscript.split(' ').length,
        speakers: [...new Set(transcriptData.map(entry => entry.speaker))],
        generatedAt: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error generating summary:', error);
      socket.emit('summary-error', 'Failed to generate summary: ' + error.message);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Environment check:');
  console.log('- SONIOX_API_KEY:', process.env.SONIOX_API_KEY ? 'Set' : 'Missing');
  console.log('- GROQ_API_KEY:', process.env.GROQ_API_KEY ? 'Set' : 'Missing');
});