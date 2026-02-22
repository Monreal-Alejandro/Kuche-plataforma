"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ChevronLeft,
  Calendar,
  CircleDollarSign,
  Hammer,
  LayoutDashboard,
  LogOut,
  Palette,
} from "lucide-react";

const navigation = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Precios y Catálogo", href: "/admin/precios", icon: CircleDollarSign },
  { label: "Aprobación Diseños", href: "/admin/disenos", icon: Palette },
  { label: "Operaciones y Taller", href: "/admin/operaciones", icon: Hammer },
  { label: "Agenda", href: "/admin/agenda", icon: Calendar },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem("kuche.admin.sidebar.collapsed");
    if (stored === "true") {
      setIsCollapsed(true);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      "kuche.admin.sidebar.collapsed",
      isCollapsed ? "true" : "false",
    );
  }, [isCollapsed]);

  return (
    <div className="min-h-screen bg-slate-50">
      <aside
        className={`fixed inset-y-0 left-0 flex flex-col border-r border-gray-200 bg-white py-8 transition-all ${
          isCollapsed ? "w-20 px-3" : "w-64 px-6"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className={`text-lg font-semibold tracking-wide text-gray-900 ${isCollapsed ? "hidden" : ""}`}>
            KUCHE Admin
          </div>
          <button
            type="button"
            onClick={() => setIsCollapsed((prev) => !prev)}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-gray-200 text-gray-500 transition hover:bg-gray-100"
            aria-label={isCollapsed ? "Expandir menú" : "Colapsar menú"}
          >
            <ChevronLeft className={`h-4 w-4 transition ${isCollapsed ? "rotate-180" : ""}`} />
          </button>
        </div>
        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group relative flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
                  isActive ? "bg-[#8B1C1C]/10 text-[#8B1C1C]" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className={isCollapsed ? "hidden" : ""}>{item.label}</span>
                {isCollapsed ? (
                  <span className="pointer-events-none absolute left-full top-1/2 ml-3 -translate-y-1/2 whitespace-nowrap rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 opacity-0 shadow-lg transition group-hover:opacity-100">
                    {item.label}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
        <button
          type="button"
          onClick={() => router.push("/login")}
          className="group relative mt-6 flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-100"
        >
          <LogOut className="h-4 w-4" />
          <span className={isCollapsed ? "hidden" : ""}>Cerrar sesión</span>
          {isCollapsed ? (
            <span className="pointer-events-none absolute left-full top-1/2 ml-3 -translate-y-1/2 whitespace-nowrap rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 opacity-0 shadow-lg transition group-hover:opacity-100">
              Cerrar sesión
            </span>
          ) : null}
        </button>
      </aside>
      <main className={`min-h-screen px-10 py-10 ${isCollapsed ? "ml-20" : "ml-64"}`}>
        {children}
      </main>
    </div>
  );
}
