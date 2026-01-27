<template>
<div v-if="isLoading" id="preloader">
  <div style="" class="loader">loading</div>
</div>

<h1>MiniGames</h1>

<div class="game-container">
<center>
    <img style="border-radius: 20px; margin-top: -14px; margin-left: -10px;" src="https://github.com/MatveyVue/icopn/blob/main/Bombies.jpeg?raw=true" width="106%">
    <p class="name-game">Bombies</p><br>
    <a href="">
        <button class="play-game">Play</button>
    </a>
</center>
</div>


<div class="bar">
<div class="btn-container">
<RouterLink to="/market">
    <button class="market" @click="triggerMediumHaptic">
        <img style="position: absolute; margin-left: -17px; margin-top: 5px;" src="https://github.com/MatveyVue/icopn/blob/main/Market.png?raw=true" width="33px"></img>
        <p style="margin-top: 40px;">Market</p>
    </button>
</RouterLink>
<RouterLink to="/">
    <button class="leaders" @click="triggerMediumHaptic">
        <img style="position: absolute; margin-left: -18px;" src="https://github.com/MatveyVue/icopn/blob/main/LeaderBoard.png?raw=true" width="40px"></img>
        <p style="margin-top: 40px; color: white;">Top</p>
    </button>
</RouterLink>
    <button class="game" @click="triggerMediumHaptic">
        <img style="position: absolute; margin-left: -23px; margin-top: -4px;" src="https://github.com/MatveyVue/icopn/blob/main/GameActive.PNG?raw=true" width="45px"></img>
        <p style="margin-top: 40px; color: rgb(25, 122, 207);">Game</p>
    </button>
<RouterLink to="/profile">
    <button class="profile" @click="triggerMediumHaptic">
        <img style="position: absolute; margin-left: -18px;" src="https://github.com/MatveyVue/icopn/blob/main/Profile.png?raw=true" width="35px"></img>
        <p style="margin-top: 40px;">Profile</p>
    </button>
</RouterLink>
</div>
</div>
</template>

<script setup>
import { ref, onBeforeUnmount, onMounted, watch } from 'vue'

defineOptions({ name: 'game' });

</script>