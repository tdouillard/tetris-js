// High scores management with local storage

class HighScoreManager {
    constructor(maxScores = 10) {
        this.maxScores = maxScores;
        this.storageKey = 'tetris_highscores';
        this.scores = this.loadScores();
    }

    loadScores() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                const scores = JSON.parse(saved);
                // Validate score format
                if (Array.isArray(scores)) {
                    return scores.filter(this.validateScore).slice(0, this.maxScores);
                }
            }
        } catch (error) {
            console.warn('Failed to load high scores:', error);
        }
        
        // Return default empty scores if loading fails
        return [];
    }

    saveScores() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.scores));
            return true;
        } catch (error) {
            console.warn('Failed to save high scores:', error);
            return false;
        }
    }

    validateScore(score) {
        return score && 
               typeof score.score === 'number' && 
               typeof score.lines === 'number' && 
               typeof score.level === 'number' &&
               typeof score.date === 'string';
    }

    addScore(gameData) {
        const newScore = {
            score: gameData.score,
            lines: gameData.lines,
            level: gameData.level,
            date: new Date().toISOString()
        };

        // Add new score to list
        this.scores.push(newScore);
        
        // Sort by score (descending)
        this.scores.sort((a, b) => b.score - a.score);
        
        // Keep only top scores
        this.scores = this.scores.slice(0, this.maxScores);
        
        // Save to localStorage
        const saved = this.saveScores();
        
        // Return whether this was a new high score and its rank
        const rank = this.scores.findIndex(s => 
            s.score === newScore.score && 
            s.date === newScore.date
        ) + 1;
        
        return {
            isNewHighScore: rank <= this.maxScores,
            rank: rank <= this.maxScores ? rank : null,
            saved: saved,
            totalScores: this.scores.length
        };
    }

    getScores() {
        return [...this.scores]; // Return copy to prevent external modification
    }

    getTopScore() {
        return this.scores.length > 0 ? this.scores[0] : null;
    }

    isHighScore(score) {
        if (this.scores.length < this.maxScores) {
            return true;
        }
        const lowestHighScore = this.scores[this.scores.length - 1];
        return score > lowestHighScore.score;
    }

    getRank(score) {
        let rank = 1;
        for (const highScore of this.scores) {
            if (score > highScore.score) {
                return rank;
            }
            rank++;
        }
        return rank <= this.maxScores ? rank : null;
    }

    clearScores() {
        this.scores = [];
        try {
            localStorage.removeItem(this.storageKey);
            return true;
        } catch (error) {
            console.warn('Failed to clear high scores:', error);
            return false;
        }
    }

    getScoreStats() {
        if (this.scores.length === 0) {
            return {
                totalGames: 0,
                averageScore: 0,
                highestScore: 0,
                totalLines: 0,
                averageLines: 0
            };
        }

        const totalScore = this.scores.reduce((sum, s) => sum + s.score, 0);
        const totalLines = this.scores.reduce((sum, s) => sum + s.lines, 0);

        return {
            totalGames: this.scores.length,
            averageScore: Math.round(totalScore / this.scores.length),
            highestScore: this.scores[0].score,
            totalLines: totalLines,
            averageLines: Math.round(totalLines / this.scores.length)
        };
    }

    formatScore(score) {
        return score.toLocaleString();
    }

    formatDate(dateString) {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return 'Unknown';
        }
    }

    exportScores() {
        try {
            const exportData = {
                scores: this.scores,
                exportDate: new Date().toISOString(),
                version: '1.0'
            };
            return JSON.stringify(exportData, null, 2);
        } catch (error) {
            console.warn('Failed to export scores:', error);
            return null;
        }
    }

    importScores(jsonData) {
        try {
            const importData = JSON.parse(jsonData);
            
            if (importData.scores && Array.isArray(importData.scores)) {
                const validScores = importData.scores.filter(this.validateScore);
                
                // Merge with existing scores
                const allScores = [...this.scores, ...validScores];
                
                // Remove duplicates based on score and date
                const uniqueScores = allScores.filter((score, index, arr) => 
                    arr.findIndex(s => s.score === score.score && s.date === score.date) === index
                );
                
                // Sort and limit
                uniqueScores.sort((a, b) => b.score - a.score);
                this.scores = uniqueScores.slice(0, this.maxScores);
                
                this.saveScores();
                return {
                    success: true,
                    imported: validScores.length,
                    total: this.scores.length
                };
            }
            
            return {
                success: false,
                error: 'Invalid data format'
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HighScoreManager;
}