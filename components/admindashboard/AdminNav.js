'use client';
import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminNav() {
    const pathname = usePathname();
    const router = useRouter();

    const navLinks = [
        { name: 'Overview', href: '/admin/overview' },
        { name: 'Users', href: '/admin/users' },
        { name: 'Referral Intake', href: '/admin/referral-intake' },
        { name: 'Referral Tracking', href: '/admin/referral-tracking' },
        { name: 'System Monitoring', href: '/admin/system-monitoring' },
        { name: 'Audit & Compliance', href: '/admin/audit-compliance' },
        { name: 'Reports & Analytics', href: '/admin/reports-analytics' },
    ];

    const handleTabChange = (value) => {
        router.push(value);
    };

    return (
        <nav className="w-full px-6 pt-6">
            <Tabs value={pathname} onValueChange={handleTabChange} className="w-full">
                <TabsList className="grid w-full grid-cols-7 bg-gray-100 p-1 rounded-full">
                    {navLinks.map((link) => (
                        <TabsTrigger key={link.name} value={link.href} className="rounded-full">
                            {link.name}
                        </TabsTrigger>
                    ))}
                </TabsList>
            </Tabs>
        </nav>
    );
}