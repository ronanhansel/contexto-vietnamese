// lib/gameState.ts

interface GameState {
  secretWord: string | null;
  wordRanks: Map<string, number> | null;
  guessHistory: Array<{ word: string; rank: number }>;
  wordList: string[];
  sortedRanks: Array<{ word: string; rank: number }>;
}

const state: GameState = {
  secretWord: null,
  wordRanks: null,
  guessHistory: [],
  wordList: [],
  sortedRanks: [],
};

export function getGameState(): GameState {
  return state;
}

export function setSecretWord(word: string | null): void {
  state.secretWord = word;
}

export function setWordRanks(ranks: Map<string, number> | null): void {
  state.wordRanks = ranks;
  // Also store a sorted version for easy hint lookup
  if (ranks) {
    state.sortedRanks = Array.from(ranks.entries())
      .map(([word, rank]) => ({ word, rank }))
      .sort((a, b) => a.rank - b.rank);
  } else {
    state.sortedRanks = [];
  }
}

export function setWordList(list: string[]): void {
  state.wordList = list;
}

export function getGuessHistory(): Array<{ word: string; rank: number }> {
  return state.guessHistory;
}

export function addGuess(guess: { word: string; rank: number }): void {
  state.guessHistory.push(guess);
  state.guessHistory.sort((a, b) => a.rank - b.rank);
}

export function resetGuessHistory(): void {
  state.guessHistory = [];
}
