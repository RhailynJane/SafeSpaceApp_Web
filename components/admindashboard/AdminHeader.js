'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// --- SVG ICONS ---
// A collection of simple, stateless functional components for rendering SVG icons used in the header.
/** Renders a refresh icon. */
const RefreshIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
);
/** Renders a settings icon. */
const SettingsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
);
/** Renders a sign-out icon. */
const SignOutIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
);

// Configuration for the navigation tabs. Each object contains the name and the link href.
const tabs = [
  { name: 'Overview', href: '/overview' },
  { name: 'Referral', href: '/admin/referral-intake' },
  { name: 'Clients', href: '/users' },
  { name: 'Schedule', href: '/Schedule' },
  { name: 'Notes', href: '/Notes' },
  { name: 'Crisis', href: '/Crisis' },
  { name: 'Reports', href: '/Reports' }
];

/**
 * The main header component for the admin dashboard.
 * It includes the logo, a title, action buttons (refresh, settings, sign out),
 * and a navigation bar with tabs.
 * The active tab is determined by the current URL pathname.
 * @returns {JSX.Element} The AdminHeader component.
 */
export default function AdminHeader() {
    // Get the current path to determine which tab is active.
    const pathname = usePathname();

    return (
        <header className="bg-white shadow-sm p-4">
            {/* Top section of the header with logo and action buttons */}
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-4">
                    <img src="/images/logo.png" alt="SafeSpace Logo" className="h-10 w-10" />
                    <h1 className="text-xl font-semibold text-gray-800">SafeSpace</h1>
                </div>
                <div className="flex items-center gap-6 text-gray-600">
                    <button className="hover:text-gray-900 transition-colors"><RefreshIcon /></button>
                    <button className="hover:text-gray-900 transition-colors"><SettingsIcon /></button>
                    <a href="/login" className="flex items-center gap-2 font-medium hover:text-red-600 transition-colors">
                        <SignOutIcon />
                        Sign out
                    </a>
                </div>
            </div>
            {/* Navigation bar section */}
            <nav className="w-full">
                <div className="border-2 border-black rounded-full p-1 mx-auto w-full max-w-screen-xl">
                    <div className="overflow-x-auto scrollbar-hide ">
                        <div className="flex border-2 border-gray-800 rounded-full overflow-x-auto whitespace-nowrap w-full">
                            {/* Map over the tabs array to render each navigation link */}
                            {tabs.map((tab, index) => {
                                const isActive = pathname === tab.href;
                                return (
                                    <Link
                                        key={tab.name}
                                        href={tab.href}
                                        className={`flex-1 min-w-[120px] text-center px-6 py-3 font-medium text-sm transition
                                            ${isActive
                                                ? 'bg-[#5DA39E] text-white' // Active tab style
                                                : 'bg-white text-black hover:bg-gray-100' // Inactive tab style
                                            }
                                            ${index !== tabs.length - 1 ? 'border-r border-gray-800' : ''}` // Add a border to all but the last tab
                                        }
                                    >
                                        {tab.name}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </nav>
        </header>
    );
}