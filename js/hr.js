// ======================================================
// hr.js - Human Resources System (人材管理システム)
// ======================================================

class HRSystem {
  constructor() {
    this.employees = []; // 現在の従業員
    this.candidates = []; // 面接候補者
    this.jobPosting = {
      active: false,
      daysLeft: 0,
      type: null // 'part' or 'full'
    };
    
    this.lastEmployeeId = 0;
  }

  // --- 求人掲載 ---
  postJob(game, type) {
    if (this.jobPosting.active) {
      game.ui.showNotification('⚠️ すでに求人を掲載中です', 'warning');
      return false;
    }

    const cost = 10000; // 掲載費用 1万円
    if (!game.economy.canAfford(cost)) {
      game.ui.showNotification('⚠️ 求人掲載費用（10,000円）が不足しています', 'warning');
      return false;
    }

    game.economy.spend(cost);
    this.jobPosting.active = true;
    this.jobPosting.daysLeft = 3; // 3日後に応募者が来る
    this.jobPosting.type = type;
    
    game.ui.addLog(`📰 求人広告を掲載しました（-10,000円）。数日後に応募者が来ます。`, 'info');
    game.ui.showNotification(`求人を掲載しました`, 'info');
    return true;
  }

  // --- 日数経過時の求人処理 ---
  advanceDay(game) {
    if (this.jobPosting.active) {
      this.jobPosting.daysLeft--;
      if (this.jobPosting.daysLeft <= 0) {
        this.generateCandidates(game);
        this.jobPosting.active = false;
      }
    }
  }

  // --- 候補者の生成 ---
  generateCandidates(game) {
    const numCandidates = Math.floor(Math.random() * 3) + 1; // 1〜3人
    this.candidates = [];
    
    const names = ['佐藤', '鈴木', '高橋', '田中', '伊藤', '渡辺', '山本', '中村', '小林', '加藤'];
    const emojis = ['🧑', '👨', '👩', '👱‍♂️', '👱‍♀️', '👨‍🦱', '👩‍🦱'];

    for (let i = 0; i < numCandidates; i++) {
      const isFull = this.jobPosting.type === 'full';
      
      this.candidates.push({
        id: ++this.lastEmployeeId,
        name: names[Math.floor(Math.random() * names.length)],
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        type: isFull ? 'full' : 'part',
        typeName: isFull ? '正社員' : 'パート',
        yearlySalary: isFull ? (2000000 + Math.floor(Math.random() * 600000)) : (800000 + Math.floor(Math.random() * 300000)),
        skill: Math.floor(Math.random() * 50) + (isFull ? 40 : 10), // 10-60 or 40-90
      });
    }

    game.ui.addLog(`📩 求人に ${numCandidates} 名の応募がありました！人材管理画面を確認してください。`, 'success');
    game.ui.showNotification(`${numCandidates}名の応募者が来ました！`, 'success');
  }

  // --- 採用 ---
  hire(game, candidateId) {
    const idx = this.candidates.findIndex(c => c.id === candidateId);
    if (idx === -1) return false;
    
    const emp = this.candidates.splice(idx, 1)[0];
    this.employees.push(emp);
    
    game.ui.addLog(`🤝 ${emp.typeName}の${emp.name}さんを採用しました！`, 'success');
    game.ui.showNotification(`${emp.name}を採用しました`, 'success');
    return true;
  }

  // --- 解雇 ---
  fire(game, employeeId) {
    const idx = this.employees.findIndex(e => e.id === employeeId);
    if (idx === -1) return false;
    
    const emp = this.employees.splice(idx, 1)[0];
    game.ui.addLog(`👋 ${emp.typeName}の${emp.name}さんを解雇しました。`, 'warning');
    return true;
  }

  // --- 日々の自動タスク（草むしり、水やり等） ---
  processDailyTasks(game) {
    if (this.employees.length === 0) return;

    let hasPart = false;
    let hasFull = false;

    this.employees.forEach(e => {
      if (e.type === 'part') hasPart = true;
      if (e.type === 'full') hasFull = true;
    });

    let weedCount = 0;
    let irrigateCount = 0;
    let irrigateCostTotal = 0;
    let pesticideCount = 0;
    let pesticideCostTotal = 0;

    for (let i = 0; i < CONSTANTS.PLOT_COUNT; i++) {
      const crop = game.crops.getCrop(i);
      const soil = game.soil.getSoil(i);
      
      // パートまたは正社員がいる場合：全区画の草むしりを自動で行う
      if ((hasPart || hasFull) && crop && !crop.isWeeded) {
        crop.isWeeded = true;
        weedCount++;
      }

      // 正社員がいる場合：高度な管理を自動で行う
      if (hasFull && crop) {
        const currentMoney = game.economy.getMoney();
        
        // 資金が5万円以上ある時のみお金のかかる自動作業を行う（ストッパー機能）
        if (currentMoney - irrigateCostTotal - pesticideCostTotal > 50000) {
          
          // 水分が50%を下回っていれば自動水やり
          if (soil.moisture < 50) {
            const irrCost = Math.round(500 * game.getBonus('costDiscount') * game.getModeBonus('irrigateCostMult'));
            irrigateCostTotal += irrCost;
            game.soil.irrigate(i, game.getBonus('irrigateBonus'));
            irrigateCount++;
          }

          // 害虫リスクが40%を超え、かつまだ農薬を撒いていない場合は自動散布
          if (crop.pestRisk > 40 && !crop.isPesticide) {
            const item = ITEMS['pesticide'];
            const itemCost = Math.round(item.cost * game.getBonus('costDiscount') * game.getModeBonus('costDiscount'));
            pesticideCostTotal += itemCost;
            crop.isPesticide = true;
            crop.pestRisk = Math.max(0, crop.pestRisk - item.effects.pestControl);
            pesticideCount++;
          }
        }
      }
    }

    // 経費の引き落としとログ表示
    if (weedCount > 0) {
      game.ui.addLog(`🧹 従業員が ${weedCount} 区画の草むしりを完了しました。`, 'info');
    }

    const totalCost = irrigateCostTotal + pesticideCostTotal;
    if (totalCost > 0) {
      game.economy.spend(totalCost);
      let msg = `👨‍🌾 正社員が自動管理を実行（費用: -${formatMoney(totalCost)}）`;
      if (irrigateCount > 0) msg += ` / 水やり ${irrigateCount}区画`;
      if (pesticideCount > 0) msg += ` / 農薬散布 ${pesticideCount}区画`;
      game.ui.addLog(msg, 'info');
    }
  }

  // --- 年間給与の支払い ---
  processYearlySalary(game) {
    if (this.employees.length === 0) return true; // 支払いなし

    let totalSalary = 0;
    this.employees.forEach(e => totalSalary += e.yearlySalary);

    if (game.economy.canAfford(totalSalary)) {
      game.economy.spend(totalSalary);
      return { success: true, amount: totalSalary };
    } else {
      // 資金ショート（ゲームオーバー相当のリスク）
      game.economy.spend(totalSalary); // マイナスになる
      return { success: false, amount: totalSalary };
    }
  }

  // --- 全体ボーナスの計算 ---
  getGrowthBonus() {
    let hasFull = this.employees.some(e => e.type === 'full');
    // 正社員がいれば、基本成長スピードが10%アップ
    return hasFull ? 1.1 : 1.0;
  }
}
