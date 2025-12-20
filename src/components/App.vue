<template>
<RouterView v-slot="{ Component, route }">
  <KeepAlive include="market">
    <component :is="Component" v-if="route.name === 'market'" />
  </KeepAlive>
  <component :is="Component" v-if="route.name !== 'market'" />
</RouterView>
</template>
