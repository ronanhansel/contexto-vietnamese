import { NextResponse } from "next/server";
import { getGameState } from "@/lib/gameState";

export async function GET() {
  try {
    const { guessHistory, sortedRanks, secretWord } = getGameState();

    if (!secretWord || sortedRanks.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Game not initialized or ranks not calculated.",
        },
        { status: 400 }
      );
    }

    // Find the best current rank (lowest number)
    const bestRank = guessHistory.length > 0 ? guessHistory[0].rank : Infinity;

    if (bestRank === 1) {
      return NextResponse.json({
        success: true,
        hint: null,
        message: "You already found the word!",
      });
    }

    let hintWord: string | null = null;
    let hintRank: number | null = null;
    let targetRank: number;

    if (bestRank === Infinity) {
      // No guesses yet, provide a hint around rank 1000 (or lower if dictionary is small)
      targetRank = Math.min(1000, Math.floor(sortedRanks.length / 2));
      const hintEntry = sortedRanks.find((entry) => entry.rank === targetRank);
      if (hintEntry) {
        hintWord = hintEntry.word;
        hintRank = hintEntry.rank;
      } else if (sortedRanks.length > 1) {
        // Fallback if rank 1000 doesn't exist
        hintWord =
          sortedRanks[Math.min(targetRank, sortedRanks.length - 1)].word;
        hintRank =
          sortedRanks[Math.min(targetRank, sortedRanks.length - 1)].rank;
      }
    } else {
      // Find the next word in the sorted list that hasn't been guessed
      for (const entry of sortedRanks) {
        if (
          entry.rank < bestRank &&
          !guessHistory.some((g) => g.word === entry.word)
        ) {
          hintWord = entry.word;
          hintRank = entry.rank;
          break;
        }
      }
    }

    // Fallback if no suitable hint is found (shouldn't normally happen unless all better words are guessed)
    if (!hintWord && sortedRanks.length > 1) {
      // Provide the next best unguessed word, even if its rank is not strictly lower than the best guess
      for (const entry of sortedRanks) {
        if (
          !guessHistory.some((g) => g.word === entry.word) &&
          entry.word !== secretWord
        ) {
          hintWord = entry.word;
          hintRank = entry.rank;
          break;
        }
      }
    }

    if (!hintWord) {
      return NextResponse.json(
        { success: false, message: "Could not determine a hint." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, hint: hintWord, rank: hintRank });
  } catch (error) {
    console.error("Error getting hint:", error);
    return NextResponse.json(
      { success: false, message: "Failed to get hint" },
      { status: 500 }
    );
  }
}
