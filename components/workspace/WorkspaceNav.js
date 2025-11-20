'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Calendar, 
  UserPlus, 
  BarChart3,
  MessageSquare,
  AlertTriangle,
  ClipboardList
} from 'lucide-react';

/**
 * WorkspaceNav component provides a side navigation for the workspace.
 * It dynamically highlights the currently active tab based on the URL query parameter.
 */
export default function WorkspaceNav() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const activeTab = searchParams?.get('tab') || 'Overview';

    const navLinks = [
        { name: 'Overview', tab: 'Overview', icon: LayoutDashboard },
        { name: 'Clients', tab: 'Clients', icon: Users },
        { name: 'Referrals', tab: 'Referrals', icon: UserPlus },
        { name: 'Notes', tab: 'Notes', icon: FileText },
        { name: 'Schedule', tab: 'Schedule', icon: Calendar },
        { name: 'Reports', tab: 'Reports', icon: BarChart3 },
        { name: 'Messages', tab: 'Messages', icon: MessageSquare },
        { name: 'Crisis Events', tab: 'Crisis', icon: AlertTriangle },
        { name: 'Audit Logs', tab: 'Audit', icon: ClipboardList },
    ];

    return (
        <aside className="h-screen w-64 border-r border-border bg-card text-card-foreground sticky top-0">
            <div className="p-6 border-b border-border">
                <h2 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
                    Workspace
                </h2>
                <p className="text-xs text-muted-foreground mt-1">Staff Portal</p>
            </div>
            <nav className="p-3">
                <ul className="space-y-1">
                    {navLinks.map((link) => {
                        const active = activeTab === link.tab;
                        const Icon = link.icon;
                        return (
                            <li key={link.tab}>
                                <Link
                                    href={`/workspace?tab=${link.tab}`}
                                    className={[
                                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                                        active
                                            ? "bg-primary text-primary-foreground shadow-sm"
                                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                                    ].join(" ")}
                                    aria-current={active ? 'page' : undefined}
                                >
                                    <Icon className="h-5 w-5" />
                                    <span>{link.name}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>
        </aside>
    );
}
