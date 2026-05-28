// ======================================================
// loan.js - Agricultural Loan & AI Consulting System
// ======================================================

class LoanSystem {
  constructor() {
    this.activeLoan = null; // { typeId, principal, interestRate, totalYears, remainingYears, yearlyPayment, isBankrupt }
    
    this.loanTypes = [
      { id: 'youth', name: '青年等就農資金 (無利子)', maxAmount: 2000000, interestRate: 0.0, desc: '新規就農者（個人農家）向けの無利子資金。最大200万円。' },
      { id: 'modern', name: '農業近代化資金 (低利)', maxAmount: 5000000, interestRate: 0.015, desc: '機械導入や施設拡充向け。金利1.5%、最大500万円。' },
      { id: 'super_l', name: 'スーパーL資金 (大規模)', maxAmount: 10000000, interestRate: 0.005, desc: '営農組合など大規模経営向け。金利0.5%、最大1000万円。審査が非常に厳しい。' }
    ];
  }

  toJSON() {
    return {
      activeLoan: this.activeLoan
    };
  }

  fromJSON(data) {
    if (data && data.activeLoan) {
      this.activeLoan = data.activeLoan;
    }
  }

  hasActiveLoan() {
    return this.activeLoan !== null && this.activeLoan.remainingYears > 0;
  }

  // --- AI Consulting Function ---
  getConsultation(game) {
    if (this.hasActiveLoan()) {
      return "現在返済中の融資があります。追加の借入の前に、現在の負債を完済してください。";
    }

    const expectedRevenue = this.estimateYearlyRevenue(game);
    const safeYearlyPayment = expectedRevenue * 0.3; // Safely can pay 30% of gross revenue
    const suggestedAmount5Y = safeYearlyPayment * 5;

    let advice = `【AI経営コンサルティング診断】\n`;
    advice += `現在のあなたの営農規模（予想年間売上: 約${formatMoney(Math.round(expectedRevenue))}）を分析しました。\n\n`;

    if (expectedRevenue < 100000) {
      advice += `まだ経営基盤が非常に弱いため、借入は推奨しません。まずは小規模でも確実な収益を上げ、自己資金を増やすか補助金の活用を検討してください。\n`;
    } else {
      advice += `経営の健全性を保つための「安全な年間返済額」は約${formatMoney(Math.round(safeYearlyPayment))}です。\n`;
      advice += `▶ 5年返済プランの場合、借入上限の目安は **約${formatMoney(Math.round(suggestedAmount5Y))}** です。\n\n`;
      
      if (game.farmingMode === 'individual') {
        advice += `個人農家として新規就農されているため、無利子の「青年等就農資金」が最もリスクが低くお勧めです。`;
      } else {
        advice += `営農組合としてスケールメリットを活かせるため、機械化による「農業近代化資金」や、大規模な「スーパーL資金」による一気な事業拡大も視野に入ります。`;
      }
    }
    return advice;
  }

  // --- Utility for AI ---
  estimateYearlyRevenue(game) {
    // Very rough estimate based on farmland type and mode
    let baseRevenuePerPlot = 20000; // avg
    if (game.farmlandType === 'paddy') baseRevenuePerPlot = 18000;
    if (game.farmlandType === 'field') baseRevenuePerPlot = 25000;
    
    let total = baseRevenuePerPlot * CONSTANTS.PLOT_COUNT;
    const yieldBonus = game.getModeBonus('yieldBonus') || 1.0;
    const sellBonus = game.getModeBonus('sellBonus') || 1.0;
    
    return total * yieldBonus * sellBonus;
  }

  // --- AI Loan Evaluation ---
  evaluateApplication(game, applicationData) {
    if (this.hasActiveLoan()) {
      return { passed: false, advice: "既に返済中の融資が存在します。多重債務は許可されていません。" };
    }

    const { typeId, amount, years, appeal } = applicationData;
    const loanDef = this.loanTypes.find(l => l.id === typeId);
    
    if (!loanDef || amount <= 0 || years <= 0) {
      return { passed: false, advice: "入力内容に不正があります。" };
    }

    const feedback = [];
    let score = 100;

    // 1. Amount and Limit check
    if (amount > loanDef.maxAmount) {
      return { passed: false, advice: `希望額（${amount.toLocaleString()}円）が${loanDef.name}の限度額（${loanDef.maxAmount.toLocaleString()}円）を超過しています。` };
    }

    // 2. Repayment Ability Check
    // Calculate yearly payment (Simple calculation for game: (Principal + Interest) / Years)
    const totalInterest = amount * loanDef.interestRate * years;
    const totalRepayment = amount + totalInterest;
    const yearlyPayment = Math.round(totalRepayment / years);
    
    const expectedRevenue = this.estimateYearlyRevenue(game);
    const repaymentRatio = yearlyPayment / expectedRevenue; // > 0.5 is very dangerous

    if (repaymentRatio > 0.6) {
      score -= 50;
      feedback.push(`返済負担率が異常に高く（推定売上の${Math.round(repaymentRatio*100)}%）、倒産リスクが極めて高いとAIが判定しました。借入額を減らすか、返済期間を伸ばしてください。`);
    } else if (repaymentRatio > 0.4) {
      score -= 20;
      feedback.push(`返済負担率がやや高めです。資金繰りに注意が必要な水準です。`);
    } else {
      feedback.push(`返済計画は現実的であり、現在の経営規模に対して健全な水準です。`);
    }

    // 3. Mode mismatch check
    if (typeId === 'youth' && game.farmingMode !== 'individual') {
      score -= 30;
      feedback.push(`「青年等就農資金」は個人農家向けであり、現在の営農組合形態での申請は不適切です。`);
    }
    if (typeId === 'super_l') {
      if (game.farmingMode === 'individual') {
        score -= 40;
        feedback.push(`「スーパーL資金」は大規模な法人・組合向けの制度です。個人の経営規模では審査を通過できません。`);
      } else {
        // Super L is strict
        if (repaymentRatio > 0.3) {
          score -= 30;
          feedback.push(`「スーパーL資金」は審査が非常に厳格です。現在の自己資本比率や予想収益に対して希望額が大きすぎます。`);
        }
      }
    }

    // 4. Appeal text length check
    if (appeal.length < 15) {
      score -= 20;
      feedback.push(`資金使途（アピールポイント）の記述が不十分です。設備投資の具体性を示してください。`);
    }

    const passed = score >= 70;
    let finalAdvice = "";

    if (passed) {
      finalAdvice = `【融資審査通過】\n厳正なAI審査の結果、融資が承認されました。\n\n`;
      finalAdvice += `借入元本: ${formatMoney(amount)}\n`;
      finalAdvice += `金利: ${loanDef.interestRate * 100}%\n`;
      finalAdvice += `返済期間: ${years}年\n`;
      finalAdvice += `毎年の返済額: ${formatMoney(yearlyPayment)}\n\n`;
      finalAdvice += `※毎年の春（Day 1）に自動的に引き落とされます。計画的な経営をお願いします。`;

      this.activeLoan = {
        typeId,
        principal: amount,
        interestRate: loanDef.interestRate,
        totalYears: years,
        remainingYears: years,
        yearlyPayment: yearlyPayment,
        isBankrupt: false
      };
    } else {
      finalAdvice = `【融資審査否決】\n審査の結果、今回は融資を見送らせていただきます。以下の理由をご確認ください。\n\n`;
      feedback.forEach(fb => {
        finalAdvice += `・${fb}\n`;
      });
    }

    return {
      passed,
      grantedAmount: passed ? amount : 0,
      advice: finalAdvice
    };
  }

  // --- Process Yearly Repayment ---
  processYearlyRepayment(game) {
    if (!this.hasActiveLoan()) return null;

    const payment = this.activeLoan.yearlyPayment;
    const result = {
      amount: payment,
      success: true,
      bankrupt: false,
      remainingYears: this.activeLoan.remainingYears - 1
    };

    game.economy.spend(payment); // EconomySystem allows negative balance
    this.activeLoan.remainingYears -= 1;

    // Check for bankruptcy / negative balance
    if (game.economy.money < 0) {
      result.success = false;
      result.bankrupt = true;
      this.activeLoan.isBankrupt = true;
      
      // Penalty: Sell all crops? Or just lock actions. 
      // In this game, if money < 0, economy.canAfford returns false, so they are locked out of buying seeds.
      // That is the penalty. We just notify them heavily.
    }

    if (this.activeLoan.remainingYears <= 0) {
      this.activeLoan = null; // Paid off
    }

    return result;
  }
}
