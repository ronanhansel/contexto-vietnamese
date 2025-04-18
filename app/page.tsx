import Game from "./components/Game";

export default function Home() {
  return (
    <div
      className="min-h-screen"
      style={{
        background: "#f5d6a0",
        backgroundImage: "url('/wood-pattern.png')",
        backgroundRepeat: "repeat",
      }}
    >
      <Game />
    </div>
  );
}
