<template>
<div v-if="isLoading" id="preloader">
  <div style="" class="loader">loading</div>
</div>

<center>
<div class="top-rating">
<RouterLink to="/">
    <button class="stars-rat">Stars</button>
</RouterLink>
<RouterLink to="token">
    <button style="background-color: #181818; color: rgb(238, 238, 238);" class="token-rat">Token</button>
</RouterLink>
</div>
</center>

<div>
<div style="display: flex; justify-content: center; gap: 7vw; margin-top: 10px;" v-if="topHolders.length">

<div v-if="topHolders.length > 1" :style="{ 'text-align': 'center', 'margin-top': '30px' }">
    <img style="border-radius: 50%;" src="https://github.com/MatveyVue/Profiles-Telegram/blob/main/Webby.jpg?raw=true" width="90px" alt="Holder Image">
    <div style="margin-left: 9vw; margin-top: -25px;" class="top-2">2</div>
<div style="margin-top: 3px;">
    <a :href="'https://tonviewer.com/address/' + topHolders[1].owner.address" target="_blank" rel="noopener noreferrer">
      <b>{{ shortenAddress(topHolders[1].owner.address) }}</b>
    </a>
    <br>
    {{ formatBalance(topHolders[1].balance) }}
</div>
</div>

  <!-- Центральный держатель (самый большой) -->
<div :style="{ 'text-align': 'center' }">
    <img style="border-radius: 50%;" src="https://github.com/MatveyVue/Profiles-Telegram/blob/main/Scrooge.jpg?raw=true" width="110px" alt="Holder Image">
    <div style="margin-top: -17px;" class="top1">1</div>
<div style="margin-top: 5px;">
    <a :href="'https://tonviewer.com/address/' + topHolders[0].owner.address" target="_blank" rel="noopener noreferrer">
      <b>{{ shortenAddress(topHolders[0].owner.address) }}</b>
    </a>
    <br>
    {{ formatBalance(topHolders[0].balance) }}
</div>
</div>


<div v-if="topHolders.length > 2" :style="{ 'text-align': 'center', 'margin-top': '30px' }">
    <img style="border-radius: 50%;" src="https://github.com/MatveyVue/Profiles-Telegram/blob/main/StonFi.png?raw=true" width="90px" alt="Holder Image">
    <div style="margin-left: 9vw; margin-top: -25px;" class="top-3">3</div>
<div style="margin-top: 3px;">
    <a :href="'https://tonviewer.com/address/' + topHolders[2].owner.address" target="_blank" rel="noopener noreferrer">
      <b>{{ shortenAddress(topHolders[2].owner.address) }}</b>
    </a>
    <br>
    {{ formatBalance(topHolders[2].balance) }}
</div>
</div>
</div>

<p style="color: rgb(20, 20, 20); font-size: 10px;">.</p>
<div class="banner">
    <a href="https://t.me/+x4-ZMCjs8y0zNDQ0">
        <img class="banner" src="https://github.com/MatveyVue/icopn/blob/main/Banner.jpg?raw=true"></img>
    </a>
</div>
<p style="color: rgb(20, 20, 20); font-size: 5px;">.</p>

<div>
    <div class="border-wallet" v-if="topHolders.length > 3" style="display: flex; align-items: center; gap: 10px;">
      <img src="https://github.com/MatveyVue/Profiles-Telegram/blob/main/Rstm%20Crew.jpg?raw=true" width="40px" alt="Holder Avatar" style="border-radius: 50%; margin-left: 7px;">
      <div>
        <a :href="'https://tonviewer.com/address/' + topHolders[3].owner.address" target="_blank" rel="noopener noreferrer">
          <b><p style="margin-left: 10px;" class="wallet">{{ shortenAddress(topHolders[3].owner.address) }}</p></b>
        </a>
        <p class="tokens-wallet">{{ formatBalance(topHolders[3].balance) }}</p>
      </div>
    </div>
</div>

    <!-- Остальные кошельки -->
<div>
    <div class="border-wallet" v-for="holder in otherHolders" :key="holder.address" style="display: flex; align-items: center; gap: 10px;">
      <img src="https://github.com/MatveyVue/gift/blob/main/Anonim.png?raw=true" width="55px" alt="Holder Avatar" style="border-radius: 50%;">
      <div>
        <a :href="'https://tonviewer.com/address/' + holder.owner.address" target="_blank" rel="noopener noreferrer">
          <b><p class="wallet">{{ shortenAddress(holder.owner.address) }}</p></b>
        </a>
        <p class="tokens-wallet">{{ formatBalance(holder.balance) }}</p>
      </div>
    </div>
</div>


    <!-- Остальной ваш шаблон -->
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
        <img style="position: absolute; margin-left: -18px;" src="https://github.com/MatveyVue/icopn/blob/main/LeaderActive.png?raw=true" width="40px"></img>
        <p style="margin-top: 40px;">Top</p>
    </button>
</RouterLink>
<RouterLink to="/profile">
    <button class="profile" @click="triggerMediumHaptic">
        <img style="position: absolute; margin-left: -18px;" src="https://github.com/MatveyVue/icopn/blob/main/Profile.png?raw=true" width="35px"></img>
        <p style="margin-top: 40px;">Profile</p>
    </button>
</RouterLink>
</div>
</div>
</template>

<script>
import { ref, onMounted } from 'vue';

export default {
    setup() {
    const isLoading = ref(true);

    onMounted(() => {
      isLoading.value = true;

      // setTimeout для скрытия preloader (теперь в setup)
      setTimeout(() => {
        const preloader = document.getElementById('preloader');
        if (preloader) {
          preloader.classList.add('hidden');
          isLoading.value = false; // Скрываем индикатор загрузки после выполнения setTimeout
        }
      }, 5000);

       // window.addEventListener('load' больше не нужен, т.к. код выполняется после монтирования
    });

    return { isLoading };
  },
  data() {
    return {
      holders: []
    }
  },
  computed: {
    // первые 3 кошелька
    topHolders() {
      return this.holders.slice(0, 4);
    },
    // остальные
    otherHolders() {
      return this.holders.slice(4);
    }
  },
  created() {
    this.fetchHolders();
  },
  methods: {
    fetchHolders() {
      fetch('https://tonapi.io/v2/jettons/EQAj5b62MW-WTXXa3jr02byWNUtCdWpVohFoGOo7GznlKtD9/holders?limit=1000&offset=0')
        .then(response => response.json())
        .then(data => {
          if (data.addresses && Array.isArray(data.addresses)) {
            this.holders = data.addresses.map(holder => ({
              balance: holder.balance,
              owner: holder.owner
            }));
          }
        })
        .catch(error => {
          console.error('Error fetching data:', error);
        });
    },
    shortenAddress(address) {
      if (!address || address.length < 10) return address;
      return address.slice(0, 5) + '...' + address.slice(-2);
    },
    formatBalance(balance) {
      console.log('Исходный баланс:', balance);
      let num = parseFloat(balance);
      if (isNaN(num)) {
        console.warn('Баланс не число:', balance);
        return balance;
      }
      if (num >= 1_000_000_000_000_000) {
        return (num / 1_000_000_000_000_000).toFixed(2) + 'М';
      } else if (num >= 1_000_000_000_000) {
        return (num / 1_000_000_000_000).toFixed(2) + 'K';
      } else {
        return num.toFixed(2);
      }
    }
  }
}
</script>

