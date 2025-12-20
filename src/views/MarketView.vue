<template>
  <div class="market-page">
    <div class="market-header">
      <h1 class="market-title">Market</h1>
      <button class="filter-toggle" type="button" @click="filtersOpen = !filtersOpen">
        Filters
      </button>
    </div>

    <div v-if="filtersOpen" class="filters-panel">
      <select v-model="selectedCollection" class="filter-select" @change="handleCollectionChange">
        <option value="All">All Collections</option>
        <option v-for="collection in collectionOptions" :key="collection" :value="collection">
          {{ collection }}
        </option>
      </select>
      <select v-model="selectedModel" class="filter-select" :disabled="selectedCollection === 'All'">
        <option value="All">All Models</option>
        <option v-for="model in modelOptions" :key="model" :value="model">
          {{ model }}
        </option>
      </select>
      <select v-model="selectedBackdrop" class="filter-select" :disabled="selectedCollection === 'All'">
        <option value="All">All Backdrops</option>
        <option v-for="backdrop in backdropOptions" :key="backdrop" :value="backdrop">
          {{ backdrop }}
        </option>
      </select>
      <select v-model="selectedSymbol" class="filter-select" :disabled="selectedCollection === 'All'">
        <option value="All">All Symbols</option>
        <option v-for="symbol in symbolOptions" :key="symbol" :value="symbol">
          {{ symbol }}
        </option>
      </select>
      <input
        v-model="numberInput"
        class="filter-input"
        type="number"
        min="1"
        placeholder="Number"
      />
      <div class="filter-actions">
        <button class="filter-btn" type="button" @click="applyFilters" :disabled="loading">
          Apply
        </button>
        <button class="filter-btn ghost" type="button" @click="resetFilters" :disabled="loading">
          Reset
        </button>
      </div>
    </div>

    <div v-if="previewImageUrl" class="collection-preview">
      <img :src="previewImageUrl" class="collection-image" />
      <div class="collection-info">
        <p class="collection-name">{{ selectedCollection }}</p>
        <p class="collection-meta">{{ selectedModelLabel }}</p>
      </div>
    </div>

    <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>

    <div ref="listRef" class="market-list" @scroll="handleListScroll">
      <div v-if="isInitialLoading" id="preloader">
        <div class="loader">loading</div>
      </div>
      <p v-if="!loading && pageItems.length === 0" class="empty-text">
        No results
      </p>
      <div v-for="(gift, index) in pageItems" :key="index" class="gifts-container">
        <img :src="gift.photo_url" style="width: 100%; border-radius: 20px;" />
        <p class="title" style="color: white;">{{ gift.title }}</p>
        <p class="number">#{{ gift.number }}</p>
        <a :href="gift.webapp_url" target="_blank" rel="noopener" style="display: inline-block; margin-top: 8px;">
          <button class="buy-btn">{{ gift.price }} TON</button>
        </a>
      </div>
    </div>

    <div class="pagination">
      <button class="page-btn" type="button" @click="goPrev" :disabled="loading || currentPage === 0">
        Prev
      </button>
      <span class="page-label">Page {{ currentPage + 1 }}</span>
      <button class="page-btn" type="button" @click="goNext" :disabled="loading || !hasNext">
        Next
      </button>
    </div>

    <button v-if="showTop" class="to-top" type="button" @click="scrollToTop">
      ^
    </button>
  </div>

  <div class="bar">
    <div class="btn-container">
      <RouterLink to="/market">
        <button class="market">
          <img
            style="position: absolute; margin-left: -17px; margin-top: 5px;"
            src="https://github.com/MatveyVue/icopn/blob/main/MarketActive.png?raw=true"
            width="33px"
          />
          <p style="margin-top: 40px; color: rgb(25, 122, 207);">Market</p>
        </button>
      </RouterLink>
      <RouterLink to="/">
        <button class="leaders">
          <img
            style="position: absolute; margin-left: -18px;"
            src="https://github.com/MatveyVue/icopn/blob/main/LeaderBoard.png?raw=true"
            width="40px"
          />
          <p style="margin-top: 40px; color: white;">Top</p>
        </button>
      </RouterLink>
      <RouterLink to="/profile">
        <button class="profile">
          <img
            style="position: absolute; margin-left: -18px;"
            src="https://github.com/MatveyVue/icopn/blob/main/Profile.png?raw=true"
            width="35px"
          />
          <p style="margin-top: 40px;">Profile</p>
        </button>
      </RouterLink>
    </div>
  </div>
  <p style="color: rgb(20, 20, 20);">.</p>
  <p style="color: rgb(20, 20, 20);">.</p>
  <p style="color: rgb(20, 20, 20);">.</p>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { fetchGiftPage } from '../script/giftsApi.js'
import rarityCsv from '../assets/data/rarity_rows.csv?raw'

const filtersOpen = ref(false)
const collectionOptions = ref([])
const modelOptions = ref([])
const backdropOptions = ref([])
const symbolOptions = ref([])
const selectedCollection = ref('All')
const selectedModel = ref('All')
const selectedBackdrop = ref('All')
const selectedSymbol = ref('All')
const numberInput = ref('')

const pageItems = ref([])
const currentPage = ref(0)
const hasNext = ref(true)
const loading = ref(false)
const errorMessage = ref('')
const listRef = ref(null)
const showTop = ref(false)

const rarityIndex = ref(new Map())
const collectionMeta = ref(new Map())
const pageCache = new Map()

const isInitialLoading = computed(() => loading.value && pageItems.value.length === 0)

const previewImageUrl = computed(() => {
  if (selectedCollection.value === 'All') return ''
  const meta = collectionMeta.value.get(selectedCollection.value)
  if (!meta) return ''
  const model = selectedModel.value !== 'All' ? selectedModel.value : meta.firstModel
  if (selectedSymbol.value !== 'All') {
    return `https://cdn.changes.tg/gifts/patterns/${encodeURIComponent(selectedCollection.value)}/png/${encodeURIComponent(selectedSymbol.value)}.png`
  }
  if (!model) return ''
  return `https://cdn.changes.tg/gifts/models/${encodeURIComponent(selectedCollection.value)}/png/${encodeURIComponent(model)}.png`
})

const selectedModelLabel = computed(() => {
  if (selectedModel.value !== 'All') return selectedModel.value
  if (selectedBackdrop.value !== 'All') return selectedBackdrop.value
  if (selectedSymbol.value !== 'All') return selectedSymbol.value
  return 'All Attributes'
})

function parseRarity(csvText) {
  const lines = csvText.trim().split(/\r?\n/)
  const index = new Map()
  const meta = new Map()
  const collections = new Set()

  for (let i = 1; i < lines.length; i += 1) {
    const line = lines[i]
    if (!line) continue
    const parts = line.split(',')
    if (parts.length < 5) continue
    const collection = parts[1]
    const attrType = parts[2]
    const attrValue = parts.slice(3, parts.length - 1).join(',')

    collections.add(collection)
    if (!index.has(collection)) {
      index.set(collection, { models: new Set(), backdrops: new Set(), symbols: new Set() })
    }
    if (!meta.has(collection)) {
      meta.set(collection, { firstModel: '' })
    }

    const bucket = index.get(collection)
    if (attrType === 'models') {
      bucket.models.add(attrValue)
      if (!meta.get(collection).firstModel) {
        meta.get(collection).firstModel = attrValue
      }
    }
    if (attrType === 'backdrops') {
      bucket.backdrops.add(attrValue)
    }
    if (attrType === 'symbols') {
      bucket.symbols.add(attrValue)
    }
  }

  return {
    collections: Array.from(collections).sort(),
    index,
    meta,
  }
}

function handleCollectionChange() {
  if (selectedCollection.value === 'All') {
    modelOptions.value = []
    backdropOptions.value = []
    symbolOptions.value = []
    selectedModel.value = 'All'
    selectedBackdrop.value = 'All'
    selectedSymbol.value = 'All'
    return
  }

  const info = rarityIndex.value.get(selectedCollection.value)
  modelOptions.value = info ? Array.from(info.models).sort() : []
  backdropOptions.value = info ? Array.from(info.backdrops).sort() : []
  symbolOptions.value = info ? Array.from(info.symbols).sort() : []
  selectedModel.value = 'All'
  selectedBackdrop.value = 'All'
  selectedSymbol.value = 'All'
}

function buildPayload() {
  const parsedNumber = Number.parseInt(numberInput.value, 10)
  return {
    name: selectedCollection.value,
    model: selectedModel.value,
    symbol: selectedSymbol.value,
    backdrop: selectedBackdrop.value,
    number: Number.isFinite(parsedNumber) ? parsedNumber : null,
  }
}

async function loadPage(page) {
  if (loading.value || page < 0) return

  const cacheKey = `${page}|${selectedCollection.value}|${selectedModel.value}|${selectedSymbol.value}|${selectedBackdrop.value}|${numberInput.value}`
  if (pageCache.has(cacheKey)) {
    pageItems.value = pageCache.get(cacheKey)
    currentPage.value = page
    hasNext.value = pageCache.get(`${cacheKey}:hasNext`) !== false
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    const items = await fetchGiftPage(buildPayload(), page)
    if (items.length === 0 && page > 0) {
      hasNext.value = false
      return
    }
    pageItems.value = items
    currentPage.value = page
    hasNext.value = items.length > 0
    pageCache.set(cacheKey, items)
    pageCache.set(`${cacheKey}:hasNext`, items.length > 0)
  } catch (error) {
    errorMessage.value = error?.message || 'Failed to load gifts'
  } finally {
    loading.value = false
  }
}

function applyFilters() {
  pageItems.value = []
  currentPage.value = 0
  hasNext.value = true
  loadPage(0)
}

function resetFilters() {
  selectedCollection.value = 'All'
  selectedModel.value = 'All'
  selectedBackdrop.value = 'All'
  selectedSymbol.value = 'All'
  numberInput.value = ''
  handleCollectionChange()
  applyFilters()
}

function goNext() {
  if (hasNext.value) {
    loadPage(currentPage.value + 1)
  }
}

function goPrev() {
  if (currentPage.value > 0) {
    loadPage(currentPage.value - 1)
  }
}

function handleListScroll(event) {
  const target = event.target
  showTop.value = target.scrollTop > 240
}

function scrollToTop() {
  if (listRef.value) {
    listRef.value.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

onMounted(() => {
  const { collections, index, meta } = parseRarity(rarityCsv)
  collectionOptions.value = collections
  rarityIndex.value = index
  collectionMeta.value = meta
  handleCollectionChange()
  applyFilters()
})
</script>
