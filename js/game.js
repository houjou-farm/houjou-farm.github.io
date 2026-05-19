// ======================================================
// game.js - Main Game Engine
// ======================================================

class GameEngine {
  constructor() {
    this.day = 1;
    this.year = 1;
    this.totalDays = 0;
    this.plotStates = {};
    this.running = false;
    this.character = null;
    this.farmingMode = null;  // 'individual' or 'cooperative'
  }

  // Get character bonus value (defaults to 1.0 / 0.0 if no character)
  getBonus(key) {
    if (!this.character) return key.includes('Resist') ? 0 : 1.0;
    return this.character.bonuses[key] ?? (key.includes('Resist') ? 0 : 1.0);
  }

  // Get farming mode bonus value
  getModeBonus(key) {
    if (!this.farmingMode) return key === 'subsidyMoney' ? 0 : 1.0;
    return FARMING_MODES[this.farmingMode]?.bonuses[key] ?? (key === 'subsidyMoney' ? 0 : 1.0);
  }

  init() {
    // Initialize subsystems (soil created later with farmland type)
    this.weather = new WeatherSystem();
    this.crops = new CropSystem();
    this.economy = new EconomySystem();
    this.subsidy = new SubsidySystem();
    this.loan = new LoanSystem();
    this.hr = new HRSystem();

    // Plot extra states
    for (let i = 0; i < CONSTANTS.PLOT_COUNT; i++) {
      this.plotStates[i] = { mulched: false, windbreak: false };
    }

    this.day = 91;
    this.weather.advanceDay(this.day, this.year);
    this.economy.updateMarket(this.day, this.getCurrentSeason());

    // Initialize UI
    this.ui = new UIManager(this);

    // Show character selection screen first
    this.ui.showCharacterSelect();
  }

  // Called after character is selected → show mode selection
  selectCharacter(characterId) {
    this.character = CHARACTERS[characterId];
    this.ui.showModeSelect();
  }

  // Called after mode is selected → show area selection
  selectMode(modeId) {
    this.farmingMode = modeId;
    this.ui.showAreaSelect();
  }

  // Called after area is selected → show farmland type selection
  selectArea(areaId) {
    this.areaId = areaId;
    this.ui.showFarmlandSelect();
  }

  // Called after farmland type is selected → start game
  startGame(farmlandType) {
    this.farmlandType = farmlandType;
    this.soil = new SoilSystem(CONSTANTS.PLOT_COUNT, farmlandType, this.areaId);

    // Apply mode bonus to initial funds
    const subsidy = this.getModeBonus('subsidyMoney');
    if (subsidy > 0) {
      this.economy.earn(subsidy);
    } else if (subsidy < 0) {
      this.economy.spend(Math.abs(subsidy));
    }

    document.getElementById('char-select-overlay').classList.remove('active');
    document.getElementById('app').style.display = 'grid';

    const area = IMIZU_AREAS[this.areaId];
    const fl = FARMLAND_TYPES[farmlandType];
    const mode = FARMING_MODES[this.farmingMode];
    this.ui.render();
    this.ui.addLog(`🌾 ${this.character.name}の農業生活が始まります！`, 'success');
    this.ui.addLog(`${mode.emoji} 経営形態: ${mode.name}`, 'info');
    this.ui.addLog(`📍 ${area.name}の${fl.name}で営農開始`, 'info');
    if (subsidy > 0) {
      this.ui.addLog(`💰 新規就農補助金: +${formatMoney(subsidy)}`, 'success');
    } else if (subsidy < 0) {
      this.ui.addLog(`💳 組合加入費: -${formatMoney(Math.abs(subsidy))}`, 'warning');
    }
    this.ui.addLog(`💰 資金: ${formatMoney(this.economy.getMoney())}`, 'info');
    this.ui.addLog('🌱 区画を選択して作物を植えましょう！', 'info');

    if (localStorage.getItem('farmSimSave')) {
      this.ui.addLog('💾 セーブデータが見つかりました。ロードボタンで復元できます。', 'info');
    }

    this.running = true;
  }

  getCurrentSeason() {
    const { month } = getDateFromDay(this.day);
    return getSeasonFromMonth(month);
  }

  // === ADVANCE ONE DAY ===
  nextDay() {
    if (!this.running) return;

    this.totalDays++;
    this.day++;
    if (this.day > 360) {
      this.day = 1;
      this.year++;
      this.ui.addLog(`🎊 ${this.year}年目が始まりました！`, 'success');
      
      // Process Loan Repayment
      const repaymentResult = this.loan.processYearlyRepayment(this);
      if (repaymentResult) {
        if (repaymentResult.success) {
          this.ui.addLog(`🏦 融資の年間返済: -${formatMoney(repaymentResult.amount)} （残り${repaymentResult.remainingYears}年）`, 'warning');
          this.ui.showNotification(`🏦 ローン返済: -${formatMoney(repaymentResult.amount)}`, 'warning');
        } else {
          this.ui.addLog(`💥 【資金ショート】 ローン返済（${formatMoney(repaymentResult.amount)}）により資金がマイナスになりました！至急資金を確保してください。`, 'error');
          this.ui.showNotification(`💥 資金ショート（倒産危機）`, 'error');
        }
      }

      // Process Yearly HR Salary
      const salaryResult = this.hr.processYearlySalary(this);
      if (!salaryResult.success && salaryResult.amount > 0) {
        this.ui.addLog(`💥 【資金ショート】 従業員への給与支払い（${formatMoney(salaryResult.amount)}）により資金がマイナスになりました！至急資金を確保してください。`, 'error');
        this.ui.showNotification(`💥 人件費で資金ショート`, 'error');
      } else if (salaryResult.amount > 0) {
        this.ui.addLog(`💰 従業員の年間給与を支払いました: -${formatMoney(salaryResult.amount)}`, 'warning');
        this.ui.showNotification(`給与支払い: -${formatMoney(salaryResult.amount)}`, 'warning');
      }
    }

    // Process HR recruiting
    this.hr.advanceDay(this);

    // Generate weather
    const weather = this.weather.advanceDay(this.day, this.year);

    // Log weather events
    for (const event of weather.events) {
      this.ui.addLog(event.message, 'warning');
      this.ui.showNotification(event.message, 'warning');
    }

    // Update each plot
    for (let i = 0; i < CONSTANTS.PLOT_COUNT; i++) {
      const hasCrop = this.crops.hasCrop(i);
      const crop = this.crops.getCrop(i);
      const cropDef = crop ? CROPS[crop.type] : null;
      const ps = this.plotStates[i];

      // Update soil
      this.soil.dailyUpdate(i, weather, hasCrop, ps.mulched, cropDef);

      // Grow crops
      if (hasCrop) {
        const soil = this.soil.getSoil(i);
        const hrBonus = this.hr.getGrowthBonus();
        const result = this.crops.dailyGrow(i, soil, weather, ps.mulched, hrBonus);

        if (result && result.died) {
          this.ui.addLog(`💀 区画${i + 1}の${crop.name}が枯れてしまいました...`, 'error');
          this.ui.showNotification(`💀 ${crop.name}が枯れました！`, 'error');
        }

        // Check if newly harvestable
        if (result && crop.growthPercent < 85 && result.growthPercent >= 85) {
          this.ui.addLog(`✅ 区画${i + 1}の${crop.name}が収穫可能になりました！`, 'success');
          this.ui.showNotification(`🎉 ${crop.name}が収穫可能！`, 'success');
        }
      }
    }

    // Process HR daily tasks (Automated weed/irrigate)
    this.hr.processDailyTasks(this);

    // Update market
    this.economy.updateMarket(this.day, this.getCurrentSeason());

    // Render
    this.ui.render();

    // Season change notification
    const { month, day } = getDateFromDay(this.day);
    if (day === 1 && [3, 6, 9, 12].includes(month)) {
      const season = this.getCurrentSeason();
      const seasonNames = { spring: '🌸 春', summer: '☀️ 夏', autumn: '🍂 秋', winter: '❄️ 冬' };
      this.ui.addLog(`${seasonNames[season]}の季節になりました`, 'info');
      this.ui.showNotification(`${seasonNames[season]}の季節になりました`, 'info');
    }
  }

  // === ADVANCE ONE WEEK ===
  nextWeek() {
    for (let i = 0; i < 7; i++) {
      this.nextDay();
    }
  }

  // === PERFORM ACTION ===
  performAction(action, plotId, extra = null) {
    if (plotId === null || plotId === undefined) {
      this.ui.showNotification('⚠️ 区画を選択してください', 'warning');
      return;
    }

    switch (action) {
      case 'plant': {
        if (!extra) return;
        const cropDef = CROPS[extra];
        if (!cropDef) return;
        const seedCostMult = this.getModeBonus('costDiscount');
        const actualSeedCost = Math.round(cropDef.seedCost * seedCostMult);
        if (!this.economy.canAfford(actualSeedCost)) {
          this.ui.showNotification('⚠️ 資金が不足しています', 'warning');
          return;
        }
        this.economy.spend(actualSeedCost);
        this.crops.plant(plotId, extra, this.day);
        this.ui.addLog(`🌱 区画${plotId + 1}に${cropDef.name}を植えました (${formatMoney(actualSeedCost)})`, 'success');
        this.ui.showNotification(`🌱 ${cropDef.name}を植えました！`, 'success');
        break;
      }
      case 'harvest': {
        const result = this.crops.harvest(plotId);
        if (!result) {
          this.ui.showNotification('⚠️ まだ収穫できません', 'warning');
          return;
        }
        const saleResult = this.economy.sell(result);
        this.ui.addLog(`🎉 ${result.cropName}を収穫！${result.gradeInfo.name} ${result.yieldKg}kg → ${formatMoney(saleResult.revenue)}`, 'success');
        this.ui.showHarvestModal(result, saleResult);
        // Reset plot state
        this.plotStates[plotId] = { mulched: false, windbreak: this.plotStates[plotId].windbreak };
        break;
      }
      case 'irrigate': {
        const irrCost = Math.round(500 * this.getBonus('costDiscount') * this.getModeBonus('irrigateCostMult'));
        if (!this.economy.canAfford(irrCost)) { this.ui.showNotification('⚠️ 資金不足', 'warning'); return; }
        this.economy.spend(irrCost);
        this.soil.irrigate(plotId, this.getBonus('irrigateBonus'));
        this.ui.addLog(`🌊 区画${plotId + 1}に灌漑 (${formatMoney(irrCost)})`, 'info');
        break;
      }
      case 'weed': {
        this.crops.weed(plotId);
        this.ui.addLog(`🌿 区画${plotId + 1}の除草完了`, 'info');
        break;
      }
      default: {
        const item = ITEMS[action];
        if (!item) return;
        const isFertilizer = item.effects && (item.effects.N || item.effects.P || item.effects.K);
        const modeCostMult = isFertilizer ? this.getModeBonus('fertilizerCostMult') : this.getModeBonus('costDiscount');
        const itemCost = Math.round(item.cost * this.getBonus('costDiscount') * modeCostMult);
        if (!this.economy.canAfford(itemCost)) {
          this.ui.showNotification('⚠️ 資金不足', 'warning');
          return;
        }
        this.economy.spend(itemCost);

        if (item.effects.mulch) {
          this.plotStates[plotId].mulched = true;
        } else if (item.effects.windbreak) {
          this.plotStates[plotId].windbreak = true;
          this.crops.setWindbreak(plotId);
        } else if (item.effects.pestRisk !== undefined) {
          this.crops.applyPesticide(plotId);
        } else {
          this.soil.applyItem(plotId, item, this.getBonus('fertilizerBonus'));
        }
        this.ui.addLog(`${item.emoji} 区画${plotId + 1}に${item.name}を使用 (${formatMoney(itemCost)})`, 'info');
        break;
      }
    }

    this.ui.render();
  }

  // === SUBSIDY SYSTEM ===
  submitSubsidyApplication(data) {
    const result = this.subsidy.evaluateApplication(this, data);
    
    if (result.passed) {
      this.economy.earn(result.grantedAmount);
      this.subsidy.recordApplication(this.year);
      this.ui.addLog(`💰 補助金審査通過！ ${formatMoney(result.grantedAmount)}が交付されました。`, 'success');
      this.ui.showNotification(`💰 補助金交付: ${formatMoney(result.grantedAmount)}`, 'success');
    } else {
      this.ui.addLog('❌ 補助金審査不採択。アドバイスを確認して再申請してください。', 'warning');
      this.ui.showNotification('❌ 補助金審査 不採択', 'error');
    }
    
    this.ui.render();
    return result;
  }

  // === LOAN SYSTEM ===
  submitLoanApplication(data) {
    const result = this.loan.evaluateApplication(this, data);
    
    if (result.passed) {
      this.economy.earn(result.grantedAmount);
      this.ui.addLog(`🏦 融資審査通過！ ${formatMoney(result.grantedAmount)}が口座に振り込まれました。`, 'success');
      this.ui.showNotification(`🏦 融資実行: ${formatMoney(result.grantedAmount)}`, 'success');
    } else {
      this.ui.addLog('❌ 融資審査不採択。AI担当者のフィードバックを確認してください。', 'warning');
      this.ui.showNotification('❌ 融資審査 否決', 'error');
    }
    
    this.ui.render();
    return result;
  }

  // === SAVE / LOAD ===
  save() {
    const data = {
      day: this.day,
      year: this.year,
      totalDays: this.totalDays,
      plotStates: this.plotStates,
      characterId: this.character ? this.character.id : null,
      farmingMode: this.farmingMode || null,
      areaId: this.areaId || null,
      farmlandType: this.farmlandType || null,
      soil: this.soil.toJSON(),
      weather: this.weather.toJSON(),
      crops: this.crops.toJSON(),
      economy: this.economy.toJSON(),
      subsidy: this.subsidy.toJSON(),
      loan: this.loan.toJSON(),
    };
    localStorage.setItem('farmSimSave', JSON.stringify(data));
    this.ui.addLog('💾 ゲームを保存しました', 'success');
    this.ui.showNotification('💾 セーブ完了！', 'success');
  }

  load() {
    const raw = localStorage.getItem('farmSimSave');
    if (!raw) {
      this.ui.showNotification('⚠️ セーブデータがありません', 'warning');
      return;
    }
    try {
      const data = JSON.parse(raw);
      this.day = data.day;
      this.year = data.year;
      this.totalDays = data.totalDays;
      this.plotStates = data.plotStates;
      if (data.characterId && CHARACTERS[data.characterId]) {
        this.character = CHARACTERS[data.characterId];
      }
      if (data.farmlandType) {
        this.farmlandType = data.farmlandType;
      }
      if (data.farmingMode) {
        this.farmingMode = data.farmingMode;
      }
      if (data.areaId) {
        this.areaId = data.areaId;
      }
      if (!this.soil) {
        this.soil = new SoilSystem(CONSTANTS.PLOT_COUNT, this.farmlandType, this.areaId);
      }
      this.soil.fromJSON(data.soil);
      this.weather.fromJSON(data.weather);
      this.crops.fromJSON(data.crops);
      this.economy.fromJSON(data.economy);
      if (data.subsidy) this.subsidy.fromJSON(data.subsidy);
      if (data.loan) this.loan.fromJSON(data.loan);
      this.ui.render();
      this.ui.addLog('💾 セーブデータをロードしました', 'success');
      this.ui.showNotification('💾 ロード完了！', 'success');
    } catch (e) {
      this.ui.showNotification('❌ ロードに失敗しました', 'error');
    }
  }
}

// === Bootstrap ===
document.addEventListener('DOMContentLoaded', () => {
  const game = new GameEngine();
  game.init();
  window.game = game;
});
