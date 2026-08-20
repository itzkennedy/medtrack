import { Flame } from "lucide-react";

export default function AdherenceStat({ stats }) {
  const streak = stats?.streak ?? 0;

  return (
    <div className="streak-circle">
      <Flame size={18} className="streak-circle__icon" />
      <span className="streak-circle__value tabular-nums">{streak}</span>
      <span className="streak-circle__label">Day streak</span>
    </div>
  );
}
