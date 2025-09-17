// Main Tetris application

class TetrisApp {
    constructor() {
        this.game = null;
        this.renderer = null;
        this.controls = null;
        this.screens = null;
        this.highScoreManager = null;
        
        this.animationId = null;
        this.lastRenderTime = 0;
        
        this.init();
    }

    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {
        try {
            // Initialize managers
            this.highScoreManager = new HighScoreManager();
            this.screens = new TetrisScreens();
            
            // Get canvas elements
            const gameCanvas = document.getElementById('game-canvas');
            const nextCanvas = document.getElementById('next-canvas');
            
            if (!gameCanvas || !nextCanvas) {
                throw new Error('Required canvas elements not found');
            }

            // Initialize renderer
            this.renderer = new TetrisRenderer(gameCanvas, nextCanvas);
            
            // Make managers globally available
            window.tetrisApp = this;
            window.highScoreManager = this.highScoreManager;
            window.tetrisScreens = this.screens;
            window.tetrisRenderer = this.renderer;
            
            // Start render loop
            this.startRenderLoop();
            
            // Handle initial screen
            this.screens.showMenu();
            
            console.log('Tetris app initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize Tetris app:', error);
            this.showError('Failed to initialize game. Please refresh the page.');
        }
    }

    startNewGame() {
        try {
            // Stop existing game if running
            if (this.game) {
                this.game.stop();
            }

            // Create new game instance
            this.game = new TetrisGame();
            this.game.onGameOver = this.handleGameOver.bind(this);
            
            // Initialize controls
            if (this.controls) {
                this.controls.destroy();
            }
            this.controls = new TetrisControls(this.game);
            
            // Make game globally available
            window.tetrisGame = this.game;
            window.tetrisControls = this.controls;
            
            // Start the game
            this.game.start();
            
            console.log('New game started');
            
        } catch (error) {
            console.error('Failed to start new game:', error);
            this.showError('Failed to start game. Please try again.');
        }
    }

    handleGameOver(gameData) {
        console.log('Game over:', gameData);
        
        // Save high score
        if (this.highScoreManager) {
            const result = this.highScoreManager.addScore(gameData);
            console.log('High score result:', result);
        }
        
        // Show game over screen
        if (this.screens) {
            this.screens.showGameOver(gameData);
        }
        
        // Clean up controls
        if (this.controls) {
            this.controls.disable();
        }
    }

    startRenderLoop() {
        const render = (currentTime) => {
            try {
                // Calculate delta time
                const deltaTime = currentTime - this.lastRenderTime;
                this.lastRenderTime = currentTime;
                
                // Render current state
                this.render();
                
                // Schedule next frame
                this.animationId = requestAnimationFrame(render);
                
            } catch (error) {
                console.error('Render loop error:', error);
            }
        };
        
        this.animationId = requestAnimationFrame(render);
    }

    render() {
        // Only render if we have an active game and we're on the game screen
        if (this.game && this.renderer && this.screens && 
            this.screens.getCurrentScreen() === 'game') {
            
            const gameState = this.game.getGameState();
            
            // Render the game
            this.renderer.render(gameState);
            
            // Update UI elements
            this.screens.updateGameUI(gameState);
        }
    }

    showError(message) {
        // Create error display
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `
            <div class="error-content">
                <h3>⚠️ Error</h3>
                <p>${message}</p>
                <button onclick="location.reload()" class="menu-btn">Reload Page</button>
            </div>
        `;
        
        errorDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            font-family: 'Courier New', monospace;
        `;
        
        // Add error styles if not present
        if (!document.getElementById('error-styles')) {
            const styles = document.createElement('style');
            styles.id = 'error-styles';
            styles.textContent = `
                .error-content {
                    background: linear-gradient(145deg, #5e2a2a, #4e1a1a);
                    border: 2px solid #ff4444;
                    border-radius: 10px;
                    padding: 2rem;
                    text-align: center;
                    color: white;
                    max-width: 400px;
                }
                .error-content h3 {
                    color: #ff4444;
                    margin-bottom: 1rem;
                    font-size: 1.5rem;
                }
                .error-content p {
                    margin-bottom: 1.5rem;
                    line-height: 1.5;
                }
            `;
            document.head.appendChild(styles);
        }
        
        document.body.appendChild(errorDiv);
    }

    // Cleanup when app is destroyed
    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        if (this.controls) {
            this.controls.destroy();
            this.controls = null;
        }
        
        if (this.game) {
            this.game.stop();
            this.game = null;
        }
        
        // Clean up global references
        delete window.tetrisApp;
        delete window.tetrisGame;
        delete window.tetrisControls;
        delete window.highScoreManager;
        delete window.tetrisScreens;
        delete window.tetrisRenderer;
    }
}

// Handle page lifecycle
window.addEventListener('beforeunload', () => {
    if (window.tetrisApp) {
        window.tetrisApp.destroy();
    }
});

// Handle visibility changes (pause when tab is not visible)
document.addEventListener('visibilitychange', () => {
    if (window.tetrisGame && window.tetrisGame.isPlaying) {
        if (document.hidden) {
            // Pause when tab becomes hidden
            if (!window.tetrisGame.isPaused) {
                window.tetrisGame.pause();
            }
        }
    }
});

// Initialize app when script loads
document.addEventListener('DOMContentLoaded', () => {
    new TetrisApp();
});

// Also initialize immediately if DOM is already ready
if (document.readyState !== 'loading') {
    new TetrisApp();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TetrisApp;
}