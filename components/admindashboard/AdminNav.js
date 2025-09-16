'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * The main navigation component for the admin dashboard sidebar.
 * It displays a list of navigation links and highlights the currently active link
 * based on the URL pathname.
 * @returns {JSX.Element} The AdminNav component.
 */
export default function AdminNav() {
    // Get the current path to determine which link is active.
    const pathname = usePathname();
    
    // Configuration for the navigation links. Each object contains the name and the link href.
    const navLinks = [
        { name: 'Overview', href: '/overview' },
        { name: 'Users', href: '/users' },
        { name: 'Referral Intake', href: '/admin/referral-intake' },
        { name: 'Referral Tracking', href: '/referral-tracking' },
        { name: 'System Monitoring', href: '/system-monitoring' },
        { name: 'Audit & Compliance', href: '/audit-compliance' },
        { name: 'Reports & Analytics', href: '/reports-analytics' },
    ];

    return (
        <div className="bg-white p-2 border-b-2 border-t-2 border-gray-200">
            <nav className="p-1 border border-gray-300 rounded-full flex items-center justify-start max-w-max">
                {/* Map over the navLinks array to render each navigation link. */}
                {navLinks.map((link) => {
                    // Determine if the current link is the active one.
                    const isActive = pathname === link.href;
                    return (
                        <Link
                            key={link.name}
                            href={link.href}
                            className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ease-in-out
                                ${isActive 
                                    ? 'bg-teal-100 text-teal-800 shadow-inner' // Active link style
                                    : 'text-gray-600 hover:bg-gray-100' // Inactive link style
                                }`}
                        >
                            {link.name}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
};