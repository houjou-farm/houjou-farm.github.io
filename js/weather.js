// ======================================================
// weather.js - Weather Simulation System
// ======================================================
class WeatherSystem {
  constructor() {
    this.currentWeather = null;
    this.forecast = [];
    this.activeEvents = [];
    this.history = [];
  }

  // --- Generate weather for a specific day ---
  generateWeather(dayOfYear, year) {
    const { month, day } = getDateFromDay(dayOfYear);
    const seasonKey = getSeasonFromMonth(month);
    const season = SEASONS[seasonKey];

    // Determine weather type (incorporate winter sunshine deprivation)
    let weatherType = this.pickWeatherType(season, month);
    if (seasonKey === 'winter' && ['sunny', 'partlyCloudy'].includes(weatherType)) {
      // 寡照 (Winter sunshine deprivation): 80% chance to degrade sunny/partly to cloudy/snow
      if (Math.random() < 0.8) {
        weatherType = Math.random() < 0.5 ? 'cloudy' : 'snow';
      }
    }
    
    const wt = WEATHER_TYPES[weatherType];

    // Check for special events FIRST to apply overrides
    const events = this.checkEvents(seasonKey, month, weatherType);

    // Temperature calculation using Imizu climate data
    const climate = IMIZU_CLIMATE[month];
    
    // Default variations
    let tempVariation = randomRange(-3.0, 3.0);
    let tempMin = Math.round((climate.tempMin + tempVariation) * 10) / 10;
    let tempMax = Math.round((climate.tempMax + tempVariation + randomRange(0, 3)) * 10) / 10;
    let humidity = clamp(Math.round(climate.humidity + randomRange(-10, 10)), 20, 98);
    let rainfall = wt.rainMod > 0 ? Math.round(wt.rainMod * randomRange(0.5, 1.5) * 10) / 10 : 0;
    let windSpeed = Math.round((weatherType === 'typhoon' ? randomRange(20, 40) : randomRange(1, 10)) * 10) / 10;

    // Apply Event Overrides
    if (events.find(e => e.type === 'foehn')) {
      tempMax += randomRange(5.0, 8.0); // Foehn spike
      humidity = clamp(humidity - randomRange(20, 40), 10, 50); // Very dry
      windSpeed += randomRange(5, 10);
      weatherType = 'sunny'; // Foehn usually clears sky
    }
    if (events.find(e => e.type === 'heavy_rain')) {
      rainfall += randomRange(30, 80); // Massive rain
      weatherType = 'heavyRain';
    }
    if (events.find(e => e.type === 'heavy_snow')) {
      rainfall += randomRange(20, 50); // Snow amount
      weatherType = 'snow';
    }

    // Sunshine hours
    const maxSunshine = season.sunshineBase + randomRange(-1, 1);
    const sunshine = Math.round(clamp(maxSunshine * WEATHER_TYPES[weatherType].sunMod, 0, 14) * 10) / 10;

    const weather = {
      dayOfYear,
      year,
      month,
      day,
      season: seasonKey,
      seasonName: season.name,
      type: weatherType,
      typeName: WEATHER_TYPES[weatherType].name,
      emoji: WEATHER_TYPES[weatherType].emoji,
      tempMin,
      tempMax,
      humidity,
      rainfall,
      sunshine,
      windSpeed,
      evapMod: wt.evapMod,
      events,
    };

    return weather;
  }

  // --- Pick weather type based on season ---
  pickWeatherType(season, month) {
    const roll = Math.random();

    // Check for typhoon
    if (season.events.typhoon) {
      const tc = season.events.typhoon;
      if (tc.monthLimit.includes(month) && roll < tc.chance) {
        return 'typhoon';
      }
    }

    // Check for snow
    if (season.events.snow) {
      const sc = season.events.snow;
      if (sc.monthLimit.includes(month) && roll < sc.chance) {
        return 'snow';
      }
    }

    // Normal weather distribution
    const rainRoll = Math.random();
    if (rainRoll < season.rainChance * 0.3) return 'heavyRain';
    if (rainRoll < season.rainChance * 0.7) return 'rain';
    if (rainRoll < season.rainChance) return 'lightRain';
    if (rainRoll < season.rainChance + 0.2) return 'cloudy';
    if (rainRoll < season.rainChance + 0.4) return 'partlyCloudy';
    return 'sunny';
  }

  // --- Check for special weather events ---
  checkEvents(seasonKey, month, weatherType) {
    const season = SEASONS[seasonKey];
    const events = [];

    // Typhoon
    if (weatherType === 'typhoon') {
      events.push({
        type: 'typhoon',
        name: '台風',
        emoji: '🌀',
        severity: randomRange(0.3, 1.0),
        message: '🌀 台風が接近しています！作物に被害が出る可能性があります！',
      });
    }

    // Frost
    if (season.events.frost) {
      const fc = season.events.frost;
      if (fc.monthLimit.includes(month) && chance(fc.chance)) {
        events.push({
          type: 'frost',
          name: '霜',
          emoji: '🥶',
          severity: randomRange(0.2, 0.7),
          message: '🥶 霜が降りました！耐寒性の低い作物に注意！',
        });
      }
    }

    // Heatwave
    if (season.events.heatwave) {
      const hc = season.events.heatwave;
      if (hc.monthLimit.includes(month) && chance(hc.chance)) {
        events.push({
          type: 'heatwave',
          name: '猛暑',
          emoji: '🔥',
          severity: randomRange(0.4, 0.9),
          message: '🔥 猛暑日です！水切れに注意してください！',
        });
      }
    }

    // Foehn Phenomenon (フェーン現象)
    if (season.events.foehn) {
      const fc = season.events.foehn;
      if (fc.monthLimit.includes(month) && chance(fc.chance)) {
        events.push({
          type: 'foehn',
          name: 'フェーン現象',
          emoji: '🏜️',
          severity: randomRange(0.6, 1.0),
          message: '🏜️ フェーン現象発生！異常高温と乾燥した強風により、土壌水分が一気に蒸発します！',
        });
      }
    }

    // Heavy Rain (梅雨末期の豪雨・線状降水帯)
    if (season.events.heavy_rain) {
      const hr = season.events.heavy_rain;
      if (hr.monthLimit.includes(month) && chance(hr.chance) && weatherType === 'heavyRain') {
        events.push({
          type: 'heavy_rain',
          name: '豪雨・線状降水帯',
          emoji: '🌧️',
          severity: randomRange(0.7, 1.0),
          message: '🌧️ 線状降水帯が発生！極端な豪雨により、根腐れや浸水の危険があります！',
        });
      }
    }

    // Heavy Snow (豪雪)
    if (season.events.heavy_snow) {
      const hs = season.events.heavy_snow;
      if (hs.monthLimit.includes(month) && chance(hs.chance) && weatherType === 'snow') {
        events.push({
          type: 'heavy_snow',
          name: '豪雪',
          emoji: '⛄',
          severity: randomRange(0.8, 1.0),
          message: '⛄ 北陸特有のドカ雪（豪雪）です！成長が完全に停止し、防風設備が破損する恐れがあります！',
        });
      }
    }

    // Long rain
    if (season.events.longRain) {
      const lr = season.events.longRain;
      if (lr.monthLimit.includes(month) && chance(lr.chance)) {
        events.push({
          type: 'longRain',
          name: '長雨',
          emoji: '🌧️',
          severity: randomRange(0.2, 0.5),
          message: '🌧️ 長雨が続いています。病害のリスクが上昇中。',
        });
      }
    }

    return events;
  }

  // --- Advance to a new day ---
  advanceDay(dayOfYear, year) {
    this.currentWeather = this.generateWeather(dayOfYear, year);
    this.history.push({ ...this.currentWeather });
    if (this.history.length > 30) this.history.shift();

    // Generate forecast
    this.forecast = [];
    for (let i = 1; i <= 5; i++) {
      let fd = dayOfYear + i;
      let fy = year;
      if (fd > 360) { fd -= 360; fy++; }
      this.forecast.push(this.generateWeather(fd, fy));
    }

    this.activeEvents = this.currentWeather.events;
    return this.currentWeather;
  }

  getCurrentWeather() {
    return this.currentWeather;
  }

  getForecast() {
    return this.forecast;
  }

  getActiveEvents() {
    return this.activeEvents;
  }

  // --- Serialize ---
  toJSON() {
    return {
      currentWeather: this.currentWeather,
      forecast: this.forecast,
      history: this.history,
    };
  }

  fromJSON(data) {
    this.currentWeather = data.currentWeather;
    this.forecast = data.forecast;
    this.history = data.history || [];
  }
}
