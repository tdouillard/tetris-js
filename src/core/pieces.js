// Tetris piece definitions and configurations

class TetrisPieces {
    static PIECES = {
        I: {
            shape: [
                [0, 0, 0, 0],
                [1, 1, 1, 1],
                [0, 0, 0, 0],
                [0, 0, 0, 0]
            ],
            color: '#00ffff' // Cyan
        },
        O: {
            shape: [
                [1, 1],
                [1, 1]
            ],
            color: '#ffff00' // Yellow
        },
        T: {
            shape: [
                [0, 1, 0],
                [1, 1, 1],
                [0, 0, 0]
            ],
            color: '#aa00ff' // Purple
        },
        S: {
            shape: [
                [0, 1, 1],
                [1, 1, 0],
                [0, 0, 0]
            ],
            color: '#00ff00' // Green
        },
        Z: {
            shape: [
                [1, 1, 0],
                [0, 1, 1],
                [0, 0, 0]
            ],
            color: '#ff0000' // Red
        },
        J: {
            shape: [
                [1, 0, 0],
                [1, 1, 1],
                [0, 0, 0]
            ],
            color: '#0000ff' // Blue
        },
        L: {
            shape: [
                [0, 0, 1],
                [1, 1, 1],
                [0, 0, 0]
            ],
            color: '#ff8800' // Orange
        }
    };

    static PIECE_TYPES = Object.keys(TetrisPieces.PIECES);

    static getRandomPiece() {
        const type = TetrisPieces.PIECE_TYPES[Math.floor(Math.random() * TetrisPieces.PIECE_TYPES.length)];
        return {
            type: type,
            shape: TetrisPieces.PIECES[type].shape,
            color: TetrisPieces.PIECES[type].color,
            x: 0,
            y: 0
        };
    }

    static rotatePiece(piece) {
        const rotated = [];
        const size = piece.shape.length;
        
        for (let i = 0; i < size; i++) {
            rotated[i] = [];
            for (let j = 0; j < size; j++) {
                rotated[i][j] = piece.shape[size - 1 - j][i];
            }
        }
        
        return {
            ...piece,
            shape: rotated
        };
    }

    static getPieceBlocks(piece) {
        const blocks = [];
        for (let y = 0; y < piece.shape.length; y++) {
            for (let x = 0; x < piece.shape[y].length; x++) {
                if (piece.shape[y][x]) {
                    blocks.push({
                        x: piece.x + x,
                        y: piece.y + y,
                        color: piece.color
                    });
                }
            }
        }
        return blocks;
    }

    static getGhostPiece(piece, board) {
        const ghostPiece = { ...piece };
        
        // Move ghost piece down until it would collide
        while (!board.wouldCollide(ghostPiece, 0, 1)) {
            ghostPiece.y++;
        }
        
        return {
            ...ghostPiece,
            color: 'rgba(255, 255, 255, 0.3)' // Semi-transparent white
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TetrisPieces;
}