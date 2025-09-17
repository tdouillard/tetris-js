// Tetris game board management

class TetrisBoard {
    constructor(width = 10, height = 20) {
        this.width = width;
        this.height = height;
        this.grid = this.createEmptyGrid();
    }

    createEmptyGrid() {
        const grid = [];
        for (let y = 0; y < this.height; y++) {
            grid[y] = [];
            for (let x = 0; x < this.width; x++) {
                grid[y][x] = null;
            }
        }
        return grid;
    }

    reset() {
        this.grid = this.createEmptyGrid();
    }

    isValidPosition(piece, offsetX = 0, offsetY = 0) {
        const blocks = TetrisPieces.getPieceBlocks({
            ...piece,
            x: piece.x + offsetX,
            y: piece.y + offsetY
        });

        for (const block of blocks) {
            if (block.x < 0 || block.x >= this.width || 
                block.y >= this.height || 
                (block.y >= 0 && this.grid[block.y][block.x] !== null)) {
                return false;
            }
        }
        return true;
    }

    wouldCollide(piece, offsetX = 0, offsetY = 0) {
        return !this.isValidPosition(piece, offsetX, offsetY);
    }

    placePiece(piece) {
        const blocks = TetrisPieces.getPieceBlocks(piece);
        
        for (const block of blocks) {
            if (block.y >= 0 && block.y < this.height && 
                block.x >= 0 && block.x < this.width) {
                this.grid[block.y][block.x] = block.color;
            }
        }
    }

    clearLines() {
        let linesCleared = 0;
        let clearedLines = [];

        // Check each row from bottom to top
        for (let y = this.height - 1; y >= 0; y--) {
            if (this.isLineFull(y)) {
                clearedLines.push(y);
                this.clearLine(y);
                linesCleared++;
                y++; // Check the same row again since lines moved down
            }
        }

        return {
            count: linesCleared,
            lines: clearedLines
        };
    }

    isLineFull(y) {
        for (let x = 0; x < this.width; x++) {
            if (this.grid[y][x] === null) {
                return false;
            }
        }
        return true;
    }

    clearLine(y) {
        // Remove the full line
        this.grid.splice(y, 1);
        // Add a new empty line at the top
        const newLine = [];
        for (let x = 0; x < this.width; x++) {
            newLine[x] = null;
        }
        this.grid.unshift(newLine);
    }

    isGameOver() {
        // Check if any blocks are in the top rows (spawn area)
        for (let y = 0; y < 2; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.grid[y][x] !== null) {
                    return true;
                }
            }
        }
        return false;
    }

    getFilledBlocks() {
        const blocks = [];
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.grid[y][x] !== null) {
                    blocks.push({
                        x: x,
                        y: y,
                        color: this.grid[y][x]
                    });
                }
            }
        }
        return blocks;
    }

    getRowHeight(y) {
        if (y < 0 || y >= this.height) return 0;
        
        let count = 0;
        for (let x = 0; x < this.width; x++) {
            if (this.grid[y][x] !== null) {
                count++;
            }
        }
        return count;
    }

    // Get aggregate height (sum of heights of all columns)
    getAggregateHeight() {
        let totalHeight = 0;
        
        for (let x = 0; x < this.width; x++) {
            let columnHeight = 0;
            for (let y = 0; y < this.height; y++) {
                if (this.grid[y][x] !== null) {
                    columnHeight = this.height - y;
                    break;
                }
            }
            totalHeight += columnHeight;
        }
        
        return totalHeight;
    }

    // Count holes (empty cells with filled cells above them)
    countHoles() {
        let holes = 0;
        
        for (let x = 0; x < this.width; x++) {
            let foundBlock = false;
            for (let y = 0; y < this.height; y++) {
                if (this.grid[y][x] !== null) {
                    foundBlock = true;
                } else if (foundBlock) {
                    holes++;
                }
            }
        }
        
        return holes;
    }

    clone() {
        const clonedBoard = new TetrisBoard(this.width, this.height);
        clonedBoard.grid = this.grid.map(row => [...row]);
        return clonedBoard;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TetrisBoard;
}