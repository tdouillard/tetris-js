// Game controls handler for keyboard and touch input

class TetrisControls {
    constructor(game) {
        this.game = game;
        this.keyBindings = {
            'ArrowLeft': 'moveLeft',
            'ArrowRight': 'moveRight',
            'ArrowDown': 'softDrop',
            'ArrowUp': 'rotate',
            ' ': 'hardDrop', // Spacebar
            'Space': 'hardDrop',
            'KeyP': 'pause',
            'Escape': 'pause'
        };
        
        this.touchControls = {};
        this.keyStates = {};
        this.repeatDelay = 150; // Initial delay before repeating
        this.repeatRate = 50;   // Rate of repetition
        
        this.setupKeyboardControls();
        this.setupTouchControls();
        this.setupMobileButtons();
    }

    setupKeyboardControls() {
        // Keyboard event listeners
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('keyup', this.handleKeyUp.bind(this));
        
        // Prevent default behavior for game keys
        document.addEventListener('keydown', (event) => {
            if (this.keyBindings[event.code] || this.keyBindings[event.key]) {
                event.preventDefault();
            }
        });
    }

    setupTouchControls() {
        const gameCanvas = document.getElementById('game-canvas');
        if (!gameCanvas) return;

        // Touch controls for swiping
        let touchStartX = 0;
        let touchStartY = 0;
        let touchStartTime = 0;
        const minSwipeDistance = 30;
        const maxTapDuration = 200;

        gameCanvas.addEventListener('touchstart', (event) => {
            event.preventDefault();
            const touch = event.touches[0];
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
            touchStartTime = Date.now();
        }, { passive: false });

        gameCanvas.addEventListener('touchmove', (event) => {
            event.preventDefault();
        }, { passive: false });

        gameCanvas.addEventListener('touchend', (event) => {
            event.preventDefault();
            if (event.touches.length > 0) return;

            const touch = event.changedTouches[0];
            const deltaX = touch.clientX - touchStartX;
            const deltaY = touch.clientY - touchStartY;
            const duration = Date.now() - touchStartTime;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

            // Handle tap (short touch without movement)
            if (duration < maxTapDuration && distance < minSwipeDistance) {
                this.handleAction('rotate');
                return;
            }

            // Handle swipes
            if (distance >= minSwipeDistance) {
                const absX = Math.abs(deltaX);
                const absY = Math.abs(deltaY);

                if (absX > absY) {
                    // Horizontal swipe
                    if (deltaX > 0) {
                        this.handleAction('moveRight');
                    } else {
                        this.handleAction('moveLeft');
                    }
                } else {
                    // Vertical swipe
                    if (deltaY > 0) {
                        this.handleAction('softDrop');
                    } else {
                        this.handleAction('hardDrop');
                    }
                }
            }
        }, { passive: false });
    }

    setupMobileButtons() {
        // Mobile control buttons
        const buttons = {
            'left-btn': 'moveLeft',
            'right-btn': 'moveRight',
            'down-btn': 'softDrop',
            'rotate-btn': 'rotate',
            'drop-btn': 'hardDrop'
        };

        Object.entries(buttons).forEach(([id, action]) => {
            const button = document.getElementById(id);
            if (button) {
                // Use touchstart for immediate response
                button.addEventListener('touchstart', (event) => {
                    event.preventDefault();
                    this.handleAction(action);
                    button.classList.add('active');
                });

                button.addEventListener('touchend', (event) => {
                    event.preventDefault();
                    button.classList.remove('active');
                });

                // Fallback to click for desktop
                button.addEventListener('click', (event) => {
                    event.preventDefault();
                    this.handleAction(action);
                });

                // Prevent context menu on long press
                button.addEventListener('contextmenu', (event) => {
                    event.preventDefault();
                });
            }
        });

        // Pause button
        const pauseBtn = document.getElementById('pause-btn');
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => {
                this.handleAction('pause');
            });
        }
    }

    handleKeyDown(event) {
        if (!this.game || !this.game.isPlaying) return;

        const action = this.keyBindings[event.code] || this.keyBindings[event.key];
        if (!action) return;

        // Handle one-time actions
        if (action === 'rotate' || action === 'hardDrop' || action === 'pause') {
            if (!this.keyStates[action]) {
                this.handleAction(action);
                this.keyStates[action] = true;
            }
            return;
        }

        // Handle repeating actions
        if (!this.keyStates[action]) {
            this.handleAction(action);
            this.keyStates[action] = {
                pressed: true,
                timeout: setTimeout(() => {
                    this.startRepeating(action);
                }, this.repeatDelay)
            };
        }
    }

    handleKeyUp(event) {
        const action = this.keyBindings[event.code] || this.keyBindings[event.key];
        if (!action) return;

        // Clear key state
        if (this.keyStates[action]) {
            if (typeof this.keyStates[action] === 'object') {
                clearTimeout(this.keyStates[action].timeout);
                if (this.keyStates[action].interval) {
                    clearInterval(this.keyStates[action].interval);
                }
            }
            delete this.keyStates[action];
        }

        // Handle soft drop release
        if (action === 'softDrop') {
            this.game.setFastDrop(false);
        }
    }

    startRepeating(action) {
        if (this.keyStates[action]) {
            this.keyStates[action].interval = setInterval(() => {
                if (this.keyStates[action]) {
                    this.handleAction(action);
                }
            }, this.repeatRate);
        }
    }

    handleAction(action) {
        if (!this.game || !this.game.isPlaying || this.game.isGameOver) {
            return;
        }

        switch (action) {
            case 'moveLeft':
                if (!this.game.isPaused) {
                    this.game.moveLeft();
                }
                break;

            case 'moveRight':
                if (!this.game.isPaused) {
                    this.game.moveRight();
                }
                break;

            case 'softDrop':
                if (!this.game.isPaused) {
                    this.game.setFastDrop(true);
                }
                break;

            case 'hardDrop':
                if (!this.game.isPaused) {
                    this.game.hardDrop();
                }
                break;

            case 'rotate':
                if (!this.game.isPaused) {
                    this.game.rotate();
                }
                break;

            case 'pause':
                this.game.pause();
                break;
        }
    }

    // Enable/disable controls
    enable() {
        this.enabled = true;
    }

    disable() {
        this.enabled = false;
        // Clear all key states
        this.clearAllKeyStates();
    }

    clearAllKeyStates() {
        Object.values(this.keyStates).forEach(state => {
            if (typeof state === 'object') {
                if (state.timeout) clearTimeout(state.timeout);
                if (state.interval) clearInterval(state.interval);
            }
        });
        this.keyStates = {};
    }

    // Update key bindings
    setKeyBinding(key, action) {
        this.keyBindings[key] = action;
    }

    getKeyBindings() {
        return { ...this.keyBindings };
    }

    // Handle focus loss (clear all key states to prevent stuck keys)
    handleFocusLoss() {
        this.clearAllKeyStates();
        this.game.setFastDrop(false);
    }

    destroy() {
        // Clean up event listeners
        document.removeEventListener('keydown', this.handleKeyDown.bind(this));
        document.removeEventListener('keyup', this.handleKeyUp.bind(this));
        this.clearAllKeyStates();
    }
}

// Add focus/blur handlers to prevent stuck keys
window.addEventListener('blur', () => {
    if (window.tetrisControls) {
        window.tetrisControls.handleFocusLoss();
    }
});

window.addEventListener('focus', () => {
    if (window.tetrisControls) {
        window.tetrisControls.clearAllKeyStates();
    }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TetrisControls;
}