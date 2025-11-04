'use client';
import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

// REFERENCES: Gemini Code Assist Agent / Gemini-Pro-2 

/**
 * AdminNav component provides a navigation bar for the admin dashboard.
 * It dynamically highlights the currently active link based on the current URL path.
 */
export default function AdminNav() {
    // usePathname is a Next.js hook that returns the current URL's pathname.
    // This is used to determine which navigation link is currently active.
    const pathname = usePathname();
    const router = useRouter();

    // Defines the navigation links for the admin dashboard.
    // Each object contains a 'name' for display and an 'href' for the navigation path.
    const navLinks = [
        { name: 'Overview', href: '/admin/overview' },
        { name: 'Users', href: '/admin/users' },
        { name: 'Referral Intake', href: '/admin/referral-intake' },
        { name: 'Referral Tracking', href: '/admin/referral-tracking' },
        { name: 'System Monitoring', href: '/admin/system-monitoring' },
        { name: 'Audit & Compliance', href: '/admin/audit-compliance' },
        { name: 'Reports & Analytics', href: '/admin/reports-analytics' },
    ];

    // Map pathname to the active tab name. Default to 'Overview' when no match.
    const active = navLinks.find(l => pathname?.startsWith(l.href))?.name ?? 'Overview';

    return (
        <nav className="w-full p-6">
            <div className="mx-auto w-full">
                <Tabs value={active} onValueChange={(val) => {
                    const link = navLinks.find(l => l.name === val);
                    if (link) router.push(link.href);
                }}>
                    {/* Use same TabsList/grid classes as the interactive page so appearance matches */}
                    <TabsList className="grid w-full grid-cols-7">
                        {navLinks.map((link) => (
                            <TabsTrigger key={link.name} value={link.name} className="text-xs">
                                {link.name}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>
            </div>
        </nav>
    );
}