"use client";

import { Suspense, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getReturnRouteForLoggedUser } from "@/lib/role-routes";

function FinalizandoLevantamientoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const nextRoute = useMemo(() => {
    const fallback = getReturnRouteForLoggedUser();
    const requested = searchParams.get("next")?.trim();
    if (!requested || !requested.startsWith("/")) {
      return fallback;
    }
    return requested;
  }, [searchParams]);

  useEffect(() => {
    const redirectTimeout = window.setTimeout(() => {
      router.replace(nextRoute);
    }, 1800);

    return () => {
      window.clearTimeout(redirectTimeout);
    };
  }, [nextRoute, router]);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-[#f8f0e5] to-[#efe4d7]">
      <div className="pointer-events-none absolute h-64 w-64 rounded-full bg-[#8b1c1c]/10 blur-3xl" />
      <div className="relative h-20 w-20">
        <div className="absolute inset-0 rounded-full border-4 border-[#8b1c1c]/15" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#8b1c1c] border-r-[#8b1c1c]/70 animate-[spin_1s_linear_infinite]" />
        <div className="absolute inset-3 rounded-full border-4 border-transparent border-b-[#2d6b5f] border-l-[#2d6b5f]/70 animate-[spin_0.9s_linear_infinite_reverse]" />
      </div>

      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </main>
  );
}

export default function FinalizandoLevantamientoPage() {
  return (
    <Suspense fallback={null}>
      <FinalizandoLevantamientoContent />
    </Suspense>
  );
}
