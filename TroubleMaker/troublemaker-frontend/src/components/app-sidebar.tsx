"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  MessagesSquare,
  ListTodo,
  Settings,
  Home,
} from "lucide-react";

const sidebarItems = [
  {
    title: "Liste des activités",
    href: "/encadrant/liste_activite",
    icon: ListTodo,
  },
  {
    title: "Liste des affirmations",
    href: "/encadrant/generer",
    icon: MessagesSquare,
  },

];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <div className="fixed left-0 h-full w-64 bg-white border-r border-gray-200 pt-20 px-4">
      <nav className="space-y-2">
        {sidebarItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900",
                isActive && "bg-gray-100 text-gray-900"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.title}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
