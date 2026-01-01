<template>
<div v-if="isLoading" id="preloader">
  <div style="" class="loader">loading</div>
</div>
<center>
    <img class="profile-img" :src="photoUrl">
    <h2 style="color: white; margin-top: -5px;">{{ user }}</h2>
</center>

<div class="profile-tabs">
  <button class="tab-btn" :class="{ active: activeTab === 'channel' }" type="button" @click="setTab('channel')">
    Rewards
  </button>
  <button class="tab-btn" :class="{ active: activeTab === 'gifts' }" type="button" @click="setTab('gifts')">
    Gifts
  </button>
</div>

<div v-if="activeTab === 'channel'" class="tab-panel">
  <div class="rewards">
      <img class="channel" src="https://github.com/MatveyVue/testcap/blob/main/scmd69.jpg?raw=true">
    <a style="text-decoration: none; color: white;" href="https://t.me/+sc77S2Dsuwc5MGNk">
      <p class="channel-name">$CMD69</p>
    </a>
      <p class="stars">{{ stars }}</p>
  </div>
</div>

<div v-else class="tab-panel">
  <div v-if="giftsLoading" class="loading-spinner">
    <span class="spinner" aria-label="Loading"></span>
  </div>
  <div v-else-if="giftsError" class="error-state">
    <p class="error-text">{{ giftsError }}</p>
    <button class="retry-btn" type="button" @click="loadGifts" :disabled="giftsLoading">
      Retry
    </button>
  </div>
  <div v-else-if="gifts.length === 0" class="empty-state">
    <p class="empty-text">No gifts yet</p>
    <p class="empty-subtext">Buy your first gift</p>
    <a class="empty-link" href="https://t.me/swiftgifts_official_bot?startapp=ref_matvey">
      <button class="empty-cta" type="button">Open SwiftGifts</button>
    </a>
  </div>
  <div v-else class="gifts-wrapper">
    <div v-for="gift in gifts" :key="gift.id" class="gifts-container">
      <button class="gift-card" type="button" @click="openGiftModal(gift)">
        <img :src="getGiftImageUrl(gift.url)" style="width:100%; border-radius: 20px;">
      </button>
      <p class="title" style="color:white;">{{ gift.title }}</p>
      <p class="number">#{{ gift.num }}</p>
    </div>
  </div>
  <button v-if="giftsHasMore && !giftsLoading" class="filter-btn" type="button" @click="loadMoreGifts">
    Load more
  </button>
</div>

  <div v-if="selectedGift" class="gift-modal" @click.self="closeGiftModal">
  <div class="gift-modal-card">
    <div class="gift-modal-handle"></div>
    <div class="gift-modal-header">
      <div>
        <h3 class="gift-modal-title">{{ selectedGift.title }}</h3>
        <p class="gift-modal-subtitle">#{{ selectedGift.num }}</p>
      </div>
      <button class="gift-modal-close" type="button" aria-label="Close" @click="closeGiftModal">x</button>
    </div>
    <div class="gift-modal-body">
      <img :src="getGiftImageUrl(selectedGift.url)" class="gift-modal-image">
      <div class="gift-modal-grid">
        <p class="gift-modal-item">
          <span class="gift-modal-label">Backdrop</span>
          <span class="gift-modal-value">{{ selectedGift.backdrop_name || 'N/A' }}</span>
        </p>
        <p class="gift-modal-item">
          <span class="gift-modal-label">Model</span>
          <span class="gift-modal-value">{{ selectedGift.model_name || 'N/A' }}</span>
        </p>
        <p class="gift-modal-item">
          <span class="gift-modal-label">Symbol</span>
          <span class="gift-modal-value">{{ selectedGift.pattern_name || 'N/A' }}</span>
        </p>
        <p class="gift-modal-item">
          <span class="gift-modal-label">Comment</span>
          <span class="gift-modal-value">{{ getGiftComment(selectedGift) }}</span>
        </p>
        <p class="gift-modal-item">
          <span class="gift-modal-label">For sale</span>
          <span class="gift-modal-value">{{ getSaleText(selectedGift) }}</span>
        </p>
        <p class="gift-modal-item">
          <span class="gift-modal-label">Updated</span>
          <span class="gift-modal-value">{{ formatDate(selectedGift.updated_at) }}</span>
        </p>
      </div>
    </div>
    <div class="gift-modal-actions">
      <a :href="selectedGift.url" class="gift-modal-link">
        <button class="gift-modal-primary" type="button">See gift</button>
      </a>
      <button class="gift-modal-secondary" type="button" @click="closeGiftModal">Ok</button>
    </div>
  </div>
</div>

<div class="bar">
<div class="btn-container">
<RouterLink to="/market">
    <button class="market" @click="triggerMediumHaptic">
        <img style="position: absolute; margin-left: -17px; margin-top: 5px;" src="https://github.com/MatveyVue/icopn/blob/main/Market.png?raw=true" width="33px"></img>
        <p style="margin-top: 40px; color: white;">Market</p>
    </button>
</RouterLink>
<RouterLink to="/">
    <button class="leaders" @click="triggerMediumHaptic">
        <img style="position: absolute; margin-left: -18px;" src="https://github.com/MatveyVue/icopn/blob/main/LeaderBoard.png?raw=true" width="40px"></img>
        <p style="margin-top: 40px; color: white;">Top</p>
    </button>
</RouterLink>
    <button class="profile" @click="triggerMediumHaptic">
        <img style="position: absolute; margin-left: -18px;" src="https://github.com/MatveyVue/icopn/blob/main/ProfileActive.png?raw=true" width="35px"></img>
        <p style="margin-top: 40px; color: rgb(25, 122, 207);">Profile</p>
    </button>
</div>
</div>
</template>

<script setup>
import { ref, onBeforeUnmount, onMounted, watch } from 'vue'
import { initializeApp } from 'firebase/app'
import { getFirestore, doc, getDoc } from 'firebase/firestore'
import { triggerMediumHaptic } from '../script/haptics.js'

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
const selectedGift = ref(null)

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
    console.log('Telegram user data is missing')
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
      console.log('Fetched user data from Firestore:', data)
      stars.value = data.stars || 0
    } else {
      stars.value = 0
      console.log('User document not found in Firestore')
    }
  } catch (error) {
    console.error('Failed to load stars from Firestore:', error)
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
    const items = Array.isArray(data) ? data : data.gifts || data.items || []
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

function getGiftSlugFromUrl(url) {
  const raw = String(url || '').split('/').filter(Boolean).pop()
  return raw || ''
}

function getGiftImageUrl(url) {
  const slug = getGiftSlugFromUrl(url)
  if (!slug) return ''
  return `https://nft.fragment.com/gift/${slug}.medium.jpg`
}

function openGiftModal(gift) {
  selectedGift.value = gift
}

function closeGiftModal() {
  selectedGift.value = null
}

watch(
  selectedGift,
  (value) => {
    document.body.classList.toggle('modal-open', Boolean(value))
  }
)

onBeforeUnmount(() => {
  document.body.classList.remove('modal-open')
})

function getGiftComment(gift) {
  if (gift.comment) return gift.comment
  const details = gift.details
  if (details && details.date) {
    return `Details date: ${formatDate(details.date)}`
  }
  return 'N/A'
}

function getSaleText(gift) {
  if (gift.resale_ton_amount != null) {
    return `${formatTon(gift.resale_ton_amount)} TON`
  }
  if (gift.resale_stars_amount != null) {
    return `${gift.resale_stars_amount} Stars`
  }
  if (gift.resale_ton_only) {
    return 'TON only'
  }
  return 'Not for sale'
}

function formatDate(value) {
  if (!value) return 'N/A'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'N/A'
  return date.toLocaleString()
}

function formatTon(value) {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return 'N/A'
  const ton = amount / 1e9
  return ton.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3
  })
}

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
}, 3000);
</script>
