import { ref, computed } from 'vue'
import type { TranscriptEntry, MergedTranscriptEntry } from '@/types'

const speakerColors = [
  '#14b8a6', '#f59e0b', '#ef4444', '#8b5cf6', 
  '#06b6d4', '#84cc16', '#f97316', '#ec4899'
]

export function useTranscript() {
  const transcript = ref<TranscriptEntry[]>([])

  const getSpeakerColor = (speaker: string) => {
    const index = parseInt(speaker.replace(/\D/g, '')) || 1
    return speakerColors[(index - 1) % speakerColors.length]
  }

  const mergedTranscript = computed(() => {
    const merged: MergedTranscriptEntry[] = []
    
    for (const entry of transcript.value) {
      const lastMerged = merged[merged.length - 1]
      
      if (lastMerged && lastMerged.speaker === entry.speaker) {
        lastMerged.text += ' ' + entry.text
        lastMerged.confidence = (lastMerged.confidence + entry.confidence) / 2
        lastMerged.timestamp = entry.timestamp
        lastMerged.is_final = lastMerged.is_final && entry.is_final
        lastMerged.chunkCount += 1
      } else {
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

  const addTranscriptEntry = (entry: Omit<TranscriptEntry, 'id'>) => {
    const newEntry: TranscriptEntry = {
      ...entry,
      id: Date.now() + Math.random()
    }
    
    const existingIndex = transcript.value.findIndex(t => t.id === newEntry.id)
    
    if (existingIndex >= 0) {
      transcript.value[existingIndex] = newEntry
    } else {
      transcript.value.push(newEntry)
    }
  }

  const clearTranscript = () => {
    transcript.value = []
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

  return {
    transcript,
    mergedTranscript,
    getSpeakerColor,
    addTranscriptEntry,
    clearTranscript,
    exportTranscript
  }
}
