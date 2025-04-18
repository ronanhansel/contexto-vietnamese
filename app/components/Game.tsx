"use client";

import { cn } from "@/lib/utils";
import { useState, useEffect, FormEvent, useRef } from "react";

type GuessHistoryItem = {
  word: string;
  rank: number;
};

export default function Game() {
  const [gameState, setGameState] = useState<{
    isLoading: boolean;
    isInitialized: boolean;
    isGameWon: boolean;
    errorMessage: string | null;
    totalWords: number;
  }>({
    isLoading: false,
    isInitialized: false,
    isGameWon: false,
    errorMessage: null,
    totalWords: 0,
  });

  const [guess, setGuess] = useState("");
  const [guessHistory, setGuessHistory] = useState<GuessHistoryItem[]>([]);
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [hint, setHint] = useState<{ word: string; rank: number } | null>(null);
  const [isHintLoading, setIsHintLoading] = useState(false);
  const [tip, setTip] = useState<{ word: string; rank: number } | null>(null);
  const [isTipLoading, setIsTipLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize the game on component mount
  useEffect(() => {
    initializeGame();
  }, []);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && !gameState.isGameWon) {
      // Stop timer if game is won
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, gameState.isGameWon]);

  // Clear hint and tip when user types
  useEffect(() => {
    if (guess !== "") {
      setHint(null);
      setTip(null);
    }
  }, [guess]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const initializeGame = async () => {
    try {
      setGameState((prev) => ({
        ...prev,
        isLoading: true,
        errorMessage: null,
      }));
      setHint(null); // Clear hint on new game

      const response = await fetch("/api/game", {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        setGameState((prev) => ({
          ...prev,
          isInitialized: true,
          isGameWon: false,
          totalWords: data.totalWords,
        }));
        setGuessHistory([]);
        setTimer(0);
        setIsTimerRunning(true);
      } else {
        setGameState((prev) => ({
          ...prev,
          errorMessage: data.message || "Failed to initialize game",
        }));
      }
    } catch (error) {
      console.error("Game initialization error:", error);
      setGameState((prev) => ({
        ...prev,
        errorMessage: "Failed to initialize game",
      }));
    } finally {
      setGameState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const fetchHint = async () => {
    if (gameState.isGameWon || gameState.isLoading || isHintLoading) return;

    setIsHintLoading(true);
    setHint(null);
    setGameState((prev) => ({ ...prev, errorMessage: null })); // Clear previous errors

    try {
      const response = await fetch("/api/game/hint");
      const data = await response.json();

      if (data.success && data.hint) {
        setHint({ word: data.hint, rank: data.rank });

        // Automatically submit the hint as a guess
        await submitGuessWord(data.hint);
      } else {
        setGameState((prev) => ({
          ...prev,
          errorMessage: data.message || "Could not fetch hint.",
        }));
      }
    } catch (error) {
      console.error("Hint fetch error:", error);
      setGameState((prev) => ({
        ...prev,
        errorMessage: "Failed to fetch hint.",
      }));
    } finally {
      setIsHintLoading(false);
    }
  };

  const fetchTip = async () => {
    if (gameState.isGameWon || gameState.isLoading || isTipLoading) return;

    setIsTipLoading(true);
    setTip(null);
    setGameState((prev) => ({ ...prev, errorMessage: null })); // Clear previous errors

    try {
      // Get the best rank so far
      const bestRank =
        guessHistory.length > 0
          ? Math.min(...guessHistory.map((g) => g.rank))
          : 1000; // Default if no guesses yet

      const response = await fetch(`/api/game/tip?bestRank=${bestRank}`);
      const data = await response.json();

      if (data.success && data.tip) {
        setTip({ word: data.tip, rank: data.rank });

        // Automatically submit the tip as a guess
        await submitGuessWord(data.tip);
      } else {
        setGameState((prev) => ({
          ...prev,
          errorMessage: data.message || "Could not fetch tip.",
        }));
      }
    } catch (error) {
      console.error("Tip fetch error:", error);
      setGameState((prev) => ({
        ...prev,
        errorMessage: "Failed to fetch tip.",
      }));
    } finally {
      setIsTipLoading(false);
    }
  };

  // Helper function to submit a word as a guess directly
  const submitGuessWord = async (word: string) => {
    if (gameState.isGameWon || gameState.isLoading) return;

    try {
      setGameState((prev) => ({
        ...prev,
        isLoading: true,
        errorMessage: null,
      }));
      setHint(null); // Clear hint on new guess
      setTip(null); // Clear tip on new guess

      const response = await fetch("/api/game", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ guess: word }),
      });

      const data = await response.json();

      if (data.success) {
        setGuessHistory(data.guessHistory);
        setGuess("");

        if (data.isCorrect) {
          setGameState((prev) => ({ ...prev, isGameWon: true }));
          setIsTimerRunning(false);
        }
      } else {
        setGameState((prev) => ({
          ...prev,
          errorMessage: data.message,
        }));
      }
    } catch (error) {
      console.error("Guess submission error:", error);
      setGameState((prev) => ({
        ...prev,
        errorMessage: "Error submitting guess",
      }));
    } finally {
      setGameState((prev) => ({ ...prev, isLoading: false }));
      if (inputRef.current) {
        setTimeout(() => {
          inputRef.current.focus();
        }, 100);
      }
    }
  };

  const submitGuess = async (e: FormEvent) => {
    e.preventDefault();

    if (!guess.trim() || gameState.isGameWon || gameState.isLoading) return;

    // Use the common submission logic
    await submitGuessWord(guess);
  };

  const toggleTimer = () => {
    setIsTimerRunning((prev) => !prev);
  };

  return (
    <div className="min-h-screen flex flex-col items-center py-6 wood-grain">
      {/* Home Screen (shown when game is not initialized) */}
      {!gameState.isInitialized ? (
        <div className="flex flex-col items-center w-full max-w-md">
          {/* Title */}
          <div className="text-center bg-[#8b4513] border-4 border-[#a0522d] rounded-lg shadow-lg p-6 mb-8 w-full">
            <h1 className="text-4xl font-['Bungee_Shade',_cursive] text-[#f8d568] shadow-[3px_3px_5px_rgba(0,0,0,0.5)] mb-2">
              CONTEXTO
            </h1>
            <h2 className="text-3xl font-['Bungee_Shade',_cursive] text-[#f8d568] shadow-[3px_3px_5px_rgba(0,0,0,0.5)]">
              VIETNAMESE
            </h2>
          </div>

          {/* Main Menu Button */}
          <button
            onClick={initializeGame}
            className="bg-[#5c9e31] border-4 border-[#4a8a24] rounded-lg text-white font-bold transition-all hover:bg-[#4a8f20] hover:-translate-y-0.5 w-3/4 mb-4 py-6 shadow-lg flex items-center justify-center disabled:opacity-50"
            disabled={gameState.isLoading}
          >
            <div className="flex items-center justify-center">
              <div className="grid grid-cols-2 grid-rows-2 gap-1 bg-[#f5d6a0] p-2 rounded-md mr-3">
                <div className="bg-[#8B4513] w-7 h-7 rounded-sm flex items-center justify-center text-white font-bold font-['Rowdies',_cursive] text-2xl">
                  A
                </div>
                <div className="bg-[#8B4513] w-7 h-7 rounded-sm flex items-center justify-center text-white font-bold font-['Rowdies',_cursive] text-2xl">
                  B
                </div>
                <div className="bg-[#8B4513] w-7 h-7 rounded-sm flex items-center justify-center text-white font-bold font-['Rowdies',_cursive] text-2xl">
                  C
                </div>
                <div className="bg-[#8B4513] w-7 h-7 rounded-sm flex items-center justify-center text-white font-bold font-['Rowdies',_cursive] text-2xl">
                  D
                </div>
              </div>
              <span className="text-white font-bold text-2xl tracking-wider font-['Rowdies',_cursive]">
                CLASSIC
              </span>
            </div>
          </button>

          {/* Gallery Button (non-functional in this version) */}
          <button className="bg-[#4b6cb7] hover:bg-[#3b5998] w-3/4 py-6 rounded-lg border-4 border-[#3b5998] shadow-lg transition-all flex items-center justify-center opacity-70">
            <div className="flex items-center justify-center">
              <div className="bg-[#f5d6a0] p-2 rounded-md mr-3 w-[44px] h-[44px] flex items-center justify-center">
                <div className="bg-[#8B4513] w-10 h-10 rounded-sm"></div>
              </div>
              <span className="text-white font-bold text-2xl tracking-wider font-['Rowdies',_cursive]">
                GALLERY
              </span>
            </div>
          </button>

          {/* Footer buttons */}
          <div className="fixed bottom-6 flex justify-center space-x-6 mt-12">
            <div className="w-12 h-12 rounded-full bg-[#8b4513] border-4 border-[#a0522d] shadow-lg flex items-center justify-center">
              <div className="text-white font-bold text-xs font-['Rowdies',_cursive]">
                ADS
              </div>
            </div>
            <div className="w-12 h-12 rounded-full bg-[#8b4513] border-4 border-[#a0522d] shadow-lg flex items-center justify-center">
              <div className="text-white font-bold font-['Rowdies',_cursive] text-2xl">
                ⚙️
              </div>
            </div>
            <div className="w-12 h-12 rounded-full bg-[#8b4513] border-4 border-[#a0522d] shadow-lg flex items-center justify-center">
              <div className="text-white font-bold font-['Rowdies',_cursive] text-2xl">
                ↗️
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Game Screen */
        <div className="w-1/2 min-w-[300px] max-w-xl flex flex-col gapy-2">
          <div className="w-[10px] h-[10vh]" />
          {/* Game header with level and timer */}
          <div className="bg-[#8b4513] border-4 border-[#a0522d] rounded-lg shadow-lg p-3 mb-6 flex justify-between items-center">
            <div className="text-white font-bold font-['Rowdies',_cursive] text-2xl p-[30px]">
              TỪ TIẾNG VIỆT
            </div>
            <div className="flex items-center">
              <div className="bg-[#f5d6a0] rounded-sm mx-2 text-[#8B4513] font-bold font-['Rowdies',_cursive] text-2xl px-1">
                {formatTime(timer)}
              </div>
              <button
                onClick={toggleTimer}
                className={cn(
                  "cursor-pointer bg-[#5c9e31] border-4 border-[#4a8a24] rounded-full text-white font-bold transition-all hover:bg-[#4a8f20] hover:-translate-y-0.5 w-[50px] h-[50px] flex items-center justify-center disabled:opacity-50",
                  isTimerRunning ? "text-[30px]" : "text-[20px]" // Keep size consistent
                )}
              >
                {isTimerRunning ? "⏸" : "▶"}
              </button>
            </div>
          </div>

          {/* Game content */}
          <div className="bg-[#8b4513] border-4 border-[#a0522d] rounded-lg shadow-lg p-4 mb-6">
            {gameState.errorMessage && (
              <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded-md font-['Rowdies',_cursive] text-2xl">
                {gameState.errorMessage}
              </div>
            )}

            {gameState.isGameWon && (
              <div className="bg-[#5c9e31] border-l-4 border-[#4a8a24] text-white p-4 mb-4 rounded-md font-['Rowdies',_cursive] text-2xl">
                Chúc mừng! Bạn đã đoán đúng từ bí mật!
              </div>
            )}

            {/* Hint display */}
            {hint && (
              <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-3 mb-4 rounded-md font-['Rowdies',_cursive] text-2xl">
                Gợi ý: Từ &quot;<strong>{hint.word}</strong>&quot; có xếp hạng #
                {hint.rank}
              </div>
            )}

            {/* Tip display */}
            {tip && (
              <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-800 p-3 mb-4 rounded-md font-['Rowdies',_cursive] text-2xl">
                Mẹo: Từ &quot;<strong>{tip.word}</strong>&quot; có xếp hạng #
                {tip.rank}
              </div>
            )}

            {/* Guess input form */}
            <form onSubmit={submitGuess} className="mb-6 flex flex-col gap-2">
              <div className="">
                <input
                  type="text"
                  ref={inputRef}
                  value={guess}
                  autoFocus
                  onChange={(e) => setGuess(e.target.value)}
                  disabled={gameState.isGameWon || gameState.isLoading}
                  placeholder="Nhập từ cần đoán..."
                  className="flex-1 w-full border-4 border-[#A0522D] rounded-md py-3 px-4 focus:outline-none text-white font-bold font-['Rowdies',_cursive] focus:shadow-[0_0_0_3px_rgba(92,158,49,0.5)] "
                  style={{
                    fontFamily: "Rowdies, cursive",
                    fontSize: "24px",
                  }}
                />
              </div>
              <button
                type="submit"
                disabled={
                  gameState.isGameWon || gameState.isLoading || !guess.trim()
                }
                className="bg-[#5c9e31] w-full border-4 border-[#4a8a24] rounded-lg text-white font-bold transition-all hover:bg-[#4a8f20] hover:-translate-y-0.5 py-3 px-6 disabled:opacity-50 text-2xl"
                style={{
                  fontFamily: "Rowdies, cursive",
                  fontSize: "24px",
                }}
              >
                Đoán
              </button>
            </form>

            {/* Guess history */}
            {guessHistory.length > 0 && (
              <div className="bg-[#f5d6a0] rounded-md p-2">
                <div className="overflow-auto max-h-96 rounded-md">
                  <table className="min-w-full">
                    <thead className="bg-[#A0522D] text-white">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-bold uppercase rounded-tl-md font-['Rowdies',_cursive]">
                          Xếp hạng
                        </th>
                        <th className="px-4 py-2 text-left text-sm font-bold uppercase rounded-tr-md font-['Rowdies',_cursive]">
                          Từ
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {guessHistory.map((item, index) => (
                        <tr
                          key={index}
                          className={cn(
                            "border-b border-[#A0522D]",
                            item.rank === 1
                              ? "bg-[#5c9e31] text-white"
                              : index % 2 === 0
                              ? "bg-[#deb887]"
                              : "bg-[#f5d6a0]"
                          )}
                        >
                          <td className="px-4 py-3">
                            <span className="px-2 py-1 rounded-md bg-[#8B4513] text-white text-base font-bold font-['Rowdies',_cursive]">
                              #{item.rank}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-medium font-['Rowdies',_cursive] text-2xl">
                            {item.word}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Game controls */}
          <div className="flex justify-center space-x-4">
            <button
              onClick={initializeGame}
              className="cursor-pointer w-14 h-14 rounded-full bg-[#8b4513] border-4 border-[#a0522d] shadow-lg flex items-center justify-center text-[#f5d6a0] text-2xl disabled:opacity-50 disabled:cursor-not-allowed"
              title="Chơi lại"
            >
              🔄
            </button>
            <button
              onClick={fetchHint}
              disabled={
                gameState.isGameWon || isHintLoading || gameState.isLoading
              }
              className="cursor-pointer w-14 h-14 rounded-full bg-[#8b4513] border-4 border-[#a0522d] shadow-lg flex items-center justify-center text-[#f5d6a0] text-2xl disabled:opacity-50 disabled:cursor-not-allowed"
              title="Gợi ý"
            >
              {isHintLoading ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              ) : (
                "✅"
              )}
            </button>
            <button
              onClick={fetchTip}
              disabled={
                gameState.isGameWon || isTipLoading || gameState.isLoading
              }
              className="cursor-pointer w-14 h-14 rounded-full bg-[#8b4513] border-4 border-[#a0522d] shadow-lg flex items-center justify-center text-[#f5d6a0] text-2xl disabled:opacity-50 disabled:cursor-not-allowed"
              title="Mẹo từ"
            >
              {isTipLoading ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              ) : (
                "💡"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
