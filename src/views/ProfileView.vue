<template>
<center>
    <img class="profile-img" :src="photoUrl">
    <h2 style="color: white; margin-top: -10px;">{{ user }}</h2>
</center>

<div class="profile-tabs">
  <button class="tab-btn" :class="{ active: activeTab === 'channel' }" type="button" @click="setTab('channel')">
    Channel
  </button>
  <button class="tab-btn" :class="{ active: activeTab === 'gifts' }" type="button" @click="setTab('gifts')">
    Gifts
  </button>
</div>

<div v-if="activeTab === 'channel'" class="tab-panel">
  <h3>Your Rewards:</h3>
  <div class="rewards">
      <img class="channel" src="https://github.com/MatveyVue/testcap/blob/main/scmd69.jpg?raw=true">
    <a style="text-decoration: none; color: white;" href="https://t.me/+sc77S2Dsuwc5MGNk">
      <p class="channel-name">$CMD69</p>
    </a>
      <p class="stars">{{ stars }}</p>
  </div>
</div>

<div v-else class="tab-panel">
  <p v-if="giftsLoading" class="empty-text">Loading gifts...</p>
  <p v-else-if="giftsError" class="error-text">{{ giftsError }}</p>
  <p v-else-if="gifts.length === 0" class="empty-text">No gifts yet</p>
  <div v-else class="gifts-wrapper">
    <div v-for="(gift, index) in gifts" :key="index" class="gifts-container">
      <img :src="gift.photo_url" style="width:100%; border-radius: 20px;">
      <p class="title" style="color:white;">{{ gift.title }}</p>
      <p class="number">#{{ gift.number }}</p>
      <a :href="gift.webapp_url" target="_blank" rel="noopener" style="display:inline-block; margin-top:8px;">
        <button class="buy-btn">{{ gift.price }} TON</button>
      </a>
    </div>
  </div>
  <button v-if="giftsHasMore && !giftsLoading" class="filter-btn" type="button" @click="loadMoreGifts">
    Load more
  </button>
</div>

<div class="bar">
<div class="btn-container">
<RouterLink to="/market">
    <button class="market">
        <img style="position: absolute; margin-left: -17px; margin-top: 5px;" src="https://github.com/MatveyVue/icopn/blob/main/Market.png?raw=true" width="33px"></img>
        <p style="margin-top: 40px; color: white;">Market</p>
    </button>
</RouterLink>
<RouterLink to="/">
    <button class="leaders">
        <img style="position: absolute; margin-left: -18px;" src="https://github.com/MatveyVue/icopn/blob/main/LeaderBoard.png?raw=true" width="40px"></img>
        <p style="margin-top: 40px; color: white;">Top</p>
    </button>
</RouterLink>
    <button class="profile">
        <img style="position: absolute; margin-left: -18px;" src="https://github.com/MatveyVue/icopn/blob/main/ProfileActive.png?raw=true" width="35px"></img>
        <p style="margin-top: 40px; color: rgb(25, 122, 207);">Profile</p>
    </button>
</div>
</div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { initializeApp } from 'firebase/app'
import { getFirestore, doc, getDoc } from 'firebase/firestore'

defineOptions({ name: 'profile' })

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

const user = ref(null)
const photoUrl = ref('https://github.com/MatveyVue/gift/blob/main/Anonim.png?raw=true')
const stars = ref(0)
const activeTab = ref('channel')
const gifts = ref([])
const giftsLoaded = ref(false)
const giftsLoading = ref(false)
const giftsError = ref('')
const giftsOffset = ref(0)
const giftsLimit = 50
const giftsHasMore = ref(true)

onMounted(() => {
  const userData = window.Telegram?.WebApp?.initDataUnsafe?.user
  if (userData && userData.username) {
    user.value = userData.username
    photoUrl.value = userData.photo_url || photoUrl.value
    loadStars()
    if (activeTab.value === 'gifts') {
      loadGifts()
    }
  } else {
    console.log('Р?Р?Р>С?Р·Р?Р?Р°С'РчР>С? РчС%Рч Р?Рч Р?РїС?РчР?РчР>РчР? РёР>Рё Р?Р°Р?Р?С<С: Р?РчС'')
  }
})

async function loadStars() {
  if (!user.value) {
    stars.value = 0
    return
  }

  try {
    const userDocRef = doc(db, 'users', user.value)
    const userDocSnap = await getDoc(userDocRef)

    if (userDocSnap.exists()) {
      const data = userDocSnap.data()
      console.log('Р"Р°Р?Р?С<Рч Р?Р?РєС?Р?РчР?С'Р°:', data)
      stars.value = data.stars || 0
    } else {
      stars.value = 0
      console.log('Р?Р?Р>С?Р·Р?Р?Р°С'РчР>С? Р?Рч Р?Р°Р№Р?РчР?')
    }
  } catch (error) {
    console.error('Р?С?РёР+РєР° РїР?Р>С?С╪РчР?РёС? Р?Р°Р?Р?С<С::', error)
    stars.value = 0
  }
}

function setTab(tab) {
  activeTab.value = tab
  if (tab === 'gifts' && !giftsLoaded.value) {
    loadGifts()
  }
}

async function loadGifts() {
  if (!user.value || giftsLoading.value) return
  giftsLoading.value = true
  giftsError.value = ''
  try {
    const url = `https://api-swiftgifts.vercel.app/api/user_gifts?username=${encodeURIComponent(user.value)}&limit=${giftsLimit}&offset=${giftsOffset.value}`
    const response = await fetch(url, {
      headers: {
        accept: 'application/json',
        'x-api-key': import.meta.env.VITE_SWIFTGIFTS_API_KEY
      }
    })
    if (!response.ok) {
      throw new Error(`Gift API error: ${response.status}`)
    }
    const data = await response.json()
    const items = Array.isArray(data) ? data : data.items || []
    if (giftsOffset.value === 0) {
      gifts.value = items
    } else {
      gifts.value = [...gifts.value, ...items]
    }
    giftsOffset.value += items.length
    giftsHasMore.value = items.length === giftsLimit
    giftsLoaded.value = true
  } catch (error) {
    giftsError.value = error?.message || 'Failed to load gifts'
  } finally {
    giftsLoading.value = false
  }
}

function loadMoreGifts() {
  if (giftsHasMore.value) {
    loadGifts()
  }
}
</script>
