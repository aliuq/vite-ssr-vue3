<script setup lang="ts">
// import naiveUISvg from 'public/naive-ui.svg'
const router = useRouter()

function go() {
  router.push({ name: 'form' })
}
</script>

<template>
  <div>
    <div flex="~" justify-center items-center>
      <div i-carbon-campsite text-4xl inline-block />
      <i px-2 text-3xl not-italic>+</i>
      <img src="/public/naive-ui.svg" text-4xl width="32" height="32">
    </div>
    <p pt-5px>
      <a rel="noreferrer" href="https://github.com/antfu/vitesse-lite" target="_blank">Vitesse Lite</a>
      +
      <a rel="noreferrer" href="https://www.naiveui.com/zh-CN/dark/docs/installation" target="_blank">Naive UI</a>
    </p>

    <div my-4>
      <button class="m-3 text-sm btn" @click="go">
        /form
      </button>
    </div>
  </div>
</template>
