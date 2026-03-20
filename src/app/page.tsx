"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.push("/auth/login");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="animate-pulse">
        <h1 className="text-xl text-gray-600 dark:text-gray-400">Redirecting to login...</h1>
      </div>
    </div>
  );
}
