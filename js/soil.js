// ======================================================
// soil.js - Soil Simulation System
// ======================================================
class SoilSystem {
  constructor(plotCount, farmlandType = null, areaId = null) {
    this.plots = [];
    this.farmlandType = farmlandType;
    this.areaId = areaId;
    // Look up the area-specific soil profile, or fall back to DEFAULT_SOIL
    let baseSoil = DEFAULT_SOIL;
    if (areaId && farmlandType && AREA_SOIL_PROFILES[areaId]) {
      baseSoil = AREA_SOIL_PROFILES[areaId][farmlandType] || DEFAULT_SOIL;
    }
    for (let i = 0; i < plotCount; i++) {
      this.plots.push(this.createSoil(i, baseSoil));
    }
  }

  createSoil(index, base = DEFAULT_SOIL) {
    const variation = () => randomRange(-6, 6);
    return {
      pH: clamp(base.pH + randomRange(-0.3, 0.3), 3.0, 9.0),
      N: clamp(base.N + variation(), 0, 100),
      P: clamp(base.P + variation(), 0, 100),
      K: clamp(base.K + variation(), 0, 100),
      organic: clamp(base.organic + variation(), 0, 100),
      moisture: clamp(base.moisture + randomRange(-8, 8), 0, 100),
      clay: base.clay + randomRange(-3, 3),
      silt: base.silt + randomRange(-3, 3),
      sand: base.sand + randomRange(-3, 3),
      ec: clamp(base.ec + randomRange(-0.2, 0.2), 0, 10),
      temperature: base.temperature,
    };
  }

  getSoil(plotId) {
    return this.plots[plotId];
  }

  // --- Daily soil update ---
  dailyUpdate(plotId, weather, hasCrop, hasMulch, cropData) {
    const soil = this.plots[plotId];

    // Update soil temperature (influenced by air temp, mulch insulation)
    const airTemp = (weather.tempMax + weather.tempMin) / 2;
    const tempTarget = hasMulch ? (airTemp * 0.6 + soil.temperature * 0.4) : airTemp;
    soil.temperature += (tempTarget - soil.temperature) * 0.3;

    // Update moisture
    const rainfall = weather.rainfall || 0;
    const evaporation = this.calcEvaporation(soil, weather, hasMulch);
    const cropConsumption = hasCrop ? this.calcCropWaterUse(soil, cropData) : 0;
    soil.moisture = clamp(
      soil.moisture + rainfall * 0.8 - evaporation - cropConsumption,
      0, 100
    );

    // Natural nutrient depletion (very slow)
    if (hasCrop) {
      const depletionRate = cropData ? 0.15 : 0.05;
      soil.N = clamp(soil.N - depletionRate * 1.2, 0, 100);
      soil.P = clamp(soil.P - depletionRate * 0.8, 0, 100);
      soil.K = clamp(soil.K - depletionRate * 1.0, 0, 100);
    }

    // Organic matter slow decay
    soil.organic = clamp(soil.organic - 0.02, 0, 100);

    // Organic matter slowly releases nutrients
    if (soil.organic > 30) {
      soil.N = clamp(soil.N + 0.03, 0, 100);
      soil.P = clamp(soil.P + 0.02, 0, 100);
      soil.K = clamp(soil.K + 0.02, 0, 100);
    }

    // pH slowly trends toward neutral (6.5) from organic matter activity
    if (soil.organic > 40) {
      const pHDiff = 6.5 - soil.pH;
      soil.pH = clamp(soil.pH + pHDiff * 0.002, 3.0, 9.0);
    }

    // EC changes - heavy rain reduces EC (leaching)
    if (rainfall > 20) {
      soil.ec = clamp(soil.ec - 0.05, 0, 10);
    }

    return soil;
  }

  calcEvaporation(soil, weather, hasMulch) {
    const baseEvap = 2.0;
    const tempFactor = Math.max(0, (weather.tempMax - 10) / 30);
    const humidityFactor = 1 - (weather.humidity / 100) * 0.5;
    const mulchFactor = hasMulch ? 0.4 : 1.0;
    let weatherMod = weather.evapMod || 1.0;
    
    // Foehn drastically increases evaporation
    if (weather.events && weather.events.find(e => e.type === 'foehn')) {
      weatherMod *= 3.0; 
    }
    
    return baseEvap * tempFactor * humidityFactor * mulchFactor * weatherMod;
  }

  calcCropWaterUse(soil, cropData) {
    if (!cropData) return 0.5;
    // Rice uses more water
    const baseDemand = cropData.id === 'rice' ? 2.0 : 1.0;
    return baseDemand;
  }

  // --- Apply fertilizer ---
  applyItem(plotId, item, bonus = 1.0) {
    const soil = this.plots[plotId];
    const effects = item.effects;

    if (effects.N) soil.N = clamp(soil.N + effects.N * bonus, 0, 100);
    if (effects.P) soil.P = clamp(soil.P + effects.P * bonus, 0, 100);
    if (effects.K) soil.K = clamp(soil.K + effects.K * bonus, 0, 100);
    if (effects.organic) soil.organic = clamp(soil.organic + effects.organic * bonus, 0, 100);
    if (effects.pH) soil.pH = clamp(soil.pH + effects.pH, 3.0, 9.0);

    // Fertilizer slightly increases EC
    if (effects.N || effects.P || effects.K) {
      soil.ec = clamp(soil.ec + 0.1, 0, 10);
    }

    return soil;
  }

  // --- Irrigate ---
  irrigate(plotId, bonus = 1.0) {
    const soil = this.plots[plotId];
    soil.moisture = clamp(soil.moisture + 20 * bonus, 0, 100);
    return soil;
  }

  // --- Analyze soil and generate recommendations ---
  analyze(plotId, cropType = null) {
    const soil = this.plots[plotId];
    const analysis = {
      overall: 'good',
      scores: {},
      recommendations: [],
      compatibility: null,
    };

    // Score each parameter
    const params = ['N', 'P', 'K', 'organic', 'moisture'];
    for (const param of params) {
      const t = SOIL_THRESHOLDS[param];
      const val = soil[param];
      if (val < t.veryLow) analysis.scores[param] = { status: 'critical', label: '危機的' };
      else if (val < t.low) analysis.scores[param] = { status: 'low', label: '不足' };
      else if (val <= t.high) analysis.scores[param] = { status: 'optimal', label: '適正' };
      else if (val <= t.veryHigh) analysis.scores[param] = { status: 'high', label: '過剰' };
      else analysis.scores[param] = { status: 'excessive', label: '危険' };
    }

    // pH scoring
    const pH = soil.pH;
    if (pH < 4.5) analysis.scores.pH = { status: 'critical', label: '強酸性' };
    else if (pH < 5.5) analysis.scores.pH = { status: 'low', label: '酸性' };
    else if (pH <= 7.5) analysis.scores.pH = { status: 'optimal', label: '適正' };
    else if (pH <= 8.5) analysis.scores.pH = { status: 'high', label: 'アルカリ性' };
    else analysis.scores.pH = { status: 'excessive', label: '強アルカリ' };

    // EC scoring
    if (soil.ec < 0.5) analysis.scores.ec = { status: 'low', label: '低い' };
    else if (soil.ec <= 3.0) analysis.scores.ec = { status: 'optimal', label: '適正' };
    else analysis.scores.ec = { status: 'high', label: '塩類集積' };

    // Generate recommendations
    if (analysis.scores.pH.status === 'low' || analysis.scores.pH.status === 'critical') {
      analysis.recommendations.push('🧪 pH が低いため石灰の散布を推奨します');
    }
    if (analysis.scores.N.status === 'low' || analysis.scores.N.status === 'critical') {
      analysis.recommendations.push('💊 窒素が不足しています。窒素肥料または堆肥を投入しましょう');
    }
    if (analysis.scores.P.status === 'low' || analysis.scores.P.status === 'critical') {
      analysis.recommendations.push('💊 リン酸が不足しています。リン酸肥料を投入しましょう');
    }
    if (analysis.scores.K.status === 'low' || analysis.scores.K.status === 'critical') {
      analysis.recommendations.push('💊 カリウムが不足しています。カリウム肥料を投入しましょう');
    }
    if (analysis.scores.organic.status === 'low' || analysis.scores.organic.status === 'critical') {
      analysis.recommendations.push('🧴 有機物が不足しています。堆肥を投入して土壌を改良しましょう');
    }
    if (analysis.scores.moisture.status === 'low' || analysis.scores.moisture.status === 'critical') {
      analysis.recommendations.push('🌊 水分が不足しています。灌漑を行いましょう');
    }
    if (analysis.scores.ec.status === 'high') {
      analysis.recommendations.push('⚠️ 塩類が集積しています。灌漑で洗い流しましょう');
    }

    if (analysis.recommendations.length === 0) {
      analysis.recommendations.push('✅ 土壌の状態は良好です！');
    }

    // Crop compatibility
    if (cropType && CROPS[cropType]) {
      analysis.compatibility = this.calcCompatibility(plotId, cropType);
    }

    // Overall status
    const statuses = Object.values(analysis.scores).map(s => s.status);
    if (statuses.some(s => s === 'critical' || s === 'excessive')) {
      analysis.overall = 'critical';
    } else if (statuses.some(s => s === 'low' || s === 'high')) {
      analysis.overall = 'warning';
    } else {
      analysis.overall = 'good';
    }

    return analysis;
  }

  // --- Calculate crop compatibility score ---
  calcCompatibility(plotId, cropType) {
    const soil = this.plots[plotId];
    const crop = CROPS[cropType];
    if (!crop) return 0;

    const opt = crop.optimal;
    const factors = [];

    factors.push(this.calcFactor(soil.pH, opt.pH.min, opt.pH.max, 2.0));
    factors.push(this.calcFactor(soil.N, opt.N.min, opt.N.max, 30));
    factors.push(this.calcFactor(soil.P, opt.P.min, opt.P.max, 30));
    factors.push(this.calcFactor(soil.K, opt.K.min, opt.K.max, 30));
    factors.push(this.calcFactor(soil.moisture, opt.moisture.min, opt.moisture.max, 30));

    const avg = factors.reduce((a, b) => a + b, 0) / factors.length;
    return avg;
  }

  // --- Calculate individual factor (0.0 - 1.0) ---
  calcFactor(value, optMin, optMax, tolerance) {
    if (value >= optMin && value <= optMax) return 1.0;
    if (value < optMin) {
      const diff = optMin - value;
      return Math.max(0, 1.0 - diff / tolerance);
    }
    const diff = value - optMax;
    return Math.max(0, 1.0 - diff / tolerance);
  }

  // --- Serialize ---
  toJSON() {
    return this.plots;
  }

  fromJSON(data) {
    this.plots = data;
  }
}
