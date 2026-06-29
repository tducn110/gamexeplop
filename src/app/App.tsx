import { GameShell } from "./layout/GameShell";
import { RootRoute } from "./routes";

export default function App() {
  return (
    <GameShell>
      <RootRoute />
    </GameShell>
  );
}
