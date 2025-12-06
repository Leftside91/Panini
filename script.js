// ====================
// GAME STATE & DATA
// ====================

// Card templates (initial cards)
const cardTemplates = [
    { templateId: 't1', name: 'Card A', power: 10, faction: 'Fire' },
    { templateId: 't2', name: 'Card B', power: 12, faction: 'Fire' },
    { templateId: 't7', name: 'Card G', power: 5, faction: 'Fire' },
    { templateId: 't8', name: 'Card H', power: 3, faction: 'Fire' },
    { templateId: 't9', name: 'Card I', power: 7, faction: 'Fire' },
    { templateId: 't3', name: 'Card C', power: 8, faction: 'Water' },
    { templateId: 't4', name: 'Card D', power: 15, faction: 'Earth' },
    { templateId: 't5', name: 'Card E', power: 9, faction: 'Wind' },
    { templateId: 't6', name: 'Card F', power: 16, faction: 'Fire' },
    { templateId: 't1-copy', name: 'Card A Copy', power: 10, faction: 'Fire' },            
    { templateId: 't2-copy', name: 'Card B Copy', power: 12, faction: 'Fire' },
];

// Game state
let gold = 100;
let draggedId = null;
let minigameClicks = 0;
let minigameTarget = 10;
let minigameTimer = null;

const gameState = {
    dailyTasks: [],
    lastReset: Date.now(),
    cardsObtained: []
};

const dailyTasksTemplates = [
    { id: 'task1', description: 'Play 3 mini-games', target: 3, reward: 50, progress: 0, completed: false },
    { id: 'task2', description: 'Buy 2 cards from shop', target: 2, reward: 30, progress: 0, completed: false },
    { id: 'task3', description: 'Reach 500 total power', target: 500, reward: 100, progress: 0, completed: false }
];

// ====================
// CARD FUNCTIONS
// ====================

function generateCommonCard() {
    const factions = ['Fire', 'Water', 'Earth', 'Wind'];
    const commonNames = ['Basic', 'Simple', 'Common', 'Standard', 'Ordinary'];
    const randomFaction = factions[Math.floor(Math.random() * factions.length)];
    const randomPower = Math.floor(Math.random() * 10) + 1;
    const uniqueId = 'common-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
    
    return {
        templateId: uniqueId,
        name: `${commonNames[Math.floor(Math.random() * commonNames.length)]} ${randomFaction}`,
        power: randomPower,
        faction: randomFaction,
        rarity: 'common'
    };
}

function generateShopCard() {
    const factions = ['Fire', 'Water', 'Earth', 'Wind'];
    const names = ['Mystic', 'Ancient', 'Crystal', 'Spectral', 'Royal', 'Enchanted'];
    const randomFaction = factions[Math.floor(Math.random() * factions.length)];
    
    // Determine rarity with probabilities
    const rarityRoll = Math.random();
    let rarity, powerMultiplier, costMultiplier;
    
    if (rarityRoll < 0.6) { // 60% common
        rarity = 'common';
        powerMultiplier = 1;
        costMultiplier = 1;
    } else if (rarityRoll < 0.9) { // 30% rare
        rarity = 'rare';
        powerMultiplier = 1.5;
        costMultiplier = 2;
    } else { // 10% epic
        rarity = 'epic';
        powerMultiplier = 2;
        costMultiplier = 3;
    }
    
    const basePower = Math.floor(Math.random() * 15) + 5;
    const randomPower = Math.floor(basePower * powerMultiplier);
    const uniqueId = 'shop-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    
    return {
        templateId: uniqueId,
        name: `${names[Math.floor(Math.random() * names.length)]} ${randomFaction}`,
        power: randomPower,
        faction: randomFaction,
        cost: Math.floor(randomPower * 2 * costMultiplier) + 20,
        rarity: rarity
    };
}

// ====================
// RENDERING FUNCTIONS
// ====================

function renderInventory() {
    const inventoryBar = document.getElementById('inventory-bar');
    inventoryBar.innerHTML = '';

    cardTemplates.forEach((cardData, index) => {
        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        cardElement.id = `instance-${index}`;
        cardElement.dataset.templateId = cardData.templateId;
        
        // Add faction color class
        cardElement.classList.add(`faction-${cardData.faction}`);
        
        // Add rarity class if exists
        if (cardData.rarity) {
            cardElement.classList.add(cardData.rarity);
        }
        
        // Add rarity symbol
        let raritySymbol = '';
        if (cardData.rarity === 'rare') raritySymbol = '⭐';
        else if (cardData.rarity === 'epic') raritySymbol = '🌟';
        else if (cardData.rarity === 'legendary') raritySymbol = '🔥';
        
        // Card content
        cardElement.innerHTML = `
            <div>${cardData.power}</div>
            <div style="font-size: 0.6em;">${cardData.faction}</div>
            ${raritySymbol ? `<div style="font-size: 0.5em; margin-top: 2px;">${raritySymbol}</div>` : ''}
        `;
        
        // Card tooltip
        cardElement.title = `${cardData.name}\nPower: ${cardData.power}\nFaction: ${cardData.faction}${cardData.rarity ? `\nRarity: ${cardData.rarity}` : ''}`;
        
        // Drag and drop
        cardElement.draggable = true;
        cardElement.addEventListener('dragstart', handleDragStart);
        cardElement.addEventListener('dragend', handleDragEnd);
        
        inventoryBar.appendChild(cardElement);
    });
}

function renderTasks() {
    const tasksList = document.getElementById('tasks-list');
    tasksList.innerHTML = '';
    
    gameState.dailyTasks.forEach(task => {
        const taskElement = document.createElement('div');
        taskElement.className = `task-item ${task.completed ? 'completed' : ''}`;
        
        const progressPercent = Math.min((task.progress / task.target) * 100, 100);
        
        taskElement.innerHTML = `
            <div class="task-header">
                <div class="task-description">${task.description}</div>
                <div class="task-reward">${task.reward} 🪙</div>
            </div>
            <div class="task-progress">Progress: ${task.progress}/${task.target}</div>
            <div class="task-progress-bar">
                <div class="task-progress-fill" style="width: ${progressPercent}%"></div>
            </div>
        `;
        
        tasksList.appendChild(taskElement);
    });
}

// ====================
// DRAG & DROP FUNCTIONS
// ====================

function handleDragStart(e) {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', e.target.id);
    draggedId = e.target.id;
    setTimeout(() => e.target.style.opacity = '0.4', 0);
}

function handleDragEnd(e) {
    e.target.style.opacity = '1';
    draggedId = null;
    updateStats();
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handleDragEnter(e) {
    if (e.target.classList.contains('card-slot')) {
        e.target.classList.add('drag-over');
    }
}

function handleDragLeave(e) {
    if (e.target.classList.contains('card-slot')) {
        e.target.classList.remove('drag-over');
    }
}

function handleDrop(e) {
    e.preventDefault();
    const targetElement = e.target;
    targetElement.classList.remove('drag-over');
    
    if (targetElement.classList.contains('card-slot') && targetElement.children.length === 0) {
        const draggableElement = document.getElementById(draggedId);
        targetElement.appendChild(draggableElement);
        draggableElement.classList.add('new-card');
        setTimeout(() => draggableElement.classList.remove('new-card'), 500);
    } else if (targetElement.id === 'inventory-bar') {
        const draggableElement = document.getElementById(draggedId);
        targetElement.appendChild(draggableElement);
    }
    
    updateStats();
}

function setupEventListeners() {
    document.querySelectorAll('.card-slot, #inventory-bar').forEach(target => {
        target.addEventListener('dragover', handleDragOver);
        target.addEventListener('dragenter', handleDragEnter);
        target.addEventListener('dragleave', handleDragLeave);
        target.addEventListener('drop', handleDrop);
    });
}

// ====================
// STATS CALCULATION
// ====================

function updateStats() {
    let totalPowerSum = 0;
    let totalBoostPercent = 0;

    // Reset all quadrant bonuses
    document.querySelectorAll('.quadrant').forEach(quadrant => {
        quadrant.classList.remove('bonus-active');
        const existingIndicator = quadrant.querySelector('.bonus-indicator');
        if (existingIndicator) existingIndicator.remove();
    });

    // Calculate stats for each quadrant
    document.querySelectorAll('.quadrant').forEach(quadrant => {
        const cardsInQuadrant = quadrant.querySelectorAll('.card');
        
        if (cardsInQuadrant.length === 5) {
            let quadrantBasePower = 0;
            const usedTemplateIds = [];
            const cardFactions = [];

            // Collect card data
            cardsInQuadrant.forEach(cardEl => {
                const templateId = cardEl.dataset.templateId;
                const cardData = cardTemplates.find(item => item.templateId === templateId);
                if (cardData) {
                    quadrantBasePower += cardData.power;
                    usedTemplateIds.push(cardData.templateId);
                    cardFactions.push(cardData.faction);
                }
            });

            let quadrantBoostMultiplier = 0;
            let bonusText = '';

            // Check for unique templates bonus
            const areAllDifferentTemplates = new Set(usedTemplateIds).size === 5;
            if (areAllDifferentTemplates) {
                quadrantBoostMultiplier += 0.02;
                bonusText += 'Unique +2%';
                
                // Check for same faction bonus
                const firstFaction = cardFactions[0];
                const areAllSameFaction = cardFactions.every(faction => faction === firstFaction);
                if (areAllSameFaction) {
                    quadrantBoostMultiplier += 0.03;
                    bonusText += ' | Same Faction +3%';
                }
            }

            // Apply visual feedback
            if (quadrantBoostMultiplier > 0) {
                quadrant.classList.add('bonus-active');
                
                const bonusIndicator = document.createElement('div');
                bonusIndicator.className = 'bonus-indicator';
                bonusIndicator.textContent = `+${(quadrantBoostMultiplier * 100)}%`;
                bonusIndicator.title = bonusText;
                quadrant.appendChild(bonusIndicator);
            }

            const boostedPower = quadrantBasePower * (1 + quadrantBoostMultiplier);
            totalPowerSum += boostedPower;
            totalBoostPercent += (quadrantBoostMultiplier * 100);

        } else {
            // Add power of individual cards
            cardsInQuadrant.forEach(cardEl => {
                const templateId = cardEl.dataset.templateId;
                const cardData = cardTemplates.find(item => item.templateId === templateId);
                if (cardData) {
                    totalPowerSum += cardData.power;
                }
            });
        }
    });

    // Update display
    document.getElementById('stat-total-power').textContent = totalPowerSum.toFixed(2);
    document.getElementById('stat-total-boost').textContent = totalBoostPercent.toFixed(0) + '%';
    
    // Update task 3 progress
    updateTaskProgress('task3', 0);
}

// ====================
// ECONOMY SYSTEM
// ====================

function addGold(amount) {
    gold += amount;
    updateGoldDisplay();
    
    // Animation
    const goldElement = document.getElementById('gold-count');
    goldElement.classList.remove('gold-gain');
    void goldElement.offsetWidth; // Trigger reflow
    goldElement.classList.add('gold-gain');
    
    setTimeout(() => goldElement.classList.remove('gold-gain'), 500);
}

function spendGold(amount) {
    if (gold >= amount) {
        gold -= amount;
        updateGoldDisplay();
        return true;
    }
    alert('Not enough gold!');
    return false;
}

function updateGoldDisplay() {
    document.getElementById('gold-count').textContent = gold;
}

// ====================
// DAILY TASKS SYSTEM
// ====================

function initializeDailyTasks() {
    const now = Date.now();
    const hoursSinceReset = (now - gameState.lastReset) / (1000 * 60 * 60);
    
    if (hoursSinceReset >= 24) {
        gameState.dailyTasks = JSON.parse(JSON.stringify(dailyTasksTemplates));
        gameState.lastReset = now;
    } else if (gameState.dailyTasks.length === 0) {
        gameState.dailyTasks = JSON.parse(JSON.stringify(dailyTasksTemplates));
    }
    
    renderTasks();
    startResetTimer();
}

function updateTaskProgress(taskId, amount = 1) {
    const task = gameState.dailyTasks.find(t => t.id === taskId);
    if (task && !task.completed) {
        task.progress += amount;
        
        // Special handling for power task
        if (taskId === 'task3') {
            const currentPower = parseFloat(document.getElementById('stat-total-power').textContent);
            task.progress = Math.min(currentPower, task.target);
        }
        
        if (task.progress >= task.target) {
            task.completed = true;
            addGold(task.reward);
            
            // Animation
            setTimeout(() => {
                const tasks = document.querySelectorAll('.task-item');
                const taskIndex = gameState.dailyTasks.findIndex(t => t.id === taskId);
                if (tasks[taskIndex]) {
                    tasks[taskIndex].classList.add('task-completed');
                    setTimeout(() => tasks[taskIndex].classList.remove('task-completed'), 1000);
                }
            }, 100);
            
            showNotification(`Task completed! You earned ${task.reward} gold!`);
        }
        renderTasks();
    }
}

function startResetTimer() {
    function updateTimer() {
        const now = Date.now();
        const timeSinceReset = now - gameState.lastReset;
        const timeUntilReset = (24 * 60 * 60 * 1000) - timeSinceReset;
        
        if (timeUntilReset <= 0) {
            initializeDailyTasks();
            return;
        }
        
        const hours = Math.floor(timeUntilReset / (1000 * 60 * 60));
        const minutes = Math.floor((timeUntilReset % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeUntilReset % (1000 * 60)) / 1000);
        
        document.getElementById('reset-timer').textContent = 
            `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    setInterval(updateTimer, 1000);
    updateTimer();
}

// ====================
// SHOP SYSTEM
// ====================

function openShop() {
    const shopCardsContainer = document.getElementById('shop-cards');
    shopCardsContainer.innerHTML = '';
    
    // Generate 3 random cards for shop
    for (let i = 0; i < 3; i++) {
        const card = generateShopCard();
        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        cardElement.classList.add(`faction-${card.faction}`, card.rarity);
        cardElement.style.cursor = 'pointer';
        cardElement.style.transform = 'scale(1.2)';
        
        // Rarity symbol
        let raritySymbol = '';
        if (card.rarity === 'rare') raritySymbol = '⭐';
        else if (card.rarity === 'epic') raritySymbol = '🌟';
        
        cardElement.innerHTML = `
            <div>${card.power}</div>
            <div style="font-size: 0.6em;">${card.faction}</div>
            ${raritySymbol ? `<div style="font-size: 0.5em;">${raritySymbol}</div>` : ''}
            <div style="font-size: 0.5em; margin-top: 5px; color: gold;">${card.cost} 🪙</div>
        `;
        
        cardElement.title = `${card.name}\nPower: ${card.power}\nFaction: ${card.faction}\nRarity: ${card.rarity}\nCost: ${card.cost} gold`;
        
        cardElement.addEventListener('click', () => {
            if (spendGold(card.cost)) {
                // Add to inventory
                cardTemplates.push({
                    templateId: card.templateId,
                    name: card.name,
                    power: card.power,
                    faction: card.faction,
                    rarity: card.rarity
                });
                
                renderInventory();
                updateStats();
                updateTaskProgress('task2', 1);
                showNotification(`Purchased ${card.name}!`);
                openShop(); // Refresh shop
            }
        });
        
        shopCardsContainer.appendChild(cardElement);
    }
    
    showModal('shop-modal');
}

// ====================
// MINI-GAME SYSTEM
// ====================

function openMiniGame() {
    minigameClicks = 0;
    document.getElementById('minigame-counter').textContent = minigameTarget;
    document.getElementById('minigame-result').textContent = '';
    document.getElementById('minigame-click').disabled = false;
    
    // Auto-close after 30 seconds
    clearTimeout(minigameTimer);
    minigameTimer = setTimeout(() => {
        if (document.getElementById('minigame-modal').style.display === 'block') {
            closeMiniGame();
            showNotification('Time\'s up! Try again!');
        }
    }, 30000);
    
    showModal('minigame-modal');
}

function handleMiniGameClick() {
    minigameClicks++;
    document.getElementById('minigame-counter').textContent = minigameTarget - minigameClicks;
    
    // Button click effect
    const button = document.getElementById('minigame-click');
    button.style.transform = 'scale(0.95)';
    setTimeout(() => button.style.transform = 'scale(1)', 100);
    
    if (minigameClicks >= minigameTarget) {
        // Player wins
        clearTimeout(minigameTimer);
        document.getElementById('minigame-result').innerHTML = '<span style="color: green; font-weight: bold;">You won!</span>';
        
        // Update task progress
        updateTaskProgress('task1', 1);
        
        // Reward gold
        const goldReward = 20;
        addGold(goldReward);
        
        // Chance to drop a common card (30% chance)
        if (Math.random() < 0.3) {
            const commonCard = generateCommonCard();
            cardTemplates.push(commonCard);
            renderInventory();
            updateStats();
            document.getElementById('minigame-result').innerHTML += 
                `<br><span style="color: blue;">🎉 You found a ${commonCard.name}!</span>`;
        } else {
            document.getElementById('minigame-result').innerHTML += 
                `<br><span>💰 You earned ${goldReward} gold!</span>`;
        }
        
        // Disable button and auto-close
        document.getElementById('minigame-click').disabled = true;
        setTimeout(() => {
            closeMiniGame();
        }, 3000);
    }
}

// ====================
// UI UTILITY FUNCTIONS
// ====================

function showModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
    document.getElementById('modal-overlay').style.display = 'block';
}

function hideModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    document.getElementById('modal-overlay').style.display = 'none';
}

function closeMiniGame() {
    hideModal('minigame-modal');
}

function closeShop() {
    hideModal('shop-modal');
}

function showNotification(message) {
    // Simple notification (could be enhanced with a proper notification system)
    console.log('Notification:', message);
    // For now, just log and alert
    alert(message);
}

// ====================
// INITIALIZATION
// ====================

document.addEventListener('DOMContentLoaded', () => {
    // Initialize game systems
    renderInventory();
    setupEventListeners();
    updateStats();
    initializeDailyTasks();
    updateGoldDisplay();
    
    // Event listeners for buttons
    document.getElementById('buy-random-card').addEventListener('click', () => {
        if (spendGold(50)) {
            const newCard = generateShopCard();
            cardTemplates.push({
                templateId: newCard.templateId,
                name: newCard.name,
                power: newCard.power,
                faction: newCard.faction,
                rarity: newCard.rarity
            });
            renderInventory();
            updateStats();
            updateTaskProgress('task2', 1);
            showNotification(`You bought a ${newCard.name}!`);
        }
    });
    
    document.getElementById('play-minigame').addEventListener('click', openMiniGame);
    document.getElementById('open-shop').addEventListener('click', openShop);
    document.getElementById('minigame-click').addEventListener('click', handleMiniGameClick);
    document.getElementById('close-minigame').addEventListener('click', closeMiniGame);
    document.getElementById('close-shop').addEventListener('click', closeShop);
    
    // Close modals when clicking overlay
    document.getElementById('modal-overlay').addEventListener('click', () => {
        closeMiniGame();
        closeShop();
    });
    
    // Prevent modal close when clicking inside modal
    document.querySelectorAll('.modal-content').forEach(modal => {
        modal.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    });
    
    console.log('Game initialized successfully! 🎮');
});
