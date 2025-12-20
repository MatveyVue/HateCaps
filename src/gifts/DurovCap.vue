<template>
<div id="preloader">
  <div style="" class="loader">loading</div>
</div>
<div class="gifts-wrapper">
  <div v-for="(gift, index) in gifts" :key="index" class="gifts-container">
    <img :src="gift.photo_url" style="width:100%; border-radius: 20px;">
    <p class="title" style="color:white;">{{ gift.title }}</p>
    <p class="number">#{{ gift.number }}</p>
    <a :href="gift.webapp_url" target="_blank" style="display:inline-block; margin-top:8px;">
      <button class="buy-btn">{{ gift.price }} TON</button>
    </a>
  </div>
</div>


<div class="bar">
<div class="btn-container">
<RouterLink to="/market">
    <button class="market">
        <img style="position: absolute; margin-left: -17px; margin-top: 5px;" src="https://github.com/MatveyVue/icopn/blob/main/MarketActive.png?raw=true" width="33px"></img>
        <p style="margin-top: 40px; color: rgb(25, 122, 207);">Market</p>
    </button>
</RouterLink>
<RouterLink to="/">
    <button class="leaders">
        <img style="position: absolute; margin-left: -18px;" src="https://github.com/MatveyVue/icopn/blob/main/LeaderBoard.png?raw=true" width="40px"></img>
        <p style="margin-top: 40px; color: white;">Top</p>
    </button>
</RouterLink>
<RouterLink to="profile">
    <button class="profile">
        <img style="position: absolute; margin-left: -18px;" src="https://github.com/MatveyVue/icopn/blob/main/Profile.png?raw=true" width="35px"></img>
        <p style="margin-top: 40px;">Profile</p>
    </button>
</RouterLink>
</div>
</div>
<p style="color: rgb(20, 20, 20);">.</p>
<p style="color: rgb(20, 20, 20);">.</p>
<p style="color: rgb(20, 20, 20);">.</p>
</template>

<script>
export default {
  data() {
    return {
      gifts: [],
      currentPage: 0,
      loading: false,
      allLoaded: false
    };
  },
  async mounted() {
    await this.fetchGifts();

    window.addEventListener('scroll', this.handleScroll);
  },
  beforeDestroy() {
    window.removeEventListener('scroll', this.handleScroll);
  },
  methods: {
    async fetchGifts() {
      if(this.loading || this.allLoaded) return;

      this.loading = true;

      const url = `https://api-swiftgifts.vercel.app/api/aggregator?page=${this.currentPage}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'x-api-key': import.meta.env.VITE_SWIFTGIFTS_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          "name": "Durov's Cap",
          "model": "All",
          "symbol": "All",
          "backdrop": "All",
          "number": null
        })
      });
      
      const data = await response.json();

      const newGifts = Array.isArray(data) ? data : data.items || [];
      if (newGifts.length > 0) {
        this.gifts = [...this.gifts, ...newGifts]; // добавляем новые гифты
        this.currentPage++; // переходим к следующей странице
      } else {
        this.allLoaded = true; // если данных больше нет, стоп
      }
      
      this.loading = false;
    },
    handleScroll() {
      if (
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 100 &&
        !this.loading &&
        !this.allLoaded
      ) {
        this.fetchGifts();
      }
    }
  }
};
</script>

<script setup>
window.addEventListener('load', function() {
});

setTimeout(function() {
    const preloader = document.getElementById('preloader');
    if (preloader) { // Проверяем, существует ли элемент
        preloader.classList.add('hidden'); // Добавляем класс для скрытия
    }
}, 5000); // 10000 миллисекунд = 10 секунд
</script>
