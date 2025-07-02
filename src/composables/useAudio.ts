import { ref, onUnmounted } from 'vue'
import { RecordTranscribe } from '@soniox/speech-to-text-web'
import type { TranscriptEntry } from '@/types'

export function useAudio() {
  const audioLevel = ref(0)
  const isRecording = ref(false)
  const transcript = ref<TranscriptEntry[]>([])
  
  let recordTranscribe: RecordTranscribe | null = null
  let audioContext: AudioContext | null = null
  let analyser: AnalyserNode | null = null
  let animationFrame: number | null = null

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

  const startRecording = async (onPartialResult: (result: any) => void, onFinalResult: (result: any) => void) => {
    try {
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
          if (!result.tokens || result.tokens.length === 0) return;

          // Group contiguous tokens by speaker
          let chunks: { speaker: any, text: string, tokens: any[] }[] = [];
          let currentSpeaker = result.tokens[0].speaker;
          let currentTokens: any[] = [];

          for (const token of result.tokens) {
            if (token.speaker !== currentSpeaker) {
              chunks.push({
                speaker: currentSpeaker,
                text: currentTokens.filter((t: any) => t.is_final).map((t: any) => t.text).join(''),
                tokens: currentTokens
              });
              currentSpeaker = token.speaker;
              currentTokens = [];
            }
            currentTokens.push(token);
          }
          // Push the last chunk
          if (currentTokens.length > 0) {
            chunks.push({
              speaker: currentSpeaker,
              text: currentTokens.filter((t: any) => t.is_final).map((t: any) => t.text).join(''),
              tokens: currentTokens
            });
          }

          // Emit a partial result for each chunk with non-empty text
          for (const chunk of chunks) {
            if (chunk.text.length > 0) {
              onPartialResult({
                ...result,
                text: chunk.text,
                speaker: chunk.speaker,
                tokens: chunk.tokens
              });
            }
          }
        },
        onFinalResult: (result: any) => {
          if (!result.tokens || result.tokens.length === 0) return;

          // Group contiguous tokens by speaker
          let chunks: { speaker: any, text: string, tokens: any[] }[] = [];
          let currentSpeaker = result.tokens[0].speaker;
          let currentTokens: any[] = [];

          for (const token of result.tokens) {
            if (token.speaker !== currentSpeaker) {
              chunks.push({
                speaker: currentSpeaker,
                text: currentTokens.filter((t: any) => t.is_final).map((t: any) => t.text).join(''),
                tokens: currentTokens
              });
              currentSpeaker = token.speaker;
              currentTokens = [];
            }
            currentTokens.push(token);
          }
          // Push the last chunk
          if (currentTokens.length > 0) {
            chunks.push({
              speaker: currentSpeaker,
              text: currentTokens.filter((t: any) => t.is_final).map((t: any) => t.text).join(''),
              tokens: currentTokens
            });
          }

          // Emit a final result for each chunk with non-empty text
          for (const chunk of chunks) {
            if (chunk.text.length > 0) {
              onFinalResult({
                ...result,
                text: chunk.text,
                speaker: chunk.speaker,
                tokens: chunk.tokens
              });
            }
          }
        },
        onError: (status: any, message: string) => {
          console.error('Soniox error:', status, message)
          isRecording.value = false
          throw new Error(`Transcription error: ${message}`)
        },
        onFinished: () => {
          console.log('Soniox transcription finished')
          stopRecording()
        }
      })

    } catch (err) {
      console.error('Error starting recording:', err)
      throw new Error('Failed to start transcription. Please check your API key and microphone permissions.')
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

  onUnmounted(() => {
    if (isRecording.value) {
      stopRecording()
    }
  })

  return {
    audioLevel,
    isRecording,
    transcript,
    startRecording,
    stopRecording
  }
}
