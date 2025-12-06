// ====================
// GAME STATE & DATA
// ====================

// Card templates (initial cards)
const cardTemplates = [
    { templateId: 't1', cardType: 'cardA', name: 'Card A', power: 10, faction: 'Fire' },
    { templateId: 't2', cardType: 'cardB', name: 'Card B', power: 12, faction: 'Fire' },
    { templateId: 't7', cardType: 'cardG', name: 'Card G', power: 5, faction: 'Fire' },
    { templateId: 't8', cardType: 'cardH', name: 'Card H', power: 3, faction: 'Fire' },
    { templateId: 't9', cardType: 'cardI', name: 'Card I', power: 7, faction: 'Fire' },
    { templateId: 't3', cardType: 'cardC', name: 'Card C', power: 8, faction: 'Water' },
    { templateId: 't4', cardType: 'cardD', name: 'Card D', power: 15, faction: 'Earth' },
    { templateId: 't5', cardType: 'cardE', name: 'Card E', power: 9, faction: 'Wind' },
    { templateId: 't6', cardType: 'cardF', name: 'Card F', power: 16, faction: 'Fire' },
    { templateId: 't1-copy', cardType: 'cardA', name: 'Card A Copy', power: 10, faction: 'Fire' },            
    { templateId: 't2-copy', cardType: 'cardB', name: 'Card B Copy', power: 12, faction: 'Fire' },
];

// Game state
let gold = 100;
let draggedId = null;
let minigameClicks = 0;
let minigameTarget = 10;
let minigameTimer = null;
let currentSort = 'power-desc';
let showAvailableOnly = false;

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
    const cardTypes = [
        { name: 'Basic', typeId: 'basic' },
        { name: 'Simple', typeId: 'simple' },
        { name: 'Common', typeId: 'common' },
        { name: 'Standard', typeId: 'standard' },
        { name: 'Ordinary', typeId: 'ordinary' }
    ];
    
    const randomFaction = factions[Math.floor(Math.random() * factions.length)];
    const randomType = cardTypes[Math.floor(Math.random() * cardTypes.length)];
    const randomPower = Math.floor(Math.random() * 10) + 1;
    const uniqueId = 'common-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
    
    return {
        templateId: uniqueId,
        cardType: `${randomType.typeId}_${randomFaction.toLowerCase()}`,
        name: `${randomType.name} ${randomFaction}`,
        power: randomPower,
        faction: randomFaction,
        rarity: 'common'
    };
}

function generateShopCard() {
    const factions = ['Fire', 'Water', 'Earth', 'Wind'];
    const cardTypes = [
        { name: 'Mystic', typeId: 'mystic' },
        { name: 'Ancient', typeId: 'ancient' },
        { name: 'Crystal', typeId: 'crystal' },
        { name: 'Spectral', typeId: 'spectral' },
        { name: 'Royal', typeId: 'royal' },
        { name: 'Enchanted', typeId: 'enchanted' }
    ];
    
    const randomFaction = factions[Math.floor(Math.random() * factions.length)];
    const randomType = cardTypes[Math.floor(Math.random() * cardTypes.length)];
    
    // Determine rarity
    const rarityRoll = Math.random();
    let rarity, powerMultiplier, costMultiplier;
    
    if (rarityRoll < 0.6) {
        rarity = 'common';
        powerMultiplier = 1;
        costMultiplier = 1;
    } else if (rarityRoll < 0.9) {
        rarity = 'rare';
        powerMultiplier = 1.5;
        costMultiplier = 2;
    } else {
        rarity = 'epic';
        powerMultiplier = 2;
        costMultiplier = 3;
    }
    
    const basePower = Math.floor(Math.random() * 15) + 5;
    const randomPower = Math.floor(basePower * powerMultiplier);
    const uniqueId = 'shop-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    
    return {
        templateId: uniqueId,
        cardType: `${randomType.typeId}_${randomFaction.toLowerCase()}_${rarity}`,
        name: `${randomType.name} ${randomFaction}`,
        power: randomPower,
        faction: randomFaction,
        cost: Math.floor(randomPower * 2 * costMultiplier) + 20,
        rarity: rarity
    };
}

// ====================
// RENDERING FUNCTIONS
// ====================

function showCardDetail(cardData) {
    document.getElementById('card-detail-name').textContent = cardData.name;
    document.getElementById('card-detail-power').textContent = cardData.power;
    document.getElementById('card-detail-faction').textContent = cardData.faction;
    document.getElementById('card-detail-rarity').textContent = cardData.rarity || 'Common';
    document.getElementById('card-detail-type').textContent = cardData.cardType || 'Standard';
    
    // Create card preview
    const preview = document.getElementById('card-detail-preview');
    preview.innerHTML = '';
    const cardElement = document.createElement('div');
    cardElement.className = `card faction-${cardData.faction} ${cardData.rarity || ''}`;
    cardElement.style.width = '100px';
    cardElement.style.height = '150px';
    cardElement.style.transform = 'scale(1.5)';
    cardElement.innerHTML = `
        <div style="font-size: 1.2em; font-weight: bold;">${cardData.power}</div>
        <div style="font-size: 0.8em;">${cardData.faction}</div>
    `;
    preview.appendChild(cardElement);
    
    showModal('card-detail-modal');
}

function renderInventory() {
    const inventoryBar = document.getElementById('inventory-bar');
    inventoryBar.innerHTML = '';
    // Get sorted cards
    const sortedCards = sortCardsForDisplay();
    const cardsInAlbum = getCardsInAlbum();
    
    // Track if we need a separator
    const hasCardsInAlbum = cardsInAlbum.size > 0;
    const notInAlbumCount = sortedCards.filter(card => !cardsInAlbum.has(card.templateId)).length;
    
    sortedCards.forEach((cardData, displayIndex) => {
        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        cardElement.id = `instance-${cardData.originalIndex}`;
        cardElement.dataset.templateId = cardData.templateId;
        cardElement.dataset.cardType = cardData.cardType || cardData.name;
        
        // Add "in-album" class if card is already placed
        if (cardsInAlbum.has(cardData.templateId)) {
            cardElement.classList.add('in-album');
        }
        
        // Add faction color class
        cardElement.classList.add(`faction-${cardData.faction}`);
        
        // Add rarity class
        if (cardData.rarity) {
            cardElement.classList.add(cardData.rarity);
        }
        
        // Add rarity symbol
        let raritySymbol = '';
        if (cardData.rarity === 'rare') raritySymbol = '⭐';
        else if (cardData.rarity === 'epic') raritySymbol = '🌟';
        
        // Card content
        cardElement.innerHTML = `
            <div style="font-weight: bold; font-size: 1.1em;">${cardData.power}</div>
            <div style="font-size: 0.6em; margin-top: 2px;">${cardData.faction}</div>
            ${raritySymbol ? `<div style="font-size: 0.5em; margin-top: 3px;">${raritySymbol}</div>` : ''}
        `;
        
        // Card tooltip
        const location = cardsInAlbum.has(cardData.templateId) ? ' (In Album)' : ' (Available)';
        cardElement.title = `${cardData.name}${location}\nPower: ${cardData.power}\nFaction: ${cardData.faction}${cardData.rarity ? `\nRarity: ${cardData.rarity}` : ''}`;        
        // Drag and drop
        cardElement.draggable = true;
        cardElement.addEventListener('dragstart', handleDragStart);
        cardElement.addEventListener('dragend', handleDragEnd);
        
        // Click for card details (if you implement this later)
        cardElement.addEventListener('click', (e) => {
            if (e.target === cardElement) {
                // You can add card detail modal here if needed
                console.log('Card clicked:', cardData);
            }
        });
        inventoryBar.appendChild(cardElement);
        
        // Add separator between available and in-album cards
        if (hasCardsInAlbum && displayIndex === notInAlbumCount - 1 && notInAlbumCount > 0) {
            const separator = document.createElement('div');
            separator.className = 'inventory-separator';
            inventoryBar.appendChild(separator);
        }
    });
    
    // Update scroll indicators
    updateScrollIndicators();
    
    // Update inventory count
    updateInventoryCount();
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
// HELPER FUNCTIONS FOR QUADRANT VISUALS
// ====================

// Helper to clean up all quadrant visuals
function cleanQuadrantVisuals(quadrant) {
    // Remove all classes
    quadrant.classList.remove('bonus-active');
    quadrant.classList.remove('has-duplicate');
    
    // Remove all indicators
    const indicators = quadrant.querySelectorAll('.bonus-indicator, .duplicate-warning');
    indicators.forEach(indicator => indicator.remove());
}

// Helper to show bonus indicator
function showQuadrantBonus(quadrant, boostMultiplier, isSameFaction = false) {
    quadrant.classList.add('bonus-active');
    
    const bonusIndicator = document.createElement('div');
    bonusIndicator.className = 'bonus-indicator';
    bonusIndicator.textContent = `+${(boostMultiplier * 100)}%`;
    bonusIndicator.title = isSameFaction 
        ? 'All different cards & same faction +5%' 
        : 'All different cards +2%';
    quadrant.appendChild(bonusIndicator);
}

// Helper to show warning indicator
function showQuadrantWarning(quadrant, text, tooltip) {
    quadrant.classList.add('has-duplicate');
    
    const warning = document.createElement('div');
    warning.className = 'duplicate-warning';
    warning.textContent = text;
    warning.title = tooltip;
    quadrant.appendChild(warning);
}

// Helper function to get cards currently placed in album
function getCardsInAlbum() {
    const cardsInAlbum = new Set();
    
    document.querySelectorAll('.quadrant .card').forEach(cardEl => {
        const templateId = cardEl.dataset.templateId;
        cardsInAlbum.add(templateId);
    });
    
    return cardsInAlbum;
}

// ====================
// INVENTORY IMPROVEMENTS
// ====================

// Update inventory count display
function updateInventoryCount() {
    const cardsInAlbum = getCardsInAlbum();
    const availableCount = cardTemplates.filter(card => !cardsInAlbum.has(card.templateId)).length;
    document.getElementById('available-count').textContent = availableCount;
    
    // Update the full inventory count text
    const totalCards = cardTemplates.length;
    const inAlbumCount = cardsInAlbum.size;
    document.getElementById('inventory-count').textContent = 
        `(${availableCount} available, ${inAlbumCount} in album, ${totalCards} total)`;
}

// Smart card sorting function
function sortCardsForDisplay() {
    const cardsInAlbum = getCardsInAlbum();
    
    // Filter cards if "Show Available Only" is enabled
    let cardsToDisplay = [...cardTemplates];
    if (showAvailableOnly) {
        cardsToDisplay = cardsToDisplay.filter(card => !cardsInAlbum.has(card.templateId));
    }
    
    // Separate cards into two groups
    const notInAlbum = [];
    const alreadyInAlbum = [];
    
    cardsToDisplay.forEach((card, originalIndex) => {
        const cardWithIndex = { ...card, originalIndex };
        
        if (cardsInAlbum.has(card.templateId)) {
            alreadyInAlbum.push(cardWithIndex);
        } else {
            notInAlbum.push(cardWithIndex);
        }
    });
    
    // Define sorting functions
    const sortFunctions = {
        'power-desc': (a, b) => b.power - a.power,
        'power-asc': (a, b) => a.power - b.power,
        'faction': (a, b) => {
            const factions = ['Fire', 'Water', 'Earth', 'Wind'];
            const factionDiff = factions.indexOf(a.faction) - factions.indexOf(b.faction);
            return factionDiff !== 0 ? factionDiff : b.power - a.power;
        },
        'rarity': (a, b) => {
            const rarityOrder = { 'epic': 3, 'rare': 2, 'common': 1, undefined: 0 };
            const rarityDiff = (rarityOrder[b.rarity] || 0) - (rarityOrder[a.rarity] || 0);
            return rarityDiff !== 0 ? rarityDiff : b.power - a.power;
        }
    };
    
    // Get the current sort function
    const sortFunction = sortFunctions[currentSort] || sortFunctions['power-desc'];
    
    // Sort each group
    notInAlbum.sort(sortFunction);
    alreadyInAlbum.sort(sortFunction);
    
    // Return combined array (available first, then in-album)
    return [...notInAlbum, ...alreadyInAlbum];
}

// Update scroll indicators
function updateScrollIndicators() {
    const inventoryBar = document.getElementById('inventory-bar');
    const leftIndicator = document.querySelector('.left-indicator');
    const rightIndicator = document.querySelector('.right-indicator');
    const scrollHint = document.getElementById('scroll-hint');
    
    if (!inventoryBar || !leftIndicator || !rightIndicator) return;
    
    const isAtStart = inventoryBar.scrollLeft <= 10;
    const isAtEnd = inventoryBar.scrollLeft + inventoryBar.clientWidth >= inventoryBar.scrollWidth - 10;
    
    // Show/hide indicators
    leftIndicator.style.opacity = isAtStart ? '0' : '0.7';
    rightIndicator.style.opacity = isAtEnd ? '0' : '0.7';
    
    // Update scroll hint
    if (scrollHint) {
        if (isAtStart && isAtEnd) {
            scrollHint.style.display = 'none';
        } else {
            scrollHint.style.display = 'block';
            if (isAtStart) {
                scrollHint.textContent = '→ Scroll for more cards →';
            } else if (isAtEnd) {
                scrollHint.textContent = '← Scroll for more cards ←';
            } else {
                scrollHint.textContent = '← Scroll to see all cards →';
            }
        }
    }
}

// Initialize sorting controls
function initSortingControls() {
    // Power sort button (toggles between desc and asc)
    document.getElementById('sort-by-power').addEventListener('click', () => {
        if (currentSort === 'power-desc') {
            currentSort = 'power-asc';
            document.querySelector('#sort-by-power .sort-arrow').textContent = '⬆';
        } else {
            currentSort = 'power-desc';
            document.querySelector('#sort-by-power .sort-arrow').textContent = '⬇';
        }
        
        // Update active state
        document.querySelectorAll('.sort-button').forEach(btn => btn.classList.remove('active'));
        document.getElementById('sort-by-power').classList.add('active');
        
        renderInventory();
    });
    
    // Faction sort button
    document.getElementById('sort-by-faction').addEventListener('click', () => {
        currentSort = 'faction';
        
        // Update active state
        document.querySelectorAll('.sort-button').forEach(btn => btn.classList.remove('active'));
        document.getElementById('sort-by-faction').classList.add('active');
        
        renderInventory();
    });
    
    // Rarity sort button
    document.getElementById('sort-by-rarity').addEventListener('click', () => {
        currentSort = 'rarity';
        
        // Update active state
        document.querySelectorAll('.sort-button').forEach(btn => btn.classList.remove('active'));
        document.getElementById('sort-by-rarity').classList.add('active');
        
        renderInventory();
    });
    
    // Show available only toggle
    document.getElementById('show-available-only').addEventListener('click', () => {
        showAvailableOnly = !showAvailableOnly;
        
        // Update button text
        const button = document.getElementById('show-available-only');
        const textSpan = button.querySelector('.sort-text');
        textSpan.textContent = showAvailableOnly ? 'Show All' : 'Show Available';
        
        // Toggle active state
        button.classList.toggle('active', showAvailableOnly);
        
        renderInventory();
    });
    
    // Scroll indicators click handlers
    document.querySelector('.left-indicator').addEventListener('click', () => {
        const inventoryBar = document.getElementById('inventory-bar');
        inventoryBar.scrollBy({ left: -200, behavior: 'smooth' });
    });
    
    document.querySelector('.right-indicator').addEventListener('click', () => {
        const inventoryBar = document.getElementById('inventory-bar');
        inventoryBar.scrollBy({ left: 200, behavior: 'smooth' });
    });
    
    // Update indicators on scroll
    document.getElementById('inventory-bar').addEventListener('scroll', updateScrollIndicators);
    
    // Initial update
    updateScrollIndicators();
}

// Update your existing initialization
document.addEventListener('DOMContentLoaded', () => {
    // Your existing initialization code...
    
    // Add new initialization after your existing setup
    initSortingControls();
    updateInventoryCount();
    
    // Update inventory count whenever stats update
    const originalUpdateStats = updateStats;
    updateStats = function() {
        originalUpdateStats();
        updateInventoryCount();
        renderInventory(); // Re-render to update "in-album" status
    };
    
    // Initial render
    renderInventory();
});

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

    // Calculate stats for each quadrant
    document.querySelectorAll('.quadrant').forEach(quadrant => {
        const cardsInQuadrant = quadrant.querySelectorAll('.card');
        let quadrantPower = 0;
        let quadrantBoost = 0;
        
        // Clean up previous visuals FIRST
        cleanQuadrantVisuals(quadrant);
        
        // Calculate base power
        cardsInQuadrant.forEach(cardEl => {
            const templateId = cardEl.dataset.templateId;
            const cardData = cardTemplates.find(item => item.templateId === templateId);
            if (cardData) {
                quadrantPower += cardData.power;
            }
        });
        
        // Check for bonuses if we have exactly 5 cards
        if (cardsInQuadrant.length === 5) {
            const cardTypes = [];
            const cardFactions = [];
            
            // Collect card data
            cardsInQuadrant.forEach(cardEl => {
                const templateId = cardEl.dataset.templateId;
                const cardData = cardTemplates.find(item => item.templateId === templateId);
                if (cardData) {
                    cardTypes.push(cardData.cardType || cardData.name);
                    cardFactions.push(cardData.faction);
                }
            });
            
            // Check for duplicates
            const uniqueCardTypes = new Set(cardTypes);
            const hasDuplicates = uniqueCardTypes.size < 5;
            
            if (hasDuplicates) {
                // Show duplicate warning
                showQuadrantWarning(quadrant, '⚠️ Duplicates', 'This quadrant has duplicate cards - no bonus applied');
            } else {
                // All cards are different - apply 2% bonus
                quadrantBoost = 0.02;
                
                // Check if all cards have SAME faction
                const firstFaction = cardFactions[0];
                const allSameFaction = cardFactions.every(faction => faction === firstFaction);
                
                if (allSameFaction) {
                    // Upgrade to 5% bonus for different cards + same faction
                    quadrantBoost = 0.05;
                }
                
                // Apply visual bonus
                if (quadrantBoost > 0) {
                    showQuadrantBonus(quadrant, quadrantBoost, allSameFaction);
                    totalBoostPercent += (quadrantBoost * 100);
                }
            }
        } else if (cardsInQuadrant.length > 5) {
            // Too many cards warning
            showQuadrantWarning(quadrant, '❌ Too many', 'Too many cards in this quadrant - remove some');
        } else if (cardsInQuadrant.length > 0 && cardsInQuadrant.length < 5) {
            // Optional: Show "incomplete" indicator
            // Remove this if you don't want it
            showQuadrantWarning(quadrant, `${cardsInQuadrant.length}/5`, 'Need 5 cards for bonus');
        }
        
        // Calculate final power
        const boostedPower = quadrantPower * (1 + quadrantBoost);
        totalPowerSum += boostedPower;
    });

    // Update display
    document.getElementById('stat-total-power').textContent = totalPowerSum.toFixed(2);
    document.getElementById('stat-total-boost').textContent = totalBoostPercent.toFixed(0) + '%';
    
    // Update task 3 progress
    updateTaskProgress('task3', 0);

    updateInventoryCount();

// And update the inventory display if cards might have moved
    setTimeout(() => {
        renderInventory();
    }, 100);
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
                    templateId: newCard.templateId,
                    cardType: newCard.cardType, // ADD THIS LINE
                    name: newCard.name,
                    power: newCard.power,
                    faction: newCard.faction,
                    rarity: newCard.rarity
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
