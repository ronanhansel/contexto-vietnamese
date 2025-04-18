import { NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";
import {
  initWordVectors,
  getSecretWord as selectSecretWord,
  getAllWordRanks,
} from "@/lib/game";
import {
  getGameState,
  setSecretWord,
  setWordRanks,
  setWordList,
  addGuess,
  getGuessHistory,
  resetGuessHistory,
} from "@/lib/gameState";

// Initialize the game
export async function POST() {
  try {
    // Read the dictionary file
    const filePath = path.join(process.cwd(), "Viet39K.txt");
    const fileContent = fs.readFileSync(filePath, "utf8");
    const wordList = fileContent
      .split("\n")
      .filter((word) => word.trim().length > 0);
    setWordList(wordList);

    // Initialize word vectors
    await initWordVectors(wordList);

    // Select a random secret word
    const secret = selectSecretWord(wordList);
    setSecretWord(secret);

    // Calculate the ranks for all words
    const ranks = await getAllWordRanks(secret, wordList);
    setWordRanks(ranks);

    // Reset guess history
    resetGuessHistory();

    // Get wordList length from state
    const { wordList: stateWordList } = getGameState();
    return NextResponse.json({
      success: true,
      message: "Game initialized successfully",
      totalWords: stateWordList.length,
    });
  } catch (error) {
    console.error("Error initializing game:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to initialize game",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  const state = getGameState();
  return NextResponse.json({
    guessHistory: state.guessHistory,
    totalWords: state.wordList.length,
    gameActive: !!state.secretWord,
  });
}

export async function PUT(request: Request) {
  try {
    const { guess } = await request.json();
    const state = getGameState();

    if (!state.secretWord || !state.wordRanks) {
      return NextResponse.json(
        {
          success: false,
          message: "Game not initialized",
        },
        { status: 400 }
      );
    }

    if (!guess || typeof guess !== "string") {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid guess",
        },
        { status: 400 }
      );
    }

    const normalizedGuess = guess.trim().toLowerCase();

    // Check if the word is in the dictionary
    if (!state.wordList.includes(normalizedGuess)) {
      return NextResponse.json(
        {
          success: false,
          message: "Word not in dictionary",
        },
        { status: 400 }
      );
    }

    // Check if the word has already been guessed
    if (
      state.guessHistory.some(
        (item: { word: string; rank: number }) => item.word === normalizedGuess
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Word already guessed",
        },
        { status: 400 }
      );
    }

    // Get the rank of the guessed word
    const rank = state.wordRanks.get(normalizedGuess) || Infinity;

    // Add the guess to history
    const newGuess = { word: normalizedGuess, rank };
    addGuess(newGuess);

    const isCorrect = normalizedGuess === state.secretWord;

    return NextResponse.json({
      success: true,
      word: normalizedGuess,
      rank,
      isCorrect,
      guessHistory: getGuessHistory(), // Return the updated history
    });
  } catch (error) {
    console.error("Error processing guess:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Error processing guess",
      },
      { status: 500 }
    );
  }
}
