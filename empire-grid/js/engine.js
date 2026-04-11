/* =============================================
   Empire Grid - محرك اللعبة
   ============================================= */

class GameEngine {
    constructor() {
        this.players = [];
        this.map = [];
        this.currentPlayerIndex = 0;
        this.round = 1;
        this.maxRounds = 15;
        this.phase = 'expansion';
        this.marketIndex = 100;
        this.gameMode = 'standard';
        this.activeEvents = [];
        this.gameStarted = false;
        this.gameOver = false;
        this.turnState = 'waiting'; // waiting, rolled, acting, ended
        this.eventQueue = [];
        this.auctionState = null;
        this.tradeState = null;
        this.upgradeDiscount = 0;
        this.log = [];
    }

    initGame(players, mode, mapId) {
        this.gameMode = mode;
        const settings = GAME_SETTINGS[mode];
        this.maxRounds = settings.rounds;
        this.round = 1;
        this.marketIndex = 100;
        this.phase = 'expansion';
        this.activeEvents = [];
        this.gameOver = false;
        this.currentPlayerIndex = 0;
        this.turnState = 'waiting';
        this.log = [];

        // تهيئة الخريطة
        this.map = JSON.parse(JSON.stringify(CITY_MAP));
        this.map.forEach(zone => {
            zone.owner = null;
            zone.level = 0;
            zone.currentValue = zone.price;
            zone.currentIncome = zone.baseIncome;
            zone.isHot = false;
            zone.tempIncomeBonus = 0;
            zone.tempValueBonus = 0;
        });

        // تهيئة اللاعبين
        this.players = players.map((p, i) => {
            const character = CHARACTERS.find(c => c.id === p.characterId);
            let startMoney = settings.startMoney;
            if (character.bonuses.startMoney) {
                startMoney += startMoney * character.bonuses.startMoney;
            }
            startMoney = Math.round(startMoney);

            // اختيار مهمات عشوائية
            const shuffledMissions = [...MISSIONS].sort(() => Math.random() - 0.5);
            const playerMissions = shuffledMissions.slice(0, 3).map(m => ({
                ...m,
                completed: false,
                progress: 0
            }));

            // بطاقات عشوائية
            const shuffledCards = [...CARDS].sort(() => Math.random() - 0.5);
            const startCards = shuffledCards.slice(0, 2);

            return {
                id: i,
                name: p.name,
                characterId: p.characterId,
                character: character,
                isAI: p.isAI,
                color: PLAYER_COLORS[i],
                money: startMoney,
                influence: 10,
                position: 0,
                properties: [],
                cards: startCards,
                missions: playerMissions,
                loans: [],
                taxShield: 0,
                doubleIncome: 0,
                nextBuyDiscount: 0,
                hostileTakeover: false,
                extraRoll: false,
                extraAction: character.bonuses.extraAction || false,
                actionsRemaining: character.bonuses.extraAction ? 2 : 1,
                totalIncome: 0,
                totalSpent: 0,
                passedStart: 0,
                tradesCompleted: 0,
                auctionsWon: 0,
                bankrupt: false
            };
        });

        // تحديد مناطق ساخنة عشوائية
        this.setHotZones();
        this.gameStarted = true;
        this.addLog('بدأت المباراة! حظًا سعيدًا للجميع.');
        return true;
    }

    get currentPlayer() {
        return this.players[this.currentPlayerIndex];
    }

    getPhase() {
        const third = Math.ceil(this.maxRounds / 3);
        if (this.round <= third) return GAME_PHASES[0];
        if (this.round <= third * 2) return GAME_PHASES[1];
        return GAME_PHASES[2];
    }

    setHotZones() {
        this.map.forEach(z => z.isHot = false);
        const buyable = this.map.filter(z => z.price > 0);
        const hotCount = Math.min(3, buyable.length);
        const shuffled = [...buyable].sort(() => Math.random() - 0.5);
        for (let i = 0; i < hotCount; i++) {
            const zone = this.map.find(z => z.id === shuffled[i].id);
            if (zone) zone.isHot = true;
        }
    }

    rollDice() {
        if (this.turnState !== 'waiting' && !this.currentPlayer.extraRoll) return null;

        const die1 = Math.floor(Math.random() * 6) + 1;
        const die2 = Math.floor(Math.random() * 6) + 1;
        const total = die1 + die2;

        this.currentPlayer.extraRoll = false;
        this.turnState = 'rolled';

        // تحريك اللاعب
        const oldPos = this.currentPlayer.position;
        this.currentPlayer.position = (oldPos + total) % this.map.length;

        // مرور على نقطة البداية
        if (this.currentPlayer.position < oldPos) {
            const bonus = 500 + (this.round * 50);
            this.currentPlayer.money += bonus;
            this.currentPlayer.passedStart++;
            this.currentPlayer.influence += 5;
            this.addLog(`${this.currentPlayer.name} مرّ بنقطة البداية وحصل على ${bonus} 💰`);
        }

        const landedZone = this.map[this.currentPlayer.position];
        this.addLog(`${this.currentPlayer.name} رمى ${total} وتحرّك إلى "${landedZone.name}"`);

        // معالجة الهبوط
        const landResult = this.processLanding(landedZone);

        return { die1, die2, total, landedZone, landResult };
    }

    processLanding(zone) {
        const player = this.currentPlayer;
        const result = { type: '', message: '' };

        if (zone.type === 'start') {
            result.type = 'start';
            result.message = 'نقطة الانطلاق! مكان آمن.';
        } else if (zone.type === 'event') {
            result.type = 'event';
            const event = this.triggerRandomEvent();
            result.event = event;
            result.message = `حدث: ${event.name}`;
        } else if (zone.owner === null && zone.price > 0) {
            result.type = 'available';
            result.message = `"${zone.name}" متاحة للشراء بـ ${this.getAdjustedPrice(zone)} 💰`;
        } else if (zone.owner !== null && zone.owner !== player.id) {
            // دفع إيجار
            if (player.taxShield > 0) {
                result.type = 'shielded';
                result.message = 'درع الضرائب يحميك من الإيجار!';
            } else {
                const rent = this.calculateRent(zone);
                const owner = this.players[zone.owner];
                player.money -= rent;
                owner.money += rent;
                owner.totalIncome += rent;
                result.type = 'rent';
                result.rent = rent;
                result.message = `دفعت ${rent} 💰 إيجار لـ ${owner.name}`;
                this.addLog(`${player.name} دفع ${rent} إيجار لـ ${owner.name} على "${zone.name}"`);

                // إفلاس مؤقت - نظام التعافي
                if (player.money < 0) {
                    this.handleNearBankruptcy(player);
                }
            }
        } else if (zone.owner === player.id) {
            result.type = 'owned';
            result.message = `أنت تملك "${zone.name}" - يمكنك تطويرها!`;
        }

        return result;
    }

    getAdjustedPrice(zone) {
        let price = zone.currentValue || zone.price;
        const marketMult = this.marketIndex / 100;
        price = Math.round(price * marketMult);

        if (zone.isHot) price = Math.round(price * 1.2);

        // خصومات الشخصية
        const player = this.currentPlayer;
        if (player.character.bonuses.buyDiscount) {
            price = Math.round(price * (1 - player.character.bonuses.buyDiscount));
        }
        if (player.nextBuyDiscount > 0) {
            price = Math.round(price * (1 - player.nextBuyDiscount));
        }

        return Math.max(100, price);
    }

    calculateRent(zone) {
        let income = zone.currentIncome;
        const level = UPGRADE_LEVELS[zone.level];
        income = Math.round(income * level.incomeMultiplier);

        // مكافآت مؤقتة
        if (zone.tempIncomeBonus) {
            income = Math.round(income * (1 + zone.tempIncomeBonus));
        }

        // مؤشر السوق
        income = Math.round(income * (this.marketIndex / 100));

        // مناطق ساخنة
        if (zone.isHot) income = Math.round(income * 1.3);

        // مكافأة المخاطر للمستثمر الجريء
        const owner = this.players[zone.owner];
        if (owner && owner.character.bonuses.riskyReturn && zone.type === 'risky') {
            income = Math.round(income * owner.character.bonuses.riskyReturn);
        }

        return Math.max(50, income);
    }

    buyProperty(zoneId) {
        const player = this.currentPlayer;
        const zone = this.map[zoneId !== undefined ? zoneId : player.position];

        if (!zone || zone.owner !== null || zone.price === 0) return { success: false, message: 'لا يمكن شراء هذا الأصل' };

        // فحص VIP
        if (zone.type === 'vip' && player.character.bonuses.canBuyVIP === false) {
            return { success: false, message: 'شخصيتك لا يمكنها شراء مناطق VIP' };
        }

        const price = this.getAdjustedPrice(zone);
        if (player.money < price) return { success: false, message: 'لا يوجد مال كافٍ!' };

        player.money -= price;
        player.totalSpent += price;
        zone.owner = player.id;
        player.nextBuyDiscount = 0;

        // نفوذ
        let influenceGain = Math.round(price / 100);
        if (player.character.bonuses.influenceGainReduction) {
            influenceGain = Math.round(influenceGain * (1 - player.character.bonuses.influenceGainReduction));
        }
        player.influence += influenceGain;

        this.addLog(`${player.name} اشترى "${zone.name}" بـ ${price} 💰`);
        this.checkMissions(player);

        return { success: true, message: `تم شراء "${zone.name}" بنجاح!`, price };
    }

    upgradeProperty(zoneId) {
        const player = this.currentPlayer;
        const zone = this.map[zoneId];

        if (!zone || zone.owner !== player.id) return { success: false, message: 'لا تملك هذا الأصل' };
        if (zone.level >= 4) return { success: false, message: 'وصل الأصل لأعلى مستوى!' };

        const nextLevel = UPGRADE_LEVELS[zone.level + 1];
        let cost = Math.round(zone.price * nextLevel.costMultiplier);

        // خصم التطوير للمطور العقاري
        if (player.character.bonuses.upgradeCostReduction) {
            cost = Math.round(cost * (1 - player.character.bonuses.upgradeCostReduction));
        }
        if (player.character.bonuses.upgradeCostIncrease) {
            cost = Math.round(cost * (1 + player.character.bonuses.upgradeCostIncrease));
        }
        // خصم أحداث
        if (this.upgradeDiscount > 0) {
            cost = Math.round(cost * (1 - this.upgradeDiscount));
        }

        if (player.money < cost) return { success: false, message: `تحتاج ${cost} 💰 للتطوير!` };

        player.money -= cost;
        player.totalSpent += cost;
        zone.level++;
        zone.currentValue = Math.round(zone.price * (1 + zone.level * 0.5));

        const influenceGain = 5 * zone.level;
        player.influence += influenceGain;

        this.addLog(`${player.name} طوّر "${zone.name}" إلى ${nextLevel.name}`);
        this.checkMissions(player);

        return { success: true, message: `تم تطوير "${zone.name}" إلى ${nextLevel.name}!`, cost };
    }

    triggerRandomEvent() {
        const available = EVENTS.filter(e => !this.activeEvents.find(ae => ae.id === e.id));
        if (available.length === 0) return EVENTS[0];

        const event = available[Math.floor(Math.random() * available.length)];
        this.applyEvent(event);
        this.activeEvents.push({ ...event, remainingRounds: event.duration });
        this.addLog(`⚡ حدث: ${event.name}`);

        return event;
    }

    applyEvent(event) {
        event.effects.forEach(effect => {
            switch (effect.type) {
                case 'zone_value':
                    this.map.filter(z => z.type === effect.zoneType).forEach(z => {
                        z.tempValueBonus = (z.tempValueBonus || 0) + effect.change;
                        z.currentValue = Math.round(z.price * (1 + z.tempValueBonus));
                    });
                    break;
                case 'zone_income':
                    this.map.filter(z => z.type === effect.zoneType).forEach(z => {
                        z.tempIncomeBonus = (z.tempIncomeBonus || 0) + effect.change;
                    });
                    break;
                case 'all_value':
                    this.map.filter(z => z.price > 0).forEach(z => {
                        z.tempValueBonus = (z.tempValueBonus || 0) + effect.change;
                        z.currentValue = Math.round(z.price * (1 + z.tempValueBonus));
                    });
                    break;
                case 'market_index':
                    if (effect.change === 0) {
                        this.marketIndex = 100;
                    } else {
                        this.marketIndex = Math.max(50, Math.min(200, this.marketIndex + effect.change));
                    }
                    break;
                case 'tax_all':
                    this.players.forEach(p => {
                        if (!p.bankrupt && p.taxShield <= 0) {
                            const tax = Math.round(p.money * effect.amount);
                            p.money -= tax;
                            this.addLog(`${p.name} دفع ضريبة ${tax} 💰`);
                        }
                    });
                    break;
                case 'reset_values':
                    this.map.forEach(z => {
                        z.tempValueBonus = 0;
                        z.tempIncomeBonus = 0;
                        z.currentValue = z.price;
                    });
                    break;
                case 'upgrade_discount':
                    this.upgradeDiscount = effect.change;
                    break;
                case 'trigger_auction':
                    this.startAuction();
                    break;
            }
        });
    }

    startAuction() {
        const available = this.map.filter(z => !z.owner && z.price > 0);
        if (available.length === 0) return null;

        const item = available[Math.floor(Math.random() * available.length)];
        this.auctionState = {
            zone: item,
            currentBid: Math.round(item.price * 0.5),
            currentBidder: null,
            passedPlayers: new Set()
        };
        return this.auctionState;
    }

    placeBid(playerId, amount) {
        if (!this.auctionState) return false;
        const player = this.players[playerId];
        if (amount <= this.auctionState.currentBid) return false;
        if (player.money < amount) return false;

        this.auctionState.currentBid = amount;
        this.auctionState.currentBidder = playerId;
        return true;
    }

    passAuction(playerId) {
        if (!this.auctionState) return;
        this.auctionState.passedPlayers.add(playerId);

        const activePlayers = this.players.filter(p => !p.bankrupt && !this.auctionState.passedPlayers.has(p.id));
        if (activePlayers.length <= 1 && this.auctionState.currentBidder !== null) {
            this.resolveAuction();
        }
    }

    resolveAuction() {
        if (!this.auctionState || this.auctionState.currentBidder === null) {
            this.auctionState = null;
            return null;
        }

        const winner = this.players[this.auctionState.currentBidder];
        const zone = this.map[this.auctionState.zone.id];
        winner.money -= this.auctionState.currentBid;
        zone.owner = winner.id;
        winner.auctionsWon++;
        winner.influence += 10;

        this.addLog(`${winner.name} فاز بالمزاد على "${zone.name}" بـ ${this.auctionState.currentBid} 💰`);

        const result = { winner: winner.name, zone: zone.name, price: this.auctionState.currentBid };
        this.auctionState = null;
        return result;
    }

    handleNearBankruptcy(player) {
        // نظام التعافي بدل الإقصاء المبكر
        if (player.money < -2000) {
            // قرض إلزامي
            const loanAmount = Math.abs(player.money) + 500;
            player.money += loanAmount;
            player.loans.push({ amount: Math.round(loanAmount * 1.5), dueIn: 5 });
            this.addLog(`${player.name} حصل على قرض إنقاذ بقيمة ${loanAmount} 💰`);
        }

        // إذا كان لا يزال تحت الصفر بعد كل المحاولات
        if (player.money < -5000 && this.getPlayerProperties(player.id).length === 0) {
            // منحة تعافي
            player.money += 2000;
            this.addLog(`${player.name} حصل على منحة تعافي!`);
        }
    }

    processLoans(player) {
        const dueLoans = [];
        player.loans = player.loans.filter(loan => {
            loan.dueIn--;
            if (loan.dueIn <= 0) {
                dueLoans.push(loan);
                return false;
            }
            return true;
        });

        dueLoans.forEach(loan => {
            if (player.money >= loan.amount) {
                player.money -= loan.amount;
                this.addLog(`${player.name} سدّد قرض بقيمة ${loan.amount} 💰`);
            } else {
                // تمديد القرض بفوائد
                const newAmount = Math.round(loan.amount * 1.3);
                player.loans.push({ amount: newAmount, dueIn: 3 });
                this.addLog(`${player.name} لم يستطع السداد! تم تمديد القرض إلى ${newAmount} 💰`);
            }
        });
    }

    collectIncome(player) {
        const properties = this.getPlayerProperties(player.id);
        let totalIncome = 0;

        properties.forEach(zone => {
            let income = this.calculateRent(zone);
            if (player.doubleIncome > 0) income *= 2;

            // خصم الدخل الأساسي للمطور العقاري
            if (zone.level === 0 && player.character.bonuses.baseIncomeReduction) {
                income = Math.round(income * (1 - player.character.bonuses.baseIncomeReduction));
            }

            totalIncome += income;
        });

        // دخل ثابت للممول
        if (player.character.bonuses.passiveIncome) {
            totalIncome += player.character.bonuses.passiveIncome;
        }

        player.money += totalIncome;
        player.totalIncome += totalIncome;

        if (totalIncome > 0) {
            this.addLog(`${player.name} حصّل دخل ${totalIncome} 💰 من ${properties.length} أصل`);
        }

        return totalIncome;
    }

    endTurn() {
        const player = this.currentPlayer;

        // تحصيل الدخل
        this.collectIncome(player);

        // معالجة القروض
        this.processLoans(player);

        // تقليل الحماية
        if (player.taxShield > 0) player.taxShield--;
        if (player.doubleIncome > 0) player.doubleIncome--;

        // إعادة تعيين الإجراءات
        player.actionsRemaining = player.extraAction ? 2 : 1;
        player.hostileTakeover = false;

        // فحص المهمات
        this.checkMissions(player);

        // الانتقال للاعب التالي
        this.currentPlayerIndex++;
        if (this.currentPlayerIndex >= this.players.length) {
            this.currentPlayerIndex = 0;
            this.advanceRound();
        }

        // تخطي اللاعبين المفلسين
        let attempts = 0;
        while (this.currentPlayer.bankrupt && attempts < this.players.length) {
            this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
            attempts++;
        }

        this.turnState = 'waiting';
        return !this.gameOver;
    }

    advanceRound() {
        this.round++;

        if (this.round > this.maxRounds) {
            this.endGame();
            return;
        }

        // تحديث المرحلة
        this.phase = this.getPhase().id;

        // تحديث مؤشر السوق
        const marketChange = (Math.random() - 0.45) * 15;
        this.marketIndex = Math.max(50, Math.min(200, Math.round(this.marketIndex + marketChange)));

        // تحديث الأحداث النشطة
        this.activeEvents = this.activeEvents.filter(e => {
            e.remainingRounds--;
            if (e.remainingRounds <= 0) {
                // إزالة تأثيرات مؤقتة
                this.removeEventEffects(e);
                return false;
            }
            return true;
        });

        // حدث عشوائي كل 2-3 جولات
        if (this.round % 2 === 0 || Math.random() > 0.6) {
            this.eventQueue.push(this.triggerRandomEvent());
        }

        // تحديث المناطق الساخنة
        if (this.round % 3 === 0) {
            this.setHotZones();
        }

        // بطاقة عشوائية
        if (this.round % 4 === 0) {
            this.players.forEach(p => {
                if (!p.bankrupt && p.cards.length < 5) {
                    const card = CARDS[Math.floor(Math.random() * CARDS.length)];
                    p.cards.push({ ...card });
                }
            });
        }

        // خصم التطوير يُدار بواسطة نظام الأحداث (removeEventEffects)

        this.addLog(`--- الجولة ${this.round} - ${this.getPhase().name} ---`);
    }

    removeEventEffects(event) {
        event.effects.forEach(effect => {
            switch (effect.type) {
                case 'zone_value':
                    this.map.filter(z => z.type === effect.zoneType).forEach(z => {
                        z.tempValueBonus = (z.tempValueBonus || 0) - effect.change;
                        z.currentValue = Math.round(z.price * (1 + z.tempValueBonus));
                    });
                    break;
                case 'zone_income':
                    this.map.filter(z => z.type === effect.zoneType).forEach(z => {
                        z.tempIncomeBonus = (z.tempIncomeBonus || 0) - effect.change;
                    });
                    break;
                case 'all_value':
                    this.map.filter(z => z.price > 0).forEach(z => {
                        z.tempValueBonus = (z.tempValueBonus || 0) - effect.change;
                        z.currentValue = Math.round(z.price * (1 + z.tempValueBonus));
                    });
                    break;
                case 'upgrade_discount':
                    this.upgradeDiscount = 0;
                    break;
            }
        });
    }

    useCard(player, cardIndex, targetPlayerId) {
        if (cardIndex < 0 || cardIndex >= player.cards.length) return null;

        const card = player.cards[cardIndex];
        const target = targetPlayerId !== undefined ? this.players[targetPlayerId] : null;

        let message = '';
        if (typeof card.effect === 'function') {
            message = card.effect(this, player, target);
        }

        player.cards.splice(cardIndex, 1);
        this.addLog(`${player.name} استخدم بطاقة "${card.name}"`);

        return { card, message };
    }

    proposeTrade(fromId, toId, offer) {
        // offer: { myMoney, myProperties: [zoneIds], theirMoney, theirProperties: [zoneIds] }
        const from = this.players[fromId];
        const to = this.players[toId];

        if (from.money < offer.myMoney) return { success: false, message: 'لا يوجد مال كافٍ!' };

        this.tradeState = {
            from: fromId,
            to: toId,
            offer: offer
        };

        return { success: true, message: `تم إرسال العرض لـ ${to.name}` };
    }

    executeTrade() {
        if (!this.tradeState) return false;

        const from = this.players[this.tradeState.from];
        const to = this.players[this.tradeState.to];
        const offer = this.tradeState.offer;

        // تبادل المال
        from.money -= offer.myMoney || 0;
        to.money += offer.myMoney || 0;
        to.money -= offer.theirMoney || 0;
        from.money += offer.theirMoney || 0;

        // تبادل الأصول
        if (offer.myProperties) {
            offer.myProperties.forEach(zoneId => {
                this.map[zoneId].owner = to.id;
            });
        }
        if (offer.theirProperties) {
            offer.theirProperties.forEach(zoneId => {
                this.map[zoneId].owner = from.id;
            });
        }

        from.tradesCompleted++;
        to.tradesCompleted++;
        from.influence += 5;
        to.influence += 5;

        this.addLog(`${from.name} و ${to.name} أتمّا صفقة تجارية!`);
        this.tradeState = null;
        return true;
    }

    rejectTrade() {
        this.tradeState = null;
    }

    checkMissions(player) {
        player.missions.forEach(mission => {
            if (mission.completed) return;

            const missionDef = MISSIONS.find(m => m.id === mission.id);
            if (!missionDef) return;

            const progress = missionDef.check(player, this);
            mission.progress = progress;

            if (progress >= missionDef.target && !mission.completed) {
                mission.completed = true;
                // مكافأة
                if (missionDef.reward.money) player.money += missionDef.reward.money;
                if (missionDef.reward.influence) player.influence += missionDef.reward.influence;
                this.addLog(`🎯 ${player.name} أكمل مهمة "${mission.name}"!`);
            }
        });
    }

    getPlayerProperties(playerId) {
        return this.map.filter(z => z.owner === playerId);
    }

    calculatePlayerScore(player) {
        const properties = this.getPlayerProperties(player.id);
        let score = 0;

        // الثروة
        score += player.money;

        // قيمة الأصول
        properties.forEach(p => {
            score += p.currentValue || p.price;
            score += p.level * p.price * 0.3;
        });

        // النفوذ
        score += player.influence * 50;

        // المهمات المكتملة
        const completedMissions = player.missions.filter(m => m.completed).length;
        score += completedMissions * 1000;

        // القروض
        player.loans.forEach(l => {
            score -= l.amount;
        });

        return Math.round(score);
    }

    determineWinner() {
        const scores = this.players.map(p => ({
            player: p,
            score: this.calculatePlayerScore(p),
            wealth: p.money,
            properties: this.getPlayerProperties(p.id).length,
            influence: p.influence,
            missions: p.missions.filter(m => m.completed).length
        }));

        scores.sort((a, b) => b.score - a.score);

        // تحديد طريقة الفوز
        const winner = scores[0];
        let winMethod = 'أعلى مجموع نقاط';

        if (winner.wealth >= scores.slice(1).reduce((max, s) => Math.max(max, s.wealth), 0) * 1.5) {
            winMethod = 'أعلى ثروة مالية';
        } else if (winner.properties >= scores.slice(1).reduce((max, s) => Math.max(max, s.properties), 0) * 1.5) {
            winMethod = 'أكبر سيطرة على الأصول';
        } else if (winner.influence >= scores.slice(1).reduce((max, s) => Math.max(max, s.influence), 0) * 1.5) {
            winMethod = 'أعلى نفوذ اقتصادي';
        } else if (winner.missions > 0 && winner.missions >= scores.slice(1).reduce((max, s) => Math.max(max, s.missions), 0)) {
            winMethod = 'إكمال أكثر مهمات';
        }

        return { rankings: scores, winMethod };
    }

    endGame() {
        this.gameOver = true;
        this.addLog('🏁 انتهت المباراة!');
    }

    sellProperty(zoneId) {
        const player = this.currentPlayer;
        const zone = this.map[zoneId];
        if (!zone || zone.owner !== player.id) return { success: false, message: 'لا تملك هذا الأصل' };

        const sellPrice = Math.round((zone.currentValue || zone.price) * 0.7);
        player.money += sellPrice;
        zone.owner = null;
        zone.level = 0;

        this.addLog(`${player.name} باع "${zone.name}" بـ ${sellPrice} 💰`);
        return { success: true, message: `بعت "${zone.name}" بـ ${sellPrice} 💰`, price: sellPrice };
    }

    addLog(message) {
        this.log.push({ round: this.round, message, time: Date.now() });
        if (this.log.length > 100) this.log.shift();
    }

    getGameState() {
        return {
            round: this.round,
            maxRounds: this.maxRounds,
            phase: this.getPhase(),
            marketIndex: this.marketIndex,
            currentPlayer: this.currentPlayer,
            players: this.players,
            map: this.map,
            activeEvents: this.activeEvents,
            turnState: this.turnState,
            gameOver: this.gameOver
        };
    }
}
