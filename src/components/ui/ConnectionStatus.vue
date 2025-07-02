<script setup lang="ts">
defineProps<{
  isConnected: boolean
}>()
</script>

<template>
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
</template>
