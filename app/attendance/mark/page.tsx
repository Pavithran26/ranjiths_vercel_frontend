"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AttendanceMarkLegacyPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/worklogs");
  }, [router]);

  return <main className="loading-screen">Redirecting to work logs...</main>;
}
