import { ref } from 'vue'
import { io, type Socket } from 'socket.io-client'
import type { Summary } from '@/types'

export function useSocket() {
  const socket = ref<Socket | null>(null)
  const isConnected = ref(false)
  const error = ref<string | null>(null)
  const summary = ref<Summary | null>(null)
  const isGeneratingSummary = ref(false)

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

  const generateSummary = (transcript: any[]) => {
    if (!socket.value) return
    
    isGeneratingSummary.value = true
    error.value = null
    
    const finalTranscript = transcript
      .filter(entry => entry.is_final)
      .map(entry => ({ speaker: entry.speaker, text: entry.text }))
    
    socket.value.emit('generate-summary', finalTranscript)
  }

  const disconnect = () => {
    if (socket.value) {
      socket.value.disconnect()
    }
  }

  return {
    socket,
    isConnected,
    error,
    summary,
    isGeneratingSummary,
    initializeSocket,
    generateSummary,
    disconnect
  }
}
