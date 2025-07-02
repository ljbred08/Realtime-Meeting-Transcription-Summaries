<script setup lang="ts">
import { computed } from 'vue'
import type { Summary } from '@/types'
import StatsPanel from './StatsPanel.vue'

const props = defineProps<{
  summary: Summary | null
  isGenerating: boolean
  onGenerate: () => void
  onExport: () => void
}>()

const hasSummary = computed(() => !!props.summary)
</script>

<template>
  <div class="h-full flex flex-col">
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
            @click="onGenerate"
            :disabled="isGenerating"
            class="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors text-sm font-medium"
          >
            <span v-if="isGenerating" class="flex items-center space-x-2">
              <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Generating...</span>
            </span>
            <span v-else>Generate Summary</span>
          </button>
          <button
            v-if="hasSummary"
            @click="onExport"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-sm"
          >
            Export
          </button>
        </div>
      </div>
    </div>
    
    <div class="flex-1 p-6 overflow-y-auto">
      <div v-if="!hasSummary" class="flex flex-col items-center justify-center h-full text-center text-gray-500">
        <svg class="w-16 h-16 mb-4 opacity-50" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p class="text-lg mb-2">No summary yet</p>
        <p class="text-sm">Generate a summary from your transcript</p>
      </div>
      
      <div v-else class="space-y-4">
        <StatsPanel :summary="summary" />
        
        <div class="prose prose-invert max-w-none">
          <div class="whitespace-pre-wrap text-gray-200 leading-relaxed">{{ summary.summary }}</div>
        </div>
        
        <div class="text-xs text-gray-400 pt-4 border-t border-gray-700">
          Generated on {{ new Date(summary.generatedAt).toLocaleString() }}
        </div>
      </div>
    </div>
  </div>
</template>
