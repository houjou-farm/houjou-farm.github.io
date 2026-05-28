// ======================================================
// economy.js - Economy & Market System
// ======================================================
class EconomySystem {
  constructor() {
    this.money = CONSTANTS.INITIAL_MONEY;
    this.totalEarned = 0;
    this.totalSpent = 0;
    this.harvestLog = [];
    this.marketPrices = {};
    this.priceHistory = {};

    // Initialize market prices
    for (const [key, crop] of Object.entries(CROPS)) {
      this.marketPrices[key] = crop.basePrice;
      this.priceHistory[key] = [crop.basePrice];
    }
    this.activeMarketEvent = null;
  }

  getMoney() {
    return this.money;
  }

  canAfford(amount) {
    return this.money >= amount;
  }

  spend(amount, description = '') {
    if (this.money < amount) return false;
    this.money -= amount;
    this.totalSpent += amount;
    return true;
  }

  earn(amount, description = '') {
    this.money += amount;
    this.totalEarned += amount;
  }

  // --- Update market prices (daily fluctuation) ---
  updateMarket(dayOfYear, seasonKey) {
    const month = Math.floor((dayOfYear - 1) / 30) + 1;
    const isFirstDayOfMonth = (dayOfYear - 1) % 30 === 0;

    // Trigger random market events on the 1st of the month
    if (isFirstDayOfMonth) {
      this.checkMarketEvents(month, seasonKey);
    }

    for (const [key, crop] of Object.entries(CROPS)) {
      const basePrice = crop.basePrice;

      // Seasonal curve using simple sine-like logic based on harvest months.
      let seasonFactor = 1.0;
      if (crop.plantingMonths && crop.plantingMonths.length > 0) {
        // Assume harvest is roughly growthDays later
        const harvestMonth = (crop.plantingMonths[0] + Math.floor(crop.growthDays / 30)) % 12 || 12;
        // Distance from harvest month (0 to 6)
        const dist = Math.min(Math.abs(month - harvestMonth), 12 - Math.abs(month - harvestMonth));
        // Dist 0 -> 0.7 (cheap, harvest season), Dist 6 -> 1.5 (expensive, off-season)
        seasonFactor = 0.7 + (dist / 6) * 0.8;
      }

      // Event Modifiers
      let eventFactor = 1.0;
      if (this.activeMarketEvent) {
        if (this.activeMarketEvent.targets.includes('all') || this.activeMarketEvent.targets.includes(crop.category) || this.activeMarketEvent.targets.includes(key)) {
          eventFactor = this.activeMarketEvent.multiplier;
        }
      }

      // Calculate target based on fundamentals
      const targetPrice = basePrice * seasonFactor * eventFactor;

      // Random daily fluctuation (random walk towards target)
      const prevPrice = this.marketPrices[key] || basePrice;
      const dailyFlux = randomRange(-0.03, 0.03); // +/- 3% daily
      const newPrice = prevPrice * (1 + dailyFlux) + (targetPrice - prevPrice) * 0.1;

      this.marketPrices[key] = Math.round(clamp(newPrice, basePrice * 0.3, basePrice * 3.0));

      // Track history (last 30 days)
      if (!this.priceHistory[key]) this.priceHistory[key] = [];
      this.priceHistory[key].push(this.marketPrices[key]);
      if (this.priceHistory[key].length > 30) {
        this.priceHistory[key].shift();
      }
    }
  }

  // --- Market News Events ---
  checkMarketEvents(month, seasonKey) {
    this.activeMarketEvent = null;

    if (Math.random() < 0.75) return; // 75% chance of normal market

    const events = [
      { id: 'heatwave_spike', name: '猛暑による野菜高騰', season: 'summer', targets: ['葉菜類', '果菜類'], multiplier: 1.5, message: '📰 【市場ニュース】全国的な猛暑の影響で、葉物・果菜類の価格が高騰しています！' },
      { id: 'rice_shortage', name: '令和の米騒動', season: 'all', targets: ['rice'], multiplier: 1.9, message: '📰 【市場ニュース】全国的な品薄状態により、米の買取価格が歴史的高騰を記録しています！' },
      { id: 'bumper_crop', name: '豊作貧乏', season: 'autumn', targets: ['all'], multiplier: 0.6, message: '📰 【市場ニュース】今年は全国的な大豊作により、卸売市場の価格が全体的に暴落しています…' },
      { id: 'tv_boom', name: 'TV番組ブーム', season: 'all', targets: ['根菜類'], multiplier: 1.4, message: '📰 【市場ニュース】TV番組の健康特集で根菜類が取り上げられ、需要が急増して価格が高騰中！' },
      { id: 'winter_shortage', name: '冬野菜の高騰', season: 'winter', targets: ['果菜類'], multiplier: 1.8, message: '📰 【市場ニュース】寒波の影響で施設栽培野菜の出荷が遅れ、夏野菜（果菜類）が超高騰しています！' }
    ];

    const possibleEvents = events.filter(e => e.season === 'all' || e.season === seasonKey);
    if (possibleEvents.length > 0) {
      const selected = possibleEvents[Math.floor(Math.random() * possibleEvents.length)];
      this.activeMarketEvent = selected;
      if (window.game && window.game.ui) {
        window.game.ui.addLog(selected.message, 'warning');
      }
    }
  }

  // --- Sell harvested crop ---
  sell(harvestResult) {
    const cropType = harvestResult.cropType;
    const marketPrice = this.marketPrices[cropType] || harvestResult.basePrice;
    const qualityMult = harvestResult.gradeInfo.multiplier;
    const sellBonus = (window.game && window.game.getBonus('sellBonus')) || 1.0;
    const modeSellBonus = (window.game && window.game.getModeBonus('sellBonus')) || 1.0;
    const modeYieldBonus = (window.game && window.game.getModeBonus('yieldBonus')) || 1.0;
    const modeQualityBonus = (window.game && window.game.getModeBonus('qualityBonus')) || 1.0;
    const adjustedYield = Math.round(harvestResult.yieldKg * modeYieldBonus);
    const revenue = Math.round(adjustedYield * marketPrice * qualityMult * modeQualityBonus * sellBonus * modeSellBonus);

    this.earn(revenue);

    const logEntry = {
      cropType,
      cropName: harvestResult.cropName,
      emoji: harvestResult.emoji,
      grade: harvestResult.grade,
      yieldKg: harvestResult.yieldKg,
      unitPrice: marketPrice,
      qualityMult,
      revenue,
      timestamp: Date.now(),
    };
    this.harvestLog.push(logEntry);
    if (this.harvestLog.length > 50) this.harvestLog.shift();

    return logEntry;
  }

  getMarketPrice(cropType) {
    return this.marketPrices[cropType] || 0;
  }

  getPriceHistory(cropType) {
    return this.priceHistory[cropType] || [];
  }

  getHarvestLog() {
    return this.harvestLog;
  }

  getStats() {
    return {
      money: this.money,
      totalEarned: this.totalEarned,
      totalSpent: this.totalSpent,
      profit: this.totalEarned - this.totalSpent,
      harvestCount: this.harvestLog.length,
    };
  }

  // --- Serialize ---
  toJSON() {
    return {
      money: this.money,
      totalEarned: this.totalEarned,
      totalSpent: this.totalSpent,
      harvestLog: this.harvestLog,
      marketPrices: this.marketPrices,
      priceHistory: this.priceHistory,
      activeMarketEvent: this.activeMarketEvent,
    };
  }

  fromJSON(data) {
    this.money = data.money;
    this.totalEarned = data.totalEarned;
    this.totalSpent = data.totalSpent;
    this.harvestLog = data.harvestLog || [];
    this.marketPrices = data.marketPrices;
    this.priceHistory = data.priceHistory || {};
    this.activeMarketEvent = data.activeMarketEvent || null;
  }
}
