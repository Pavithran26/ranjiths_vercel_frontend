import { UiIcon, type IconName } from "./ui-icon";

export type LeaderboardItem = {
  id: string;
  name: string;
  metric: string | number;
  subtext?: string;
};

export function Leaderboard({
  title,
  items,
  icon,
  emptyText
}: {
  title: string;
  items: LeaderboardItem[];
  icon: IconName;
  emptyText: string;
}) {
  return (
    <article className="panel-card leaderboard-card">
      <div className="panel-heading" style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <span className="stats-icon">
            <UiIcon name={icon} width={18} height={18} />
          </span>
          <h4 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800 }}>{title}</h4>
        </div>
      </div>
      <div className="leaderboard-list">
        {items.length === 0 ? (
          <p className="dashboard-note">{emptyText}</p>
        ) : null}
        {items.map((item, index) => (
          <div key={item.id} className="leaderboard-item">
            <span className="leaderboard-rank">{index + 1}</span>
            <div className="leaderboard-info">
              <strong>{item.name}</strong>
              {item.subtext && <span>{item.subtext}</span>}
            </div>
            <div className="leaderboard-metric">{item.metric}</div>
          </div>
        ))}
      </div>
    </article>
  );
}
