/* =============================================
   Empire Grid - نقطة الدخول الرئيسية
   ============================================= */

// ============ متغيرات عامة ============
let game = new GameEngine();
let ai = new AIPlayer('medium');
let ui = new UIController(game, ai);
let playerCount = 4;
let selectedMode = 'casual';
let selectedMap = 'neon-city';
let characterSelectQueue = [];
let currentCharSelectIndex = 0;
let takenCharacters = [];
let setupPlayers = [];
let previousScreen = null;

// ============ التهيئة ============
window.addEventListener('DOMContentLoaded', () => {
    // شاشة التحميل
    setTimeout(() => {
        showScreen('main-menu');
    }, 3000);

    // إعداد قائمة اللاعبين الافتراضية
    ui.renderPlayerList(playerCount);

    // إنشاء الجسيمات
    createParticles();
});

// ============ التنقل بين الشاشات ============
function showScreen(screenId) {
    const current = document.querySelector('.screen.active');
    if (current) previousScreen = current.id;
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const screen = document.getElementById(screenId);
    if (screen) screen.classList.add('active');
}

// ============ إعدادات اللعبة ============
function selectMode(el) {
    document.querySelectorAll('.mode-card').forEach(c => c.classList.remove('selected'));
    el.classList.add('selected');
    selectedMode = el.dataset.mode;
}

function selectMap(el) {
    document.querySelectorAll('.map-card').forEach(c => c.classList.remove('selected'));
    el.classList.add('selected');
    selectedMap = el.dataset.map;
}

function changePlayerCount(delta) {
    playerCount = Math.max(2, Math.min(6, playerCount + delta));
    document.getElementById('player-count-display').textContent = playerCount;
    ui.renderPlayerList(playerCount);
}

// ============ بدء اللعبة ============
function startGame() {
    // جمع بيانات اللاعبين
    setupPlayers = [];
    for (let i = 0; i < playerCount; i++) {
        const nameInput = document.querySelector(`input[data-player="${i}"]`);
        const typeSelect = document.querySelector(`select[data-player-type="${i}"]`);
        setupPlayers.push({
            name: nameInput ? nameInput.value : `لاعب ${i + 1}`,
            isAI: typeSelect ? typeSelect.value === 'ai' : i > 0,
            characterId: null
        });
    }

    // تحديد صعوبة الذكاء الاصطناعي
    const aiDiff = document.getElementById('ai-difficulty');
    if (aiDiff) ai = new AIPlayer(aiDiff.value);

    // بدء اختيار الشخصيات
    characterSelectQueue = setupPlayers.map((p, i) => i);
    currentCharSelectIndex = 0;
    takenCharacters = [];

    // إذا كان اللاعب ذكاء اصطناعي، اختر تلقائيًا
    startCharacterSelection();
}

function startCharacterSelection() {
    if (currentCharSelectIndex >= characterSelectQueue.length) {
        // جميع اللاعبين اختاروا شخصياتهم
        launchGame();
        return;
    }

    const playerIdx = characterSelectQueue[currentCharSelectIndex];
    const player = setupPlayers[playerIdx];

    if (player.isAI) {
        // اختيار تلقائي للذكاء الاصطناعي
        const available = CHARACTERS.filter(c => !takenCharacters.includes(c.id));
        const choice = available[Math.floor(Math.random() * available.length)];
        player.characterId = choice.id;
        takenCharacters.push(choice.id);
        currentCharSelectIndex++;
        startCharacterSelection();
    } else {
        // عرض شاشة اختيار الشخصية
        document.getElementById('char-player-name').textContent = player.name;
        ui.renderCharacterGrid(takenCharacters);
        document.getElementById('confirm-char-btn').disabled = true;
        document.getElementById('selected-char-info').style.display = 'none';
        showScreen('character-select');
    }
}

function selectCharacter(charId) {
    if (takenCharacters.includes(charId)) return;

    document.querySelectorAll('.char-card').forEach(c => c.classList.remove('selected'));
    const card = document.querySelector(`.char-card[data-char="${charId}"]`);
    if (card) card.classList.add('selected');

    ui.showCharacterDetail(charId);
    document.getElementById('confirm-char-btn').disabled = false;

    // تخزين مؤقت
    window._selectedChar = charId;
}

function confirmCharacter() {
    const charId = window._selectedChar;
    if (!charId || takenCharacters.includes(charId)) return;

    const playerIdx = characterSelectQueue[currentCharSelectIndex];
    setupPlayers[playerIdx].characterId = charId;
    takenCharacters.push(charId);
    currentCharSelectIndex++;
    startCharacterSelection();
}

function launchGame() {
    game = new GameEngine();
    ui = new UIController(game, ai);

    game.initGame(setupPlayers, selectedMode, selectedMap);
    showScreen('game-screen');
    ui.updateGameUI();

    // إذا كان أول لاعب ذكاء اصطناعي
    if (game.currentPlayer.isAI) {
        setTimeout(() => processAITurn(), 1000);
    }
}

// ============ إجراءات اللعب ============
function rollDice() {
    if (game.currentPlayer.isAI) return;
    if (game.turnState !== 'waiting') return;

    const result = game.rollDice();
    if (!result) return;

    ui.showDiceAnimation(result.die1, result.die2, result.total, () => {
        game.turnState = 'acting';
        ui.updateGameUI();

        // معالجة نتيجة الهبوط
        if (result.landResult.type === 'event' && result.landResult.event) {
            ui.showEventModal(result.landResult.event);
        } else if (result.landResult.type === 'available') {
            ui.showNotification(result.landResult.message, '🏢');
        } else if (result.landResult.type === 'rent') {
            ui.showNotification(result.landResult.message, '💸');
        } else if (result.landResult.type === 'shielded') {
            ui.showNotification(result.landResult.message, '🛡️');
        } else if (result.landResult.type === 'owned') {
            ui.showNotification(result.landResult.message, '🏠');
        }
    });
}

function buyProperty(zoneId) {
    const result = game.buyProperty(zoneId);
    if (result.success) {
        ui.showNotification(result.message, '🎉');
        closeModal('property-modal');
    } else {
        ui.showNotification(result.message, '❌');
    }
    ui.updateGameUI();
}

function openUpgradeMenu() {
    ui.showUpgradeMenu();
}

function upgradeFromModal(zoneId) {
    const result = game.upgradeProperty(zoneId);
    if (result.success) {
        ui.showNotification(result.message, '⬆️');
        closeModal('upgrade-modal');
        closeModal('property-modal');
    } else {
        ui.showNotification(result.message, '❌');
    }
    ui.updateGameUI();
}

function sellFromModal(zoneId) {
    if (confirm('هل أنت متأكد من بيع هذا الأصل؟')) {
        const result = game.sellProperty(zoneId);
        ui.showNotification(result.message, result.success ? '💰' : '❌');
        closeModal('property-modal');
        ui.updateGameUI();
    }
}

function openTradeMenu() {
    ui.showTradeModal();
}

function selectTradePlayer(playerId) {
    ui.selectedTradePlayer = playerId;
    document.querySelectorAll('.trade-player-option').forEach(el => el.classList.remove('selected-trade-player'));
    const el = document.querySelector(`.trade-player-option[data-player="${playerId}"]`);
    if (el) el.classList.add('selected-trade-player');
    ui.updateTradeTheirAssets(playerId);
}

function toggleTradeAsset(el, side, zoneId) {
    el.classList.toggle('selected-trade');
    const list = side === 'my' ? ui.selectedTradeMyAssets : ui.selectedTradeTheirAssets;
    const idx = list.indexOf(zoneId);
    if (idx >= 0) list.splice(idx, 1);
    else list.push(zoneId);
}

function submitTrade() {
    if (ui.selectedTradePlayer === null) {
        ui.showNotification('اختر لاعبًا أولاً!', '❌');
        return;
    }

    const offer = {
        myMoney: parseInt(document.getElementById('trade-my-money').value) || 0,
        theirMoney: parseInt(document.getElementById('trade-their-money').value) || 0,
        myProperties: [...ui.selectedTradeMyAssets],
        theirProperties: [...ui.selectedTradeTheirAssets]
    };

    const targetPlayer = game.players[ui.selectedTradePlayer];

    if (targetPlayer.isAI) {
        // الذكاء الاصطناعي يقيّم العرض
        const accepted = ai.evaluateTrade(game, targetPlayer, offer);
        if (accepted) {
            const result = game.proposeTrade(game.currentPlayer.id, ui.selectedTradePlayer, offer);
            if (result.success) {
                game.executeTrade();
                ui.showNotification(`${targetPlayer.name} قبل الصفقة!`, '🤝');
                closeModal('trade-modal');
            } else {
                ui.showNotification(result.message, '❌');
            }
        } else {
            ui.showNotification(`${targetPlayer.name} رفض العرض!`, '🚫');
        }
    } else {
        // عرض للاعب بشري
        game.proposeTrade(game.currentPlayer.id, ui.selectedTradePlayer, offer);
        ui.showTradeOffer(game.currentPlayer, offer);
        closeModal('trade-modal');
    }

    ui.updateGameUI();
}

function respondToTrade(accepted) {
    if (accepted) {
        game.executeTrade();
        ui.showNotification('تم إتمام الصفقة!', '🤝');
    } else {
        game.rejectTrade();
        ui.showNotification('تم رفض العرض.', '🚫');
    }
    closeModal('trade-offer-modal');
    ui.updateGameUI();
}

function counterTrade() {
    game.rejectTrade();
    closeModal('trade-offer-modal');
    openTradeMenu();
}

function openCards() {
    ui.showCardsModal(game.currentPlayer);
}

function playCard(cardIndex) {
    const player = game.currentPlayer;
    if (player.isAI) return;

    const card = player.cards[cardIndex];

    // البطاقات الهجومية تحتاج هدف
    if (card.type === 'attack') {
        const targets = game.players.filter(p => p.id !== player.id && !p.bankrupt);
        if (targets.length === 0) {
            ui.showNotification('لا يوجد أهداف!', '❌');
            return;
        }
        // اختيار أقوى خصم تلقائيًا
        const target = targets.sort((a, b) => game.calculatePlayerScore(b) - game.calculatePlayerScore(a))[0];
        const result = game.useCard(player, cardIndex, target.id);
        if (result) {
            ui.showNotification(result.message, card.icon);
        }
    } else {
        const result = game.useCard(player, cardIndex);
        if (result) {
            ui.showNotification(result.message, card.icon);
        }
    }

    closeModal('cards-modal');
    ui.updateGameUI();
}

function useCard() {
    openCards();
}

function openMissions() {
    ui.showMissionsModal(game.currentPlayer);
}

function toggleLeaderboard() {
    ui.showLeaderboard();
}

function toggleSettings() {
    showScreen('settings-screen');
}

function goBack() {
    if (game.gameStarted && !game.gameOver) {
        showScreen('game-screen');
    } else if (previousScreen) {
        showScreen(previousScreen);
    } else {
        showScreen('main-menu');
    }
}

function endTurn() {
    if (game.currentPlayer.isAI) return;

    const continueGame = game.endTurn();
    ui.updateGameUI();

    if (continueGame && game.currentPlayer.isAI) {
        setTimeout(() => processAITurn(), 800);
    }
}

// ============ معالجة الأحداث ============
function handleZoneClick(zoneId) {
    const zone = game.map[zoneId];
    if (!zone || zone.type === 'start' || zone.type === 'event') return;
    if (zone.price === 0) return;
    ui.showPropertyModal(zoneId);
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function closeEventModal() {
    closeModal('event-modal');
}

// ============ المزادات ============
function placeBid() {
    const input = document.getElementById('auction-bid-input');
    const amount = parseInt(input.value) || 0;
    const player = game.currentPlayer;

    if (game.placeBid(player.id, amount)) {
        document.getElementById('auction-current-price').textContent = ui.formatMoney(amount);
        document.getElementById('auction-current-bidder').textContent = player.name;
        input.value = amount + 200;

        // باقي اللاعبين (AI) يزايدون
        processAIAuction();
    } else {
        ui.showNotification('مبلغ المزايدة غير كافٍ!', '❌');
    }
}

function passAuction() {
    const result = game.passAuction(game.currentPlayer.id);
    if (!result) {
        // passAuction didn't auto-resolve, try manually
        const manualResult = game.resolveAuction();
        if (manualResult) {
            ui.showNotification(`${manualResult.winner} فاز بالمزاد على ${manualResult.zone}!`, '🏛️');
        }
    } else {
        ui.showNotification(`${result.winner} فاز بالمزاد على ${result.zone}!`, '🏛️');
    }
    closeModal('auction-modal');
    ui.updateGameUI();
}

function processAIAuction() {
    if (!game.auctionState) return;

    game.players.forEach(p => {
        if (!game.auctionState) return;
        if (p.isAI && !p.bankrupt && !game.auctionState.passedPlayers.has(p.id)) {
            const bid = ai.evaluateAuction(game, p, game.auctionState.zone, game.auctionState.currentBid);
            if (bid) {
                game.placeBid(p.id, bid);
            } else {
                game.passAuction(p.id);
            }
        }
    });

    // تحديث الواجهة
    if (game.auctionState) {
        document.getElementById('auction-current-price').textContent = ui.formatMoney(game.auctionState.currentBid);
        document.getElementById('auction-current-bidder').textContent =
            game.auctionState.currentBidder !== null ? game.players[game.auctionState.currentBidder].name : '';
        document.getElementById('auction-bid-input').value = game.auctionState.currentBid + 200;
    } else {
        const result = game.resolveAuction();
        if (result) {
            ui.showNotification(`${result.winner} فاز بالمزاد!`, '🏛️');
        }
        closeModal('auction-modal');
        ui.updateGameUI();
    }
}

// ============ دور الذكاء الاصطناعي ============
async function processAITurn() {
    if (!game.gameStarted || game.gameOver) return;
    const player = game.currentPlayer;
    if (!player.isAI) return;

    ui.showNotification(`دور ${player.name}...`, player.character.avatar);

    // تأخير للقراءة
    await sleep(600);

    // رمي النرد
    const rollResult = game.rollDice();
    if (!rollResult) {
        game.endTurn();
        ui.updateGameUI();
        if (game.currentPlayer.isAI && !game.gameOver) {
            setTimeout(() => processAITurn(), 500);
        }
        return;
    }

    ui.showDiceAnimation(rollResult.die1, rollResult.die2, rollResult.total, async () => {
        game.turnState = 'acting';
        ui.updateGameUI();

        await sleep(500);

        // معالجة الحدث
        if (rollResult.landResult.type === 'event' && rollResult.landResult.event) {
            ui.showEventModal(rollResult.landResult.event);
            await sleep(1500);
            closeModal('event-modal');
        }

        // قرارات AI
        const decisions = await ai.makeDecision(game);
        if (decisions) {
            for (const decision of decisions) {
                switch (decision.type) {
                    case 'buy': {
                        const result = game.buyProperty(decision.zone.id);
                        if (result.success) {
                            ui.showNotification(`${player.name} اشترى "${decision.zone.name}"`, '🏢');
                            await sleep(800);
                        }
                        break;
                    }
                    case 'upgrade': {
                        const result = game.upgradeProperty(decision.zone.id);
                        if (result.success) {
                            ui.showNotification(`${player.name} طوّر "${decision.zone.name}"`, '⬆️');
                            await sleep(800);
                        }
                        break;
                    }
                    case 'card': {
                        const result = game.useCard(player, decision.cardIndex, decision.targetId);
                        if (result) {
                            ui.showNotification(`${player.name}: ${result.message}`, '🃏');
                            await sleep(800);
                        }
                        break;
                    }
                }
                ui.updateGameUI();
            }
        }

        await sleep(400);

        // إنهاء الدور
        const continueGame = game.endTurn();
        ui.updateGameUI();

        if (continueGame && game.currentPlayer.isAI) {
            setTimeout(() => processAITurn(), 600);
        }
    });
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ============ الجسيمات ============
function createParticles() {
    const container = document.getElementById('particles');
    if (!container) return;

    for (let i = 0; i < 30; i++) {
        const particle = document.createElement('div');
        particle.style.cssText = `
            position: absolute;
            width: ${Math.random() * 4 + 1}px;
            height: ${Math.random() * 4 + 1}px;
            background: ${Math.random() > 0.5 ? '#00f0ff' : '#ff00e5'};
            border-radius: 50%;
            opacity: ${Math.random() * 0.5 + 0.1};
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            animation: particleFloat ${Math.random() * 10 + 5}s linear infinite;
        `;
        container.appendChild(particle);
    }

    // إضافة CSS الحركة
    if (!document.getElementById('particle-style')) {
        const style = document.createElement('style');
        style.id = 'particle-style';
        style.textContent = `
            @keyframes particleFloat {
                0% { transform: translateY(0) translateX(0); opacity: 0; }
                20% { opacity: 0.5; }
                80% { opacity: 0.3; }
                100% { transform: translateY(-100vh) translateX(${Math.random() > 0.5 ? '' : '-'}50px); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
}

// ============ تصدير للاختبار ============
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GameEngine, AIPlayer, UIController };
}
