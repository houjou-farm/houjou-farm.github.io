// ======================================================
// crop.js - Crop Growth & Management System
// ======================================================
class CropSystem {
  constructor() {
    // plotId -> crop state
    this.crops = {};
  }

  // --- Plant a crop ---
  plant(plotId, cropType, currentDay) {
    const cropDef = CROPS[cropType];
    if (!cropDef) return null;

    const crop = {
      type: cropType,
      name: cropDef.name,
      emoji: cropDef.emoji,
      plantedDay: currentDay,
      growthPercent: 0,
      health: 100,
      stageIndex: 0,
      daysSincePlanted: 0,
      qualityAccum: 0,
      qualitySamples: 0,
      pestRisk: 10,
      diseaseRisk: 10,
      isPesticide: false,
      isWeeded: true,
      waterStressDays: 0,
      nutrientStressDays: 0,
      weatherDamage: 0,
      harvested: false,
    };

    this.crops[plotId] = crop;
    return crop;
  }

  // --- Daily growth update ---
  dailyGrow(plotId, soil, weather, hasMulch, hrBonus = 1.0) {
    const crop = this.crops[plotId];
    if (!crop || crop.harvested) return null;

    const cropDef = CROPS[crop.type];
    crop.daysSincePlanted++;

    // Calculate condition factors
    const factors = this.calcGrowthFactors(crop, cropDef, soil, weather);

    // Overall daily growth rate
    const baseGrowthPerDay = 100 / cropDef.growthDays;
    const overallFactor = factors.reduce((a, f) => a * f.value, 1);
    const growthBonusMult = (window.game && window.game.getBonus('growthBonus')) || 1.0;
    
    // Heavy snow halts growth completely
    const isHeavySnow = weather.events && weather.events.find(e => e.type === 'heavy_snow');
    const growthToday = isHeavySnow ? 0 : baseGrowthPerDay * Math.max(0.05, overallFactor) * growthBonusMult * hrBonus;
    
    crop.growthPercent = clamp(crop.growthPercent + growthToday, 0, 100);

    // Track quality (running average of condition matching)
    crop.qualityAccum += overallFactor;
    crop.qualitySamples++;

    // Update growth stage
    for (let i = cropDef.stages.length - 1; i >= 0; i--) {
      if (crop.growthPercent >= cropDef.stages[i].threshold) {
        crop.stageIndex = i;
        break;
      }
    }

    // Disease & pest risk
    this.updatePestDisease(crop, cropDef, soil, weather);

    // Health damage from stress
    if (overallFactor < 0.3) {
      crop.health = clamp(crop.health - 2, 0, 100);
    }

    // Weather event damage
    this.applyWeatherDamage(crop, cropDef, weather, hasMulch, plotId);

    // Nitrogen fixation for legumes
    if (cropDef.nitrogenFixer && crop.growthPercent > 20) {
      soil.N = clamp(soil.N + 0.1, 0, 100);
    }

    // Weed regrowth
    if (crop.isWeeded && chance(0.05)) {
      crop.isWeeded = false;
    }

    // Weed competition reduces growth
    if (!crop.isWeeded) {
      crop.health = clamp(crop.health - 0.5, 0, 100);
    }

    // If health hits 0, crop dies
    if (crop.health <= 0) {
      crop.health = 0;
      return { ...crop, died: true };
    }

    return crop;
  }

  // --- Calculate growth factors ---
  calcGrowthFactors(crop, cropDef, soil, weather) {
    const opt = cropDef.optimal;
    const factors = [];

    // Temperature factor
    const avgTemp = (weather.tempMax + weather.tempMin) / 2;
    factors.push({
      name: '温度',
      value: this.rangeFactor(avgTemp, opt.temperature.min, opt.temperature.max, 15),
    });

    // pH factor
    factors.push({
      name: 'pH',
      value: this.rangeFactor(soil.pH, opt.pH.min, opt.pH.max, 2),
    });

    // Moisture factor
    factors.push({
      name: '水分',
      value: this.rangeFactor(soil.moisture, opt.moisture.min, opt.moisture.max, 30),
    });

    // Nitrogen factor
    factors.push({
      name: '窒素',
      value: this.rangeFactor(soil.N, opt.N.min, opt.N.max, 30),
    });

    // Phosphorus factor
    factors.push({
      name: 'リン酸',
      value: this.rangeFactor(soil.P, opt.P.min, opt.P.max, 30),
    });

    // Potassium factor
    factors.push({
      name: 'カリウム',
      value: this.rangeFactor(soil.K, opt.K.min, opt.K.max, 30),
    });

    // Sunshine factor
    factors.push({
      name: '日照',
      value: clamp(weather.sunshine / opt.sunshine, 0, 1.2),
    });

    // Health factor
    factors.push({
      name: '健康',
      value: crop.health / 100,
    });

    return factors;
  }

  rangeFactor(value, optMin, optMax, tolerance) {
    if (value >= optMin && value <= optMax) return 1.0;
    if (value < optMin) {
      const diff = optMin - value;
      return Math.max(0, 1.0 - diff / tolerance);
    }
    const diff = value - optMax;
    return Math.max(0, 1.0 - diff / tolerance);
  }

  // --- Update pest and disease risk ---
  updatePestDisease(crop, cropDef, soil, weather) {
    // High humidity increases disease risk
    if (weather.humidity > 80) {
      crop.diseaseRisk = clamp(crop.diseaseRisk + 2, 0, 100);
    } else {
      crop.diseaseRisk = clamp(crop.diseaseRisk - 0.5, 0, 100);
    }

    // Warm + humid = pest increase
    const avgTemp = (weather.tempMax + weather.tempMin) / 2;
    if (avgTemp > 25 && weather.humidity > 70) {
      crop.pestRisk = clamp(crop.pestRisk + 1.5, 0, 100);
    } else {
      crop.pestRisk = clamp(crop.pestRisk - 0.3, 0, 100);
    }

    // Pesticide effect
    if (crop.isPesticide) {
      crop.pestRisk = clamp(crop.pestRisk - 3, 0, 100);
      crop.diseaseRisk = clamp(crop.diseaseRisk - 2, 0, 100);
      // Pesticide wears off
      if (chance(0.1)) {
        crop.isPesticide = false;
      }
    }

    // Resistance reduces risk
    crop.diseaseRisk *= (1 - cropDef.resistance.disease * 0.3);
    crop.pestRisk *= (1 - cropDef.resistance.disease * 0.2);

    // High risk causes damage
    if (crop.diseaseRisk > 60 && chance(0.15)) {
      const dmg = randomRange(3, 8);
      crop.health = clamp(crop.health - dmg, 0, 100);
      return { type: 'disease', damage: dmg };
    }
    if (crop.pestRisk > 60 && chance(0.12)) {
      const dmg = randomRange(2, 6);
      crop.health = clamp(crop.health - dmg, 0, 100);
      return { type: 'pest', damage: dmg };
    }

    return null;
  }

  // --- Apply weather event damage ---
  applyWeatherDamage(crop, cropDef, weather, hasMulch, plotId) {
    if (!weather.events || weather.events.length === 0) return;

    for (const event of weather.events) {
      let damage = 0;

      switch (event.type) {
        case 'typhoon': {
          damage = event.severity * 30 * (1 - cropDef.resistance.heat * 0.3);
          const charWeatherRes = (window.game && window.game.getBonus('weatherResist')) || 0;
          damage *= (1 - charWeatherRes);
          if (crop.hasWindbreak) damage *= 0.3;
          crop.health = clamp(crop.health - damage, 0, 100);
          crop.weatherDamage += damage;
          break;
        }
        case 'frost': {
          damage = event.severity * 25 * (1 - cropDef.resistance.cold);
          const charWR2 = (window.game && window.game.getBonus('weatherResist')) || 0;
          damage *= (1 - charWR2);
          if (hasMulch) damage *= 0.5;
          crop.health = clamp(crop.health - damage, 0, 100);
          crop.weatherDamage += damage;
          break;
        }
        case 'heatwave': {
          damage = event.severity * 15 * (1 - cropDef.resistance.heat);
          crop.health = clamp(crop.health - damage, 0, 100);
          crop.weatherDamage += damage;
          break;
        }
        case 'longRain': {
          if (soil.moisture > 85) {
            damage = event.severity * 10;
            crop.diseaseRisk += 5;
            crop.health = clamp(crop.health - damage, 0, 100);
            crop.weatherDamage += damage;
          }
          break;
        }
        case 'foehn': {
          damage = event.severity * 20 * (1 - cropDef.resistance.heat);
          if (hasMulch) damage *= 0.4;
          crop.health = clamp(crop.health - damage, 0, 100);
          crop.weatherDamage += damage;
          break;
        }
        case 'heavy_rain': {
          if (soil.moisture > 80) {
            damage = event.severity * 25; // 根腐れ (Root rot)
            crop.diseaseRisk += 10;
            crop.health = clamp(crop.health - damage, 0, 100);
            crop.weatherDamage += damage;
          }
          break;
        }
        case 'heavy_snow': {
          damage = event.severity * 15 * (1 - cropDef.resistance.cold);
          if (crop.hasWindbreak) {
            damage *= 0.2;
            // 豪雪で防風林が壊れる確率
            if (chance(0.2)) {
              crop.hasWindbreak = false;
              if (window.game) {
                 window.game.plotStates[plotId].windbreak = false;
                 window.game.ui.addLog(`⛄ 豪雪の重みで区画${plotId + 1}の防風設備が倒壊しました！`, 'error');
              }
            }
          }
          crop.health = clamp(crop.health - damage, 0, 100);
          crop.weatherDamage += damage;
          break;
        }
      }
    }
  }

  // --- Harvest a crop ---
  harvest(plotId) {
    const crop = this.crops[plotId];
    if (!crop || crop.growthPercent < 85) return null;

    const cropDef = CROPS[crop.type];

    // Calculate quality
    const avgQuality = crop.qualitySamples > 0
      ? crop.qualityAccum / crop.qualitySamples
      : 0.5;
    const healthFactor = crop.health / 100;
    const charQBonus = (window.game && window.game.getBonus('qualityBonus')) || 1.0;
    const finalQuality = clamp(avgQuality * healthFactor * charQBonus, 0, 1.0);

    // Determine grade
    let grade = 'C';
    for (const [key, g] of Object.entries(QUALITY_GRADES)) {
      if (finalQuality >= g.minScore) {
        grade = key;
        break;
      }
    }

    // Calculate yield
    const growthFactor = crop.growthPercent / 100;
    const charQualityBonus = (window.game && window.game.getBonus('qualityBonus')) || 1.0;
    const charYieldBonus = (window.game && window.game.getBonus('yieldBonus')) || 1.0;
    const yieldKg = cropDef.baseYieldKg * growthFactor * healthFactor *
      randomRange(0.85, 1.15) * charYieldBonus;

    const result = {
      cropType: crop.type,
      cropName: cropDef.name,
      emoji: cropDef.emoji,
      grade,
      gradeInfo: QUALITY_GRADES[grade],
      yieldKg: Math.round(yieldKg * 10) / 10,
      quality: Math.round(finalQuality * 100),
      health: Math.round(crop.health),
      daysGrown: crop.daysSincePlanted,
      basePrice: cropDef.basePrice,
    };

    // Remove crop from plot
    delete this.crops[plotId];

    return result;
  }

  // --- Weed a plot ---
  weed(plotId) {
    const crop = this.crops[plotId];
    if (crop) {
      crop.isWeeded = true;
      crop.health = clamp(crop.health + 2, 0, 100);
    }
  }

  // --- Apply pesticide ---
  applyPesticide(plotId) {
    const crop = this.crops[plotId];
    if (crop) {
      crop.isPesticide = true;
      crop.pestRisk = clamp(crop.pestRisk - 30, 0, 100);
      crop.diseaseRisk = clamp(crop.diseaseRisk - 20, 0, 100);
    }
  }

  // --- Set windbreak ---
  setWindbreak(plotId) {
    const crop = this.crops[plotId];
    if (crop) {
      crop.hasWindbreak = true;
    }
  }

  getCrop(plotId) {
    return this.crops[plotId] || null;
  }

  hasCrop(plotId) {
    return !!this.crops[plotId];
  }

  isHarvestable(plotId) {
    const crop = this.crops[plotId];
    return crop && crop.growthPercent >= 85 && crop.health > 0;
  }

  getGrowthFactors(plotId, soil, weather) {
    const crop = this.crops[plotId];
    if (!crop) return [];
    const cropDef = CROPS[crop.type];
    return this.calcGrowthFactors(crop, cropDef, soil, weather);
  }

  // --- Serialize ---
  toJSON() {
    return this.crops;
  }

  fromJSON(data) {
    this.crops = data || {};
  }
}
