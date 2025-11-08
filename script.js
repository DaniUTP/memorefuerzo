// Variables globales del juego
        let gameState = {
            currentScreen: 'welcome',
            level: 1,
            cards: [],
            flippedCards: [],
            matchedPairs: 0,
            moves: 0,
            timer: 0,
            timerInterval: null,
            gameStarted: false
        };

        // Sistema de puntos
        let playerPoints = 0;
        let playerAbilities = [];

        // Habilidades disponibles
        const abilities = [
            {
                id: 'vision-rayos-x',
                name: 'Visión Rayos X',
                description: 'Muestra todas las cartas al inicio por 3 segundos',
                cost: 40,
                icon: 'fas fa-eye'
            },
            {
                id: 'tiempo-extra',
                name: 'Tiempo Extra',
                description: '+30 segundos en el temporizador',
                cost: 30,
                icon: 'fas fa-clock'
            },
            {
                id: 'doble-puntos',
                name: 'Doble Puntos',
                description: 'Gana el doble de puntos en cada partida',
                cost: 75,
                icon: 'fas fa-gem'
            },
            {
                id: 'memoria-mejorada',
                name: 'Memoria Mejorada',
                description: 'Las cartas permanecen visibles por más tiempo',
                cost: 50,
                icon: 'fas fa-camera'
            }
        ];

        // Sistema de sonidos
        const sounds = {
            inicio: new Audio('sonido/inicio.mp3'),
            movCarta: new Audio('sonido/movCarta.mp3'),
            result: new Audio('sonido/result.mp3'),
            buy: new Audio('sonido/buy.mp3')
        };

        // Configurar sonidos
        Object.values(sounds).forEach(sound => {
            sound.preload = 'auto';
            sound.volume = 0.7;
        });

        // Inicialización del juego
        document.addEventListener('DOMContentLoaded', function() {
            console.log("🎮 Inicializando MemoRefuerzo...");
            
            resetGameData();
            updatePointsDisplay();
            loadAbilities();
            
            // Event listeners con sonidos
            document.getElementById('start-btn').addEventListener('click', function() {
                sounds.inicio.play();
                showLevelSelect();
            });
            
            document.getElementById('shop-btn').addEventListener('click', showShop);
            document.getElementById('shop-btn-2').addEventListener('click', showShop);
            document.getElementById('shop-btn-3').addEventListener('click', showShop);
            document.getElementById('back-btn').addEventListener('click', showWelcome);
            document.getElementById('back-from-shop').addEventListener('click', showWelcome);
            document.getElementById('restart-btn').addEventListener('click', restartGame);
            document.getElementById('play-again-btn').addEventListener('click', playAgain);
            document.getElementById('new-level-btn').addEventListener('click', showLevelSelect);
            
            // Niveles
            const levelCards = document.querySelectorAll('.level-card');
            levelCards.forEach((card, index) => {
                if (!card.hasAttribute('data-level')) {
                    card.setAttribute('data-level', index + 1);
                }
                
                card.addEventListener('click', function() {
                    const level = Number.parseInt(this.getAttribute('data-level'));
                    console.log("🎯 Nivel seleccionado:", level);
                    startGame(level);
                });
            });
            
            console.log("✅ Juego inicializado - Puntos: 0");
        });

        // Funciones de navegación
        function showScreen(screenId) {
            document.querySelectorAll('.screen').forEach(screen => {
                screen.classList.remove('active');
            });
            document.getElementById(screenId).classList.add('active');
            gameState.currentScreen = screenId;
            
            if (screenId === 'shop-screen') {
                updateShopPoints();
                loadAbilities();
            }
        }

        function showWelcome() { showScreen('welcome-screen'); }
        function showLevelSelect() { 
            showScreen('level-select-screen');
            document.getElementById('level-points').textContent = playerPoints;
        }
        function showGame() { showScreen('game-screen'); }
        function showResults() { 
            showScreen('results-screen');
            sounds.result.play(); // Sonido al mostrar resultados
        }
        function showShop() { showScreen('shop-screen'); }

        // Funciones del juego
        function startGame(level) {
            console.log("🎯 Iniciando nivel", level);
            
            gameState.level = level;
            gameState.matchedPairs = 0;
            gameState.moves = 0;
            gameState.timer = 0;
            gameState.flippedCards = [];
            gameState.gameStarted = false;
            
            document.getElementById('moves-count').textContent = gameState.moves;
            document.getElementById('timer').textContent = gameState.timer;
            document.getElementById('game-points').textContent = playerPoints;
            
            createGameBoard(level);
            
            applyActiveAbilities();

            showGame();
            startTimer();
        }

        function createGameBoard(level) {
            const gameBoard = document.getElementById('game-board');
            gameBoard.innerHTML = '';
            
            let cardCount;
            switch(level) {
                case 1: cardCount = 4; break;
                case 2: cardCount = 8; break;
                case 3: cardCount = 12; break;
                default: cardCount = 8;
            }
            
            console.log(`🃏 Creando tablero con ${cardCount} cartas para nivel ${level}`);
            
            if (level === 1) {
                gameBoard.style.gridTemplateColumns = 'repeat(2, 1fr)';
                gameBoard.style.maxWidth = '300px';
            } else if (level === 2) {
                gameBoard.style.gridTemplateColumns = 'repeat(4, 1fr)';
                gameBoard.style.maxWidth = '500px';
            } else {
                gameBoard.style.gridTemplateColumns = 'repeat(4, 1fr)';
                gameBoard.style.maxWidth = '500px';
            }
            
            const symbols = ['🍎', '🍌', '🍒', '🍇', '🍊', '🍓', '🥝', '🍑', '🍍', '🥭', '🍉', '🫐'];
            const selectedSymbols = symbols.slice(0, cardCount / 2);
            const cardSymbols = [...selectedSymbols, ...selectedSymbols];
            
            shuffleArray(cardSymbols);
            
            gameState.cards = [];
            cardSymbols.forEach((symbol, index) => {
                const card = document.createElement('div');
                card.className = 'card';
                card.dataset.index = index;
                card.dataset.symbol = symbol;
                
                card.addEventListener('click', () => flipCard(card));
                gameBoard.appendChild(card);
                
                gameState.cards.push({
                    element: card,
                    symbol: symbol,
                    flipped: false,
                    matched: false
                });
            });
            
            console.log(`✅ Tablero creado con ${gameState.cards.length} cartas`);
        }

        function applyActiveAbilities() {
            if (playerAbilities.includes('vision-rayos-x')) {
                console.log("🔍 Aplicando Visión Rayos X");
                showAllCardsTemporarily();
            }
        }

        function showAllCardsTemporarily() {
            gameState.cards.forEach(card => {
                card.element.classList.add('flipped');
                card.element.textContent = card.symbol;
            });
            
            setTimeout(() => {
                gameState.cards.forEach(card => {
                    if (!card.matched) {
                        card.element.classList.remove('flipped');
                        card.element.textContent = '';
                    }
                });
            }, 3000);
        }

        function flipCard(card) {
            const index = parseInt(card.dataset.index);
            const cardData = gameState.cards[index];
            
            if (cardData.flipped || cardData.matched || gameState.flippedCards.length >= 2) {
                return;
            }
            
            if (!gameState.gameStarted) {
                gameState.gameStarted = true;
            }

            // Sonido al mover carta
            sounds.movCarta.play();
            
            cardData.flipped = true;
            card.classList.add('flipped');
            card.textContent = cardData.symbol;
            gameState.flippedCards.push(cardData);
            
            if (gameState.flippedCards.length === 2) {
                gameState.moves++;
                document.getElementById('moves-count').textContent = gameState.moves;

                const delay = playerAbilities.includes('memoria-mejorada') ? 1000 : 500;
                setTimeout(checkMatch, delay);
            }
        }

        function checkMatch() {
            const [card1, card2] = gameState.flippedCards;
            
            if (card1.symbol === card2.symbol) {
                card1.matched = true;
                card2.matched = true;
                card1.element.classList.add('matched');
                card2.element.classList.add('matched');
                gameState.matchedPairs++;
                
                if (gameState.matchedPairs === gameState.cards.length / 2) {
                    endGame();
                }
            } else {
                card1.flipped = false;
                card2.flipped = false;
                card1.element.classList.remove('flipped');
                card2.element.classList.remove('flipped');
                card1.element.textContent = '';
                card2.element.textContent = '';
            }
            
            gameState.flippedCards = [];
        }

        function endGame() {
            clearInterval(gameState.timerInterval);
            
            const basePoints = {1: 10, 2: 25, 3: 50};
            let pointsEarned = basePoints[gameState.level] || 10;
            
            const totalPairs = gameState.cards.length / 2;
            const efficiency = totalPairs / gameState.moves;
            if (efficiency > 0.8) pointsEarned = Math.round(pointsEarned * 1.5);
            else if (efficiency > 0.6) pointsEarned = Math.round(pointsEarned * 1.25);
            
            if (playerAbilities.includes('doble-puntos')) {
                pointsEarned *= 2;
                console.log("💰 Doble puntos aplicado. Puntos ganados:", pointsEarned);
            }

            playerPoints += pointsEarned;
            saveGameData();
            
            document.getElementById('earned-points').textContent = pointsEarned;
            document.getElementById('result-level').textContent = getLevelName(gameState.level);
            document.getElementById('result-moves').textContent = gameState.moves;
            document.getElementById('result-time').textContent = gameState.timer;
            document.getElementById('result-efficiency').textContent = Math.round((totalPairs / gameState.moves) * 100);
            
            showResults();
        }

        function restartGame() {
            clearInterval(gameState.timerInterval);
            startGame(gameState.level);
        }

        function playAgain() {
            startGame(gameState.level);
        }

        function startTimer() {
            clearInterval(gameState.timerInterval);
            gameState.timer = 0;
            
            if (playerAbilities.includes('tiempo-extra')) {
                gameState.timer = -30;
                console.log("⏰ Tiempo extra aplicado");
            }
            
            document.getElementById('timer').textContent = gameState.timer;
            
            gameState.timerInterval = setInterval(() => {
                gameState.timer++;
                document.getElementById('timer').textContent = gameState.timer;
            }, 1000);
        }

        function resetGameData() {
            playerPoints = 0;
            playerAbilities = [];
            saveGameData();
            console.log("🔄 Datos reseteados - Puntos: 0");
        }

        function loadGameData() {
            const savedData = localStorage.getItem('memoRefuerzoData');
            
            if (savedData) {
                try {
                    const data = JSON.parse(savedData);
                    playerPoints = data.points || 0;
                    playerAbilities = data.abilities || [];
                } catch (e) {
                    console.error("Error al cargar datos, reseteando...");
                    resetGameData();
                }
            } else {
                resetGameData();
            }
        }

        function saveGameData() {
            const data = {
                points: playerPoints,
                abilities: playerAbilities
            };
            localStorage.setItem('memoRefuerzoData', JSON.stringify(data));
        }

        function updatePointsDisplay() {
            document.getElementById('points-value').textContent = playerPoints;
            document.getElementById('game-points').textContent = playerPoints;
            document.getElementById('level-points').textContent = playerPoints;
        }

        function updateShopPoints() {
            document.getElementById('shop-points').textContent = playerPoints;
        }

        function loadAbilities() {
            const abilitiesGrid = document.getElementById('abilities-grid');
            abilitiesGrid.innerHTML = '';
            
            abilities.forEach(ability => {
                const isOwned = playerAbilities.includes(ability.id);
                const canAfford = playerPoints >= ability.cost;
                
                const abilityCard = document.createElement('div');
                abilityCard.className = `ability-card ${isOwned ? 'owned' : ''}`;
                abilityCard.innerHTML = `
                    <div class="ability-header">
                        <div class="ability-name">
                            <i class="${ability.icon}"></i> ${ability.name}
                        </div>
                        <div class="ability-cost">${ability.cost} pts</div>
                    </div>
                    <div class="ability-description">${ability.description}</div>
                    <div class="ability-action">
                        ${isOwned 
                            ? '<button class="ability-btn" disabled><i class="fas fa-check"></i> Ya comprado</button>'
                            : `<button class="ability-btn" onclick="buyAbility('${ability.id}', ${ability.cost})" 
                                  ${!canAfford ? 'disabled' : ''}>
                                  <i class="fas fa-shopping-cart"></i> ${canAfford ? 'Comprar' : 'Puntos insuficientes'}
                               </button>`
                        }
                    </div>
                `;
                
                abilitiesGrid.appendChild(abilityCard);
            });
        }

        function buyAbility(abilityId, cost) {
            console.log("🛒 Intentando comprar:", abilityId, "Costo:", cost, "Puntos:", playerPoints);
            
            if (playerPoints >= cost) {
                if (!playerAbilities.includes(abilityId)) {
                    playerPoints -= cost;
                    playerAbilities.push(abilityId);
                    saveGameData();
                    updatePointsDisplay();
                    updateShopPoints();
                    loadAbilities();
                    
                    // Sonido al comprar habilidad
                    sounds.buy.play();
                    
                    showPurchaseMessage('¡Habilidad comprada exitosamente!', 'success');
                    console.log("✅ Habilidad comprada:", abilityId);
                } else {
                    showPurchaseMessage('Ya tienes esta habilidad', 'error');
                }
            } else {
                showPurchaseMessage('Puntos insuficientes', 'error');
            }
        }

        function showPurchaseMessage(message, type) {
            const messageElement = document.getElementById('purchase-message');
            messageElement.textContent = message;
            messageElement.className = `purchase-message ${type}`;
            messageElement.style.display = 'block';
            
            setTimeout(() => {
                messageElement.style.display = 'none';
            }, 3000);
        }

        function shuffleArray(array) {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
            return array;
        }

        function getLevelName(level) {
            switch(level) {
                case 1: return 'Fácil';
                case 2: return 'Medio';
                case 3: return 'Difícil';
                default: return 'Desconocido';
            }
        }

        window.buyAbility = buyAbility;
