'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// REFERENCES: Gemini Code Assist Agent / Gemini-Pro-2 

/**
 * AdminNav component provides a navigation bar for the admin dashboard.
 * It dynamically highlights the currently active link based on the current URL path.
 */
export default function AdminNav() {
    const pathname = usePathname();

    const navLinks = [
        { name: 'Overview', href: '/admin/overview' },
        { name: 'Users', href: '/admin/users' },
        { name: 'Referral Intake', href: '/admin/referral-intake' },
        { name: 'Referral Tracking', href: '/admin/referral-tracking' },
        { name: 'System Monitoring', href: '/admin/system-monitoring' },
        { name: 'Audit & Compliance', href: '/admin/audit-compliance' },
        { name: 'Reports & Analytics', href: '/admin/reports-analytics' },
    ];

    return (
        <aside className="h-full w-64 border-r border-border bg-card text-foreground">
            <div className="p-4 font-semibold">Admin</div>
            <nav className="px-2 pb-4">
                <ul className="space-y-1">
                    {navLinks.map((link) => {
                        const active = pathname?.startsWith(link.href);
                        return (
                            <li key={link.href}>
                                <Link
                                    href={link.href}
                                    className={[
                                        "flex items-center rounded-md px-3 py-2 text-sm transition-colors",
                                        active
                                            ? "bg-accent text-accent-foreground"
                                            : "hover:bg-accent hover:text-accent-foreground",
                                    ].join(" ")}
                                    aria-current={active ? 'page' : undefined}
                                >
                                    {link.name}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>
        </aside>
    );
}