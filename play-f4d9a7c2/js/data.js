// ======================================================
// data.js - Master Data & Constants for Farm Simulation
// ======================================================

// --- Game Constants ---
const CONSTANTS = {
  INITIAL_MONEY: 100000,
  PLOT_COUNT: 9,
  DAYS_PER_MONTH: 30,
  MONTHS_PER_YEAR: 12,
  DAYS_PER_YEAR: 360,
  FORECAST_DAYS: 5,
  MAX_LOG_ENTRIES: 50,
};

// --- 経営形態定義 ---
const FARMING_MODES = {
  individual: {
    id: 'individual',
    name: '個人農家',
    emoji: '🧑‍🌾',
    title: '新規就農・個人経営',
    description: '新規就農者として一からスタート。国の補助金制度を活用でき、自由な栽培計画で独自のブランドを築ける。小回りの利く経営が強み。',
    features: [
      { icon: '💰', text: '新規就農補助金 +¥80,000', detail: '国の新規就農者支援制度による初期資金の上乗せ' },
      { icon: '🌱', text: '品質ボーナス +15%', detail: 'こだわりの栽培で品質が上がりやすい' },
      { icon: '🏷️', text: '直売所販売 売値+10%', detail: '直売所・マルシェでの対面販売で高値販売' },
      { icon: '📋', text: '自由な栽培計画', detail: '作物選択に制限なし、多品種少量生産が得意' },
    ],
    disadvantages: [
      { icon: '🚜', text: 'トラクターなし', detail: '手作業中心のため灌漑・施肥コストが高い' },
      { icon: '💸', text: '資材コスト割高', detail: '個人購入のため資材費が高くなりがち' },
    ],
    bonuses: {
      subsidyMoney: 80000,      // 初期補助金
      qualityBonus: 1.15,       // 品質15%UP
      sellBonus: 1.10,          // 売値10%UP
      costDiscount: 1.0,        // コスト割引なし（等倍）
      irrigateCostMult: 1.2,    // 灌漑コスト20%増
      fertilizerCostMult: 1.15, // 施肥コスト15%増
      growthBonus: 1.0,         // 成長速度変化なし
      yieldBonus: 1.0,          // 収量変化なし
    },
    bgGradient: 'linear-gradient(145deg, rgba(22,45,18,0.95), rgba(10,22,40,0.92))',
    accentColor: '#4ade80',
    badgeColor: 'rgba(74,222,128,0.15)',
  },
  cooperative: {
    id: 'cooperative',
    name: '営農組合',
    emoji: '🏛️',
    title: '集落営農組合加入',
    description: '地域の営農組合に参加してスタート。共有トラクターや一括仕入れのコスト削減が魅力。大規模経営で安定した収益を目指す。',
    features: [
      { icon: '🚜', text: 'トラクター利用可', detail: '共有農機で灌漑・施肥コストを大幅削減' },
      { icon: '📦', text: '資材一括仕入れ -20%', detail: '組合での大量購入により全資材が2割引' },
      { icon: '🌾', text: '収量ボーナス +15%', detail: '広い農地と機械化で効率的な大量生産' },
      { icon: '🤝', text: '組合員ネットワーク', detail: '情報共有により成長速度+5%' },
    ],
    disadvantages: [
      { icon: '💳', text: '組合費 -¥30,000', detail: '加入時の組合費・年会費が必要' },
      { icon: '📉', text: '出荷制限 売値-5%', detail: 'JA出荷のため個人販売より単価が低い' },
    ],
    bonuses: {
      subsidyMoney: -30000,     // 組合費（マイナス）
      qualityBonus: 1.0,        // 品質変化なし
      sellBonus: 0.95,          // 売値5%ダウン（JA出荷）
      costDiscount: 0.80,       // 全コスト20%OFF
      irrigateCostMult: 0.6,    // 灌漑コスト40%減（トラクター）
      fertilizerCostMult: 0.7,  // 施肥コスト30%減（機械施肥）
      growthBonus: 1.05,        // 成長速度5%UP
      yieldBonus: 1.15,         // 収量15%UP
    },
    bgGradient: 'linear-gradient(145deg, rgba(20,25,50,0.95), rgba(40,18,10,0.92))',
    accentColor: '#fbbf24',
    badgeColor: 'rgba(251,191,36,0.15)',
  },
};

// --- Season Definitions (射水市ベース: 日本海側気候) ---
const SEASONS = {
  spring: {
    name: '春',
    emoji: '🌸',
    months: [3, 4, 5],
    baseTemp: { min: 3, max: 20 },
    rainChance: 0.38,
    humidityBase: 70,
    sunshineBase: 5.5,
    events: {
      frost: { chance: 0.06, monthLimit: [3] },
      longRain: { chance: 0.05, monthLimit: [5] },
      foehn: { chance: 0.15, monthLimit: [4, 5] }, // 春のフェーン現象
    },
  },
  summer: {
    name: '夏',
    emoji: '☀️',
    months: [6, 7, 8],
    baseTemp: { min: 18, max: 33 },
    rainChance: 0.38,
    humidityBase: 78,
    sunshineBase: 5.5,
    events: {
      typhoon: { chance: 0.04, monthLimit: [7, 8] },
      heatwave: { chance: 0.12, monthLimit: [7, 8] },
      longRain: { chance: 0.18, monthLimit: [6] }, // 北陸梅雨
      foehn: { chance: 0.10, monthLimit: [6, 7, 8] }, // 夏のフェーン現象
      heavy_rain: { chance: 0.15, monthLimit: [6, 7] }, // 梅雨末期の豪雨・線状降水帯
    },
  },
  autumn: {
    name: '秋',
    emoji: '🍂',
    months: [9, 10, 11],
    baseTemp: { min: 5, max: 25 },
    rainChance: 0.35,
    humidityBase: 76,
    sunshineBase: 4.5,
    events: {
      typhoon: { chance: 0.06, monthLimit: [9, 10] },
      frost: { chance: 0.08, monthLimit: [11] },
      foehn: { chance: 0.05, monthLimit: [9, 10] },
    },
  },
  winter: {
    name: '冬',
    emoji: '❄️',
    months: [12, 1, 2],
    baseTemp: { min: -1, max: 7 },
    rainChance: 0.55,
    humidityBase: 80,
    sunshineBase: 2.5,
    events: {
      frost: { chance: 0.30, monthLimit: [12, 1, 2] },
      snow: { chance: 0.35, monthLimit: [12, 1, 2] },
      heavy_snow: { chance: 0.20, monthLimit: [12, 1, 2] }, // 北陸のドカ雪・豪雪
    },
  },
};

// --- 射水市 月別気候データ (気象庁平年値 1991-2020) ---
const IMIZU_CLIMATE = {
  1:  { avgTemp: 3.0, tempMin: 0.0, tempMax: 6.5,  rain: 259, sunshine: 2.2, humidity: 82 },
  2:  { avgTemp: 3.4, tempMin: 0.2, tempMax: 7.2,  rain: 172, sunshine: 3.2, humidity: 78 },
  3:  { avgTemp: 6.9, tempMin: 2.7, tempMax: 11.5, rain: 165, sunshine: 4.5, humidity: 72 },
  4:  { avgTemp: 12.3, tempMin: 7.0, tempMax: 17.8, rain: 135, sunshine: 5.8, humidity: 68 },
  5:  { avgTemp: 17.5, tempMin: 12.2, tempMax: 23.0, rain: 123, sunshine: 6.7, humidity: 70 },
  6:  { avgTemp: 21.4, tempMin: 17.0, tempMax: 26.0, rain: 173, sunshine: 5.1, humidity: 78 },
  7:  { avgTemp: 25.5, tempMin: 21.5, tempMax: 30.3, rain: 246, sunshine: 5.1, humidity: 79 },
  8:  { avgTemp: 27.2, tempMin: 22.8, tempMax: 32.2, rain: 168, sunshine: 6.4, humidity: 76 },
  9:  { avgTemp: 23.1, tempMin: 18.5, tempMax: 28.0, rain: 214, sunshine: 4.7, humidity: 78 },
  10: { avgTemp: 17.3, tempMin: 12.0, tempMax: 22.5, rain: 149, sunshine: 4.8, humidity: 76 },
  11: { avgTemp: 11.5, tempMin: 6.5, tempMax: 16.2, rain: 141, sunshine: 3.8, humidity: 75 },
  12: { avgTemp: 6.1,  tempMin: 2.2, tempMax: 9.8,  rain: 244, sunshine: 2.6, humidity: 79 },
};

// --- 射水市 地区定義 (旧5市町村ベース) ---
const IMIZU_AREAS = {
  shinminato: {
    id: 'shinminato',
    name: '新湊地区',
    emoji: '⚓',
    description: '富山湾に面した港町。海風の影響を受け塩分を含む砂質土壌が特徴。潮風ミネラルが独特の風味を生む。',
    geography: '沿岸部・干拓地',
    elevation: '0〜5m',
    features: ['海風ミネラル', '砂質混じり', '温暖な沿岸気候', '塩害リスク'],
    climateModifier: { tempBonus: 0.8, humidityBonus: 5, rainMod: 0.9 },
    bgColor: '#0d2a3a',
    accentColor: '#38bdf8',
  },
  kosugi: {
    id: 'kosugi',
    name: '小杉地区',
    emoji: '🏘️',
    description: '射水丘陵の麓に位置する住宅・農業複合地域。丘陵からの湧水に恵まれ、排水の良い肥沃な農地が広がる。',
    geography: '丘陵裾野・扇状地',
    elevation: '10〜50m',
    features: ['豊富な湧水', '排水良好', '肥沃な土壌', '果樹栽培も可能'],
    climateModifier: { tempBonus: -0.3, humidityBonus: -2, rainMod: 1.0 },
    bgColor: '#1a2a15',
    accentColor: '#4ade80',
  },
  daimon: {
    id: 'daimon',
    name: '大門地区',
    emoji: '🌾',
    description: '庄川沿いの広大な水田地帯。河川が運ぶ肥沃な沖積土が堆積し、射水市最大の穀倉地帯を形成。',
    geography: '庄川沖積平野',
    elevation: '3〜10m',
    features: ['広大な農地', '庄川の肥沃土', '大規模営農', '集落営農先進地'],
    climateModifier: { tempBonus: 0, humidityBonus: 3, rainMod: 1.05 },
    bgColor: '#2a2a10',
    accentColor: '#fbbf24',
  },
  oshima: {
    id: 'oshima',
    name: '大島地区',
    emoji: '🏞️',
    description: '下条川流域の低湿地を乾田化した農地。粘土質が強く保水性に優れるが、排水には暗渠が不可欠。',
    geography: '低湿地・乾田化農地',
    elevation: '1〜8m',
    features: ['強粘土質', '高い保水力', '暗渠排水整備', '大豆転作適地'],
    climateModifier: { tempBonus: 0.2, humidityBonus: 5, rainMod: 1.08 },
    bgColor: '#1a1a2a',
    accentColor: '#a78bfa',
  },
  shimomura: {
    id: 'shimomura',
    name: '下村地区',
    emoji: '🌿',
    description: '射水平野の中央部に位置する純農村地域。有機質に富む黒ボク土が分布し、野菜栽培の適地として注目。',
    geography: '内陸平野・黒ボク土地帯',
    elevation: '5〜15m',
    features: ['黒ボク土', '有機質豊富', '野菜適地', '静かな農村環境'],
    climateModifier: { tempBonus: -0.5, humidityBonus: 0, rainMod: 0.95 },
    bgColor: '#15250a',
    accentColor: '#86efac',
  },
};

// --- 農地タイプ定義 (地区別の水田・畑地) ---
const FARMLAND_TYPES = {
  paddy: {
    id: 'paddy', name: '水田', emoji: '🌾',
    textureImg: 'assets/images/texture_water.png',
    baseDescription: '粘土質で保水力が高く水稲栽培に最適。排水性が低いため畑作には工夫が必要。',
    features: ['高い保水力', '粘土質土壌', '水稲に最適', '排水性が低い'],
    recommended: ['rice', 'soybean'],
  },
  field: {
    id: 'field', name: '畑地', emoji: '🥕',
    textureImg: 'assets/images/texture_soil.png',
    baseDescription: '排水整備された転換畑。粘土質を改良し野菜・根菜類の栽培に対応。有機物が豊富で多品種に適する。',
    features: ['排水整備済み', '改良粘土質', '野菜に適する', '多品種対応'],
    recommended: ['tomato', 'cabbage', 'carrot', 'potato', 'corn'],
  },
};

// --- 地区×農地タイプ別の土壌プロファイル ---
const AREA_SOIL_PROFILES = {
  shinminato: {
    paddy: { pH: 6.5, N: 30, P: 25, K: 38, organic: 35, moisture: 65, clay: 30, silt: 30, sand: 40, ec: 2.0, temperature: 16 },
    field:  { pH: 6.8, N: 28, P: 30, K: 35, organic: 32, moisture: 45, clay: 22, silt: 30, sand: 48, ec: 2.2, temperature: 17 },
  },
  kosugi: {
    paddy: { pH: 5.9, N: 42, P: 30, K: 35, organic: 48, moisture: 70, clay: 42, silt: 36, sand: 22, ec: 1.2, temperature: 15 },
    field:  { pH: 6.4, N: 38, P: 38, K: 32, organic: 55, moisture: 50, clay: 30, silt: 38, sand: 32, ec: 1.4, temperature: 15 },
  },
  daimon: {
    paddy: { pH: 5.7, N: 45, P: 28, K: 38, organic: 50, moisture: 78, clay: 48, silt: 34, sand: 18, ec: 1.1, temperature: 15 },
    field:  { pH: 6.2, N: 40, P: 35, K: 32, organic: 52, moisture: 55, clay: 35, silt: 38, sand: 27, ec: 1.3, temperature: 15 },
  },
  oshima: {
    paddy: { pH: 5.6, N: 38, P: 22, K: 32, organic: 42, moisture: 82, clay: 52, silt: 32, sand: 16, ec: 1.0, temperature: 14 },
    field:  { pH: 6.1, N: 34, P: 30, K: 28, organic: 45, moisture: 58, clay: 38, silt: 36, sand: 26, ec: 1.2, temperature: 14 },
  },
  shimomura: {
    paddy: { pH: 5.8, N: 44, P: 32, K: 36, organic: 55, moisture: 72, clay: 38, silt: 35, sand: 27, ec: 1.1, temperature: 14 },
    field:  { pH: 6.5, N: 42, P: 40, K: 34, organic: 60, moisture: 48, clay: 28, silt: 35, sand: 37, ec: 1.3, temperature: 14 },
  },
};

// --- Weather Type Definitions ---
const WEATHER_TYPES = {
  sunny: { name: '晴れ', emoji: '☀️', rainMod: 0, sunMod: 1.2, evapMod: 1.3 },
  partlyCloudy: { name: '曇り時々晴れ', emoji: '⛅', rainMod: 0, sunMod: 0.8, evapMod: 1.0 },
  cloudy: { name: '曇り', emoji: '☁️', rainMod: 0, sunMod: 0.5, evapMod: 0.8 },
  lightRain: { name: '小雨', emoji: '🌦️', rainMod: 5, sunMod: 0.3, evapMod: 0.5 },
  rain: { name: '雨', emoji: '🌧️', rainMod: 15, sunMod: 0.1, evapMod: 0.3 },
  heavyRain: { name: '大雨', emoji: '⛈️', rainMod: 35, sunMod: 0.05, evapMod: 0.2 },
  snow: { name: '雪', emoji: '🌨️', rainMod: 5, sunMod: 0.2, evapMod: 0.2 },
  typhoon: { name: '台風', emoji: '🌀', rainMod: 60, sunMod: 0.0, evapMod: 0.1 },
};

// --- Crop Definitions ---
const CROPS = {
  tomato: {
    id: 'tomato',
    name: 'トマト',
    emoji: '🍅',
    category: '果菜類',
    seedCost: 200,
    basePrice: 300,
    growthDays: 90,
    baseYieldKg: 5,
    plantingSeasons: ['spring'],
    plantingMonths: [4, 5],
    optimal: {
      pH: { min: 6.0, max: 6.8 },
      temperature: { min: 20, max: 30 },
      moisture: { min: 55, max: 75 },
      N: { min: 40, max: 70 },
      P: { min: 50, max: 80 },
      K: { min: 40, max: 60 },
      sunshine: 6,
    },
    tolerance: {
      coldMin: 5,
      heatMax: 40,
      droughtMin: 20,
      floodMax: 95,
    },
    resistance: { cold: 0.3, heat: 0.5, disease: 0.5 },
    stages: [
      { name: '種まき', threshold: 0, emoji: '🟤', scale: 0.3 },
      { name: '発芽', threshold: 5, emoji: '🌱', scale: 0.4 },
      { name: '苗', threshold: 15, emoji: '🌿', scale: 0.55 },
      { name: '開花', threshold: 40, emoji: '🌼', scale: 0.7 },
      { name: '結実', threshold: 65, emoji: '🍅', scale: 0.85 },
      { name: '成熟', threshold: 90, emoji: '🍅', scale: 1.0 },
    ],
    description: '日当たりの良い場所を好む夏野菜の代表格。適度な水分管理が品質の鍵。',
    difficulty: 2,
  },
  cabbage: {
    id: 'cabbage',
    name: 'キャベツ',
    emoji: '🥬',
    category: '葉菜類',
    seedCost: 150,
    basePrice: 200,
    growthDays: 70,
    baseYieldKg: 4,
    plantingSeasons: ['spring', 'autumn'],
    plantingMonths: [3, 4, 9, 10],
    optimal: {
      pH: { min: 6.0, max: 7.0 },
      temperature: { min: 15, max: 25 },
      moisture: { min: 60, max: 75 },
      N: { min: 50, max: 80 },
      P: { min: 30, max: 60 },
      K: { min: 30, max: 60 },
      sunshine: 5,
    },
    tolerance: {
      coldMin: -2,
      heatMax: 35,
      droughtMin: 25,
      floodMax: 90,
    },
    resistance: { cold: 0.6, heat: 0.3, disease: 0.5 },
    stages: [
      { name: '種まき', threshold: 0, emoji: '🟤', scale: 0.3 },
      { name: '発芽', threshold: 7, emoji: '🌱', scale: 0.4 },
      { name: '苗', threshold: 20, emoji: '🌿', scale: 0.55 },
      { name: '結球開始', threshold: 45, emoji: '🥬', scale: 0.7 },
      { name: '結球', threshold: 70, emoji: '🥬', scale: 0.85 },
      { name: '成熟', threshold: 90, emoji: '🥬', scale: 1.0 },
    ],
    description: '冷涼な気候を好む葉物野菜。窒素をしっかり与えると大きく育つ。',
    difficulty: 1,
  },
  carrot: {
    id: 'carrot',
    name: 'にんじん',
    emoji: '🥕',
    category: '根菜類',
    seedCost: 100,
    basePrice: 250,
    growthDays: 80,
    baseYieldKg: 3,
    plantingSeasons: ['spring', 'autumn'],
    plantingMonths: [3, 4, 9, 10],
    optimal: {
      pH: { min: 6.0, max: 7.0 },
      temperature: { min: 15, max: 25 },
      moisture: { min: 55, max: 70 },
      N: { min: 30, max: 50 },
      P: { min: 40, max: 70 },
      K: { min: 40, max: 70 },
      sunshine: 5,
    },
    tolerance: {
      coldMin: 0,
      heatMax: 35,
      droughtMin: 20,
      floodMax: 85,
    },
    resistance: { cold: 0.5, heat: 0.4, disease: 0.6 },
    stages: [
      { name: '種まき', threshold: 0, emoji: '🟤', scale: 0.3 },
      { name: '発芽', threshold: 8, emoji: '🌱', scale: 0.4 },
      { name: '葉の成長', threshold: 20, emoji: '🌿', scale: 0.55 },
      { name: '根の肥大', threshold: 45, emoji: '🥕', scale: 0.7 },
      { name: '成長', threshold: 70, emoji: '🥕', scale: 0.85 },
      { name: '成熟', threshold: 90, emoji: '🥕', scale: 1.0 },
    ],
    description: '深く耕した柔らかい土壌を好む。リン酸とカリウムが根の発育を促進。',
    difficulty: 1,
  },
  potato: {
    id: 'potato',
    name: 'じゃがいも',
    emoji: '🥔',
    category: '根菜類',
    seedCost: 250,
    basePrice: 200,
    growthDays: 100,
    baseYieldKg: 8,
    plantingSeasons: ['spring'],
    plantingMonths: [3, 4],
    optimal: {
      pH: { min: 5.5, max: 6.5 },
      temperature: { min: 15, max: 25 },
      moisture: { min: 55, max: 75 },
      N: { min: 40, max: 65 },
      P: { min: 50, max: 75 },
      K: { min: 50, max: 80 },
      sunshine: 6,
    },
    tolerance: {
      coldMin: 2,
      heatMax: 35,
      droughtMin: 20,
      floodMax: 85,
    },
    resistance: { cold: 0.4, heat: 0.4, disease: 0.4 },
    stages: [
      { name: '植え付け', threshold: 0, emoji: '🟤', scale: 0.3 },
      { name: '発芽', threshold: 7, emoji: '🌱', scale: 0.4 },
      { name: '茎葉成長', threshold: 20, emoji: '🌿', scale: 0.55 },
      { name: '開花', threshold: 45, emoji: '🌸', scale: 0.7 },
      { name: 'いも肥大', threshold: 65, emoji: '🥔', scale: 0.85 },
      { name: '成熟', threshold: 90, emoji: '🥔', scale: 1.0 },
    ],
    description: '冷涼な気候と弱酸性の土壌を好む。カリウムをたっぷり与えると収量UP。',
    difficulty: 2,
  },
  rice: {
    id: 'rice',
    name: '米',
    emoji: '🌾',
    category: '穀類',
    seedCost: 300,
    basePrice: 500,
    growthDays: 150,
    baseYieldKg: 6,
    plantingSeasons: ['spring'],
    plantingMonths: [4, 5],
    optimal: {
      pH: { min: 5.5, max: 6.5 },
      temperature: { min: 22, max: 32 },
      moisture: { min: 80, max: 95 },
      N: { min: 40, max: 65 },
      P: { min: 40, max: 65 },
      K: { min: 30, max: 55 },
      sunshine: 7,
    },
    tolerance: {
      coldMin: 10,
      heatMax: 40,
      droughtMin: 40,
      floodMax: 100,
    },
    resistance: { cold: 0.2, heat: 0.7, disease: 0.5 },
    stages: [
      { name: '田植え', threshold: 0, emoji: '🟤', scale: 0.3 },
      { name: '活着', threshold: 5, emoji: '🌱', scale: 0.4 },
      { name: '分げつ', threshold: 15, emoji: '🌿', scale: 0.55 },
      { name: '穂ばらみ', threshold: 45, emoji: '🌾', scale: 0.7 },
      { name: '出穂', threshold: 65, emoji: '🌾', scale: 0.85 },
      { name: '成熟', threshold: 90, emoji: '🌾', scale: 1.0 },
    ],
    description: '水田で栽培する日本の主食。高い水分量を維持することが重要。',
    difficulty: 3,
  },
  wheat: {
    id: 'wheat',
    name: '小麦',
    emoji: '🌾',
    category: '穀類',
    seedCost: 200,
    basePrice: 350,
    growthDays: 180,
    baseYieldKg: 5,
    plantingSeasons: ['autumn'],
    plantingMonths: [10, 11],
    optimal: {
      pH: { min: 6.0, max: 7.0 },
      temperature: { min: 8, max: 22 },
      moisture: { min: 50, max: 70 },
      N: { min: 50, max: 80 },
      P: { min: 30, max: 55 },
      K: { min: 30, max: 55 },
      sunshine: 6,
    },
    tolerance: {
      coldMin: -5,
      heatMax: 30,
      droughtMin: 20,
      floodMax: 85,
    },
    resistance: { cold: 0.8, heat: 0.3, disease: 0.5 },
    stages: [
      { name: '種まき', threshold: 0, emoji: '🟤', scale: 0.3 },
      { name: '発芽', threshold: 5, emoji: '🌱', scale: 0.4 },
      { name: '分げつ', threshold: 15, emoji: '🌿', scale: 0.55 },
      { name: '起生', threshold: 40, emoji: '🌾', scale: 0.7 },
      { name: '出穂', threshold: 65, emoji: '🌾', scale: 0.85 },
      { name: '成熟', threshold: 90, emoji: '🌾', scale: 1.0 },
    ],
    description: '秋に植えて翌年初夏に収穫。寒さに強く、冬を越して育つ。',
    difficulty: 2,
  },
  soybean: {
    id: 'soybean',
    name: '大豆',
    emoji: '🫘',
    category: '豆類',
    seedCost: 150,
    basePrice: 400,
    growthDays: 120,
    baseYieldKg: 3,
    plantingSeasons: ['summer'],
    plantingMonths: [6, 7],
    optimal: {
      pH: { min: 6.0, max: 7.0 },
      temperature: { min: 20, max: 30 },
      moisture: { min: 55, max: 75 },
      N: { min: 20, max: 40 },
      P: { min: 40, max: 70 },
      K: { min: 40, max: 65 },
      sunshine: 7,
    },
    tolerance: {
      coldMin: 5,
      heatMax: 38,
      droughtMin: 20,
      floodMax: 85,
    },
    resistance: { cold: 0.3, heat: 0.6, disease: 0.5 },
    nitrogenFixer: true,
    stages: [
      { name: '種まき', threshold: 0, emoji: '🟤', scale: 0.3 },
      { name: '発芽', threshold: 7, emoji: '🌱', scale: 0.4 },
      { name: '茎葉成長', threshold: 20, emoji: '🌿', scale: 0.55 },
      { name: '開花', threshold: 45, emoji: '🌸', scale: 0.7 },
      { name: '莢の肥大', threshold: 70, emoji: '🫘', scale: 0.85 },
      { name: '成熟', threshold: 90, emoji: '🫘', scale: 1.0 },
    ],
    description: '根粒菌と共生し窒素を固定。連作障害が少なく、土壌改良効果あり。',
    difficulty: 2,
  },
  corn: {
    id: 'corn',
    name: 'とうもろこし',
    emoji: '🌽',
    category: '穀類',
    seedCost: 200,
    basePrice: 250,
    growthDays: 85,
    baseYieldKg: 6,
    plantingSeasons: ['spring'],
    plantingMonths: [4, 5],
    optimal: {
      pH: { min: 6.0, max: 7.0 },
      temperature: { min: 20, max: 32 },
      moisture: { min: 60, max: 80 },
      N: { min: 50, max: 80 },
      P: { min: 30, max: 55 },
      K: { min: 30, max: 55 },
      sunshine: 8,
    },
    tolerance: {
      coldMin: 8,
      heatMax: 40,
      droughtMin: 25,
      floodMax: 90,
    },
    resistance: { cold: 0.2, heat: 0.6, disease: 0.6 },
    stages: [
      { name: '種まき', threshold: 0, emoji: '🟤', scale: 0.3 },
      { name: '発芽', threshold: 6, emoji: '🌱', scale: 0.4 },
      { name: '茎葉成長', threshold: 18, emoji: '🌿', scale: 0.55 },
      { name: '雄穂出現', threshold: 45, emoji: '🌽', scale: 0.7 },
      { name: '粒の肥大', threshold: 70, emoji: '🌽', scale: 0.85 },
      { name: '成熟', threshold: 90, emoji: '🌽', scale: 1.0 },
    ],
    description: '日照と高温を好む。窒素を多く消費するため、しっかりとした施肥が必要。',
    difficulty: 1,
  },
};

// --- Item Definitions ---
const ITEMS = {
  fertilizer_n: {
    id: 'fertilizer_n',
    name: '窒素肥料',
    emoji: '💊',
    description: '窒素成分を補給。葉の成長を促進。',
    cost: 800,
    effects: { N: 15, organic: 3 },
    category: 'fertilizer',
  },
  fertilizer_p: {
    id: 'fertilizer_p',
    name: 'リン酸肥料',
    emoji: '💊',
    description: 'リン酸を補給。根・花・実の発育を促進。',
    cost: 700,
    effects: { P: 15 },
    category: 'fertilizer',
  },
  fertilizer_k: {
    id: 'fertilizer_k',
    name: 'カリウム肥料',
    emoji: '💊',
    description: 'カリウムを補給。耐性と品質を向上。',
    cost: 700,
    effects: { K: 15 },
    category: 'fertilizer',
  },
  compost: {
    id: 'compost',
    name: '堆肥',
    emoji: '🧴',
    description: '有機物を豊富に含む万能肥料。土壌改良効果も。',
    cost: 1000,
    effects: { N: 5, P: 5, K: 5, organic: 15 },
    category: 'fertilizer',
  },
  lime: {
    id: 'lime',
    name: '石灰',
    emoji: '🧪',
    description: 'pH を上げる。酸性土壌の中和に。',
    cost: 600,
    effects: { pH: 0.5 },
    category: 'amendment',
  },
  pesticide: {
    id: 'pesticide',
    name: '農薬',
    emoji: '🐛',
    description: '病害虫のリスクを大幅に軽減。',
    cost: 1200,
    effects: { pestRisk: -50 },
    category: 'protection',
  },
  mulch: {
    id: 'mulch',
    name: 'マルチシート',
    emoji: '🛡️',
    description: '保水力UP、雑草抑制、土壌温度安定化。',
    cost: 1500,
    effects: { mulch: true },
    category: 'protection',
  },
  windbreak: {
    id: 'windbreak',
    name: '防風ネット',
    emoji: '🏗️',
    description: '台風や強風による被害を軽減。',
    cost: 3000,
    effects: { windbreak: true },
    category: 'protection',
  },
};

// --- Quality Grade Definitions ---
const QUALITY_GRADES = {
  S: { name: 'S品質', emoji: '✨', color: '#fbbf24', multiplier: 2.0, minScore: 0.85 },
  A: { name: 'A品質', emoji: '🌟', color: '#34d399', multiplier: 1.5, minScore: 0.65 },
  B: { name: 'B品質', emoji: '⭐', color: '#60a5fa', multiplier: 1.0, minScore: 0.40 },
  C: { name: 'C品質', emoji: '💫', color: '#94a3b8', multiplier: 0.5, minScore: 0.0 },
};

// --- Default Soil Templates (射水市 沖積粘土質ベース) ---
const DEFAULT_SOIL = {
  pH: 6.0,
  N: 38,
  P: 28,
  K: 32,
  organic: 45,
  moisture: 65,
  clay: 40,
  silt: 36,
  sand: 24,
  ec: 1.3,
  temperature: 15,
};

// --- Soil Analysis Thresholds ---
const SOIL_THRESHOLDS = {
  pH: { veryLow: 4.5, low: 5.5, optimal: 6.0, high: 7.5, veryHigh: 8.5 },
  N: { veryLow: 10, low: 25, optimal: 40, high: 75, veryHigh: 90 },
  P: { veryLow: 10, low: 25, optimal: 40, high: 75, veryHigh: 90 },
  K: { veryLow: 10, low: 25, optimal: 40, high: 75, veryHigh: 90 },
  organic: { veryLow: 10, low: 25, optimal: 40, high: 80, veryHigh: 95 },
  moisture: { veryLow: 15, low: 30, optimal: 50, high: 80, veryHigh: 95 },
  ec: { veryLow: 0.2, low: 0.5, optimal: 1.0, high: 3.0, veryHigh: 5.0 },
};

// --- Month names ---
const MONTH_NAMES = [
  '', '1月', '2月', '3月', '4月', '5月', '6月',
  '7月', '8月', '9月', '10月', '11月', '12月',
];

// --- Utility: get season from month ---
function getSeasonFromMonth(month) {
  for (const [key, season] of Object.entries(SEASONS)) {
    if (season.months.includes(month)) return key;
  }
  return 'spring';
}

// --- Utility: get month and day from game day ---
function getDateFromDay(dayOfYear) {
  const month = Math.floor((dayOfYear - 1) / 30) + 1;
  const dayInMonth = ((dayOfYear - 1) % 30) + 1;
  return { month: Math.min(month, 12), day: dayInMonth };
}

// --- Utility: clamp value ---
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

// --- Utility: random in range ---
function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

// --- Utility: weighted random boolean ---
function chance(probability) {
  return Math.random() < probability;
}

// --- Utility: format currency ---
function formatMoney(amount) {
  return `¥${Math.floor(amount).toLocaleString()}`;
}

// --- Character Definitions ---
// Skills: 体力(stamina), 知識(knowledge), 技術(technique), 感性(sensitivity), 経営(management), 幸運(luck)
// Each 0-100. These modify gameplay:
//   stamina   -> irrigation/fertilizer effectiveness boost
//   knowledge -> soil analysis accuracy, growth factor bonus
//   technique -> harvest quality bonus, pest/disease reduction
//   sensitivity -> weather event damage reduction, disease early detection
//   management -> sell price bonus, cost discount
//   luck      -> yield variance bonus, event mitigation
const CHARACTERS = {
  takeru: {
    id: 'takeru',
    name: '猛（タケル）',
    gender: 'male',
    emoji: '👨‍🌾',
    portrait: '💪',
    portraitImg: 'assets/images/char_takeru.png',
    age: 28,
    description: '体力自慢の力持ち農家。重労働もへっちゃら。灌漑や施肥の効果が高い。',
    skills: { stamina: 85, knowledge: 40, technique: 50, sensitivity: 35, management: 45, luck: 55 },
    bonuses: {
      irrigateBonus: 1.4,     // 灌漑効果40%UP
      fertilizerBonus: 1.3,   // 施肥効果30%UP
      qualityBonus: 1.0,
      yieldBonus: 1.15,       // 収量15%UP
      sellBonus: 1.0,
      costDiscount: 1.0,
      weatherResist: 0.1,
      diseaseResist: 0.0,
    },
    bgColor: '#1a3a5c',
  },
  gaku: {
    id: 'gaku',
    name: '学（ガク）',
    gender: 'male',
    emoji: '👨‍🔬',
    portrait: '🧠',
    portraitImg: 'assets/images/char_gaku.png',
    age: 35,
    description: '農学博士の知識派。土壌分析が得意で、作物の最適条件を見抜く。',
    skills: { stamina: 35, knowledge: 90, technique: 60, sensitivity: 55, management: 50, luck: 40 },
    bonuses: {
      irrigateBonus: 1.0,
      fertilizerBonus: 1.1,
      qualityBonus: 1.2,      // 品質20%UP
      yieldBonus: 1.0,
      sellBonus: 1.0,
      costDiscount: 1.0,
      weatherResist: 0.0,
      diseaseResist: 0.15,    // 病害耐性15%
      growthBonus: 1.1,       // 成長速度10%UP
    },
    bgColor: '#1a3a3c',
  },
  ryota: {
    id: 'ryota',
    name: '涼太（リョウタ）',
    gender: 'male',
    emoji: '🧑‍💼',
    portrait: '📊',
    portraitImg: 'assets/images/char_ryota.png',
    age: 32,
    description: '元商社マンの経営農家。作物を高く売り、コストを抑える。',
    skills: { stamina: 45, knowledge: 50, technique: 45, sensitivity: 40, management: 90, luck: 60 },
    bonuses: {
      irrigateBonus: 1.0,
      fertilizerBonus: 1.0,
      qualityBonus: 1.0,
      yieldBonus: 1.0,
      sellBonus: 1.3,         // 売値30%UP
      costDiscount: 0.8,      // コスト20%OFF
      weatherResist: 0.0,
      diseaseResist: 0.0,
    },
    bgColor: '#2a1a4c',
  },
  hana: {
    id: 'hana',
    name: '花（ハナ）',
    gender: 'female',
    emoji: '👩‍🌾',
    portrait: '🌸',
    portraitImg: 'assets/images/char_hana.png',
    age: 26,
    description: '繊細な感性の持ち主。天候変化をいち早く察知し、作物の異変にも敏感。',
    skills: { stamina: 40, knowledge: 50, technique: 55, sensitivity: 90, management: 45, luck: 50 },
    bonuses: {
      irrigateBonus: 1.1,
      fertilizerBonus: 1.0,
      qualityBonus: 1.15,     // 品質15%UP
      yieldBonus: 1.0,
      sellBonus: 1.0,
      costDiscount: 1.0,
      weatherResist: 0.3,     // 天候被害30%軽減
      diseaseResist: 0.25,    // 病害耐性25%
    },
    bgColor: '#3c1a2a',
  },
  misaki: {
    id: 'misaki',
    name: '美咲（ミサキ）',
    gender: 'female',
    emoji: '👩‍🔧',
    portrait: '✨',
    portraitImg: 'assets/images/char_misaki.png',
    age: 30,
    description: '職人肌の技術派農家。丁寧な栽培で最高品質の作物を生み出す。',
    skills: { stamina: 45, knowledge: 55, technique: 95, sensitivity: 60, management: 40, luck: 45 },
    bonuses: {
      irrigateBonus: 1.1,
      fertilizerBonus: 1.15,
      qualityBonus: 1.35,     // 品質35%UP
      yieldBonus: 1.1,        // 収量10%UP
      sellBonus: 1.1,
      costDiscount: 1.0,
      weatherResist: 0.05,
      diseaseResist: 0.1,
    },
    bgColor: '#1a2a3c',
  },
  tomoko: {
    id: 'tomoko',
    name: '智子（トモコ）',
    gender: 'female',
    emoji: '👩‍💼',
    portrait: '🍀',
    portraitImg: 'assets/images/char_tomoko.png',
    age: 33,
    description: '強運の持ち主で経営センス抜群。幸運が舞い込みやすく、何事もうまくいく。',
    skills: { stamina: 40, knowledge: 45, technique: 50, sensitivity: 50, management: 75, luck: 95 },
    bonuses: {
      irrigateBonus: 1.05,
      fertilizerBonus: 1.05,
      qualityBonus: 1.1,
      yieldBonus: 1.2,        // 収量20%UP
      sellBonus: 1.2,         // 売値20%UP
      costDiscount: 0.85,     // コスト15%OFF
      weatherResist: 0.2,     // 天候被害20%軽減
      diseaseResist: 0.1,
    },
    bgColor: '#2a3c1a',
  },
};

