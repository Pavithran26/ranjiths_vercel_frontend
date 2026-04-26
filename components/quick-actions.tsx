import Link from "next/link";
import { UiIcon, type IconName } from "./ui-icon";

export type QuickActionItem = {
  title: string;
  description: string;
  icon: IconName;
  href: string;
};

export function QuickActions({ items }: { items: QuickActionItem[] }) {
  return (
    <article className="panel-card quick-actions-card">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Shortcuts</p>
          <h3>Quick Actions</h3>
        </div>
      </div>
      <div className="quick-actions-list">
        {items.map((item) => (
          <Link key={item.href} href={item.href} className="quick-action-btn">
            <span className="module-icon">
              <UiIcon name={item.icon} width={20} height={20} />
            </span>
            <div className="quick-action-info">
              <strong>{item.title}</strong>
              <p>{item.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </article>
  );
}
