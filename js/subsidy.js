// ======================================================
// subsidy.js - Real-world inspired subsidy application system
// ======================================================

class SubsidySystem {
  constructor() {
    this.lastApplicationYear = 0;
    this.objectiveOptions = [
      '新規就農の経営安定',
      '販路開拓・ブランド化',
      '省力化・機械化',
      '農地集積・規模拡大',
      '環境負荷低減',
      '地域貢献・担い手確保',
    ];
    this.useOptions = [
      '農業機械の導入',
      '施設・ハウス整備',
      '資材費・苗代',
      '土づくり資材',
      '研修費・資格取得',
      '販路開拓・包装資材',
    ];
    this.environmentOptions = [
      '化学肥料5割低減',
      '化学農薬5割低減',
      '堆肥・有機質資材の活用',
      'カバークロップ・緑肥',
      '生物多様性保全',
      '水管理・省エネ',
    ];
    this.categories = [
      {
        id: 'management_start',
        name: '経営開始資金（新規就農者育成総合対策）',
        shortName: '経営開始資金',
        maxAmount: 500000,
        actualScale: '現実参考: 月13.75万円、年間最大165万円、最長3年',
        desc: '新規就農直後の経営安定を支える制度を参考にした申請区分です。',
        applicantModes: ['individual'],
        policyNote: '49歳以下の新規就農者向け。青年等就農計画、販路、収支見通しが重要です。',
      },
      {
        id: 'business_development',
        name: '経営発展支援事業',
        shortName: '経営発展支援',
        maxAmount: 800000,
        actualScale: '現実参考: 初期投資支援。経営開始資金と併用時は補助対象上限500万円',
        desc: '初期投資や設備導入で経営を前に進める制度を参考にした申請区分です。',
        applicantModes: ['individual', 'cooperative'],
        policyNote: '市町村を通じて申請。青年等就農計画と、投資後の売上・収益向上が審査の軸です。',
      },
      {
        id: 'land_efficiency',
        name: '農地利用効率化等支援交付金',
        shortName: '農地利用効率化',
        maxAmount: 1000000,
        actualScale: '現実参考: 機械・施設導入、購入3/10以内、上限1,500万円',
        desc: '地域計画、農地集積、省力化投資を重視する制度を参考にした申請区分です。',
        applicantModes: ['individual', 'cooperative'],
        policyNote: '市町村経由で要望。地域計画、目標地図、機械導入の妥当性が重視されます。',
      },
      {
        id: 'environment_direct',
        name: '環境保全型農業直接支払交付金',
        shortName: '環境保全型直接支払',
        maxAmount: 350000,
        actualScale: '現実参考: 化学肥料・農薬原則5割以上低減と高い環境効果の活動を支援',
        desc: '環境負荷低減の実践を支える制度を参考にした申請区分です。',
        applicantModes: ['individual', 'cooperative'],
        policyNote: '化学肥料・化学農薬の低減、堆肥・カバークロップ等の具体的な環境取組が必要です。',
      },
    ];
  }

  canApply(currentYear) {
    return this.lastApplicationYear < currentYear;
  }

  recordApplication(year) {
    this.lastApplicationYear = year;
  }

  toJSON() {
    return {
      lastApplicationYear: this.lastApplicationYear,
    };
  }

  fromJSON(data) {
    if (data && data.lastApplicationYear) {
      this.lastApplicationYear = data.lastApplicationYear;
    }
  }

  getCategory(id) {
    return this.categories.find(category => category.id === id);
  }

  normalizeText(text) {
    return (text || '').replace(/\s+/g, ' ').trim();
  }

  countKeywords(text, keywords) {
    return keywords.reduce((count, keyword) => count + (text.includes(keyword) ? 1 : 0), 0);
  }

  calculateGrant(program, amount, score) {
    if (score >= 90) return amount;
    if (score >= 82) return Math.round(amount * 0.9);
    if (score >= 75) return Math.round(amount * 0.75);
    return 0;
  }

  buildApplicationSheet(game, data, program) {
    const area = IMIZU_AREAS[game.areaId];
    const farmland = FARMLAND_TYPES[game.farmlandType];
    const cropNames = data.crops.map(cropId => CROPS[cropId]?.name || cropId);

    return {
      programName: program.name,
      projectName: this.normalizeText(data.projectName),
      fiscalYear: this.normalizeText(data.fiscalYear),
      applicantName: game.character ? game.character.name : '申請者',
      farmingMode: game.farmingMode === 'cooperative' ? '営農組合' : '個人農家',
      areaName: area ? area.name : '未設定',
      farmlandName: farmland ? farmland.name : '未設定',
      amount: data.amount,
      selfFunding: data.selfFunding,
      crops: cropNames,
      objectives: data.objectives,
      uses: data.uses,
      targetSales: data.targetSales,
      salesChannel: this.normalizeText(data.salesChannel),
      summary: this.normalizeText(data.appeal),
      schedule: this.normalizeText(data.schedule),
      regionalPlan: this.normalizeText(data.regionalPlan),
      environmentPractices: data.environmentPractices,
      reference: program.actualScale,
    };
  }

  evaluateApplication(game, applicationData) {
    const program = this.getCategory(applicationData.category);
    if (!program) {
      return {
        passed: false,
        score: 0,
        grantedAmount: 0,
        programName: '不明',
        summary: '制度区分の読み込みに失敗しました。',
        feedback: ['制度区分を選び直してください。'],
        breakdown: [],
        applicationSheet: null,
      };
    }

    const data = {
      category: applicationData.category,
      amount: parseInt(applicationData.amount, 10) || 0,
      selfFunding: parseInt(applicationData.selfFunding, 10) || 0,
      targetSales: parseInt(applicationData.targetSales, 10) || 0,
      crops: applicationData.crops || [],
      objectives: applicationData.objectives || [],
      uses: applicationData.uses || [],
      environmentPractices: applicationData.environmentPractices || [],
      projectName: applicationData.projectName || '',
      fiscalYear: applicationData.fiscalYear || '',
      appeal: applicationData.appeal || '',
      schedule: applicationData.schedule || '',
      regionalPlan: applicationData.regionalPlan || '',
      salesChannel: applicationData.salesChannel || '',
    };

    const area = IMIZU_AREAS[game.areaId];
    const farmland = FARMLAND_TYPES[game.farmlandType];
    const sheet = this.buildApplicationSheet(game, data, program);
    const feedback = [];
    const breakdown = [];
    let score = 0;

    const addScore = (label, value, max, comment) => {
      breakdown.push({ label, score: value, max, comment });
      score += value;
    };

    const planText = [
      sheet.projectName,
      sheet.summary,
      sheet.schedule,
      sheet.regionalPlan,
      sheet.salesChannel,
      sheet.objectives.join(' '),
      sheet.uses.join(' '),
      sheet.environmentPractices.join(' '),
    ].join(' ');

    let eligibilityScore = 0;
    if (program.applicantModes.includes(game.farmingMode)) {
      eligibilityScore += 10;
    } else {
      feedback.push(`${program.shortName}は現在の経営形態と相性が弱く、制度趣旨との整合が不足しています。`);
    }
    if (game.character && game.character.age <= 49) {
      eligibilityScore += 5;
    } else if (program.id === 'management_start') {
      feedback.push('経営開始資金は、現実制度では49歳以下の新規就農者が中心です。');
    }
    if (data.amount > 0 && data.amount <= program.maxAmount) {
      eligibilityScore += 5;
    } else {
      feedback.push(`希望額が ${program.shortName} のゲーム内上限 ${formatMoney(program.maxAmount)} を超えています。`);
    }
    addScore('制度適合性', Math.min(20, eligibilityScore), 20, program.policyNote);

    let completenessScore = 0;
    if (sheet.projectName.length >= 10) completenessScore += 4;
    if (sheet.summary.length >= 50) completenessScore += 5;
    if (sheet.schedule.length >= 30) completenessScore += 4;
    if (sheet.regionalPlan.length >= 25) completenessScore += 4;
    if (sheet.salesChannel.length >= 4) completenessScore += 3;
    if (completenessScore < 14) {
      feedback.push('申請書の記述量が不足しています。事業名、実施手順、地域との関わり、販路を具体的に書くと評価が安定します。');
    }
    addScore('申請書の完成度', completenessScore, 20, '事業名、資金使途、実施工程、販路まで記入されているかを確認します。');

    let fitScore = 0;
    const recommended = farmland ? farmland.recommended : [];
    const recommendedCount = data.crops.filter(cropId => recommended.includes(cropId)).length;
    if (data.crops.length > 0) {
      const matchRatio = recommendedCount / data.crops.length;
      if (matchRatio >= 0.8) fitScore += 10;
      else if (matchRatio >= 0.5) fitScore += 7;
      else fitScore += 3;
    }
    if (area) fitScore += 3;
    if (data.objectives.length >= 2) fitScore += 3;
    if (data.uses.length >= 2) fitScore += 4;
    if (fitScore < 13) {
      feedback.push(`${farmland ? farmland.name : '現在の農地'} に合う作物や使途の説明が弱く、事業効果が伝わりにくい内容です。`);
    }
    addScore('営農計画との整合', fitScore, 20, '地区・農地・作物・使途がつながっているかを見ます。');

    let financeScore = 0;
    if (data.amount > 0 && data.amount <= program.maxAmount) {
      const ratio = data.amount / program.maxAmount;
      financeScore += ratio <= 0.7 ? 8 : ratio <= 0.9 ? 6 : 4;
    }
    if (data.selfFunding >= Math.round(data.amount * 0.2)) financeScore += 5;
    else if (program.id === 'business_development' || program.id === 'land_efficiency') feedback.push('投資系の制度では、自己負担や自己資金の裏付けがある方が評価されやすくなります。');
    if (data.targetSales >= Math.round(game.economy.getMoney() * 4)) financeScore += 4;
    if (sheet.salesChannel.length >= 4) financeScore += 3;
    addScore('資金計画の妥当性', financeScore, 20, '希望額、自己負担、売上目標、販路の現実性を評価します。');

    let policyScore = 0;
    if (program.id === 'management_start') {
      if (game.year <= 3) policyScore += 6;
      if (this.countKeywords(planText, ['販路', '直売', '収支', 'ブランド', '単価', '研修']) >= 3) policyScore += 8;
      if (data.objectives.includes('新規就農の経営安定')) policyScore += 6;
      if (policyScore < 14) feedback.push('経営開始資金は、就農初期の安定と青年等就農計画に沿った収支設計がより明確だと通りやすくなります。');
    } else if (program.id === 'business_development') {
      if (this.countKeywords(planText, ['機械', '施設', '販路', '売上', '効率', '投資']) >= 3) policyScore += 8;
      if (data.uses.includes('農業機械の導入') || data.uses.includes('施設・ハウス整備')) policyScore += 6;
      if (data.targetSales > Math.round(game.economy.getMoney() * 5)) policyScore += 6;
      if (policyScore < 14) feedback.push('経営発展支援事業は、投資後にどれだけ売上や生産性が伸びるかを数字で示すと強くなります。');
    } else if (program.id === 'land_efficiency') {
      if (game.farmingMode === 'cooperative') policyScore += 6;
      if (this.countKeywords(planText, ['地域計画', '集積', '受け手', '機械', '省力化', 'リース']) >= 3) policyScore += 8;
      if (data.objectives.includes('農地集積・規模拡大') || data.objectives.includes('省力化・機械化')) policyScore += 6;
      if (policyScore < 14) feedback.push('農地利用効率化等支援交付金は、地域計画や農地引受け、機械導入の必要性を前面に出すと評価が上がります。');
    } else if (program.id === 'environment_direct') {
      const envCount = data.environmentPractices.length;
      if (envCount >= 3) policyScore += 8;
      else if (envCount >= 2) policyScore += 5;
      if (this.countKeywords(planText, ['5割', '化学肥料', '化学農薬', '堆肥', 'カバークロップ', '有機']) >= 3) policyScore += 8;
      if (data.objectives.includes('環境負荷低減')) policyScore += 4;
      if ((game.soil.getSoil(0)?.organic || 0) >= 40) policyScore += 0;
      if (policyScore < 14) feedback.push('環境保全型農業直接支払交付金は、化学肥料・農薬の低減や堆肥、緑肥などの取組を具体的に示す必要があります。');
    }
    addScore('制度固有の評価軸', policyScore, 20, program.policyNote);

    const passed = score >= 75;
    const grantedAmount = passed ? this.calculateGrant(program, data.amount, score) : 0;
    const summary = passed
      ? `${program.shortName}は採択です。${formatMoney(grantedAmount)} を交付します。`
      : `${program.shortName}は今回は不採択です。計画を補強して次年度に再挑戦してください。`;

    if (feedback.length === 0) {
      feedback.push('申請書の構成、使途、地域性の説明がまとまっており、制度趣旨との整合も良好でした。');
    }

    return {
      passed,
      score,
      grantedAmount,
      programName: program.name,
      summary,
      feedback,
      breakdown,
      applicationSheet: sheet,
      policyReference: program.actualScale,
    };
  }
}
