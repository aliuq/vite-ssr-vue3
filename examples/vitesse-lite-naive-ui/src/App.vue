<script lang="ts" setup>
import { darkTheme, lightTheme } from 'naive-ui'
import { isDark } from '~/composables'

const theme = computed(() => {
  return isDark.value ? darkTheme : lightTheme
})
</script>

<template>
  <div>
    <n-config-provider :theme="isDark ? darkTheme : lightTheme">
      <n-message-provider>
        <main font-sans p="x-4 y-10" text="center gray-700 dark:gray-200">
          <router-view />
          <Footer />
        </main>
      </n-message-provider>
    </n-config-provider>
  </div>
</template>
