export interface TranscriptEntry {
  id: number
  speaker: string
  text: string
  confidence: number
  timestamp: string
  is_final: boolean
}

export interface MergedTranscriptEntry extends Omit<TranscriptEntry, 'id'> {
  id: string
  chunkCount: number
}

export interface Summary {
  summary: string
  wordCount: number
  speakers: string[]
  generatedAt: string
}
