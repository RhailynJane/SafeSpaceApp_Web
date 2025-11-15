"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const items = [
  { label: "Overview", href: "/superadmin" },
  { label: "Organizations", href: "/superadmin/organizations" },
  { label: "Account Management", href: "/superadmin/accounts" },
  { label: "Audit Logs", href: "/superadmin/audit-logs" },
  { label: "System Health", href: "/superadmin/system" },
];

export default function SuperAdminSidebar() {
  const pathname = usePathname();
  return (
    <aside className="rounded-lg border bg-background">
      <div className="p-3 text-xs font-semibold text-muted-foreground">Navigation</div>
      <nav className="px-2 pb-3">
        {items.map(({ label, href }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground",
                isActive && "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300"
              )}
            >
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
