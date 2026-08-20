import { Flame } from "lucide-react";

export default function AdherenceStat({ stats }) {
  const streak = stats?.streak ?? 0;

  return (
    <div className="adherence-card adherence-card--streak">
      <div className="adherence-streak">
        <Flame size={28} className="adherence-streak__icon" />
        <div className="adherence-streak__value tabular-nums">{streak}</div>
        <div className="adherence-streak__label">Day streak</div>
      </div>
    </div>
  );
}
