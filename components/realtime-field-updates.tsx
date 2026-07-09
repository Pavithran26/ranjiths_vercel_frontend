"use client";

import { useEffect, useState } from "react";
import { db, ensureFirebaseInitialized } from "@/lib/firebaseClient";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";

interface WorkLogUpdate {
  id: string;
  land: string;
  supervisor: string;
  coconut_count: number;
  work_date: string;
}

export function RealtimeFieldUpdates() {
  const [updates, setUpdates] = useState<WorkLogUpdate[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    ensureFirebaseInitialized();

    // Check if Firestore is likely configured
    if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || !db) {
        return;
    }

    try {
        const q = query(
            collection(db, "worklogs"),
            orderBy("updated_at", "desc"),
            limit(5)
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const logs: WorkLogUpdate[] = [];
            querySnapshot.forEach((doc) => {
                logs.push({ id: doc.id, ...doc.data() } as WorkLogUpdate);
            });
            setUpdates(logs);
        }, (err) => {
            console.error("Firestore subscription error:", err);
            setError(true);
        });

        return () => unsubscribe();
    } catch (e) {
        console.error("Firestore error:", e);
        setError(true);
    }
  }, []);

  if (error || !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    return null;
  }

  if (updates.length === 0) {
    return (
        <div className="card-container" style={{ padding: '20px', textAlign: 'center' }}>
            <p style={{ opacity: 0.6, fontSize: '14px' }}>Waiting for real-time field updates...</p>
        </div>
    );
  }

  return (
    <div className="card-container">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e', boxShadow: '0 0 8px #22c55e' }}></div>
        <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Live Field Logs</h3>
      </div>
      <div style={{ display: 'grid', gap: '12px' }}>
        {updates.map((log) => (
          <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.03)' }}>
            <div>
              <p style={{ fontSize: '14px', fontWeight: 500 }}>{log.land}</p>
              <p style={{ fontSize: '12px', opacity: 0.6 }}>{log.supervisor}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '14px', fontWeight: 600, color: '#f59e0b' }}>{log.coconut_count}</p>
              <p style={{ fontSize: '10px', opacity: 0.4 }}>{new Date(log.work_date).toLocaleDateString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
