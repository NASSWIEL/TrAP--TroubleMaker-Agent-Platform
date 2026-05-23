"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function EncadrantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    api.get("/api/activites/").catch(() => router.push("/encadrant/login"));
  }, [router]);

  return children;
}
