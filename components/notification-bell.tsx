"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { FaBell, FaTimes, FaExclamationTriangle, FaCalendarAlt, FaLeaf } from "react-icons/fa";

import { getLands, getWorkLogs, type Land, type WorkLog } from "@/lib/api";
import { getStoredSession } from "@/lib/session";

type HarvestNotification = {
  id: string; // `${landId}-${expectedDateStr}`
  landId: string;
  landName: string;
  ownerName: string;
  treeCount: number;
  expectedDate: string; // Formatted date
  expectedDateStr: string; // YYYY-MM-DD
  daysElapsed: number;
  isOverdue: boolean;
  daysLeft: number;
};

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<HarvestNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch data and calculate notifications
  useEffect(() => {
    const session = getStoredSession();
    if (!session?.token) return;

    const loadNotifications = async () => {
      setLoading(true);
      try {
        // Fetch all lands and logs
        const [lands, logs] = await Promise.all([
          getLands(session.token),
          getWorkLogs(session.token, { page_size: 10000 }) // Fetch all logs to ensure we get the latest harvest for each grove
        ]);

        // Group logs by landId
        const logsByLand: Record<string, WorkLog[]> = {};
        for (const log of logs) {
          if (!log.landId) continue;
          if (!logsByLand[log.landId]) {
            logsByLand[log.landId] = [];
          }
          logsByLand[log.landId].push(log);
        }

        const calculatedNotifications: HarvestNotification[] = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Fetch manual dismissals from localStorage
        const dismissedKeys: string[] = [];
        if (typeof window !== "undefined") {
          const rawDismissed = window.localStorage.getItem("dismissed-harvest-notifications");
          if (rawDismissed) {
            try {
              dismissedKeys.push(...(JSON.parse(rawDismissed) as string[]));
            } catch {
              // Ignore parse errors
            }
          }
        }

        for (const land of lands) {
          if (!land.isActive) continue;

          // Find latest harvest work date
          const landLogs = logsByLand[land.id] || [];
          let baseDateStr = "";

          if (landLogs.length > 0) {
            // Sort by date descending
            const sortedLogs = [...landLogs].sort(
              (a, b) => new Date(b.workDate).getTime() - new Date(a.workDate).getTime()
            );
            baseDateStr = sortedLogs[0].workDate;
          } else {
            // Default to lease start date if no work logs exist
            baseDateStr = land.leaseStartDate;
          }

          if (!baseDateStr) continue;

          // Expected harvest date: 60 days after latest harvest
          const baseDate = new Date(baseDateStr);
          baseDate.setHours(0, 0, 0, 0);
          
          const nextHarvestDate = new Date(baseDate);
          nextHarvestDate.setDate(baseDate.getDate() + 60);

          const expectedDateStr = nextHarvestDate.toISOString().split("T")[0];

          // Check if notification already dismissed for this cycle
          const notificationId = `${land.id}-${expectedDateStr}`;
          if (dismissedKeys.includes(notificationId)) {
            continue;
          }

          // Calculate elapsed days
          const diffTime = today.getTime() - baseDate.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

          // Start notifying 5 days before (i.e. >= 55 days elapsed)
          if (diffDays >= 55) {
            calculatedNotifications.push({
              id: notificationId,
              landId: land.id,
              landName: land.name,
              ownerName: land.ownerName,
              treeCount: land.treeCount,
              expectedDate: nextHarvestDate.toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric"
              }),
              expectedDateStr,
              daysElapsed: diffDays,
              isOverdue: diffDays >= 60,
              daysLeft: 60 - diffDays
            });
          }
        }

        // Sort notifications: Overdue first, then by days elapsed descending
        calculatedNotifications.sort((a, b) => b.daysElapsed - a.daysElapsed);
        setNotifications(calculatedNotifications);
      } catch (err) {
        console.error("Failed to load harvest notifications:", err);
      } finally {
        setLoading(false);
      }
    };

    void loadNotifications();
  }, [isOpen]); // Recalculate when user opens dropdown to capture latest state

  // Handle manual dismissal
  const handleDismiss = (id: string) => {
    setNotifications((curr) => curr.filter((n) => n.id !== id));

    if (typeof window !== "undefined") {
      const STORAGE_KEY = "dismissed-harvest-notifications";
      let dismissed: string[] = [];
      const rawDismissed = window.localStorage.getItem(STORAGE_KEY);
      if (rawDismissed) {
        try {
          dismissed = JSON.parse(rawDismissed) as string[];
        } catch {
          // Reset if corrupted
        }
      }
      if (!dismissed.includes(id)) {
        dismissed.push(id);
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(dismissed));
      }
    }
  };

  return (
    <div className="bell-wrapper" ref={containerRef}>
      <button 
        className="icon-button" 
        type="button" 
        aria-label="Notifications" 
        onClick={() => setIsOpen(!isOpen)}
        style={{ position: "relative" }}
      >
        <FaBell size={18} />
        {notifications.length > 0 && (
          <span className="bell-badge">{notifications.length}</span>
        )}
      </button>

      {isOpen && (
        <div className="notifications-dropdown">
          <div className="dropdown-header">
            <h4>Harvest Notifications</h4>
            {notifications.length > 0 && (
              <span className="count-tag">{notifications.length} Pending</span>
            )}
          </div>

          <div className="dropdown-list">
            {loading ? (
              <div className="empty-notifications">Checking schedules...</div>
            ) : notifications.length === 0 ? (
              <div className="empty-notifications">
                <FaLeaf size={24} style={{ color: "var(--brand-soft, #a7f3d0)", marginBottom: "4px" }} />
                <p style={{ margin: 0, fontWeight: 600 }}>All groves up to date</p>
                <span style={{ fontSize: "0.78rem", color: "var(--muted)" }}>No harvests scheduled in the next 5 days.</span>
              </div>
            ) : (
              notifications.map((item) => (
                <div 
                  key={item.id} 
                  className={`notification-card ${item.isOverdue ? "overdue" : "due-soon"}`}
                >
                  <div className="notification-card-header">
                    <div>
                      <p className="notification-owner">Owner: {item.ownerName}</p>
                      <h5 className="notification-title">{item.landName}</h5>
                    </div>
                    <button 
                      className="dismiss-btn" 
                      type="button" 
                      onClick={() => handleDismiss(item.id)}
                      title="Dismiss notification"
                    >
                      <FaTimes size={12} />
                    </button>
                  </div>

                  <div className="notification-details">
                    Go for harvest on: <span className="highlight-text">{item.expectedDate}</span>
                    <br />
                    Grove capacity: <span className="highlight-text">{item.treeCount} trees</span>
                  </div>

                  <div className="notification-card-footer">
                    <span className={`notification-status ${item.isOverdue ? "status-overdue" : "status-due-soon"}`}>
                      <FaExclamationTriangle size={12} />
                      {item.isOverdue 
                        ? `Overdue by ${item.daysElapsed - 60} days` 
                        : `Scheduled in ${item.daysLeft} days`}
                    </span>
                    <Link 
                      href={`/worklogs/add?landId=${item.landId}`} 
                      className="action-log-btn"
                      onClick={() => setIsOpen(false)}
                    >
                      Log Harvest
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>

          <style jsx>{`
            .bell-wrapper {
              position: relative;
              display: inline-block;
            }
            .bell-badge {
              position: absolute;
              top: -2px;
              right: -2px;
              background: var(--danger, #b04d36);
              color: white;
              font-size: 0.65rem;
              font-weight: 800;
              min-width: 18px;
              height: 18px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 0 4px;
              border: 2px solid var(--surface-strong, #fff);
              pointer-events: none;
            }
            .notifications-dropdown {
              position: absolute;
              top: 55px;
              right: 0;
              width: min(340px, calc(100vw - 32px));
              max-height: 480px;
              background: var(--surface-strong, #fff);
              border: 1px solid var(--line, rgba(27, 43, 40, 0.1));
              border-radius: 16px;
              box-shadow: var(--shadow, 0 10px 30px rgba(43, 66, 56, 0.15));
              z-index: 1000;
              display: flex;
              flex-direction: column;
              overflow: hidden;
              animation: fadeIn 150ms ease;
            }
            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(-5px); }
              to { opacity: 1; transform: translateY(0); }
            }
            .dropdown-header {
              padding: 14px 16px;
              border-bottom: 1px solid var(--line, rgba(27, 43, 40, 0.08));
              display: flex;
              align-items: center;
              justify-content: space-between;
              background: var(--surface-muted, #f5f8f3);
            }
            .dropdown-header h4 {
              margin: 0;
              font-size: 0.9rem;
              font-weight: 800;
              color: var(--text, #18322c);
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }
            .count-tag {
              font-size: 0.72rem;
              font-weight: 700;
              background: var(--brand-soft, #dcefe4);
              color: var(--brand-deep, #154732);
              padding: 2px 8px;
              border-radius: 99px;
            }
            .dropdown-list {
              overflow-y: auto;
              padding: 12px;
              display: flex;
              flex-direction: column;
              gap: 10px;
              max-height: 400px;
            }
            .notification-card {
              position: relative;
              padding: 12px 14px;
              background: var(--surface-muted, #f5f8f3);
              border-radius: 12px;
              border: 1px solid var(--line, rgba(27, 43, 40, 0.05));
              display: flex;
              flex-direction: column;
              gap: 8px;
              text-align: left;
            }
            .notification-card.due-soon {
              border-left: 4px solid #eab308; /* Amber */
            }
            .notification-card.overdue {
              border-left: 4px solid var(--danger, #b04d36); /* Red */
            }
            .notification-card-header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              gap: 12px;
            }
            .notification-title {
              font-size: 0.88rem;
              font-weight: 800;
              color: var(--text, #18322c);
              margin: 2px 0 0;
            }
            .notification-owner {
              font-size: 0.7rem;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              font-weight: 700;
              color: var(--muted, #62766e);
              margin: 0;
            }
            .dismiss-btn {
              background: transparent;
              border: 0;
              cursor: pointer;
              color: var(--muted, #62766e);
              padding: 4px;
              display: flex;
              align-items: center;
              justify-content: center;
              border-radius: 50%;
              transition: background 150ms, color 150ms;
            }
            .dismiss-btn:hover {
              background: rgba(0, 0, 0, 0.04);
              color: var(--text);
            }
            .notification-details {
              font-size: 0.8rem;
              color: var(--text, #18322c);
              line-height: 1.4;
            }
            .highlight-text {
              font-weight: 700;
              color: var(--brand-deep, #154732);
            }
            .notification-card-footer {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-top: 4px;
              padding-top: 6px;
              border-top: 1px dashed var(--line, rgba(27, 43, 40, 0.05));
            }
            .notification-status {
              font-size: 0.72rem;
              font-weight: 700;
              display: inline-flex;
              align-items: center;
              gap: 4px;
            }
            .status-due-soon {
              color: #b45309; /* Muted Amber */
            }
            .status-overdue {
              color: var(--danger, #b04d36);
            }
            .action-log-btn {
              font-size: 0.75rem;
              font-weight: 800;
              color: var(--brand, #216649);
              text-decoration: none;
              transition: color 150ms;
              background: var(--brand-soft, #dcefe4);
              padding: 4px 10px;
              border-radius: 6px;
            }
            .action-log-btn:hover {
              color: white;
              background: var(--brand, #216649);
            }
            .empty-notifications {
              padding: 32px 16px;
              text-align: center;
              color: var(--muted, #62766e);
              font-size: 0.82rem;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              gap: 8px;
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
