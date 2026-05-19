// ======================================================
// subsidy.js - Subsidy Application & Mock AI Judge System
// ======================================================

class SubsidySystem {
  constructor() {
    this.lastApplicationYear = 0; // The year the player last applied
    
    this.categories = [
      { id: 'startup', name: '新規就農・経営自立支援枠', maxAmount: 500000, desc: 'これから独自の経営を確立していく個人農家向けの支援金です。' },
      { id: 'scale', name: '規模拡大・機械化促進枠', maxAmount: 1000000, desc: '集落営農組合など、大規模な農業を展開し地域の中心となる組織向けの支援金です。' },
      { id: 'environment', name: '環境保全型農業推進枠', maxAmount: 300000, desc: '土壌や水質に配慮し、持続可能な農業を目指す取り組みを支援します。' }
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
      lastApplicationYear: this.lastApplicationYear
    };
  }

  fromJSON(data) {
    if (data && data.lastApplicationYear) {
      this.lastApplicationYear = data.lastApplicationYear;
    }
  }

  /**
   * Evaluate the application using a mock AI algorithm.
   */
  evaluateApplication(game, applicationData) {
    const { category, amount, crops, appeal } = applicationData;
    let score = 0;
    const feedback = [];
    const penaltyFlags = {
      amount: false,
      modeMatch: false,
      cropMatch: false,
      keywords: false
    };

    // 1. Amount Evaluation (Max 20 pts)
    const categoryDef = this.categories.find(c => c.id === category);
    if (!categoryDef) return { passed: false, score: 0, grantedAmount: 0, advice: "無効な申請枠です。" };
    
    if (amount <= 0) {
      return { passed: false, score: 0, grantedAmount: 0, advice: "希望金額が不正です。" };
    } else if (amount > categoryDef.maxAmount) {
      score += 0;
      penaltyFlags.amount = true;
      feedback.push(`希望額（${amount.toLocaleString()}円）が、${categoryDef.name}の規定上限（${categoryDef.maxAmount.toLocaleString()}円）を超過しています。現実的な投資計画に修正してください。`);
    } else {
      // Good amount. If asking for a reasonable amount compared to max, get full points.
      const ratio = amount / categoryDef.maxAmount;
      if (ratio > 0.8) {
        score += 15; // Slightly risky
        feedback.push(`上限に近い希望額ですが、資金計画の妥当性を一部認めました。`);
      } else {
        score += 20;
      }
    }

    // 2. Mode Match Evaluation (Max 20 pts)
    const mode = game.farmingMode;
    if (category === 'startup') {
      if (mode === 'individual') {
        score += 20;
      } else {
        score += 5;
        penaltyFlags.modeMatch = true;
        feedback.push(`「新規就農・経営自立支援枠」は個人農家を想定していますが、あなたの現在の経営形態（営農組合）とはミスマッチです。申請枠を見直してください。`);
      }
    } else if (category === 'scale') {
      if (mode === 'cooperative') {
        score += 20;
      } else {
        score += 5;
        penaltyFlags.modeMatch = true;
        feedback.push(`「規模拡大・機械化促進枠」は営農組合など大規模経営向けです。個人農家の場合は、より適切な支援枠を選択するか、アピールポイントで明確な規模拡大のロードマップを提示する必要があります。`);
      }
    } else {
      // environment applies to both
      score += 20;
    }

    // 3. Environment & Crop Suitability (Max 30 pts)
    let cropSuitabilityScore = 0;
    const farmlandType = game.farmlandType; // 'paddy' or 'field'
    const flDef = FARMLAND_TYPES[farmlandType];
    let recommendedCount = 0;

    crops.forEach(cropId => {
      if (flDef.recommended.includes(cropId)) {
        recommendedCount++;
      }
    });

    if (crops.length === 0) {
      cropSuitabilityScore = 0;
      penaltyFlags.cropMatch = true;
      feedback.push(`栽培予定作物が選択されていません。具体的な営農計画が欠如しています。`);
    } else {
      const matchRatio = recommendedCount / crops.length;
      if (matchRatio === 1) {
        cropSuitabilityScore = 30;
      } else if (matchRatio >= 0.5) {
        cropSuitabilityScore = 20;
        feedback.push(`農地（${flDef.name}）の適性に合わない作物が一部含まれています。射水市の気候・土壌データを再確認することをお勧めします。`);
      } else {
        cropSuitabilityScore = 5;
        penaltyFlags.cropMatch = true;
        feedback.push(`現在の農地（${flDef.name}）と栽培予定作物の相性が著しく悪いです。水田には水稲・大豆、畑地には野菜類といった、土壌特性を活かした作付け計画を立ててください。`);
      }
    }
    score += cropSuitabilityScore;

    // 4. Keyword Analysis in Appeal (Max 30 pts)
    const text = appeal || "";
    let keywordScore = 0;
    const foundKeywords = [];

    const keywordSets = {
      individual: ['独自', 'ブランド', '直売', '有機', 'こだわり', '付加価値', '高品質', '挑戦'],
      cooperative: ['効率化', '機械化', '地域', '貢献', '共同', '大規模', '安定', '集約'],
      environment: ['環境', '無農薬', '持続', 'エコ', '土づくり', '循環', '自然']
    };

    let targetSet = [];
    if (category === 'environment') targetSet = keywordSets.environment;
    else targetSet = mode === 'cooperative' ? keywordSets.cooperative : keywordSets.individual;

    targetSet.forEach(kw => {
      if (text.includes(kw)) {
        keywordScore += 10;
        foundKeywords.push(kw);
      }
    });

    if (text.length < 20) {
      keywordScore = 0;
      penaltyFlags.keywords = true;
      feedback.push(`営農アピールポイントが短すぎます。事業への熱意や具体的な計画が見えません。`);
    } else {
      if (keywordScore > 30) keywordScore = 30;
      if (keywordScore < 10) {
        penaltyFlags.keywords = true;
        let hint = "";
        if (targetSet === keywordSets.individual) hint = "「ブランド化」「こだわり」「直売」";
        else if (targetSet === keywordSets.cooperative) hint = "「効率化」「地域への貢献」「機械化」";
        else hint = "「持続可能性」「土づくり」「環境配慮」";
        feedback.push(`アピールポイントに説得力が欠けています。申請枠や経営形態に合わせて、${hint}といったキーワードを意識してビジョンを記述してください。`);
      }
    }
    score += keywordScore;

    // --- Final Decision ---
    const passThreshold = 75;
    const passed = score >= passThreshold;
    let finalAdvice = "";

    if (passed) {
      finalAdvice = `【採択】スコア: ${score}/100\n素晴らしい営農計画です！あなたの計画は実現性が高く、射水市の農業発展に寄与するとAI審査システムに評価されました。希望額の${amount.toLocaleString()}円を交付します。`;
      if (foundKeywords.length > 0) {
        finalAdvice += `\n（評価されたキーワード: ${foundKeywords.join(', ')}）`;
      }
    } else {
      finalAdvice = `【不採択】スコア: ${score}/100\n厳正なるAI審査の結果、今回は不採択となりました。以下のフィードバックを参考に、次年度以降に申請書類と計画を修正して再提出してください。\n\n`;
      feedback.forEach(fb => {
        finalAdvice += `・${fb}\n`;
      });
    }

    return {
      passed,
      score,
      grantedAmount: passed ? amount : 0,
      advice: finalAdvice
    };
  }
}
