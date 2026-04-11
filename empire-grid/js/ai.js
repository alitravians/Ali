/* =============================================
   Empire Grid - الذكاء الاصطناعي
   ============================================= */

class AIPlayer {
    constructor(difficulty = 'medium') {
        this.difficulty = difficulty;
        this.thinkDelay = { easy: 800, medium: 1200, hard: 1500 }[difficulty] || 1200;
    }

    async makeDecision(game) {
        await this.think();
        const player = game.currentPlayer;
        if (!player.isAI) return null;

        const state = game.getGameState();
        const zone = game.map[player.position];

        const decisions = [];

        // قرار الشراء
        if (zone.owner === null && zone.price > 0) {
            const shouldBuy = this.evaluateBuy(game, player, zone);
            if (shouldBuy) {
                decisions.push({ type: 'buy', zone: zone });
            }
        }

        // قرار التطوير
        const upgradeTarget = this.findBestUpgrade(game, player);
        if (upgradeTarget) {
            decisions.push({ type: 'upgrade', zone: upgradeTarget });
        }

        // قرار استخدام بطاقة
        const cardPlay = this.evaluateCards(game, player);
        if (cardPlay) {
            decisions.push({ type: 'card', ...cardPlay });
        }

        return decisions;
    }

    evaluateBuy(game, player, zone) {
        const price = game.getAdjustedPrice(zone);

        // حساب نسبة المال
        const moneyRatio = player.money / price;

        switch (this.difficulty) {
            case 'easy':
                // يشتري إذا كان لديه ضعف الثمن
                return moneyRatio >= 2;
            case 'medium':
                // يحلل العائد
                if (moneyRatio < 1.3) return false;
                const roi = zone.baseIncome / price;
                return roi > 0.05 || (zone.isHot && moneyRatio >= 1.5);
            case 'hard':
                // تحليل متقدم
                if (moneyRatio < 1.2) return false;
                const advancedROI = this.calculateAdvancedROI(game, player, zone, price);
                const sectorCount = game.getPlayerProperties(player.id).filter(p => p.type === zone.type).length;
                const sectorBonus = sectorCount > 0 ? 1.3 : 1.0;
                return advancedROI * sectorBonus > 0.06;
        }
        return false;
    }

    calculateAdvancedROI(game, player, zone, price) {
        let expectedIncome = zone.baseIncome;

        // تأثير المرحلة
        const phase = game.getPhase();
        if (phase.id === 'expansion') expectedIncome *= 0.8;
        else if (phase.id === 'control') expectedIncome *= 1.2;

        // تأثير مؤشر السوق
        expectedIncome *= game.marketIndex / 100;

        // عائد الجولات المتبقية
        const remainingRounds = game.maxRounds - game.round;
        const totalExpected = expectedIncome * remainingRounds;

        return totalExpected / price / remainingRounds;
    }

    findBestUpgrade(game, player) {
        const properties = game.getPlayerProperties(player.id);
        if (properties.length === 0) return null;

        let bestZone = null;
        let bestValue = 0;

        properties.forEach(zone => {
            if (zone.level >= 4) return;

            const nextLevel = UPGRADE_LEVELS[zone.level + 1];
            let cost = Math.round(zone.price * nextLevel.costMultiplier);

            if (player.character.bonuses.upgradeCostReduction) {
                cost = Math.round(cost * (1 - player.character.bonuses.upgradeCostReduction));
            }

            if (player.money < cost * 1.5) return;

            const currentIncome = zone.baseIncome * UPGRADE_LEVELS[zone.level].incomeMultiplier;
            const nextIncome = zone.baseIncome * nextLevel.incomeMultiplier;
            const incomeGain = nextIncome - currentIncome;
            const value = incomeGain / cost;

            if (value > bestValue) {
                bestValue = value;
                bestZone = zone;
            }
        });

        // الصعوبة تؤثر على عتبة التطوير
        const threshold = { easy: 0.15, medium: 0.08, hard: 0.05 }[this.difficulty] || 0.08;
        return bestValue > threshold ? bestZone : null;
    }

    evaluateCards(game, player) {
        if (player.cards.length === 0) return null;

        for (let i = 0; i < player.cards.length; i++) {
            const card = player.cards[i];

            switch (card.id) {
                case 'city_bonus':
                case 'influence_boost':
                    // استخدم فورًا - مكافآت مباشرة
                    return { cardIndex: i };

                case 'emergency_loan':
                    if (player.money < 1000) return { cardIndex: i };
                    break;

                case 'tax_shield':
                    if (player.money < 2000) return { cardIndex: i };
                    break;

                case 'fast_expansion':
                    // استخدم قبل الشراء
                    const available = game.map.filter(z => !z.owner && z.price > 0);
                    if (available.length > 0 && player.money > 1500) return { cardIndex: i };
                    break;

                case 'market_crash':
                    if (this.difficulty === 'hard') {
                        // استخدم ضد أغنى خصم
                        const richest = game.players
                            .filter(p => p.id !== player.id && !p.bankrupt)
                            .sort((a, b) => game.getPlayerProperties(b.id).length - game.getPlayerProperties(a.id).length)[0];
                        if (richest && game.getPlayerProperties(richest.id).length >= 3) {
                            return { cardIndex: i, targetId: richest.id };
                        }
                    }
                    break;

                case 'investment_surge':
                    if (game.getPlayerProperties(player.id).length >= 3) return { cardIndex: i };
                    break;

                case 'secret_deal':
                    return { cardIndex: i };
            }
        }
        return null;
    }

    evaluateTrade(game, player, offer) {
        // تقييم العرض التجاري
        let myValue = offer.myMoney || 0;
        let theirValue = offer.theirMoney || 0;

        if (offer.myProperties) {
            offer.myProperties.forEach(zoneId => {
                const zone = game.map[zoneId];
                myValue += (zone.currentValue || zone.price) * 1.1;
            });
        }

        if (offer.theirProperties) {
            offer.theirProperties.forEach(zoneId => {
                const zone = game.map[zoneId];
                theirValue += (zone.currentValue || zone.price) * 1.1;
            });
        }

        // الصعوبة تؤثر على مرونة القبول
        const thresholds = { easy: 0.8, medium: 0.9, hard: 1.0 };
        const threshold = thresholds[this.difficulty] || 0.9;

        return myValue >= theirValue * threshold;
    }

    evaluateAuction(game, player, zone, currentBid) {
        const maxBid = this.getMaxBid(game, player, zone);
        if (currentBid >= maxBid) return null;

        const increment = { easy: 200, medium: 150, hard: 100 }[this.difficulty] || 150;
        const bid = Math.min(currentBid + increment, maxBid);

        return bid;
    }

    getMaxBid(game, player, zone) {
        const baseMax = zone.price;
        const moneyFactor = player.money * 0.4; // لا تزايد بأكثر من 40% من مالك

        switch (this.difficulty) {
            case 'easy': return Math.min(baseMax * 0.8, moneyFactor);
            case 'medium': return Math.min(baseMax * 1.0, moneyFactor);
            case 'hard': return Math.min(baseMax * 1.2, moneyFactor);
        }
        return Math.min(baseMax, moneyFactor);
    }

    think() {
        return new Promise(resolve => setTimeout(resolve, this.thinkDelay));
    }
}
