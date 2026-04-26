"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import type { ProfitLossReport } from "../lib/api";

export function FinancialOverview({ report }: { report: ProfitLossReport }) {
  return (
    <article className="panel-card financial-overview-card" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Financial Trends</p>
          <h3>Profit & Loss</h3>
        </div>
      </div>
      
      <div className="financial-summary-row" style={{ marginBottom: "1.5rem" }}>
        <div className="fin-stat positive">
          <span>Revenue</span>
          <strong>Rs {report.totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong>
        </div>
        <div className="fin-stat negative">
          <span>Expenses</span>
          <strong>Rs {report.totalExpenses.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong>
        </div>
        <div className="fin-stat net">
          <span>Net Profit</span>
          <strong>Rs {report.totalProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong>
        </div>
      </div>

      {report.monthlyBreakdown.length > 0 ? (
        <div style={{ width: "100%", height: 300, flex: 1, minHeight: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={report.monthlyBreakdown}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis 
                dataKey="period" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: "#64748b", fontSize: 12 }} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: "#64748b", fontSize: 12 }}
                tickFormatter={(value) => `Rs ${(value / 1000).toFixed(0)}k`}
                dx={-10}
              />
              <Tooltip 
                contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)" }}
                formatter={(value: number) => [`Rs ${value.toLocaleString()}`, undefined]}
              />
              <Legend iconType="circle" wrapperStyle={{ paddingTop: "20px" }} />
              <Area 
                type="monotone" 
                name="Revenue"
                dataKey="revenue" 
                stroke="#10b981" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorRevenue)" 
              />
              <Area 
                type="monotone" 
                name="Expenses"
                dataKey="expenses" 
                stroke="#ef4444" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorExpense)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="empty-state" style={{ marginTop: '20px', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p>No financial data available yet for trends.</p>
        </div>
      )}
    </article>
  );
}
