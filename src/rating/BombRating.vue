<template>
<div v-if="isLoading" id="preloader">
  <div style="" class="loader">loading</div>
</div>
  <div class="leaderboard">
    <div class="players-container">
      <!-- Второе место (слева) -->
      <div v-if="topPlayers[1]" class="player-card2">
        <img src="https://github.com/MatveyVue/Telegram-Gifts/blob/main/Loot%20Bag.png?raw=true" width="100px">
        <div class="rank">#2</div>
        <div class="name">{{ topPlayers[1].username || 'Аноним' }}</div>
        <div class="score">{{ topPlayers[1].totalScore }}</div>
      </div>

      <!-- Первое место (посередине) -->
      <div v-if="topPlayers[0]" class="player-card1">
        <img src="https://github.com/MatveyVue/Telegram-Gifts/blob/main/Durov's%20Cap.png?raw=true" width="120px">
        <div class="rank">#1</div>
        <div class="name">{{ topPlayers[0].username || 'Аноним' }}</div>
        <div class="score">{{ topPlayers[0].totalScore }}</div>
      </div>

      <!-- Третье место (справа) -->
      <div v-if="topPlayers[2]" class="player-card3">
        <img src="https://github.com/MatveyVue/Telegram-Gifts/blob/main/Vintage%20Cigar.png?raw=true" width="100px">
        <div class="rank">#3</div>
        <div class="name">{{ topPlayers[2].username || 'Аноним' }}</div>
        <div class="score">{{ topPlayers[2].totalScore }}</div>
      </div>
    </div>

    <div style="margin-top: -30px;" class="banner">
      <a href="https://t.me/+x4-ZMCjs8y0zNDQ0">
        <img class="banner" src="https://github.com/MatveyVue/icopn/blob/main/Banner.jpg?raw=true"></img>
      </a>
    </div>
    
    <!-- Список остальных игроков (4-10 места) -->
    <div v-if="topPlayers.length > 3" class="other-players">
      <div class="players-list">
        <div 
          v-for="(player, index) in topPlayers.slice(3, 10)" 
          :key="player.id" 
          class="player-row"
          :class="{
            'top4': index === 0,
            'top5': index === 1,
            'top6': index === 2
          }"
        >
          <div class="player-rank">#{{ index + 4 }}</div>
          <div class="player-avatar">
            <img 
              v-if="player.photoUrl" 
              :src="player.photoUrl" 
              class="avatar-img"
              alt="Аватар"
            >
            <div v-else class="avatar-default">
              {{ getInitial(player.username) }}
            </div>
          </div>
          <div class="player-info">
            <span class="player-name">{{ player.username || 'Аноним' }}</span>
          </div>
          <div class="player-score">{{ player.totalScore }}</div>
        </div>
      </div>
    </div>
    
    <div v-if="topPlayers.length === 0" class="no-data">
      Нет данных об игроках
    </div>
  </div>

<p style="color: rgb(20, 20, 20);">.</p>
<p style="color: rgb(20, 20, 20);">.</p>
<p style="color: rgb(20, 20, 20);">.</p>

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
import { ref, onMounted } from 'vue'
import { initializeApp } from 'firebase/app'
import { 
  getFirestore, 
  collection, 
  query, 
  orderBy, 
  limit, 
  getDocs 
} from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyAC5LEXiZ-_LcPg3pUlb9tuDzQvUptHF7s",
  authDomain: "giftcaps.firebaseapp.com",
  databaseURL: "https://giftcaps-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "giftcaps",
  storageBucket: "giftcaps.firebasestorage.app",
  messagingSenderId: "762854065131",
  appId: "1:762854065131:web:116cf5343de1d1e353cfae",
  measurementId: "G-LK9N0SKT0P"
}

let db = null
try {
  const app = initializeApp(firebaseConfig)
  db = getFirestore(app)
  console.log('✅ Firebase инициализирован')
} catch (error) {
  console.error('❌ Ошибка инициализации Firebase:', error)
}

const topPlayers = ref([])

// Функция для получения первой буквы имени для дефолтной аватарки
const getInitial = (username) => {
  if (!username) return '?'
  return username.charAt(0).toUpperCase()
}

const fetchTopPlayers = async () => {
  try {
    if (!db) {
      throw new Error('Firebase не инициализирован')
    }
    
    const playersRef = collection(db, 'players')
    const topQuery = query(
      playersRef,
      orderBy('totalScore', 'desc'),
      limit(10)
    )
    
    const querySnapshot = await getDocs(topQuery)
    const players = []
    
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      players.push({
        id: doc.id,
        username: data.username || data.firstName || data.telegramUsername || 'Аноним',
        totalScore: data.totalScore || 0,
        photoUrl: data.photoUrl || data.avatar || null,
        telegramUsername: data.telegramUsername || null
      })
    })
    
    players.sort((a, b) => b.totalScore - a.totalScore)
    topPlayers.value = players
    console.log('✅ Загружено игроков:', players.length)
  } catch (err) {
    console.error('❌ Ошибка загрузки:', err)
  }
}

onMounted(() => {
  fetchTopPlayers()
})

const isLoading = ref(true);

onMounted(() => {
    isLoading.value = true;
});

window.addEventListener('load', function() {
});

setTimeout(function() {
    const preloader = document.getElementById('preloader');
    if (preloader) { // Проверяем, существует ли элемент
        preloader.classList.add('hidden'); // Добавляем класс для скрытия
    }
}, 5000);
</script>

<style scoped>
.leaderboard {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  text-align: center;
  font-family: Arial, sans-serif;
}

.players-container {
  margin-top: 20px;
  min-height: 300px;
  position: relative;
}

.player-card1 {
  position: absolute;
  text-align: center;
  left: 50%;
  transform: translateX(-50%);
  top: 0;
}

.player-card2 {
  position: absolute;
  text-align: center;
  left: -5px;
  top: 50px;
}

.player-card3 {
  position: absolute;
  text-align: center;
  right: -5px;
  top: 50px;
}

.player-card1 img,
.player-card2 img,
.player-card3 img {
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
}

.rank {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 15px;
}

.name {
  font-size: 20px;
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 8px;
  margin-top: -5px;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.score {
  font-size: 18px;
  color: #666;
  font-weight: bold;
  margin-top: -5px;
}

/* Стили для списка остальных игроков */
.other-players {
  margin-top: 10px;
  border-radius: 15px;
}

.players-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.player-row {
  display: flex;
  align-items: center;
  background: rgb(25, 25, 25);
  height: 60px;
  border-radius: 15px;
  width: 100%;
  padding: 0 15px;
  margin-left: -15px;
}

.player-rank {
  font-weight: bold;
  color: #ccc;
  min-width: 40px;
  font-size: 16px;
  margin-left: -7px;
}

.player-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  margin-left: 10px;
  background: #444;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-default {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 18px;
  color: white;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.player-info {
  flex: 1;
  text-align: left;
  padding-left: 15px;
}

.player-name {
  font-weight: 500;
  color: #fff;
  font-size: 16px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.player-score {
  font-weight: bold;
  color: #aaa;
  font-size: 15px;
  min-width: 60px;
  text-align: right;
}

.no-data {
  padding: 30px;
  background: #f5f5f5;
  border-radius: 10px;
  color: #666;
  margin: 40px 0;
}

.banner {
    width: 105%;
    margin-left: -10px;
}
</style>