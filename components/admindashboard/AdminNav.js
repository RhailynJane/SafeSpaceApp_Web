'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminNav() {
    const pathname = usePathname();

    const navLinks = [
        { name: 'Overview', href: '/admin/overview' },
        { name: 'Referral Intake', href: '/admin/referral-intake' },
        { name: 'Referral Tracking', href: '/admin/referral-tracking' },
        { name: 'Reports & Analytics', href: '/admin/reports-analytics' },
        { name: 'System Monitoring', href: '/admin/system-monitoring' },
        { name: 'Audit & Compliance', href: '/admin/audit-compliance' },
        { name: 'Users', href: '/admin/users' },
    ];

    return (
        <nav className="w-full">
            <div className="border-2 border-black rounded-full p-1 mx-auto w-full max-w-screen-xl">
                <div className="overflow-x-auto scrollbar-hide ">
                    <div className="flex border-2 border-gray-800 rounded-full overflow-x-auto whitespace-nowrap w-full">
                        {navLinks.map((link, index) => {
                            const isActive = pathname === link.href;
                            return (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    className={`flex-1 min-w-[120px] text-center px-6 py-3 font-medium text-sm transition
                                        ${isActive
                                            ? 'bg-[#5DA39E] text-white'
                                            : 'bg-white text-black hover:bg-gray-100'
                                        }
                                        ${index !== navLinks.length - 1 ? 'border-r border-gray-800' : ''}`
                                    }
                                >
                                    {link.name}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>
        </nav>
    );
}