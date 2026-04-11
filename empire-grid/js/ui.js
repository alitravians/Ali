/* =============================================
   Empire Grid - واجهة المستخدم
   ============================================= */

class UIController {
    constructor(game, ai) {
        this.game = game;
        this.ai = ai;
        this.selectedTradePlayer = null;
        this.selectedTradeMyAssets = [];
        this.selectedTradeTheirAssets = [];
        this.animationsEnabled = true;
        this.soundEnabled = true;
    }

    // ============ تحديث اللوحة ============
    updateGameUI() {
        if (!this.game.gameStarted) return;
        const state = this.game.getGameState();

        this.updateHeader(state);
        this.updatePlayersPanel(state);
        this.updateCityMap(state);
        this.updateActionPanel(state);
        this.updateTicker();

        if (state.gameOver) {
            this.showGameOver();
        }
    }

    updateHeader(state) {
        const phase = state.phase;
        const phaseEl = document.getElementById('phase-name');
        const phaseIcon = document.querySelector('.phase-icon');
        if (phaseEl) phaseEl.textContent = phase.name;
        if (phaseIcon) phaseIcon.textContent = phase.icon;

        const roundEl = document.getElementById('round-number');
        if (roundEl) roundEl.textContent = state.round;

        const maxRoundsEl = document.getElementById('max-rounds');
        if (maxRoundsEl) maxRoundsEl.textContent = `/ ${state.maxRounds}`;

        const marketVal = document.getElementById('market-value');
        const marketChange = document.getElementById('market-change');
        if (marketVal) marketVal.textContent = state.marketIndex;
        if (marketChange) {
            const change = state.marketIndex - 100;
            marketChange.textContent = `${change >= 0 ? '+' : ''}${change}%`;
            marketChange.className = `market-change ${change >= 0 ? 'up' : 'down'}`;
        }
    }

    updatePlayersPanel(state) {
        const panel = document.getElementById('players-panel');
        if (!panel) return;

        panel.innerHTML = state.players.map(p => {
            const props = this.game.getPlayerProperties(p.id);
            const isActive = p.id === state.currentPlayer.id;
            return `
                <div class="player-card-game ${isActive ? 'active-player' : ''}" style="border-color: ${isActive ? p.color : ''}">
                    <div class="player-header-game">
                        <span class="player-avatar-small">${p.character.avatar}</span>
                        <span class="player-name-game" style="color: ${p.color}">${p.name}</span>
                        ${p.isAI ? '<span class="player-badge">ذ.ا</span>' : ''}
                    </div>
                    <div class="player-stats-game">
                        <div class="player-stat-item">💰 <span class="stat-num">${this.formatMoney(p.money)}</span></div>
                        <div class="player-stat-item">⭐ <span class="stat-num">${p.influence}</span></div>
                        <div class="player-stat-item">🏢 <span class="stat-num">${props.length}</span></div>
                        <div class="player-stat-item">🃏 <span class="stat-num">${p.cards.length}</span></div>
                    </div>
                    ${p.loans.length > 0 ? `<div style="font-size:0.65rem;color:#ff3366;margin-top:4px;">📋 ${p.loans.length} قرض</div>` : ''}
                </div>
            `;
        }).join('');
    }

    updateCityMap(state) {
        const mapEl = document.getElementById('city-map');
        if (!mapEl) return;

        mapEl.innerHTML = state.map.map(zone => {
            const zoneType = ZONE_TYPES[zone.type] || { name: zone.type, icon: '❓', color: '#666' };
            const owner = zone.owner !== null ? state.players[zone.owner] : null;
            const playersHere = state.players.filter(p => p.position === zone.id);

            return `
                <div class="zone-tile ${zone.id === state.currentPlayer.position ? 'highlighted' : ''}"
                     data-type="${zone.type}" data-id="${zone.id}"
                     onclick="handleZoneClick(${zone.id})"
                     style="${owner ? `box-shadow: inset 0 0 20px ${owner.color}22;` : ''}">
                    
                    ${zone.level > 0 ? `
                        <div class="zone-level">
                            ${Array.from({length: 4}, (_, i) => 
                                `<div class="level-dot ${i < zone.level ? 'filled' : ''}"></div>`
                            ).join('')}
                        </div>
                    ` : ''}
                    
                    ${zone.isHot && zone.type !== 'event' && zone.type !== 'start' ? '<div class="zone-hot">🔥</div>' : ''}
                    
                    ${playersHere.length > 0 ? `
                        <div class="zone-players">
                            ${playersHere.map(p => 
                                `<div class="player-marker" style="background:${p.color}">${p.character.avatar}</div>`
                            ).join('')}
                        </div>
                    ` : ''}
                    
                    <div class="zone-icon">${zone.icon || zoneType.icon}</div>
                    <div class="zone-name">${zone.name}</div>
                    ${zone.price > 0 ? `<div class="zone-price">${this.formatMoney(zone.currentValue || zone.price)}</div>` : ''}
                    
                    ${owner ? `<div class="zone-owner-marker" style="background:${owner.color}" title="${owner.name}"></div>` : ''}
                </div>
            `;
        }).join('');
    }

    updateActionPanel(state) {
        const infoEl = document.getElementById('current-player-info');
        const player = state.currentPlayer;
        const props = this.game.getPlayerProperties(player.id);

        if (infoEl) {
            infoEl.innerHTML = `
                <div class="cp-avatar">${player.character.avatar}</div>
                <div class="cp-name" style="color:${player.color}">${player.name}</div>
                <div class="cp-role">${player.character.name}</div>
                <div class="cp-resources">
                    <div class="cp-resource res-money">
                        <div class="res-value">${this.formatMoney(player.money)}</div>
                        <div class="res-label">المال</div>
                    </div>
                    <div class="cp-resource res-influence">
                        <div class="res-value">${player.influence}</div>
                        <div class="res-label">النفوذ</div>
                    </div>
                    <div class="cp-resource res-assets">
                        <div class="res-value">${props.length}</div>
                        <div class="res-label">الأصول</div>
                    </div>
                    <div class="cp-resource res-cards">
                        <div class="res-value">${player.cards.length}</div>
                        <div class="res-label">البطاقات</div>
                    </div>
                </div>
            `;
        }

        // تحديث أزرار الإجراءات
        const rollBtn = document.getElementById('roll-dice-btn');
        const buyBtn = document.getElementById('buy-btn');
        const upgradeBtn = document.getElementById('upgrade-btn');
        const tradeBtn = document.getElementById('trade-btn');
        const cardBtn = document.getElementById('card-btn');
        const endBtn = document.getElementById('end-turn-btn');

        const isHuman = !player.isAI;
        const canRoll = state.turnState === 'waiting';
        const hasRolled = state.turnState === 'rolled' || state.turnState === 'acting';
        const currentZone = state.map[player.position];
        const canBuy = hasRolled && currentZone.owner === null && currentZone.price > 0;
        const hasProps = props.length > 0;
        const upgradable = props.some(p => p.level < 4);

        if (rollBtn) rollBtn.disabled = !isHuman || !canRoll;
        if (buyBtn) buyBtn.disabled = !isHuman || !canBuy;
        if (upgradeBtn) upgradeBtn.disabled = !isHuman || !hasRolled || !hasProps || !upgradable;
        if (tradeBtn) tradeBtn.disabled = !isHuman || !hasRolled;
        if (cardBtn) cardBtn.disabled = !isHuman || !hasRolled || player.cards.length === 0;
        if (endBtn) endBtn.disabled = !isHuman || !hasRolled;
    }

    updateTicker() {
        const ticker = document.getElementById('ticker-content');
        if (!ticker) return;

        const messages = [...TICKER_MESSAGES];
        // إضافة أحداث حالية
        this.game.activeEvents.forEach(e => {
            messages.push({ text: `⚡ ${e.name} - متبقي ${e.remainingRounds} جولة`, type: 'neutral' });
        });
        // إضافة آخر أحداث السجل
        this.game.log.slice(-5).forEach(l => {
            messages.push({ text: l.message, type: 'neutral' });
        });

        ticker.innerHTML = messages.map(m =>
            `<span class="ticker-item ${m.type}">${m.text}</span>`
        ).join('');
    }

    // ============ النوافذ المنبثقة ============
    showPropertyModal(zoneId) {
        const zone = this.game.map[zoneId];
        if (!zone) return;

        const zoneType = ZONE_TYPES[zone.type] || { name: zone.type, color: '#666' };
        const owner = zone.owner !== null ? this.game.players[zone.owner] : null;
        const player = this.game.currentPlayer;

        document.getElementById('prop-type-badge').textContent = zoneType.name;
        document.getElementById('prop-type-badge').style.background = zoneType.color + '33';
        document.getElementById('prop-type-badge').style.color = zoneType.color;
        document.getElementById('prop-name').textContent = zone.name;
        document.getElementById('prop-district').textContent = `${zoneType.icon} ${zoneType.name}`;
        document.getElementById('prop-price').textContent = this.formatMoney(this.game.getAdjustedPrice(zone));
        document.getElementById('prop-income').textContent = this.formatMoney(this.game.calculateRent(zone));
        document.getElementById('prop-level').textContent = UPGRADE_LEVELS[zone.level].name;
        document.getElementById('prop-market-value').textContent = this.formatMoney(zone.currentValue || zone.price);

        // مسار التطوير
        const upgradePath = document.getElementById('prop-upgrade-path');
        upgradePath.innerHTML = UPGRADE_LEVELS.map((lvl, i) => `
            <div class="upgrade-step ${i === zone.level ? 'current' : ''} ${i < zone.level ? 'completed' : ''}">
                <span class="upgrade-step-icon">${lvl.icon}</span>
                <span>${lvl.name}</span>
            </div>
        `).join('');

        // المالك
        const ownerInfo = document.getElementById('prop-owner-info');
        if (owner) {
            ownerInfo.innerHTML = `<span style="color:${owner.color}">👤 ${owner.name}</span>`;
        } else {
            ownerInfo.innerHTML = '<span style="color:var(--neon-green)">متاح للشراء</span>';
        }

        // الإجراءات
        const actions = document.getElementById('prop-actions');
        actions.innerHTML = '';

        if (zone.owner === null && zone.price > 0 && !player.isAI) {
            const price = this.game.getAdjustedPrice(zone);
            actions.innerHTML += `<button class="prop-buy-btn" onclick="buyProperty(${zone.id})">شراء بـ ${this.formatMoney(price)}</button>`;
        }
        if (zone.owner === player.id && zone.level < 4) {
            const nextLevel = UPGRADE_LEVELS[zone.level + 1];
            let cost = Math.round(zone.price * nextLevel.costMultiplier);
            actions.innerHTML += `<button class="prop-upgrade-btn" onclick="upgradeFromModal(${zone.id})">تطوير بـ ${this.formatMoney(cost)}</button>`;
        }
        if (zone.owner === player.id) {
            actions.innerHTML += `<button class="prop-sell-btn" onclick="sellFromModal(${zone.id})">بيع</button>`;
        }

        document.getElementById('property-modal').style.display = 'flex';
    }

    showEventModal(event) {
        document.getElementById('event-icon-large').textContent = event.icon;
        document.getElementById('event-title').textContent = event.name;
        document.getElementById('event-description').textContent = event.description;

        const effectsEl = document.getElementById('event-effects');
        effectsEl.innerHTML = event.effects.map(e => `
            <div class="event-effect-item">
                <span>${e.label}</span>
                <span class="${e.change > 0 ? 'effect-positive' : 'effect-negative'}">${e.change > 0 ? '📈' : '📉'}</span>
            </div>
        `).join('');

        document.getElementById('event-modal').style.display = 'flex';
    }

    showDiceAnimation(die1, die2, total, callback) {
        const modal = document.getElementById('dice-modal');
        const d1 = document.getElementById('dice-1');
        const d2 = document.getElementById('dice-2');
        const result = document.getElementById('dice-result');

        d1.textContent = DICE_FACES[die1 - 1];
        d2.textContent = DICE_FACES[die2 - 1];
        result.textContent = `تحرّكت ${total} خطوة`;

        modal.style.display = 'flex';

        setTimeout(() => {
            modal.style.display = 'none';
            if (callback) callback();
        }, 1500);
    }

    showTradeModal() {
        const player = this.game.currentPlayer;
        const otherPlayers = this.game.players.filter(p => p.id !== player.id && !p.bankrupt);

        // تحديث اسم اللاعب
        document.getElementById('trade-my-name').textContent = player.name;

        // عرض أصول اللاعب
        const myAssets = document.getElementById('trade-my-assets');
        const myProps = this.game.getPlayerProperties(player.id);
        myAssets.innerHTML = myProps.map(z => `
            <div class="trade-asset-item" data-zone="${z.id}" onclick="toggleTradeAsset(this, 'my', ${z.id})">
                ${z.icon} ${z.name} (${this.formatMoney(z.currentValue || z.price)})
            </div>
        `).join('') || '<p style="color:var(--text-dim);font-size:0.8rem;">لا توجد أصول</p>';

        // عرض اللاعبين الآخرين
        const selectEl = document.getElementById('trade-player-select');
        selectEl.innerHTML = otherPlayers.map(p => `
            <div class="trade-player-option" data-player="${p.id}" onclick="selectTradePlayer(${p.id})">
                <span>${p.character.avatar}</span>
                <span style="color:${p.color}">${p.name}</span>
                <span style="color:var(--text-dim);font-size:0.75rem;">${this.formatMoney(p.money)}</span>
            </div>
        `).join('');

        this.selectedTradePlayer = null;
        this.selectedTradeMyAssets = [];
        this.selectedTradeTheirAssets = [];
        document.getElementById('trade-my-money').value = 0;
        document.getElementById('trade-their-money').value = 0;
        document.getElementById('trade-their-assets').innerHTML = '';

        document.getElementById('trade-modal').style.display = 'flex';
    }

    updateTradeTheirAssets(playerId) {
        const theirAssets = document.getElementById('trade-their-assets');
        const theirProps = this.game.getPlayerProperties(playerId);
        theirAssets.innerHTML = theirProps.map(z => `
            <div class="trade-asset-item" data-zone="${z.id}" onclick="toggleTradeAsset(this, 'their', ${z.id})">
                ${z.icon} ${z.name} (${this.formatMoney(z.currentValue || z.price)})
            </div>
        `).join('') || '<p style="color:var(--text-dim);font-size:0.8rem;">لا توجد أصول</p>';
    }

    showCardsModal(player) {
        const grid = document.getElementById('cards-grid');
        if (player.cards.length === 0) {
            grid.innerHTML = '<p style="text-align:center;color:var(--text-dim);">لا توجد بطاقات</p>';
        } else {
            grid.innerHTML = player.cards.map((card, i) => `
                <div class="game-card" onclick="playCard(${i})">
                    <div class="card-icon">${card.icon}</div>
                    <div class="card-name">${card.name}</div>
                    <div class="card-desc">${card.description}</div>
                </div>
            `).join('');
        }
        document.getElementById('cards-modal').style.display = 'flex';
    }

    showMissionsModal(player) {
        const list = document.getElementById('missions-list');
        list.innerHTML = player.missions.map(m => {
            const missionDef = MISSIONS.find(md => md.id === m.id);
            const progress = m.progress || 0;
            const target = missionDef ? missionDef.target : 1;
            const pct = Math.min(100, Math.round((progress / target) * 100));

            return `
                <div class="mission-item ${m.completed ? 'completed' : ''}">
                    <div class="mission-icon">${m.icon}</div>
                    <div class="mission-info">
                        <div class="mission-name">${m.name}</div>
                        <div class="mission-desc">${m.description}</div>
                    </div>
                    <div class="mission-progress">
                        <div class="mission-progress-bar">
                            <div class="mission-progress-fill" style="width:${pct}%"></div>
                        </div>
                        <div class="mission-progress-text">${m.completed ? 'مكتملة ✓' : `${progress} / ${target}`}</div>
                    </div>
                </div>
            `;
        }).join('');

        document.getElementById('missions-modal').style.display = 'flex';
    }

    showLeaderboard() {
        const list = document.getElementById('leaderboard-list');
        const scores = this.game.players.map(p => ({
            player: p,
            score: this.game.calculatePlayerScore(p),
            props: this.game.getPlayerProperties(p.id).length
        })).sort((a, b) => b.score - a.score);

        list.innerHTML = scores.map((s, i) => `
            <div class="lb-entry">
                <div class="lb-rank">${i + 1}</div>
                <div class="lb-avatar">${s.player.character.avatar}</div>
                <div class="lb-info">
                    <div class="lb-name" style="color:${s.player.color}">${s.player.name}</div>
                    <div class="lb-details">${s.player.character.name} • ${s.props} أصل • ${s.player.influence} نفوذ</div>
                </div>
                <div class="lb-score">
                    <div class="lb-score-value">${this.formatMoney(s.score)}</div>
                    <div class="lb-score-label">مجموع النقاط</div>
                </div>
            </div>
        `).join('');

        document.getElementById('leaderboard-modal').style.display = 'flex';
    }

    showUpgradeMenu() {
        const player = this.game.currentPlayer;
        const props = this.game.getPlayerProperties(player.id).filter(p => p.level < 4);

        const list = document.getElementById('upgrade-list');
        if (props.length === 0) {
            list.innerHTML = '<p style="text-align:center;color:var(--text-dim);">لا توجد أصول قابلة للتطوير</p>';
        } else {
            list.innerHTML = props.map(zone => {
                const nextLevel = UPGRADE_LEVELS[zone.level + 1];
                let cost = Math.round(zone.price * nextLevel.costMultiplier);
                if (player.character.bonuses.upgradeCostReduction) {
                    cost = Math.round(cost * (1 - player.character.bonuses.upgradeCostReduction));
                }
                if (player.character.bonuses.upgradeCostIncrease) {
                    cost = Math.round(cost * (1 + player.character.bonuses.upgradeCostIncrease));
                }
                const canAfford = player.money >= cost;

                return `
                    <div class="upgrade-item">
                        <span style="font-size:1.5rem">${zone.icon}</span>
                        <div class="upgrade-item-info">
                            <div class="upgrade-item-name">${zone.name}</div>
                            <div class="upgrade-item-level">${UPGRADE_LEVELS[zone.level].name} → ${nextLevel.name}</div>
                        </div>
                        <span class="upgrade-item-cost">${this.formatMoney(cost)}</span>
                        <button class="upgrade-item-btn" ${canAfford ? '' : 'disabled'} onclick="upgradeFromModal(${zone.id})">تطوير</button>
                    </div>
                `;
            }).join('');
        }

        document.getElementById('upgrade-modal').style.display = 'flex';
    }

    showAuctionModal(auctionState) {
        if (!auctionState) return;

        const zone = auctionState.zone;
        document.getElementById('auction-item').innerHTML = `
            <div style="font-size:2rem;margin-bottom:8px;">${zone.icon}</div>
            <h4>${zone.name}</h4>
            <p style="color:var(--text-secondary);font-size:0.85rem;">${ZONE_TYPES[zone.type]?.name || zone.type}</p>
            <p style="color:var(--neon-gold);margin-top:8px;">القيمة: ${this.formatMoney(zone.price)}</p>
        `;
        document.getElementById('auction-current-price').textContent = this.formatMoney(auctionState.currentBid);
        document.getElementById('auction-current-bidder').textContent = auctionState.currentBidder !== null
            ? this.game.players[auctionState.currentBidder].name
            : 'لا أحد';
        document.getElementById('auction-bid-input').value = auctionState.currentBid + 200;
        document.getElementById('auction-modal').style.display = 'flex';
    }

    showTradeOffer(fromPlayer, offer) {
        const details = document.getElementById('trade-offer-details');
        let html = `<p style="color:var(--neon-cyan);margin-bottom:10px;">عرض من ${fromPlayer.name}</p>`;

        if (offer.myMoney) html += `<p>يعرض: ${this.formatMoney(offer.myMoney)} 💰</p>`;
        if (offer.myProperties && offer.myProperties.length > 0) {
            html += '<p>يعرض أصول:</p>';
            offer.myProperties.forEach(zid => {
                const z = this.game.map[zid];
                html += `<p style="color:var(--text-secondary)">• ${z.name}</p>`;
            });
        }
        if (offer.theirMoney) html += `<p style="color:var(--neon-gold);">يطلب: ${this.formatMoney(offer.theirMoney)} 💰</p>`;
        if (offer.theirProperties && offer.theirProperties.length > 0) {
            html += '<p>يطلب أصول:</p>';
            offer.theirProperties.forEach(zid => {
                const z = this.game.map[zid];
                html += `<p style="color:var(--text-secondary)">• ${z.name}</p>`;
            });
        }

        details.innerHTML = html;
        document.getElementById('trade-offer-modal').style.display = 'flex';
    }

    showGameOver() {
        const result = this.game.determineWinner();
        const winner = result.rankings[0];

        document.getElementById('winner-name').textContent = `🎉 ${winner.player.name} هو الفائز!`;

        document.getElementById('final-stats').innerHTML = `
            <div class="final-stat">
                <div class="final-stat-value">${this.formatMoney(winner.score)}</div>
                <div class="final-stat-label">مجموع النقاط</div>
            </div>
            <div class="final-stat">
                <div class="final-stat-value">${this.formatMoney(winner.wealth)}</div>
                <div class="final-stat-label">الثروة</div>
            </div>
            <div class="final-stat">
                <div class="final-stat-value">${winner.properties}</div>
                <div class="final-stat-label">الأصول</div>
            </div>
            <div class="final-stat">
                <div class="final-stat-value">${winner.influence}</div>
                <div class="final-stat-label">النفوذ</div>
            </div>
        `;

        document.getElementById('all-players-results').innerHTML = result.rankings.map((r, i) => `
            <div class="result-row">
                <span class="result-rank">${i + 1}</span>
                <span class="result-avatar">${r.player.character.avatar}</span>
                <span class="result-name" style="color:${r.player.color}">${r.player.name}</span>
                <span class="result-score">${this.formatMoney(r.score)} نقطة</span>
            </div>
        `).join('');

        document.getElementById('game-over-modal').style.display = 'flex';
    }

    showNotification(text, icon = '💡') {
        const notif = document.getElementById('notification');
        document.getElementById('notif-icon').textContent = icon;
        document.getElementById('notif-text').textContent = text;
        notif.style.display = 'block';

        setTimeout(() => {
            notif.style.display = 'none';
        }, 3000);
    }

    // ============ إعداد اللاعبين ============
    renderPlayerList(count) {
        const list = document.getElementById('player-list');
        list.innerHTML = '';

        for (let i = 0; i < count; i++) {
            const div = document.createElement('div');
            div.className = 'player-entry';
            div.innerHTML = `
                <div class="player-color" style="background:${PLAYER_COLORS[i]}"></div>
                <input type="text" value="${i === 0 ? 'أنت' : `لاعب ${i + 1}`}" data-player="${i}" placeholder="اسم اللاعب">
                <select data-player-type="${i}">
                    ${i === 0 ? '<option value="human">بشري</option><option value="ai">ذ.ا</option>' : '<option value="ai">ذ.ا</option><option value="human">بشري</option>'}
                </select>
            `;
            list.appendChild(div);
        }
    }

    renderCharacterGrid(takenIds = []) {
        const grid = document.getElementById('character-grid');
        grid.innerHTML = CHARACTERS.map(char => `
            <div class="char-card ${takenIds.includes(char.id) ? 'taken' : ''}" 
                 data-char="${char.id}" onclick="selectCharacter('${char.id}')">
                <div class="char-avatar">${char.avatar}</div>
                <div class="char-name">${char.name}</div>
                <div class="char-role">${char.ability.substring(0, 30)}...</div>
            </div>
        `).join('');
    }

    showCharacterDetail(charId) {
        const char = CHARACTERS.find(c => c.id === charId);
        if (!char) return;

        document.getElementById('char-avatar-large').textContent = char.avatar;
        document.getElementById('char-detail-name').textContent = char.name;
        document.getElementById('char-detail-desc').textContent = char.description;
        document.getElementById('char-ability').textContent = char.ability;
        document.getElementById('char-weakness').textContent = char.weakness;
        document.getElementById('selected-char-info').style.display = 'block';
    }

    // ============ مساعدات ============
    formatMoney(amount) {
        if (amount >= 10000) return (amount / 1000).toFixed(1) + 'K';
        return amount.toLocaleString('ar-SA');
    }
}
