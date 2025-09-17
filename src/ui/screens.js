// Screen management for different game states

class TetrisScreens {
    constructor() {
        this.currentScreen = 'menu';
        this.screens = {
            menu: document.getElementById('menu-screen'),
            game: document.getElementById('game-screen'),
            highscores: document.getElementById('highscores-screen'),
            gameover: document.getElementById('gameover-screen')
        };
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Menu buttons
        const playBtn = document.getElementById('play-btn');
        const highscoresBtn = document.getElementById('highscores-btn');
        
        if (playBtn) {
            playBtn.addEventListener('click', () => this.startGame());
        }
        
        if (highscoresBtn) {
            highscoresBtn.addEventListener('click', () => this.showHighScores());
        }

        // High scores screen
        const backToMenu = document.getElementById('back-to-menu');
        if (backToMenu) {
            backToMenu.addEventListener('click', () => this.showMenu());
        }

        // Game screen
        const backToMenuGame = document.getElementById('back-to-menu-game');
        if (backToMenuGame) {
            backToMenuGame.addEventListener('click', () => this.exitGame());
        }

        // Game over screen
        const playAgainBtn = document.getElementById('play-again-btn');
        const menuBtnGameover = document.getElementById('menu-btn-gameover');
        
        if (playAgainBtn) {
            playAgainBtn.addEventListener('click', () => this.startGame());
        }
        
        if (menuBtnGameover) {
            menuBtnGameover.addEventListener('click', () => this.showMenu());
        }
    }

    showScreen(screenName) {
        // Hide all screens
        Object.values(this.screens).forEach(screen => {
            if (screen) {
                screen.classList.remove('active');
            }
        });
        
        // Show requested screen
        if (this.screens[screenName]) {
            this.screens[screenName].classList.add('active');
            this.currentScreen = screenName;
            
            // Handle screen-specific setup
            this.onScreenChange(screenName);
        }
    }

    onScreenChange(screenName) {
        switch (screenName) {
            case 'menu':
                this.stopMusic();
                break;
            case 'game':
                this.startMusic();
                break;
            case 'highscores':
                this.updateHighScoresDisplay();
                break;
            case 'gameover':
                this.stopMusic();
                break;
        }
    }

    showMenu() {
        this.showScreen('menu');
        
        // Stop game if running
        if (window.tetrisGame) {
            window.tetrisGame.stop();
        }
    }

    showGame() {
        this.showScreen('game');
    }

    showHighScores() {
        this.showScreen('highscores');
    }

    showGameOver(gameData) {
        // Update game over screen with final scores
        this.updateGameOverDisplay(gameData);
        this.showScreen('gameover');
    }

    startGame() {
        this.showGame();
        
        // Initialize and start game
        if (window.tetrisApp) {
            window.tetrisApp.startNewGame();
        }
    }

    exitGame() {
        if (window.tetrisGame && window.tetrisGame.isPlaying) {
            const confirmExit = confirm('Are you sure you want to exit the current game?');
            if (!confirmExit) {
                return;
            }
        }
        
        this.showMenu();
    }

    updateHighScoresDisplay() {
        const scoresList = document.getElementById('scores-list');
        if (!scoresList || !window.highScoreManager) return;

        const scores = window.highScoreManager.getScores();
        
        if (scores.length === 0) {
            scoresList.innerHTML = '<p style="color: #666; text-align: center; padding: 2rem;">No high scores yet.<br>Play a game to set your first score!</p>';
            return;
        }

        let html = '';
        scores.forEach((score, index) => {
            const rank = index + 1;
            const rankSuffix = this.getRankSuffix(rank);
            const date = window.highScoreManager.formatDate(score.date);
            const formattedScore = window.highScoreManager.formatScore(score.score);
            
            html += `
                <div class="score-entry">
                    <span class="rank">${rank}${rankSuffix}</span>
                    <span class="score-details">
                        <div class="score">${formattedScore}</div>
                        <div class="score-meta">Level ${score.level} • ${score.lines} lines</div>
                        <div class="score-date">${date}</div>
                    </span>
                </div>
            `;
        });

        scoresList.innerHTML = html;
    }

    updateGameOverDisplay(gameData) {
        const finalScore = document.getElementById('final-score');
        const finalLines = document.getElementById('final-lines');
        
        if (finalScore) {
            finalScore.textContent = gameData.score.toLocaleString();
        }
        
        if (finalLines) {
            finalLines.textContent = gameData.lines.toLocaleString();
        }

        // Check if it's a high score and show message
        if (window.highScoreManager && window.highScoreManager.isHighScore(gameData.score)) {
            const result = window.highScoreManager.addScore(gameData);
            if (result.isNewHighScore) {
                this.showHighScoreMessage(result.rank);
            }
        }
    }

    showHighScoreMessage(rank) {
        // Create and show high score notification
        const message = document.createElement('div');
        message.className = 'high-score-message';
        message.innerHTML = `
            <div class="high-score-content">
                <h3>🎉 NEW HIGH SCORE! 🎉</h3>
                <p>You ranked #${rank}!</p>
            </div>
        `;
        
        // Style the message
        message.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(145deg, #2a2a5e, #1a1a4e);
            border: 3px solid #00ff88;
            border-radius: 10px;
            padding: 2rem;
            text-align: center;
            z-index: 1000;
            animation: highScorePulse 2s ease-in-out infinite;
            box-shadow: 0 0 30px rgba(0, 255, 136, 0.5);
        `;

        // Add animation styles if not already present
        if (!document.getElementById('high-score-styles')) {
            const styles = document.createElement('style');
            styles.id = 'high-score-styles';
            styles.textContent = `
                @keyframes highScorePulse {
                    0%, 100% { transform: translate(-50%, -50%) scale(1); }
                    50% { transform: translate(-50%, -50%) scale(1.05); }
                }
                .high-score-content h3 {
                    color: #00ff88;
                    margin-bottom: 0.5rem;
                    text-shadow: 0 0 10px #00ff88;
                }
                .high-score-content p {
                    color: white;
                    font-size: 1.2rem;
                    margin: 0;
                }
            `;
            document.head.appendChild(styles);
        }

        document.body.appendChild(message);

        // Remove after 3 seconds
        setTimeout(() => {
            if (message.parentNode) {
                message.parentNode.removeChild(message);
            }
        }, 3000);
    }

    getRankSuffix(rank) {
        const lastDigit = rank % 10;
        const lastTwoDigits = rank % 100;
        
        if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
            return 'th';
        }
        
        switch (lastDigit) {
            case 1: return 'st';
            case 2: return 'nd';
            case 3: return 'rd';
            default: return 'th';
        }
    }

    updateGameUI(gameState) {
        // Update score display
        const currentScore = document.getElementById('current-score');
        const linesCleared = document.getElementById('lines-cleared');
        const currentLevel = document.getElementById('current-level');
        
        if (currentScore) {
            currentScore.textContent = gameState.score.toLocaleString();
        }
        
        if (linesCleared) {
            linesCleared.textContent = gameState.lines.toLocaleString();
        }
        
        if (currentLevel) {
            currentLevel.textContent = gameState.level;
        }

        // Update pause button text
        const pauseBtn = document.getElementById('pause-btn');
        if (pauseBtn) {
            pauseBtn.textContent = gameState.isPaused ? 'RESUME' : 'PAUSE';
        }
    }

    startMusic() {
        const music = document.getElementById('tetris-music');
        if (music) {
            music.volume = 0.3; // Set volume to 30%
            music.currentTime = 0; // Reset to beginning
            music.play().catch(error => {
                console.warn('Could not play music:', error);
            });
        }
    }

    stopMusic() {
        const music = document.getElementById('tetris-music');
        if (music) {
            music.pause();
        }
    }

    getCurrentScreen() {
        return this.currentScreen;
    }

    // Handle responsive design changes
    handleResize() {
        // Adjust UI elements based on screen size
        if (window.innerWidth <= 768) {
            document.body.classList.add('mobile');
        } else {
            document.body.classList.remove('mobile');
        }
    }
}

// Handle window resize
window.addEventListener('resize', () => {
    if (window.tetrisScreens) {
        window.tetrisScreens.handleResize();
    }
    
    if (window.tetrisRenderer) {
        window.tetrisRenderer.handleResize();
    }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TetrisScreens;
}