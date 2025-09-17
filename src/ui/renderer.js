// Tetris game renderer

class TetrisRenderer {
    constructor(gameCanvas, nextCanvas) {
        this.gameCanvas = gameCanvas;
        this.nextCanvas = nextCanvas;
        this.gameCtx = gameCanvas.getContext('2d');
        this.nextCtx = nextCanvas.getContext('2d');
        
        this.cellSize = this.calculateCellSize();
        this.gridColor = '#333333';
        this.backgroundColor = '#000000';
        
        // Animation properties
        this.lineClearAnimation = {
            active: false,
            rows: [],
            progress: 0,
            duration: 300
        };
        
        this.setupCanvas();
    }

    calculateCellSize() {
        // Calculate cell size based on canvas dimensions
        const boardWidth = 10;
        const boardHeight = 20;
        return Math.min(
            this.gameCanvas.width / boardWidth,
            this.gameCanvas.height / boardHeight
        );
    }

    setupCanvas() {
        // Enable image smoothing for better graphics
        this.gameCtx.imageSmoothingEnabled = true;
        this.nextCtx.imageSmoothingEnabled = true;
        
        // Set up initial styles
        this.gameCtx.lineWidth = 1;
        this.nextCtx.lineWidth = 1;
        
        this.resizeCanvas();
    }

    resizeCanvas() {
        // Responsive canvas sizing
        const container = this.gameCanvas.parentElement;
        const rect = container.getBoundingClientRect();
        
        // Maintain aspect ratio (1:2 for Tetris board)
        const maxWidth = Math.min(rect.width * 0.8, 300);
        const maxHeight = maxWidth * 2;
        
        this.gameCanvas.style.width = maxWidth + 'px';
        this.gameCanvas.style.height = maxHeight + 'px';
        
        // Recalculate cell size
        this.cellSize = this.calculateCellSize();
    }

    render(gameState) {
        this.clearCanvas();
        this.drawBackground();
        this.drawGrid();
        
        if (gameState.board) {
            this.drawBoard(gameState.board);
        }
        
        // Draw ghost piece first (so it appears behind current piece)
        if (gameState.ghostPiece && !gameState.clearingLines) {
            this.drawPiece(gameState.ghostPiece, true);
        }
        
        if (gameState.currentPiece && !gameState.clearingLines) {
            this.drawPiece(gameState.currentPiece);
        }
        
        if (gameState.clearingLines) {
            this.drawLineClearEffect(gameState.clearedRows);
        }
        
        if (gameState.nextPiece) {
            this.renderNextPiece(gameState.nextPiece);
        }
        
        if (gameState.isPaused) {
            this.drawPauseOverlay();
        }
    }

    clearCanvas() {
        this.gameCtx.clearRect(0, 0, this.gameCanvas.width, this.gameCanvas.height);
    }

    drawBackground() {
        this.gameCtx.fillStyle = this.backgroundColor;
        this.gameCtx.fillRect(0, 0, this.gameCanvas.width, this.gameCanvas.height);
    }

    drawGrid() {
        this.gameCtx.strokeStyle = this.gridColor;
        this.gameCtx.lineWidth = 0.5;
        
        // Draw vertical lines
        for (let x = 0; x <= 10; x++) {
            const xPos = x * this.cellSize;
            this.gameCtx.beginPath();
            this.gameCtx.moveTo(xPos, 0);
            this.gameCtx.lineTo(xPos, 20 * this.cellSize);
            this.gameCtx.stroke();
        }
        
        // Draw horizontal lines
        for (let y = 0; y <= 20; y++) {
            const yPos = y * this.cellSize;
            this.gameCtx.beginPath();
            this.gameCtx.moveTo(0, yPos);
            this.gameCtx.lineTo(10 * this.cellSize, yPos);
            this.gameCtx.stroke();
        }
    }

    drawBoard(board) {
        const blocks = board.getFilledBlocks();
        
        for (const block of blocks) {
            this.drawBlock(block.x, block.y, block.color);
        }
    }

    drawPiece(piece, isGhost = false) {
        const blocks = TetrisPieces.getPieceBlocks(piece);
        
        for (const block of blocks) {
            if (block.y >= 0) { // Don't draw blocks above the visible area
                if (isGhost) {
                    this.drawGhostBlock(block.x, block.y, piece.color);
                } else {
                    this.drawBlock(block.x, block.y, block.color);
                }
            }
        }
    }

    drawBlock(x, y, color) {
        const pixelX = x * this.cellSize;
        const pixelY = y * this.cellSize;
        
        // Main block color
        this.gameCtx.fillStyle = color;
        this.gameCtx.fillRect(pixelX + 1, pixelY + 1, this.cellSize - 2, this.cellSize - 2);
        
        // Add highlight effect
        this.gameCtx.fillStyle = this.lightenColor(color, 0.3);
        this.gameCtx.fillRect(pixelX + 1, pixelY + 1, this.cellSize - 2, 3);
        this.gameCtx.fillRect(pixelX + 1, pixelY + 1, 3, this.cellSize - 2);
        
        // Add shadow effect
        this.gameCtx.fillStyle = this.darkenColor(color, 0.3);
        this.gameCtx.fillRect(pixelX + this.cellSize - 4, pixelY + 1, 3, this.cellSize - 2);
        this.gameCtx.fillRect(pixelX + 1, pixelY + this.cellSize - 4, this.cellSize - 2, 3);
        
        // Border
        this.gameCtx.strokeStyle = this.darkenColor(color, 0.5);
        this.gameCtx.lineWidth = 1;
        this.gameCtx.strokeRect(pixelX + 0.5, pixelY + 0.5, this.cellSize - 1, this.cellSize - 1);
    }

    drawGhostBlock(x, y, color) {
        const pixelX = x * this.cellSize;
        const pixelY = y * this.cellSize;
        
        // Draw ghost outline
        this.gameCtx.strokeStyle = color;
        this.gameCtx.lineWidth = 2;
        this.gameCtx.setLineDash([4, 4]);
        this.gameCtx.strokeRect(pixelX + 2, pixelY + 2, this.cellSize - 4, this.cellSize - 4);
        this.gameCtx.setLineDash([]); // Reset line dash
    }

    drawLineClearEffect(clearedRows) {
        // Flash effect for cleared lines
        const flashIntensity = Math.sin(Date.now() * 0.02) * 0.5 + 0.5;
        
        this.gameCtx.fillStyle = `rgba(255, 255, 255, ${flashIntensity * 0.8})`;
        
        for (const row of clearedRows) {
            const y = row * this.cellSize;
            this.gameCtx.fillRect(0, y, 10 * this.cellSize, this.cellSize);
        }
    }

    renderNextPiece(nextPiece) {
        // Clear next piece canvas
        this.nextCtx.clearRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
        
        // Draw background
        this.nextCtx.fillStyle = this.backgroundColor;
        this.nextCtx.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
        
        const cellSize = Math.min(
            this.nextCanvas.width / 4,
            this.nextCanvas.height / 4
        );
        
        // Center the piece
        const shape = nextPiece.shape;
        const pieceWidth = shape[0].length;
        const pieceHeight = shape.length;
        
        const offsetX = (4 - pieceWidth) / 2;
        const offsetY = (4 - pieceHeight) / 2;
        
        // Draw next piece
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    const pixelX = (offsetX + x) * cellSize;
                    const pixelY = (offsetY + y) * cellSize;
                    
                    this.nextCtx.fillStyle = nextPiece.color;
                    this.nextCtx.fillRect(pixelX + 1, pixelY + 1, cellSize - 2, cellSize - 2);
                    
                    // Add simple border
                    this.nextCtx.strokeStyle = this.darkenColor(nextPiece.color, 0.3);
                    this.nextCtx.lineWidth = 1;
                    this.nextCtx.strokeRect(pixelX + 0.5, pixelY + 0.5, cellSize - 1, cellSize - 1);
                }
            }
        }
    }

    drawPauseOverlay() {
        // Semi-transparent overlay
        this.gameCtx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.gameCtx.fillRect(0, 0, this.gameCanvas.width, this.gameCanvas.height);
        
        // Pause text
        this.gameCtx.fillStyle = '#FFFFFF';
        this.gameCtx.font = `${this.cellSize}px Courier New`;
        this.gameCtx.textAlign = 'center';
        this.gameCtx.textBaseline = 'middle';
        
        const centerX = this.gameCanvas.width / 2;
        const centerY = this.gameCanvas.height / 2;
        
        this.gameCtx.fillText('PAUSED', centerX, centerY);
    }

    lightenColor(color, amount) {
        return this.adjustColor(color, amount);
    }

    darkenColor(color, amount) {
        return this.adjustColor(color, -amount);
    }

    adjustColor(color, amount) {
        const hex = color.replace('#', '');
        const num = parseInt(hex, 16);
        
        let r = (num >> 16) + Math.round(255 * amount);
        let g = (num >> 8 & 0x00FF) + Math.round(255 * amount);
        let b = (num & 0x0000FF) + Math.round(255 * amount);
        
        r = Math.max(0, Math.min(255, r));
        g = Math.max(0, Math.min(255, g));
        b = Math.max(0, Math.min(255, b));
        
        return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
    }

    // Handle window resize
    handleResize() {
        this.resizeCanvas();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TetrisRenderer;
}