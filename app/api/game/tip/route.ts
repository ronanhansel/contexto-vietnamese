import { NextResponse } from "next/server";
import { getGameState } from "@/lib/gameState";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const bestRankParam = searchParams.get("bestRank");
    const bestGuessedRank = bestRankParam
      ? parseInt(bestRankParam, 10)
      : Infinity;

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

    // Game already won
    if (bestGuessedRank === 1) {
      return NextResponse.json({
        success: true,
        tip: null,
        message: "You already found the word!",
      });
    }

    // Find a word with a better rank (lower number) that hasn't been guessed yet
    let tipWord: string | null = null;
    let tipRank: number | null = null;

    // Look for a word that's better than the current best but not the exact secret word
    // Aim for approximately 75% closer to the target
    const targetImprovement = Math.max(1, Math.floor(bestGuessedRank * 0.25));
    const targetRankRange = Math.max(2, bestGuessedRank - targetImprovement);

    // Find words in the target range
    const potentialTips = sortedRanks.filter(
      (entry) =>
        entry.rank < bestGuessedRank &&
        entry.rank >= 2 && // Don't give away the secret word
        entry.word !== secretWord && // Ensure we don't give the secret word
        !guessHistory.some((g) => g.word === entry.word) // Not already guessed
    );

    if (potentialTips.length > 0) {
      // Try to find a word closer to our target improvement
      const closestToTarget = potentialTips.reduce((closest, current) => {
        const currentDistance = Math.abs(current.rank - targetRankRange);
        const closestDistance = Math.abs(closest.rank - targetRankRange);
        return currentDistance < closestDistance ? current : closest;
      }, potentialTips[0]);

      tipWord = closestToTarget.word;
      tipRank = closestToTarget.rank;
    }

    // If no suitable tip found, find any better word
    if (!tipWord) {
      for (const entry of sortedRanks) {
        if (
          entry.rank < bestGuessedRank &&
          entry.word !== secretWord &&
          !guessHistory.some((g) => g.word === entry.word)
        ) {
          tipWord = entry.word;
          tipRank = entry.rank;
          break;
        }
      }
    }

    // Last resort: find any unguessed word
    if (!tipWord) {
      for (const entry of sortedRanks) {
        if (
          entry.word !== secretWord &&
          !guessHistory.some((g) => g.word === entry.word)
        ) {
          tipWord = entry.word;
          tipRank = entry.rank;
          break;
        }
      }
    }

    if (!tipWord) {
      return NextResponse.json(
        { success: false, message: "Could not determine a tip." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      tip: tipWord,
      rank: tipRank,
    });
  } catch (error) {
    console.error("Error getting tip:", error);
    return NextResponse.json(
      { success: false, message: "Failed to get tip" },
      { status: 500 }
    );
  }
}
