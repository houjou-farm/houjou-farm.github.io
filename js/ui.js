// ======================================================
// ui.js - UI Manager
// ======================================================
class UIManager {
  constructor(game) {
    this.game = game;
    this.selectedPlot = null;
    this.notifications = [];
    this.bindEvents();
  }

  bindEvents() {
    // Farm grid clicks
    document.getElementById('farm-grid').addEventListener('click', (e) => {
      const plot = e.target.closest('.plot-cell');
      if (plot) this.selectPlot(parseInt(plot.dataset.plotId));
    });

    // Action buttons
    document.getElementById('btn-next-day').addEventListener('click', () => this.game.nextDay());
    document.getElementById('btn-next-week').addEventListener('click', () => this.game.nextWeek());
    document.getElementById('btn-shop').addEventListener('click', () => this.showShopModal());
    document.getElementById('btn-irrigate').addEventListener('click', () => this.game.performAction('irrigate', this.selectedPlot));
    document.getElementById('btn-fertilize-n').addEventListener('click', () => this.game.performAction('fertilizer_n', this.selectedPlot));
    document.getElementById('btn-fertilize-p').addEventListener('click', () => this.game.performAction('fertilizer_p', this.selectedPlot));
    document.getElementById('btn-fertilize-k').addEventListener('click', () => this.game.performAction('fertilizer_k', this.selectedPlot));
    document.getElementById('btn-compost').addEventListener('click', () => this.game.performAction('compost', this.selectedPlot));
    document.getElementById('btn-lime').addEventListener('click', () => this.game.performAction('lime', this.selectedPlot));
    document.getElementById('btn-pesticide').addEventListener('click', () => this.game.performAction('pesticide', this.selectedPlot));
    document.getElementById('btn-weed').addEventListener('click', () => this.game.performAction('weed', this.selectedPlot));
    document.getElementById('btn-mulch').addEventListener('click', () => this.game.performAction('mulch', this.selectedPlot));
    document.getElementById('btn-windbreak').addEventListener('click', () => this.game.performAction('windbreak', this.selectedPlot));
    document.getElementById('btn-harvest').addEventListener('click', () => this.game.performAction('harvest', this.selectedPlot));
    document.getElementById('btn-plant').addEventListener('click', () => this.showPlantModal());
    document.getElementById('btn-analyze').addEventListener('click', () => this.showAnalysisModal());

    // Modal close
    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', () => this.hideModals());
    });
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) this.hideModals();
      });
    });

    // Save/Load
    document.getElementById('btn-save')?.addEventListener('click', () => this.game.save());
    document.getElementById('btn-load')?.addEventListener('click', () => this.game.load());

    // Subsidy
    document.getElementById('btn-subsidy')?.addEventListener('click', () => this.showSubsidyModal());
    document.getElementById('btn-submit-subsidy')?.addEventListener('click', () => this.handleSubsidySubmit());

    // Loan
    document.getElementById('btn-loan')?.addEventListener('click', () => this.showLoanModal());
    document.getElementById('btn-consult-loan')?.addEventListener('click', () => this.handleLoanConsult());
    document.getElementById('btn-submit-loan')?.addEventListener('click', () => this.handleLoanSubmit());

    // HR
    document.getElementById('btn-hr')?.addEventListener('click', () => this.showHRModal());
    document.getElementById('btn-post-part')?.addEventListener('click', () => this.handlePostJob('part'));
    document.getElementById('btn-post-full')?.addEventListener('click', () => this.handlePostJob('full'));
  }

  selectPlot(plotId) {
    if (plotId === null || plotId === undefined) return;
    this.selectedPlot = plotId;
    document.querySelectorAll('.plot-cell').forEach(cell => {
      cell.classList.toggle('selected', parseInt(cell.dataset.plotId) === plotId);
    });
    this.updateInfoPanel();
    this.updateActionButtons();
  }

  // === RENDER ALL ===
  render() {
    this.updateHeader();
    this.updateWeatherPanel();
    this.updateFarmGrid();
    if (this.selectedPlot !== null) {
      this.updateInfoPanel();
      this.updateActionButtons();
    }
  }

  // === HEADER ===
  updateHeader() {
    const w = this.game.weather.getCurrentWeather();
    if (!w) return;
    const season = SEASONS[w.season];
    document.getElementById('header-date').textContent = `${w.year}年目 ${MONTH_NAMES[w.month]} ${w.day}日`;
    document.getElementById('header-season').textContent = `${season.emoji} ${season.name}`;
    document.getElementById('header-weather').textContent = `${w.emoji} ${w.typeName}`;
    document.getElementById('header-temp').textContent = `🌡️ ${w.tempMin}°C〜${w.tempMax}°C`;
    document.getElementById('header-money').textContent = formatMoney(this.game.economy.getMoney());
    // Character badge
    const charBadge = document.getElementById('header-character');
    if (charBadge && this.game.character) {
      if (this.game.character.portraitImg) {
        charBadge.innerHTML = `<img src="${this.game.character.portraitImg}" style="width:24px;height:24px;border-radius:50%;object-fit:cover;vertical-align:middle;margin-right:6px;border:1px solid var(--accent-gold);"> ${this.game.character.name}`;
      } else {
        charBadge.innerHTML = `${this.game.character.emoji} ${this.game.character.name}`;
      }
      charBadge.style.display = 'flex';
    }
  }

  // === WEATHER PANEL ===
  updateWeatherPanel() {
    const w = this.game.weather.getCurrentWeather();
    if (!w) return;

    document.getElementById('weather-detail').innerHTML = `
      <div class="weather-current">
        <div class="weather-icon-large">${w.emoji}</div>
        <div class="weather-name">${w.typeName}</div>
        <div class="weather-temps">${w.tempMin}°C 〜 ${w.tempMax}°C</div>
      </div>
      <div class="weather-stats">
        <div class="stat-row"><span>💧 湿度</span><span>${w.humidity}%</span></div>
        <div class="stat-row"><span>🌧️ 降水量</span><span>${w.rainfall}mm</span></div>
        <div class="stat-row"><span>☀️ 日照</span><span>${w.sunshine}h</span></div>
        <div class="stat-row"><span>💨 風速</span><span>${w.windSpeed}m/s</span></div>
      </div>
    `;

    // Events
    const eventsEl = document.getElementById('weather-events');
    if (w.events && w.events.length > 0) {
      eventsEl.innerHTML = w.events.map(e =>
        `<div class="event-alert">${e.emoji} ${e.message}</div>`
      ).join('');
      eventsEl.style.display = 'block';
    } else {
      eventsEl.style.display = 'none';
    }

    // Forecast
    const forecast = this.game.weather.getForecast();
    document.getElementById('weather-forecast').innerHTML = forecast.map(f =>
      `<div class="forecast-day">
        <div class="forecast-date">${f.day}日</div>
        <div class="forecast-icon">${f.emoji}</div>
        <div class="forecast-temp">${f.tempMin}°〜${f.tempMax}°</div>
      </div>`
    ).join('');
  }

  // === FARM GRID ===
  updateFarmGrid() {
    const grid = document.getElementById('farm-grid');
    let html = '';
    for (let i = 0; i < 9; i++) {
      const crop = this.game.crops.getCrop(i);
      const soil = this.game.soil.getSoil(i);
      const selected = this.selectedPlot === i ? 'selected' : '';
      const harvestable = this.game.crops.isHarvestable(i) ? 'harvestable' : '';
      const plotState = this.game.plotStates[i] || {};

      let cropContent = '';
      let stageBar = '';
      let statusIcons = '';

      if (crop) {
        const cropDef = CROPS[crop.type];
        const stage = cropDef.stages[crop.stageIndex];
        const scale = stage.scale;
        const healthColor = crop.health > 70 ? '#48bb78' : crop.health > 40 ? '#fbbf24' : '#f56565';

        cropContent = `<div class="crop-emoji" style="transform:scale(${scale})">${stage.emoji}</div>
          <div class="crop-name">${cropDef.name}</div>`;
        stageBar = `<div class="growth-bar"><div class="growth-fill" style="width:${crop.growthPercent}%;background:${healthColor}"></div></div>
          <div class="growth-label">${stage.name} ${Math.floor(crop.growthPercent)}%</div>`;

        if (plotState.mulched) statusIcons += '<span title="マルチ">🛡️</span>';
        if (plotState.windbreak) statusIcons += '<span title="防風">🏗️</span>';
        if (crop.isPesticide) statusIcons += '<span title="農薬">🐛</span>';
        if (!crop.isWeeded) statusIcons += '<span title="雑草" class="warning-icon">🌿</span>';
      } else {
        cropContent = `<div class="empty-plot">空き地</div>`;
      }

      // Moisture indicator
      const moistColor = soil.moisture > 70 ? '#60a5fa' : soil.moisture > 40 ? '#48bb78' : '#f59e0b';

      // Farmland Texture
      const flType = this.game.farmlandType || 'field';
      const textureImg = FARMLAND_TYPES[flType]?.textureImg || '';

      html += `<div class="plot-cell ${selected} ${harvestable}" data-plot-id="${i}" style="background-image: url('${textureImg}');">
        <div class="plot-header">
          <span class="plot-id">区画${i + 1}</span>
          <span class="plot-moisture" style="color:${moistColor}; font-weight: bold; text-shadow: 0 1px 2px rgba(0,0,0,0.8);">💧${Math.round(soil.moisture)}%</span>
        </div>
        <div class="plot-content">${cropContent}</div>
        ${stageBar}
        <div class="plot-status">${statusIcons}</div>
      </div>`;
    }
    grid.innerHTML = html;
  }

  // === INFO PANEL ===
  updateInfoPanel() {
    const plotId = this.selectedPlot;
    if (plotId === null) {
      document.getElementById('info-panel-content').innerHTML = '<p class="hint">区画を選択してください</p>';
      return;
    }

    const soil = this.game.soil.getSoil(plotId);
    const crop = this.game.crops.getCrop(plotId);
    const analysis = this.game.soil.analyze(plotId, crop?.type);

    let html = `<h3>📍 区画${plotId + 1} 土壌情報</h3>`;
    html += `<div class="soil-grid">
      ${this.soilRow('pH', soil.pH.toFixed(1), analysis.scores.pH)}
      ${this.soilRow('窒素(N)', Math.round(soil.N), analysis.scores.N)}
      ${this.soilRow('リン酸(P)', Math.round(soil.P), analysis.scores.P)}
      ${this.soilRow('カリウム(K)', Math.round(soil.K), analysis.scores.K)}
      ${this.soilRow('有機物', Math.round(soil.organic) + '%', analysis.scores.organic)}
      ${this.soilRow('水分', Math.round(soil.moisture) + '%', analysis.scores.moisture)}
      ${this.soilRow('EC', soil.ec.toFixed(1) + ' dS/m', analysis.scores.ec)}
      ${this.soilRow('地温', Math.round(soil.temperature) + '°C', null)}
    </div>`;

    // Soil texture
    html += `<div class="texture-info">
      <h4>土壌テクスチャ</h4>
      <div class="texture-bars">
        <div class="tex-row"><span>粘土</span><div class="tex-bar"><div class="tex-fill clay" style="width:${soil.clay}%"></div></div><span>${Math.round(soil.clay)}%</span></div>
        <div class="tex-row"><span>シルト</span><div class="tex-bar"><div class="tex-fill silt" style="width:${soil.silt}%"></div></div><span>${Math.round(soil.silt)}%</span></div>
        <div class="tex-row"><span>砂</span><div class="tex-bar"><div class="tex-fill sand" style="width:${soil.sand}%"></div></div><span>${Math.round(soil.sand)}%</span></div>
      </div>
    </div>`;

    // Crop info
    if (crop) {
      const cropDef = CROPS[crop.type];
      const stage = cropDef.stages[crop.stageIndex];
      const w = this.game.weather.getCurrentWeather();
      const factors = this.game.crops.getGrowthFactors(plotId, soil, w);

      html += `<div class="crop-info-panel">
        <h3>${cropDef.emoji} ${cropDef.name}</h3>
        <div class="crop-stats">
          <div class="stat-row"><span>成長段階</span><span>${stage.name}</span></div>
          <div class="stat-row"><span>成長率</span><span>${Math.floor(crop.growthPercent)}%</span></div>
          <div class="stat-row"><span>健康度</span><span style="color:${crop.health>70?'#48bb78':crop.health>40?'#fbbf24':'#f56565'}">${Math.round(crop.health)}%</span></div>
          <div class="stat-row"><span>栽培日数</span><span>${crop.daysSincePlanted}日</span></div>
          <div class="stat-row"><span>病害リスク</span><span>${Math.round(crop.diseaseRisk)}%</span></div>
          <div class="stat-row"><span>害虫リスク</span><span>${Math.round(crop.pestRisk)}%</span></div>
        </div>
        <h4>成長因子</h4>
        <div class="factor-list">
          ${factors.map(f => `<div class="factor-row">
            <span>${f.name}</span>
            <div class="factor-bar"><div class="factor-fill" style="width:${f.value*100}%;background:${f.value>0.7?'#48bb78':f.value>0.4?'#fbbf24':'#f56565'}"></div></div>
            <span>${Math.round(f.value*100)}%</span>
          </div>`).join('')}
        </div>
      </div>`;
    }

    // Recommendations
    if (analysis.recommendations.length > 0) {
      html += `<div class="recommendations"><h4>💡 アドバイス</h4>
        ${analysis.recommendations.map(r => `<div class="rec-item">${r}</div>`).join('')}
      </div>`;
    }

    document.getElementById('info-panel-content').innerHTML = html;

    // Draw radar chart
    this.drawRadarChart(soil);
  }

  soilRow(label, value, score) {
    const statusClass = score ? `status-${score.status}` : '';
    const statusLabel = score ? score.label : '';
    return `<div class="soil-row">
      <span class="soil-label">${label}</span>
      <span class="soil-value">${value}</span>
      <span class="soil-status ${statusClass}">${statusLabel}</span>
    </div>`;
  }

  // === RADAR CHART ===
  drawRadarChart(soil) {
    const canvas = document.getElementById('radar-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width = 220;
    const h = canvas.height = 220;
    const cx = w / 2, cy = h / 2, r = 80;

    ctx.clearRect(0, 0, w, h);

    const labels = ['pH', 'N', 'P', 'K', '有機', '水分'];
    const values = [
      soil.pH / 9,
      soil.N / 100,
      soil.P / 100,
      soil.K / 100,
      soil.organic / 100,
      soil.moisture / 100,
    ];
    const n = labels.length;

    // Draw grid
    for (let level = 1; level <= 4; level++) {
      ctx.beginPath();
      const lr = r * level / 4;
      for (let i = 0; i <= n; i++) {
        const angle = (Math.PI * 2 * i / n) - Math.PI / 2;
        const x = cx + lr * Math.cos(angle);
        const y = cy + lr * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.stroke();
    }

    // Draw axes
    for (let i = 0; i < n; i++) {
      const angle = (Math.PI * 2 * i / n) - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.stroke();

      // Labels
      const lx = cx + (r + 18) * Math.cos(angle);
      const ly = cy + (r + 18) * Math.sin(angle);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px "Noto Sans JP", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(labels[i], lx, ly);
    }

    // Draw data
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const idx = i % n;
      const angle = (Math.PI * 2 * idx / n) - Math.PI / 2;
      const v = Math.min(1, values[idx]);
      const x = cx + r * v * Math.cos(angle);
      const y = cy + r * v * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(52, 211, 153, 0.25)';
    ctx.fill();
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw data points
    for (let i = 0; i < n; i++) {
      const angle = (Math.PI * 2 * i / n) - Math.PI / 2;
      const v = Math.min(1, values[i]);
      const x = cx + r * v * Math.cos(angle);
      const y = cy + r * v * Math.sin(angle);
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#34d399';
      ctx.fill();
    }
  }

  // === ACTION BUTTONS ===
  updateActionButtons() {
    const p = this.selectedPlot;
    const hasCrop = p !== null && this.game.crops.hasCrop(p);
    const canHarvest = p !== null && this.game.crops.isHarvestable(p);

    document.getElementById('btn-plant').disabled = p === null || hasCrop;
    document.getElementById('btn-harvest').disabled = !canHarvest;
    document.getElementById('btn-irrigate').disabled = p === null;
    document.getElementById('btn-weed').disabled = !hasCrop;
    document.getElementById('btn-analyze').disabled = p === null;

    const moneyActions = ['btn-fertilize-n', 'btn-fertilize-p', 'btn-fertilize-k', 'btn-compost', 'btn-lime', 'btn-pesticide', 'btn-mulch', 'btn-windbreak'];
    moneyActions.forEach(id => {
      document.getElementById(id).disabled = p === null;
    });
  }

  // === MODALS ===
  showPlantModal() {
    if (this.selectedPlot === null) return;
    const modal = document.getElementById('plant-modal');
    const w = this.game.weather.getCurrentWeather();
    const month = w ? w.month : 4;

    let html = '<div class="crop-grid">';
    for (const [key, crop] of Object.entries(CROPS)) {
      const canPlant = crop.plantingMonths.includes(month);
      const compat = this.game.soil.calcCompatibility(this.selectedPlot, key);
      const compatPct = Math.round(compat * 100);
      const compatColor = compat > 0.7 ? '#48bb78' : compat > 0.4 ? '#fbbf24' : '#f56565';
      const costOk = this.game.economy.canAfford(crop.seedCost);

      html += `<div class="crop-card ${!canPlant || !costOk ? 'disabled' : ''}" data-crop="${key}">
        <div class="crop-card-emoji">${crop.emoji}</div>
        <div class="crop-card-name">${crop.name}</div>
        <div class="crop-card-cat">${crop.category}</div>
        <div class="crop-card-info">
          <span>種代: ${formatMoney(crop.seedCost)}</span>
          <span>成長: ${crop.growthDays}日</span>
        </div>
        <div class="crop-card-compat" style="color:${compatColor}">適合度: ${compatPct}%</div>
        <div class="crop-card-difficulty">${'★'.repeat(crop.difficulty)}${'☆'.repeat(3-crop.difficulty)}</div>
        ${!canPlant ? '<div class="crop-card-warn">⚠ 播種期外</div>' : ''}
        ${!costOk ? '<div class="crop-card-warn">⚠ 資金不足</div>' : ''}
        <div class="crop-card-desc">${crop.description}</div>
      </div>`;
    }
    html += '</div>';

    document.getElementById('plant-modal-content').innerHTML = html;
    modal.classList.add('active');

    // Bind crop card clicks
    modal.querySelectorAll('.crop-card:not(.disabled)').forEach(card => {
      card.addEventListener('click', () => {
        const cropType = card.dataset.crop;
        this.game.performAction('plant', this.selectedPlot, cropType);
        this.hideModals();
      });
    });
  }

  showShopModal() {
    const modal = document.getElementById('shop-modal');
    let html = '<div class="shop-section"><h3>🏪 市場価格</h3><div class="market-grid">';
    for (const [key, crop] of Object.entries(CROPS)) {
      const price = this.game.economy.getMarketPrice(key);
      const history = this.game.economy.getPriceHistory(key);
      const prevPrice = history.length > 1 ? history[history.length - 2] : crop.basePrice;
      const diff = price - prevPrice;
      const baseDiff = price - crop.basePrice;
      const sign = diff > 0 ? '🔺' : diff < 0 ? '🔻' : '➖';
      const diffColor = diff > 0 ? '#48bb78' : diff < 0 ? '#f56565' : '#94a3b8';
      
      let priceLabel = `${formatMoney(price)}/kg`;
      if (baseDiff > crop.basePrice * 0.5) priceLabel += ' 🔥高騰!';
      else if (baseDiff < -crop.basePrice * 0.3) priceLabel += ' 🥶暴落';

      html += `<div class="market-row">
        <span>${crop.emoji} ${crop.name}</span>
        <span>${priceLabel}</span>
        <span style="color:${diffColor}; font-weight:bold;">${sign} ${diff > 0 ? '+' : ''}${diff}</span>
      </div>`;
    }
    html += '</div></div>';

    // Stats
    const stats = this.game.economy.getStats();
    html += `<div class="shop-section"><h3>📊 経営実績</h3>
      <div class="stats-grid">
        <div class="stat-row"><span>総収入</span><span style="color:#48bb78">${formatMoney(stats.totalEarned)}</span></div>
        <div class="stat-row"><span>総支出</span><span style="color:#f56565">${formatMoney(stats.totalSpent)}</span></div>
        <div class="stat-row"><span>利益</span><span style="color:${stats.profit>=0?'#48bb78':'#f56565'}">${formatMoney(stats.profit)}</span></div>
        <div class="stat-row"><span>収穫回数</span><span>${stats.harvestCount}回</span></div>
      </div>
    </div>`;

    document.getElementById('shop-modal-content').innerHTML = html;
    modal.classList.add('active');
  }

  showAnalysisModal() {
    if (this.selectedPlot === null) return;
    const modal = document.getElementById('analysis-modal');
    const soil = this.game.soil.getSoil(this.selectedPlot);
    const analysis = this.game.soil.analyze(this.selectedPlot);

    let html = `<h3>🔬 区画${this.selectedPlot + 1} 詳細土壌分析</h3>`;
    html += '<div class="analysis-compat"><h4>作物適合度</h4><div class="compat-grid">';
    for (const [key, crop] of Object.entries(CROPS)) {
      const score = this.game.soil.calcCompatibility(this.selectedPlot, key);
      const pct = Math.round(score * 100);
      const color = score > 0.7 ? '#48bb78' : score > 0.4 ? '#fbbf24' : '#f56565';
      html += `<div class="compat-row">
        <span>${crop.emoji} ${crop.name}</span>
        <div class="compat-bar"><div class="compat-fill" style="width:${pct}%;background:${color}"></div></div>
        <span style="color:${color}">${pct}%</span>
      </div>`;
    }
    html += '</div></div>';
    html += `<div class="analysis-recs"><h4>💡 改善提案</h4>
      ${analysis.recommendations.map(r => `<div class="rec-item">${r}</div>`).join('')}
    </div>`;

    document.getElementById('analysis-modal-content').innerHTML = html;
    modal.classList.add('active');
  }

  showHarvestModal(result, saleResult) {
    const modal = document.getElementById('harvest-modal');
    const html = `
      <div class="harvest-result">
        <div class="harvest-emoji">${result.emoji}</div>
        <h3>🎉 ${result.cropName}を収穫しました！</h3>
        <div class="harvest-grade" style="color:${result.gradeInfo.color}">
          ${result.gradeInfo.emoji} ${result.gradeInfo.name}
        </div>
        <div class="harvest-stats">
          <div class="stat-row"><span>収量</span><span>${result.yieldKg} kg</span></div>
          <div class="stat-row"><span>品質スコア</span><span>${result.quality}%</span></div>
          <div class="stat-row"><span>栽培日数</span><span>${result.daysGrown}日</span></div>
          <div class="stat-row"><span>市場単価</span><span>${formatMoney(saleResult.unitPrice)}/kg</span></div>
          <div class="stat-row"><span>品質倍率</span><span>×${saleResult.qualityMult}</span></div>
        </div>
        <div class="harvest-revenue">売上: <strong style="color:#fbbf24">${formatMoney(saleResult.revenue)}</strong></div>
      </div>`;
    document.getElementById('harvest-modal-content').innerHTML = html;
    modal.classList.add('active');
  }

  hideModals() {
    document.querySelectorAll('.modal-overlay').forEach(modal => {
      modal.classList.remove('active');
    });
  }

  // === SUBSIDY SYSTEM ===
  showSubsidyModal() {
    if (!this.game.subsidy.canApply(this.game.year)) {
      this.showNotification('⚠️ 補助金の申請は1年に1回までです。来年また申請してください。', 'warning');
      return;
    }

    const modal = document.getElementById('subsidy-modal');
    const container = document.getElementById('subsidy-crops-container');
    
    // Generate crop checkboxes
    let html = '';
    for (const [key, crop] of Object.entries(CROPS)) {
      html += `
        <label>
          <input type="checkbox" name="subsidy-crop" value="${key}">
          ${crop.emoji} ${crop.name}
        </label>
      `;
    }
    container.innerHTML = html;

    // Reset form
    document.getElementById('subsidy-amount').value = '';
    document.getElementById('subsidy-appeal').value = '';
    document.getElementById('ai-judging-overlay').style.display = 'none';

    modal.classList.add('active');
  }

  handleSubsidySubmit() {
    const category = document.getElementById('subsidy-category').value;
    const amountStr = document.getElementById('subsidy-amount').value;
    const appeal = document.getElementById('subsidy-appeal').value;

    const cropCheckboxes = document.querySelectorAll('input[name="subsidy-crop"]:checked');
    const crops = Array.from(cropCheckboxes).map(cb => cb.value);

    const amount = parseInt(amountStr);
    if (isNaN(amount) || amount <= 0) {
      this.showNotification('⚠️ 希望金額を正しく入力してください', 'warning');
      return;
    }

    const applicationData = { category, amount, crops, appeal };

    // Show AI Spinner
    const overlay = document.getElementById('ai-judging-overlay');
    overlay.style.display = 'flex';

    // Simulate AI processing delay
    setTimeout(() => {
      overlay.style.display = 'none';
      this.hideModals();
      const result = this.game.submitSubsidyApplication(applicationData);
      this.showSubsidyResultModal(result);
    }, 2000);
  }

  showSubsidyResultModal(result) {
    const modal = document.getElementById('subsidy-result-modal');
    const content = document.getElementById('subsidy-result-content');
    
    const resultClass = result.passed ? 'passed' : 'rejected';
    
    content.innerHTML = `
      <div class="subsidy-result-box ${resultClass}">
        ${result.advice}
      </div>
    `;
    
    modal.classList.add('active');
  }

  // === LOAN SYSTEM ===
  showLoanModal() {
    const modal = document.getElementById('loan-modal');
    
    // Reset form
    document.getElementById('loan-amount').value = '';
    document.getElementById('loan-appeal').value = '';
    document.getElementById('ai-judging-overlay-loan').style.display = 'none';
    
    const consultResult = document.getElementById('loan-consult-result');
    consultResult.style.display = 'none';
    consultResult.innerHTML = '';

    modal.classList.add('active');
  }

  handleLoanConsult() {
    const resultBox = document.getElementById('loan-consult-result');
    resultBox.style.display = 'block';
    resultBox.innerHTML = '<div class="ai-spinner" style="font-size:2rem; margin:10px 0;">🤖</div> <p>分析中...</p>';
    
    setTimeout(() => {
      const advice = this.game.loan.getConsultation(this.game);
      resultBox.innerHTML = advice.replace(/\n/g, '<br>');
    }, 1000);
  }

  handleLoanSubmit() {
    const typeId = document.getElementById('loan-type').value;
    const amountStr = document.getElementById('loan-amount').value;
    const yearsStr = document.getElementById('loan-years').value;
    const appeal = document.getElementById('loan-appeal').value;

    const amount = parseInt(amountStr);
    const years = parseInt(yearsStr);

    if (isNaN(amount) || amount <= 0) {
      this.showNotification('⚠️ 希望金額を正しく入力してください', 'warning');
      return;
    }

    const applicationData = { typeId, amount, years, appeal };

    // Show AI Spinner
    const overlay = document.getElementById('ai-judging-overlay-loan');
    overlay.style.display = 'flex';

    // Simulate AI processing delay
    setTimeout(() => {
      overlay.style.display = 'none';
      this.hideModals();
      const result = this.game.submitLoanApplication(applicationData);
      this.showLoanResultModal(result);
    }, 2500);
  }

  showLoanResultModal(result) {
    const modal = document.getElementById('loan-result-modal');
    const content = document.getElementById('loan-result-content');
    
    const resultClass = result.passed ? 'passed' : 'rejected';
    
    content.innerHTML = `
      <div class="subsidy-result-box ${resultClass}">
        ${result.advice.replace(/\n/g, '<br>')}
      </div>
    `;
    
    modal.classList.add('active');
  }

  // === HR MODAL ===
  showHRModal() {
    const modal = document.getElementById('hr-modal');
    const candidatesList = document.getElementById('hr-candidates-list');
    const employeesList = document.getElementById('hr-employees-list');
    
    // Render Candidates
    if (this.game.hr.candidates.length === 0) {
      candidatesList.innerHTML = `<p class="hint">現在、面接待ちの候補者はいません。</p>`;
    } else {
      candidatesList.innerHTML = this.game.hr.candidates.map(c => `
        <div style="background:rgba(255,255,255,0.05); padding:12px; border-radius:8px; display:flex; justify-content:space-between; align-items:center;">
          <div>
            <div style="font-size:1.2rem; font-weight:bold;">${c.emoji} ${c.name} <span style="font-size:0.8rem; background:rgba(96,165,250,0.2); padding:2px 6px; border-radius:4px; color:#60a5fa;">${c.typeName}</span></div>
            <div style="font-size:0.8rem; color:var(--text-secondary); margin-top:4px;">
              スキルレベル: ${c.skill} / 希望年収: ${formatMoney(c.yearlySalary)}
            </div>
          </div>
          <button class="action-btn primary" onclick="window.game.ui.handleHire(${c.id})">採用する</button>
        </div>
      `).join('');
    }

    // Render Employees
    if (this.game.hr.employees.length === 0) {
      employeesList.innerHTML = `<p class="hint">現在、雇用している従業員はいません。</p>`;
    } else {
      employeesList.innerHTML = this.game.hr.employees.map(e => `
        <div style="background:rgba(255,255,255,0.05); padding:12px; border-radius:8px; display:flex; justify-content:space-between; align-items:center;">
          <div>
            <div style="font-size:1.1rem; font-weight:bold;">${e.emoji} ${e.name} <span style="font-size:0.8rem; background:rgba(52,211,153,0.2); padding:2px 6px; border-radius:4px; color:#34d399;">${e.typeName}</span></div>
            <div style="font-size:0.8rem; color:var(--text-secondary); margin-top:4px;">
              年収: ${formatMoney(e.yearlySalary)}
            </div>
          </div>
          <button class="action-btn" style="border-color:var(--accent-red); color:var(--accent-red);" onclick="window.game.ui.handleFire(${e.id})">解雇</button>
        </div>
      `).join('');
    }
    
    // Disable post buttons if already active
    const btnPart = document.getElementById('btn-post-part');
    const btnFull = document.getElementById('btn-post-full');
    if (this.game.hr.jobPosting.active) {
      btnPart.disabled = true;
      btnFull.disabled = true;
      btnPart.innerHTML = `⏳ 掲載中（残り${this.game.hr.jobPosting.daysLeft}日）`;
      btnFull.innerHTML = `⏳ 掲載中（残り${this.game.hr.jobPosting.daysLeft}日）`;
    } else {
      btnPart.disabled = false;
      btnFull.disabled = false;
      btnPart.innerHTML = `🧹 パート求人を出す`;
      btnFull.innerHTML = `🚜 正社員求人を出す`;
    }

    modal.classList.add('active');
  }

  handlePostJob(type) {
    if (this.game.hr.postJob(this.game, type)) {
      this.showHRModal();
      this.updateHeader();
    }
  }

  handleHire(candidateId) {
    if (this.game.hr.hire(this.game, candidateId)) {
      this.showHRModal();
    }
  }

  handleFire(employeeId) {
    if (confirm('本当に解雇しますか？')) {
      if (this.game.hr.fire(this.game, employeeId)) {
        this.showHRModal();
      }
    }
  }

  // === EVENT LOG ===
  addLog(message, type = 'info') {
    const log = document.getElementById('event-log');
    const entry = document.createElement('div');
    entry.className = `log-entry log-${type}`;
    entry.textContent = message;
    log.prepend(entry);
    if (log.children.length > 50) log.removeChild(log.lastChild);
  }

  // === NOTIFICATION ===
  showNotification(message, type = 'info') {
    const container = document.getElementById('notifications');
    const notif = document.createElement('div');
    notif.className = `notification notif-${type}`;
    notif.textContent = message;
    container.appendChild(notif);
    setTimeout(() => notif.classList.add('show'), 10);
    setTimeout(() => {
      notif.classList.remove('show');
      setTimeout(() => notif.remove(), 300);
    }, 3500);
  }

  // === CHARACTER SELECT SCREEN ===
  showCharacterSelect() {
    document.getElementById('app').style.display = 'none';
    const overlay = document.getElementById('char-select-overlay');
    overlay.classList.add('active');

    const skillLabels = {
      stamina: '体力', knowledge: '知識', technique: '技術',
      sensitivity: '感性', management: '経営', luck: '幸運'
    };
    const skillEmojis = {
      stamina: '💪', knowledge: '🧠', technique: '🔧',
      sensitivity: '🌸', management: '📊', luck: '🍀'
    };
    const bonusLabels = {
      irrigateBonus: '灌漑効果', fertilizerBonus: '施肥効果', qualityBonus: '品質',
      yieldBonus: '収量', sellBonus: '売値', costDiscount: 'コスト',
      weatherResist: '天候耐性', diseaseResist: '病害耐性', growthBonus: '成長速度'
    };

    const chars = Object.values(CHARACTERS);
    const maleChars = chars.filter(c => c.gender === 'male');
    const femaleChars = chars.filter(c => c.gender === 'female');

    let html = `<div class="cs-title">🌾 豊穣の大地</div>
      <div class="cs-subtitle">キャラクターを選択してください</div>
      <div class="cs-gender-tabs">
        <button class="cs-tab active" data-gender="male">👨 男性キャラクター</button>
        <button class="cs-tab" data-gender="female">👩 女性キャラクター</button>
      </div>
      <div class="cs-cards-wrapper">
        <div class="cs-cards" id="cs-male-cards">${this._renderCharCards(maleChars, skillLabels, skillEmojis, bonusLabels)}</div>
        <div class="cs-cards" id="cs-female-cards" style="display:none">${this._renderCharCards(femaleChars, skillLabels, skillEmojis, bonusLabels)}</div>
      </div>`;

    overlay.innerHTML = html;

    // Tab switching
    overlay.querySelectorAll('.cs-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        overlay.querySelectorAll('.cs-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const gender = tab.dataset.gender;
        document.getElementById('cs-male-cards').style.display = gender === 'male' ? 'flex' : 'none';
        document.getElementById('cs-female-cards').style.display = gender === 'female' ? 'flex' : 'none';
      });
    });

    // Card selection
    overlay.querySelectorAll('.cs-card').forEach(card => {
      card.addEventListener('click', () => {
        this.game.selectCharacter(card.dataset.charId);
      });
    });
  }

  _renderCharCards(chars, skillLabels, skillEmojis, bonusLabels) {
    return chars.map(c => {
      const skillBars = Object.entries(c.skills).map(([key, val]) =>
        `<div class="cs-skill-row">
          <span class="cs-skill-label">${skillEmojis[key]} ${skillLabels[key]}</span>
          <div class="cs-skill-bar"><div class="cs-skill-fill" style="width:${val}%;background:${val > 70 ? '#34d399' : val > 50 ? '#fbbf24' : '#94a3b8'}"></div></div>
          <span class="cs-skill-val">${val}</span>
        </div>`
      ).join('');

      const bonusTags = Object.entries(c.bonuses)
        .filter(([k, v]) => (k.includes('Resist') ? v > 0 : v !== 1.0))
        .map(([k, v]) => {
          let label = bonusLabels[k] || k;
          let display;
          if (k === 'costDiscount') {
            display = `-${Math.round((1 - v) * 100)}%`;
          } else if (k.includes('Resist')) {
            display = `+${Math.round(v * 100)}%`;
          } else {
            display = `+${Math.round((v - 1) * 100)}%`;
          }
          return `<span class="cs-bonus-tag">${label} ${display}</span>`;
        }).join('');

      const genderIcon = c.gender === 'male' ? '♂' : '♀';
      const genderClass = c.gender === 'male' ? 'cs-male' : 'cs-female';

      return `<div class="cs-card ${genderClass}" data-char-id="${c.id}" style="--card-bg:${c.bgColor}">
        <img src="${c.portraitImg}" alt="${c.name}" style="width: 120px; height: 120px; border-radius: 50%; object-fit: cover; margin: 0 auto 12px; display: block; border: 3px solid var(--accent-green); box-shadow: 0 8px 16px rgba(0,0,0,0.4);" />
        <div class="cs-card-name">${c.name}</div>
        <div class="cs-card-meta"><span class="cs-gender-badge ${genderClass}">${genderIcon} ${c.gender === 'male' ? '男性' : '女性'}</span> ${c.age}歳</div>
        <div class="cs-card-desc">${c.description}</div>
        <div class="cs-skills">${skillBars}</div>
        <div class="cs-bonuses">${bonusTags}</div>
        <button class="cs-select-btn">このキャラクターで始める</button>
      </div>`;
    }).join('');
  }

  // === MODE SELECT SCREEN ===
  showModeSelect() {
    const overlay = document.getElementById('char-select-overlay');
    const char = this.game.character;

    let html = `<div class="cs-title">💼 経営形態を選択</div>
      <div class="cs-subtitle">${char.emoji} ${char.name} — どのようなスタイルで農業を始めますか？</div>
      <div class="mode-cards">`;

    for (const [key, mode] of Object.entries(FARMING_MODES)) {
      const featureItems = mode.features.map(f => `
        <div class="mode-feature">
          <span class="mode-f-icon">${f.icon}</span>
          <div class="mode-f-text">
            <strong>${f.text}</strong>
            <small>${f.detail}</small>
          </div>
        </div>
      `).join('');

      const disItems = mode.disadvantages.map(d => `
        <div class="mode-feature negative">
          <span class="mode-f-icon">${d.icon}</span>
          <div class="mode-f-text">
            <strong>${d.text}</strong>
            <small>${d.detail}</small>
          </div>
        </div>
      `).join('');

      html += `<div class="mode-card" data-mode-id="${key}" style="background:${mode.bgGradient}; border-color:${mode.accentColor}; --mode-accent:${mode.accentColor}">
        <div class="mode-header" style="background:${mode.badgeColor}; color:${mode.accentColor}">
          <span class="mode-emoji">${mode.emoji}</span>
          <div>
            <div class="mode-title">${mode.title}</div>
            <div class="mode-name">${mode.name}</div>
          </div>
        </div>
        <div class="mode-desc">${mode.description}</div>
        <div class="mode-section-title" style="color:${mode.accentColor}">✨ メリット</div>
        <div class="mode-features-list">${featureItems}</div>
        <div class="mode-section-title" style="color:#ef4444; margin-top:12px;">⚠️ デメリット</div>
        <div class="mode-features-list">${disItems}</div>
        <button class="mode-select-btn" style="background:${mode.badgeColor}; color:${mode.accentColor}; border-color:${mode.accentColor}">
          この形態で始める
        </button>
      </div>`;
    }

    html += '</div>';
    overlay.innerHTML = html;

    overlay.querySelectorAll('.mode-card').forEach(card => {
      card.addEventListener('click', () => {
        this.game.selectMode(card.dataset.modeId);
      });
    });
  }

  // === AREA SELECT SCREEN ===
  showAreaSelect() {
    const overlay = document.getElementById('char-select-overlay');
    const char = this.game.character;

    let html = `<div class="cs-title">📍 射水市の地区を選択</div>
      <div class="cs-subtitle">${char.emoji} ${char.name} — 営農する地区を選んでください</div>
      <div class="fl-location-info">
        <div class="fl-loc-header">🌊 富山県射水市 - 射水平野</div>
        <div class="fl-loc-desc">庄川・神通川の沖積低地に位置する日本海側の農業地域。旧5市町村それぞれに異なる地形・土壌特性があります。</div>
        <div class="fl-climate-grid">
          <div class="fl-climate-item"><span class="fl-cl-label">🌡️ 年平均気温</span><span class="fl-cl-val">14.5°C</span></div>
          <div class="fl-climate-item"><span class="fl-cl-label">🌧️ 年間降水量</span><span class="fl-cl-val">2,185mm</span></div>
          <div class="fl-climate-item"><span class="fl-cl-label">☀️ 年間日照</span><span class="fl-cl-val">1,671h</span></div>
          <div class="fl-climate-item"><span class="fl-cl-label">❄️ 降雪期</span><span class="fl-cl-val">12〜2月</span></div>
        </div>
      </div>
      <div class="area-cards">`;

    for (const [key, area] of Object.entries(IMIZU_AREAS)) {
      const featureTags = area.features.map(f => `<span class="fl-feature-tag">${f}</span>`).join('');
      html += `<div class="area-card" data-area-id="${key}" style="--area-accent:${area.accentColor};--area-bg:${area.bgColor}">
        <div class="area-card-emoji">${area.emoji}</div>
        <div class="area-card-name">${area.name}</div>
        <div class="area-card-geo">${area.geography}｜標高 ${area.elevation}</div>
        <div class="area-card-desc">${area.description}</div>
        <div class="fl-features">${featureTags}</div>
        <button class="area-select-btn">この地区を選ぶ</button>
      </div>`;
    }

    html += '</div>';
    overlay.innerHTML = html;

    overlay.querySelectorAll('.area-card').forEach(card => {
      card.addEventListener('click', () => {
        this.game.selectArea(card.dataset.areaId);
      });
    });
  }

  // === FARMLAND SELECT SCREEN ===
  showFarmlandSelect() {
    const overlay = document.getElementById('char-select-overlay');
    const char = this.game.character;
    const areaId = this.game.areaId;
    const area = IMIZU_AREAS[areaId];

    let html = `<div class="cs-title">${area.emoji} ${area.name}の農地を選択</div>
      <div class="cs-subtitle">${char.emoji} ${char.name} — 水田か畑地を選んでください</div>
      <div class="fl-cards">`;

    for (const [flKey, fl] of Object.entries(FARMLAND_TYPES)) {
      const soilInfo = AREA_SOIL_PROFILES[areaId][flKey];
      const features = fl.features.map(f => `<span class="fl-feature-tag">${f}</span>`).join('');
      const recCrops = fl.recommended.map(r => CROPS[r] ? `${CROPS[r].emoji} ${CROPS[r].name}` : r).join('、');

      html += `<div class="fl-card" data-fl-type="${flKey}" style="--fl-bg:${area.bgColor}">
        <div class="fl-card-emoji">${fl.emoji}</div>
        <div class="fl-card-name">${area.name} ${fl.name}</div>
        <div class="fl-card-desc">${fl.baseDescription}</div>
        <div class="fl-features">${features}</div>
        <div class="fl-soil-preview">
          <h4>🧪 土壌特性</h4>
          <div class="fl-soil-grid">
            <div class="fl-soil-row"><span>pH</span><span>${soilInfo.pH}</span></div>
            <div class="fl-soil-row"><span>窒素(N)</span><span>${soilInfo.N}</span></div>
            <div class="fl-soil-row"><span>リン酸(P)</span><span>${soilInfo.P}</span></div>
            <div class="fl-soil-row"><span>カリ(K)</span><span>${soilInfo.K}</span></div>
            <div class="fl-soil-row"><span>有機物</span><span>${soilInfo.organic}%</span></div>
            <div class="fl-soil-row"><span>水分</span><span>${soilInfo.moisture}%</span></div>
          </div>
          <div class="fl-texture">粘土 ${Math.round(soilInfo.clay)}% / シルト ${Math.round(soilInfo.silt)}% / 砂 ${Math.round(soilInfo.sand)}%</div>
        </div>
        <div class="fl-rec">🌱 おすすめ: ${recCrops}</div>
        <button class="fl-select-btn">この農地で始める</button>
      </div>`;
    }

    html += '</div>';
    overlay.innerHTML = html;

    overlay.querySelectorAll('.fl-card').forEach(card => {
      card.addEventListener('click', () => {
        this.game.startGame(card.dataset.flType);
      });
    });
  }
}
