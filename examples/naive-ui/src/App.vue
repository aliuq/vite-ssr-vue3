<script setup lang="ts">
// This starter template is using Vue 3 <script setup> SFCs
// Check out https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup
import { darkTheme, lightTheme } from 'naive-ui'
import { ref } from 'vue'
import HelloWorld from './components/HelloWorld.vue'

const theme = ref<typeof darkTheme | null>(null)
const toggleTheme = () => {
  theme.value = theme.value?.name === 'dark' ? lightTheme : darkTheme
}
</script>

<template>
  <n-message-provider>
    <n-config-provider :theme="theme">
      <div class="icons">
        <img alt="Vue logo" src="./assets/logo.png">
        <span>+</span>
        <img src="https://www.naiveui.com/assets/naivelogo.93278402.svg" alt="">
      </div>
      <div class="form">
        <h2>
          Form 示例 <n-button @click="toggleTheme">
            深色/浅色
          </n-button>
        </h2>
        <HelloWorld />
      </div>
    </n-config-provider>
  </n-message-provider>
</template>

<style>
#app {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;

  width: 800px;
  margin: 60px auto;
}
.icons {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  height: 150px;
}
.icons img {
  height: 100%;
  object-fit: cover;
}
.icons span {
  font-size: 60px;
  padding: 0 2rem;
  color: #666;
}
.form h2 {
  margin-bottom: 2rem;
}
</style>
