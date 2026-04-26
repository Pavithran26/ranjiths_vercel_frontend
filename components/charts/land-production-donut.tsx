"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import type { LandProductionReportItem } from "../../lib/api";

const COLORS = ["#0ea5e9", "#f59e0b", "#10b981", "#8b5cf6", "#f43f5e", "#64748b"];

export function LandProductionDonut({ report }: { report: LandProductionReportItem[] }) {
  // If there are no coconuts harvested at all, we show an empty state.
  const hasData = report.some((land) => land.totalCoconuts > 0);

  return (
    <article className="panel-card" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Production share</p>
          <h3>Harvest by Land</h3>
        </div>
      </div>

      {hasData ? (
        <div style={{ width: "100%", height: 300, flex: 1, minHeight: 0, marginTop: "1rem" }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={report}
                dataKey="totalCoconuts"
                nameKey="name"
                cx="50%"
                cy="45%"
                innerRadius={70}
                outerRadius={100}
                paddingAngle={2}
                stroke="none"
              >
                {report.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)" }}
                formatter={(value: number) => [`${value.toLocaleString()} units`, undefined]}
              />
              <Legend 
                iconType="circle" 
                layout="horizontal" 
                verticalAlign="bottom" 
                align="center"
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="empty-state" style={{ marginTop: '20px', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p>No harvest data available to display.</p>
        </div>
      )}
    </article>
  );
}
