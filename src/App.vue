<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { io, Socket } from 'socket.io-client'
import { RecordTranscribe } from '@soniox/speech-to-text-web'

interface TranscriptEntry {
  id: number
  speaker: string
  text: string
  confidence: number
  timestamp: string
  is_final: boolean
}

interface MergedTranscriptEntry {
  id: string
  speaker: string
  text: string
  confidence: number
  timestamp: string
  is_final: boolean
  chunkCount: number
}

interface Summary {
  summary: string
  wordCount: number
  speakers: string[]
  generatedAt: string
}

const socket = ref<Socket | null>(null)
const isRecording = ref(false)
const isConnected = ref(false)
const transcript = ref<TranscriptEntry[]>([])
const summary = ref<Summary | null>(null)
const isGeneratingSummary = ref(false)
const error = ref<string | null>(null)
const audioLevel = ref(0)

let recordTranscribe: RecordTranscribe | null = null
let audioContext: AudioContext | null = null
let analyser: AnalyserNode | null = null
let animationFrame: number | null = null

const speakerColors = [
  '#14b8a6', '#f59e0b', '#ef4444', '#8b5cf6', 
  '#06b6d4', '#84cc16', '#f97316', '#ec4899'
]

const getSpeakerColor = (speaker: string) => {
  const index = parseInt(speaker.replace(/\D/g, '')) || 1
  return speakerColors[(index - 1) % speakerColors.length]
}

// Computed property to merge adjacent entries from the same speaker
const mergedTranscript = computed(() => {
  const merged: MergedTranscriptEntry[] = []
  
  for (const entry of transcript.value) {
    const lastMerged = merged[merged.length - 1]
    
    // If this entry is from the same speaker as the last merged entry, merge them
    if (lastMerged && lastMerged.speaker === entry.speaker) {
      lastMerged.text += ' ' + entry.text
      lastMerged.confidence = (lastMerged.confidence + entry.confidence) / 2
      lastMerged.timestamp = entry.timestamp // Use latest timestamp
      lastMerged.is_final = lastMerged.is_final && entry.is_final // Only final if all chunks are final
      lastMerged.chunkCount += 1
    } else {
      // Create a new merged entry
      merged.push({
        id: `merged-${entry.id}`,
        speaker: entry.speaker,
        text: entry.text,
        confidence: entry.confidence,
        timestamp: entry.timestamp,
        is_final: entry.is_final,
        chunkCount: 1
      })
    }
  }
  
  return merged
})

const initializeSocket = () => {
  socket.value = io('http://localhost:3001')
  
  socket.value.on('connect', () => {
    isConnected.value = true
    error.value = null
    console.log('Connected to server')
  })

  socket.value.on('disconnect', () => {
    isConnected.value = false
    console.log('Disconnected from server')
  })

  socket.value.on('summary-generated', (summaryData: Summary) => {
    summary.value = summaryData
    isGeneratingSummary.value = false
  })

  socket.value.on('summary-error', (errorMsg: string) => {
    error.value = errorMsg
    isGeneratingSummary.value = false
  })

  socket.value.on('error', (errorMsg: string) => {
    error.value = errorMsg
    console.error('Socket error:', errorMsg)
  })
}

const getAudioLevel = () => {
  if (!analyser) return
  
  const dataArray = new Uint8Array(analyser.frequencyBinCount)
  analyser.getByteFrequencyData(dataArray)
  
  const average = dataArray.reduce((a, b) => a + b) / dataArray.length
  audioLevel.value = Math.min(average / 128, 1)
  
  if (isRecording.value) {
    animationFrame = requestAnimationFrame(getAudioLevel)
  }
}

const startRecording = async () => {
  try {
    error.value = null
    
    // Get microphone access for audio level monitoring
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 16000
      } 
    })

    // Set up audio analysis for visual feedback
    audioContext = new AudioContext()
    analyser = audioContext.createAnalyser()
    const source = audioContext.createMediaStreamSource(stream)
    source.connect(analyser)
    analyser.fftSize = 256

    // Initialize Soniox RecordTranscribe
    recordTranscribe = new RecordTranscribe({
      apiKey: import.meta.env.VITE_SONIOX_API_KEY,
    })

    // Clear previous transcript
    transcript.value = []
    
    // Start transcription
    await recordTranscribe.start({
      model: 'stt-rt-preview',
      enableSpeakerDiarization: true,
      onStarted: () => {
        console.log('Soniox transcription started')
        isRecording.value = true
        getAudioLevel()
      },
      onPartialResult: (result: any) => {
        console.log('Partial result:', result)
        var text = "";
          for (const token of result.tokens) {
            if (token.is_final) {
              text += token.text;
            } else {
             // newNonFinalTokens += token.text;
            }
          }
        if (text.length > 0) {
          const speaker = result.speaker ? `Speaker ${result.speaker}` : 'Speaker 1'
          
          const transcriptEntry: TranscriptEntry = {
            id: result.id || Date.now() + Math.random(),
            speaker: speaker,
            text: text,
            confidence: result.confidence || 0.9,
            timestamp: new Date().toISOString(),
            is_final: false
          }
          
          // Update or add partial result
          const existingIndex = transcript.value.findIndex(t => t.id === transcriptEntry.id)
          
          if (existingIndex >= 0) {
            transcript.value[existingIndex] = transcriptEntry
          } else {
            transcript.value.push(transcriptEntry)
          }
          
          // Auto-scroll to bottom
          setTimeout(() => {
            const container = document.getElementById('transcript-container')
            if (container) {
              container.scrollTop = container.scrollHeight
            }
          }, 100)
        }
      },
      onFinalResult: (result: any) => {
        console.log('Final result:', result)
        if (result.words && result.words.length > 0) {
          const text = result.words.map((w: any) => w.text).join(' ')
          const speaker = result.speaker ? `Speaker ${result.speaker}` : 'Speaker 1'
          
          const transcriptEntry: TranscriptEntry = {
            id: result.id || Date.now() + Math.random(),
            speaker: speaker,
            text: text,
            confidence: result.confidence || 0.9,
            timestamp: new Date().toISOString(),
            is_final: true
          }
          
          // Replace any partial result with final result
          const existingIndex = transcript.value.findIndex(t => t.id === transcriptEntry.id)
          
          if (existingIndex >= 0) {
            transcript.value[existingIndex] = transcriptEntry
          } else {
            transcript.value.push(transcriptEntry)
          }
          
          // Auto-scroll to bottom
          setTimeout(() => {
            const container = document.getElementById('transcript-container')
            if (container) {
              container.scrollTop = container.scrollHeight
            }
          }, 100)
        }
      },
      onError: (status: any, message: string) => {
        console.error('Soniox error:', status, message)
        error.value = `Transcription error: ${message}`
        isRecording.value = false
      },
      onFinished: () => {
        console.log('Soniox transcription finished')
        isRecording.value = false
        audioLevel.value = 0
        if (animationFrame) {
          cancelAnimationFrame(animationFrame)
        }
      }
    })

  } catch (err) {
    console.error('Error starting recording:', err)
    error.value = 'Failed to start transcription. Please check your API key and microphone permissions.'
    isRecording.value = false
  }
}

const stopRecording = () => {
  if (recordTranscribe) {
    recordTranscribe.stop()
  }
  
  if (audioContext) {
    audioContext.close()
  }
  
  if (animationFrame) {
    cancelAnimationFrame(animationFrame)
  }
  
  isRecording.value = false
  audioLevel.value = 0
}

const generateSummary = () => {
  if (!transcript.value.length) {
    error.value = 'No transcript available for summary'
    return
  }
  
  isGeneratingSummary.value = true
  error.value = null
  
  // Send merged transcript to server for summary generation
  const finalTranscript = mergedTranscript.value
    .filter(entry => entry.is_final)
    .map(entry => ({ speaker: entry.speaker, text: entry.text }))
  
  socket.value?.emit('generate-summary', finalTranscript)
}

const clearTranscript = () => {
  transcript.value = []
  summary.value = null
  error.value = null
}

const exportTranscript = () => {
  const finalTranscript = mergedTranscript.value
    .filter(entry => entry.is_final)
    .map(entry => `[${new Date(entry.timestamp).toLocaleTimeString()}] ${entry.speaker}: ${entry.text}`)
    .join('\n')
  
  const blob = new Blob([finalTranscript], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `transcript-${new Date().toISOString().slice(0, 10)}.txt`
  a.click()
  URL.revokeObjectURL(url)
}

const exportSummary = () => {
  if (!summary.value) return
  
  const summaryText = `Meeting Summary
Generated: ${new Date(summary.value.generatedAt).toLocaleString()}
Speakers: ${summary.value.speakers.join(', ')}
Word Count: ${summary.value.wordCount}

${summary.value.summary}`
  
  const blob = new Blob([summaryText], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `summary-${new Date().toISOString().slice(0, 10)}.txt`
  a.click()
  URL.revokeObjectURL(url)
}

onMounted(() => {
  initializeSocket()
})

onUnmounted(() => {
  if (isRecording.value) {
    stopRecording()
  }
  socket.value?.disconnect()
})
</script>

<template>
  <div class="min-h-screen bg-gray-900 text-white">
    <!-- Header -->
    <header class="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-10">
      <div class="max-w-7xl mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-teal-400">TranscribeAI</h1>
            <p class="text-sm text-gray-400">Real-time Audio Transcription & Analysis</p>
          </div>
          <div class="flex items-center space-x-4">
            <div class="flex items-center space-x-2">
              <div 
                :class="[
                  'w-3 h-3 rounded-full transition-colors',
                  isConnected ? 'bg-green-400' : 'bg-red-400'
                ]"
              ></div>
              <span class="text-sm text-gray-400">
                {{ isConnected ? 'Connected' : 'Disconnected' }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>

    <div class="max-w-7xl mx-auto px-4 py-8">
      <!-- Controls -->
      <div class="mb-8">
        <div class="bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold">Recording Controls</h2>
            <div class="flex space-x-3">
              <button
                @click="clearTranscript"
                class="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm"
                :disabled="isRecording"
              >
                Clear
              </button>
              <button
                v-if="mergedTranscript.length > 0"
                @click="exportTranscript"
                class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-sm"
              >
                Export Transcript
              </button>
            </div>
          </div>
          
          <div class="flex items-center space-x-6">
            <button
              @click="isRecording ? stopRecording() : startRecording()"
              :disabled="!isConnected"
              :class="[
                'flex items-center justify-center w-16 h-16 rounded-full transition-all transform hover:scale-105',
                isRecording 
                  ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30' 
                  : 'bg-teal-500 hover:bg-teal-600 shadow-lg shadow-teal-500/30',
                !isConnected && 'opacity-50 cursor-not-allowed'
              ]"
            >
              <svg 
                v-if="!isRecording" 
                class="w-6 h-6" 
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path fill-rule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clip-rule="evenodd" />
              </svg>
              <div v-else class="w-4 h-4 bg-white rounded-sm"></div>
            </button>
            
            <!-- Audio Level Indicator -->
            <div v-if="isRecording" class="flex-1 max-w-xs">
              <div class="flex items-center space-x-2">
                <span class="text-sm text-gray-400">Audio Level:</span>
                <div class="flex-1 bg-gray-700 rounded-full h-2">
                  <div 
                    class="bg-teal-400 h-2 rounded-full transition-all duration-100"
                    :style="{ width: `${audioLevel * 100}%` }"
                  ></div>
                </div>
              </div>
            </div>
            
            <!-- Recording Indicator -->
            <div v-if="isRecording" class="flex items-center space-x-2">
              <div class="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
              <span class="text-sm text-red-400 font-medium">Recording</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Error Message -->
      <div v-if="error" class="mb-6">
        <div class="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <div class="flex items-center space-x-2">
            <svg class="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            <span class="text-red-400">{{ error }}</span>
          </div>
        </div>
      </div>

      <!-- Main Content Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Transcript Section -->
        <div class="bg-gray-800/30 backdrop-blur-sm rounded-xl border border-gray-700 h-[600px] flex flex-col">
          <div class="p-6 border-b border-gray-700 flex-shrink-0">
            <h2 class="text-lg font-semibold">Live Transcript</h2>
            <p class="text-sm text-gray-400 mt-1">
              {{ mergedTranscript.length }} entries • Real-time transcription with speaker diarization
            </p>
          </div>
          <div 
            id="transcript-container"
            class="flex-1 overflow-y-auto p-6 space-y-4"
          >
            <div v-if="mergedTranscript.length === 0" class="flex flex-col items-center justify-center h-full text-center text-gray-500">
              <svg class="w-16 h-16 mb-4 opacity-50" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clip-rule="evenodd" />
              </svg>
              <p class="text-lg mb-2">No transcript yet</p>
              <p class="text-sm">Start recording to see live transcription</p>
            </div>
            
            <div 
              v-for="entry in mergedTranscript" 
              :key="entry.id"
              :class="[
                'p-4 rounded-lg border-l-4 transition-all',
                entry.is_final ? 'bg-gray-700/30' : 'bg-gray-600/20 animate-pulse'
              ]"
              :style="{ borderLeftColor: getSpeakerColor(entry.speaker) }"
            >
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center space-x-2">
                  <span 
                    class="text-sm font-medium"
                    :style="{ color: getSpeakerColor(entry.speaker) }"
                  >
                    {{ entry.speaker }}
                  </span>
                  <span v-if="entry.chunkCount > 1" class="text-xs bg-gray-600 px-2 py-1 rounded text-gray-300">
                    {{ entry.chunkCount }} chunks
                  </span>
                </div>
                <div class="flex items-center space-x-2 text-xs text-gray-400">
                  <span>{{ new Date(entry.timestamp).toLocaleTimeString() }}</span>
                  <span v-if="entry.confidence" class="bg-gray-600 px-2 py-1 rounded">
                    {{ Math.round(entry.confidence * 100) }}%
                  </span>
                </div>
              </div>
              <p class="text-gray-200 leading-relaxed">{{ entry.text }}</p>
            </div>
          </div>
        </div>

        <!-- Summary Section -->
        <div class="bg-gray-800/30 backdrop-blur-sm rounded-xl border border-gray-700 h-[600px] flex flex-col">
          <div class="p-6 border-b border-gray-700 flex-shrink-0">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-lg font-semibold">AI Summary</h2>
                <p class="text-sm text-gray-400 mt-1">
                  Generate intelligent meeting summary
                </p>
              </div>
              <div class="flex space-x-2">
                <button
                  @click="generateSummary"
                  :disabled="isGeneratingSummary || mergedTranscript.length === 0"
                  class="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors text-sm font-medium"
                >
                  <span v-if="isGeneratingSummary" class="flex items-center space-x-2">
                    <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Generating...</span>
                  </span>
                  <span v-else>Generate Summary</span>
                </button>
                <button
                  v-if="summary"
                  @click="exportSummary"
                  class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-sm"
                >
                  Export
                </button>
              </div>
            </div>
          </div>
          
          <div class="flex-1 p-6 overflow-y-auto">
            <div v-if="!summary" class="flex flex-col items-center justify-center h-full text-center text-gray-500">
              <svg class="w-16 h-16 mb-4 opacity-50" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p class="text-lg mb-2">No summary yet</p>
              <p class="text-sm">Generate a summary from your transcript</p>
            </div>
            
            <div v-if="summary" class="space-y-4">
              <div class="grid grid-cols-3 gap-4 text-center">
                <div class="bg-gray-700/30 rounded-lg p-3">
                  <div class="text-2xl font-bold text-teal-400">{{ summary.wordCount }}</div>
                  <div class="text-xs text-gray-400">Words</div>
                </div>
                <div class="bg-gray-700/30 rounded-lg p-3">
                  <div class="text-2xl font-bold text-teal-400">{{ summary.speakers.length }}</div>
                  <div class="text-xs text-gray-400">Speakers</div>
                </div>
                <div class="bg-gray-700/30 rounded-lg p-3">
                  <div class="text-2xl font-bold text-teal-400">AI</div>
                  <div class="text-xs text-gray-400">Generated</div>
                </div>
              </div>
              
              <div class="prose prose-invert max-w-none">
                <div class="whitespace-pre-wrap text-gray-200 leading-relaxed">{{ summary.summary }}</div>
              </div>
              
              <div class="text-xs text-gray-400 pt-4 border-t border-gray-700">
                Generated on {{ new Date(summary.generatedAt).toLocaleString() }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Custom scrollbar */
#transcript-container::-webkit-scrollbar {
  width: 6px;
}

#transcript-container::-webkit-scrollbar-track {
  background: rgba(55, 65, 81, 0.3);
  border-radius: 3px;
}

#transcript-container::-webkit-scrollbar-thumb {
  background: rgba(20, 184, 166, 0.5);
  border-radius: 3px;
}

#transcript-container::-webkit-scrollbar-thumb:hover {
  background: rgba(20, 184, 166, 0.7);
}
</style>