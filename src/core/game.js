// Main Tetris game engine

class TetrisGame {
    constructor() {
        this.board = new TetrisBoard();
        this.currentPiece = null;
        this.nextPiece = null;
        this.ghostPiece = null;
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.isGameOver = false;
        this.isPaused = false;
        this.isPlaying = false;
        
        // Timing
        this.dropInterval = 1000; // Start with 1 second
        this.lastDropTime = 0;
        this.fastDrop = false;
        this.fastDropInterval = 50;
        
        // Line clear animation
        this.clearingLines = false;
        this.clearedRows = [];
        
        // Score multipliers
        this.lineScoreMultipliers = {
            1: 100,  // Single
            2: 300,  // Double  
            3: 500,  // Triple
            4: 800   // Tetris
        };
        
        this.gameLoop = this.gameLoop.bind(this);
        this.lastTime = 0;
    }

    start() {
        this.reset();
        this.spawnNewPiece();
        this.spawnNextPiece();
        this.isPlaying = true;
        this.gameLoop(0);
    }

    reset() {
        this.board.reset();
        this.currentPiece = null;
        this.nextPiece = null;
        this.ghostPiece = null;
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.isGameOver = false;
        this.isPaused = false;
        this.clearingLines = false;
        this.clearedRows = [];
        this.dropInterval = 1000;
        this.lastDropTime = 0;
    }

    pause() {
        this.isPaused = !this.isPaused;
    }

    stop() {
        this.isPlaying = false;
        this.isGameOver = true;
    }

    gameLoop(currentTime) {
        if (!this.isPlaying || this.isGameOver) {
            return;
        }

        if (!this.isPaused) {
            const deltaTime = currentTime - this.lastTime;
            this.update(deltaTime);
        }

        this.lastTime = currentTime;
        requestAnimationFrame(this.gameLoop);
    }

    update(deltaTime) {
        if (this.clearingLines) {
            // Handle line clear animation
            return;
        }

        if (!this.currentPiece) {
            this.spawnNewPiece();
            return;
        }

        // Handle automatic dropping
        const dropTime = this.fastDrop ? this.fastDropInterval : this.dropInterval;
        this.lastDropTime += deltaTime;

        if (this.lastDropTime >= dropTime) {
            this.moveDown();
            this.lastDropTime = 0;
        }

        // Update ghost piece
        this.updateGhostPiece();
    }

    spawnNewPiece() {
        if (this.nextPiece) {
            this.currentPiece = this.nextPiece;
        } else {
            this.currentPiece = TetrisPieces.getRandomPiece();
        }
        
        this.spawnNextPiece();
        
        // Position piece at top center
        this.currentPiece.x = Math.floor((this.board.width - this.currentPiece.shape[0].length) / 2);
        this.currentPiece.y = 0;
        
        // Check for game over
        if (this.board.wouldCollide(this.currentPiece)) {
            this.gameOver();
        }

        this.updateGhostPiece();
    }

    spawnNextPiece() {
        this.nextPiece = TetrisPieces.getRandomPiece();
    }

    updateGhostPiece() {
        if (this.currentPiece) {
            this.ghostPiece = TetrisPieces.getGhostPiece(this.currentPiece, this.board);
        }
    }

    moveLeft() {
        if (this.canMove(-1, 0)) {
            this.currentPiece.x--;
            this.updateGhostPiece();
            return true;
        }
        return false;
    }

    moveRight() {
        if (this.canMove(1, 0)) {
            this.currentPiece.x++;
            this.updateGhostPiece();
            return true;
        }
        return false;
    }

    moveDown() {
        if (this.canMove(0, 1)) {
            this.currentPiece.y++;
            return true;
        } else {
            // Piece has landed
            this.landPiece();
            return false;
        }
    }

    hardDrop() {
        let dropDistance = 0;
        while (this.canMove(0, 1)) {
            this.currentPiece.y++;
            dropDistance++;
        }
        this.landPiece();
        
        // Award points for hard drop
        this.score += dropDistance * 2;
        return dropDistance;
    }

    rotate() {
        const rotatedPiece = TetrisPieces.rotatePiece(this.currentPiece);
        
        // Try rotation at current position
        if (this.board.isValidPosition(rotatedPiece)) {
            this.currentPiece = rotatedPiece;
            this.updateGhostPiece();
            return true;
        }
        
        // Try wall kicks (move left/right to fit rotation)
        const kicks = [-1, 1, -2, 2];
        for (const kick of kicks) {
            if (this.board.isValidPosition(rotatedPiece, kick, 0)) {
                rotatedPiece.x += kick;
                this.currentPiece = rotatedPiece;
                this.updateGhostPiece();
                return true;
            }
        }
        
        return false;
    }

    canMove(dx, dy) {
        return this.currentPiece && this.board.isValidPosition(this.currentPiece, dx, dy);
    }

    landPiece() {
        if (!this.currentPiece) return;

        this.board.placePiece(this.currentPiece);
        this.currentPiece = null;
        this.ghostPiece = null;

        // Check for completed lines
        const clearResult = this.board.clearLines();
        if (clearResult.count > 0) {
            this.handleLinesCleared(clearResult);
        }

        // Check for game over
        if (this.board.isGameOver()) {
            this.gameOver();
        }
    }

    handleLinesCleared(clearResult) {
        const { count, lines } = clearResult;
        
        // Update lines and level
        this.lines += count;
        const newLevel = Math.floor(this.lines / 10) + 1;
        if (newLevel > this.level) {
            this.level = newLevel;
            this.updateDropSpeed();
        }

        // Calculate score
        const baseScore = this.lineScoreMultipliers[count] || 0;
        const levelMultiplier = this.level;
        this.score += baseScore * levelMultiplier;

        // Trigger line clear effects
        this.triggerLineClearEffect(lines);
    }

    updateDropSpeed() {
        // Increase speed based on level
        const baseSpeed = 1000;
        const speedIncrease = Math.min(this.level - 1, 15) * 50; // Cap at level 15
        this.dropInterval = Math.max(baseSpeed - speedIncrease, 50); // Minimum 50ms
    }

    triggerLineClearEffect(lines) {
        // Store cleared lines for visual effect
        this.clearedRows = lines;
        this.clearingLines = true;

        // Clear the effect after a brief moment
        setTimeout(() => {
            this.clearingLines = false;
            this.clearedRows = [];
        }, 300);
    }

    setFastDrop(enabled) {
        this.fastDrop = enabled;
    }

    gameOver() {
        this.isGameOver = true;
        this.isPlaying = false;
        
        // Save high score
        const gameData = {
            score: this.score,
            lines: this.lines,
            level: this.level
        };
        
        // Trigger game over event
        if (this.onGameOver) {
            this.onGameOver(gameData);
        }
    }

    getGameState() {
        return {
            board: this.board,
            currentPiece: this.currentPiece,
            nextPiece: this.nextPiece,
            ghostPiece: this.ghostPiece,
            score: this.score,
            lines: this.lines,
            level: this.level,
            isGameOver: this.isGameOver,
            isPaused: this.isPaused,
            clearingLines: this.clearingLines,
            clearedRows: this.clearedRows
        };
    }

    // Event handlers
    onGameOver = null;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TetrisGame;
}