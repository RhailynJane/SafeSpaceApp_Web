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
    // usePathname is a Next.js hook that returns the current URL's pathname.
    // This is used to determine which navigation link is currently active.
    const pathname = usePathname();

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

    return (
        // Main navigation container with full width.
        <nav className="w-full">
            {/* Outer border and rounded full shape for the navigation bar. */}
            <div className="border-2 border-black rounded-full p-1 mx-auto w-full max-w-screen-xl">
                {/* Container for horizontal scrolling if content overflows. */}
                <div className="overflow-x-auto scrollbar-hide ">
                    {/* Inner container for the navigation links, styled as a flex row. */}
                    <div className="flex border-2 border-gray-800 rounded-full overflow-x-auto whitespace-nowrap w-full">
                        {/* Maps through the navLinks array to render each navigation item. */}
                        {navLinks.map((link, index) => {
                            // Determines if the current link's href matches the current pathname,
                            // indicating it's the active link.
                            const isActive = pathname === link.href;
                            return (
                                // Next.js Link component for client-side navigation without full page reloads.
                                <Link
                                    key={link.name} // Unique key for each link, important for React list rendering.
                                    href={link.href} // The destination path for the link.
                                    // Dynamic class names for styling:
                                    // - flex-1, min-w-[120px], text-center, px-6, py-3, font-medium, text-sm, transition are base styles.
                                    // - isActive applies specific background and text color for the active link.
                                    // - Inactive links have a white background, black text, and a hover effect.
                                    // - A right border is added to all links except the last one for visual separation.
                                    className={`flex-1 min-w-[120px] text-center px-6 py-3 font-medium text-sm transition
                                        ${isActive
                                            ? 'bg-[#5DA39E] text-white'
                                            : 'bg-white text-black hover:bg-gray-100'
                                        }
                                        ${index !== navLinks.length - 1 ? 'border-r border-gray-800' : ''}`
                                    }
                                >
                                    {link.name} {/* Displays the name of the navigation link. */}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>
        </nav>
    );
}