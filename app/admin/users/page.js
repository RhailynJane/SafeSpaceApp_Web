// File path: app/(admin)/users/page.js


// REFERENCES: Gemini Code Assist Agent / Gemini-Pro-2 

'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Search, Plus, Settings, X, Filter, ArrowUpDown } from "lucide-react";

// --- ICONS ---
// A collection of simple, stateless functional components for rendering SVG icons.

/** Renders a search icon. */
const SearchIcon = () => ( <Search className="h-5 w-5 text-gray-400" /> );
/** Renders a plus icon for creating a new user. */
const PlusIcon = () => ( <Plus className="h-5 w-5" /> );
/** Renders a settings icon for the user action menu. */
const SettingsIcon = () => ( <Settings className="h-5 w-5" /> );
/** Renders a close icon ('X') for modals. */
const CloseIcon = () => ( <X className="h-5 w-5 text-gray-500 hover:text-gray-800" /> );

// --- MOCK DATA ---
// This is the initial set of users. This data is used to populate localStorage if it's empty.
const initialUsers = [
    { id: 1, firstName: 'Emerson', lastName: 'Pascual', email: 'emer.pascual@gmail.com', lastLogin: '2025-08-11 05:00 PM', createdAt: '2025-01-01 09:00 AM', status: 'Active' },
    { id: 2, firstName: 'Freddie', lastName: 'Aguilar', email: 'fred.aguilar@gmail.com', lastLogin: '2025-08-11 05:00 PM', createdAt: '2025-01-02 09:00 AM', status: 'Active' },
    { id: 3, firstName: 'Gerard', lastName: 'Chua', email: 'gerard.chua@gmail.com', lastLogin: '2025-08-11 05:00 PM', createdAt: '2025-01-03 09:00 AM', status: 'Active' },
    { id: 4, firstName: 'Komal', lastName: 'Kaur', email: 'komal.kaur@gmail.com', lastLogin: '2025-08-11 05:00 PM', createdAt: '2025-01-04 09:00 AM', status: 'Active' },
    { id: 5, firstName: 'John', lastName: 'Doe', email: 'john.doe@gmail.com', lastLogin: '2025-08-11 05:00 PM', createdAt: '2025-01-05 09:00 AM', status: 'Active' },
    { id: 6, firstName: 'Jane', lastName: 'Doe', email: 'jane.doe@gmail.com', lastLogin: 'N/A', createdAt: '2025-08-11 05:00 PM', status: 'Active' },
];

// --- MODAL COMPONENTS ---

/**
 * A confirmation modal for deleting a user.
 * @param {object} props - The component props.
 * @param {object} props.user - The user object to be deleted.
 * @param {Function} props.onConfirm - The function to call when the deletion is confirmed.
 * @param {Function} props.onCancel - The function to call to cancel the deletion.
 * @returns {JSX.Element} The DeleteUserModal component.
 */
const DeleteUserModal = ({ user, onConfirm, onCancel }) => (
    <Dialog open={true} onOpenChange={onCancel}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Delete User</DialogTitle>
                <DialogDescription>
                    Are you sure you want to delete user?
                </DialogDescription>
            </DialogHeader>
            <DialogFooter>
                <Button variant="outline" onClick={onCancel}>Cancel</Button>
                <Button variant="destructive" onClick={onConfirm}>Confirm</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
);

/**
 * A modal to show that a user has been successfully deleted.
 * @param {object} props - The component props.
 * @param {Function} props.onClose - The function to call to close the modal.
 * @returns {JSX.Element} The DeleteSuccessModal component.
 */
const DeleteSuccessModal = ({ onClose }) => (
    <Dialog open={true} onOpenChange={onClose}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Delete User</DialogTitle>
                <DialogDescription>
                    User deleted successfully!
                </DialogDescription>
            </DialogHeader>
            <DialogFooter>
                <Button onClick={onClose}>Close</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
);


/**
 * The main page for managing users.
 * It displays a list of users with search and filter functionality.
 * It also allows for creating, editing, and deleting users.
 * User data is persisted in localStorage to simulate a backend.
 * @returns {JSX.Element} The UsersPage component.
 */
export default function UsersPage() {
    // State for the search query.
    const [searchQuery, setSearchQuery] = useState('');
    // State to manage which user's action menu is currently open.
    const [activeActionMenu, setActiveActionMenu] = useState(null);
    // State to manage the currently open modal ('delete-confirm' or 'delete-success').
    const [modal, setModal] = useState({ type: null, data: null });
    // State to hold the list of users.
    const [users, setUsers] = useState([]);
    // Filter states
    const [filterRole, setFilterRole] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [showFilters, setShowFilters] = useState(false);
    // Sort state
    const [sortBy, setSortBy] = useState('created_at');
    const [sortOrder, setSortOrder] = useState('desc');
    const router = useRouter();
    const [syncing, setSyncing] = useState(false);
    const [syncResult, setSyncResult] = useState(null);

    useEffect(() => {
        const getUsers = async () => {
            const url = filterStatus === 'deleted' ? '/api/admin/users?status=deleted' : '/api/admin/users';
            const res = await fetch(url);
            const data = await res.json();
            setUsers(data);
        };
        getUsers();
        // refetch when deleted filter toggles
    }, [filterStatus]);

    // Filters the users based on the search query, role, and status.
    // Also handles sorting.
    const filteredUsers = Array.isArray(users) ? users
        .filter(user => {
            const lowercasedQuery = searchQuery.toLowerCase();
            const matchesSearch = (
                user.first_name.toLowerCase().includes(lowercasedQuery) ||
                user.last_name.toLowerCase().includes(lowercasedQuery) ||
                user.email.toLowerCase().includes(lowercasedQuery) ||
                user.role.role_name.toLowerCase().includes(lowercasedQuery)
            );
            const matchesRole = filterRole === 'all' || user.role.role_name.toLowerCase() === filterRole.toLowerCase();
            const matchesStatus = filterStatus === 'all' || user.status.toLowerCase() === filterStatus.toLowerCase();
            return matchesSearch && matchesRole && matchesStatus;
        })
        .sort((a, b) => {
            let aVal, bVal;
            switch (sortBy) {
                case 'name':
                    aVal = `${a.first_name} ${a.last_name}`.toLowerCase();
                    bVal = `${b.first_name} ${b.last_name}`.toLowerCase();
                    break;
                case 'email':
                    aVal = a.email.toLowerCase();
                    bVal = b.email.toLowerCase();
                    break;
                case 'role':
                    aVal = a.role.role_name.toLowerCase();
                    bVal = b.role.role_name.toLowerCase();
                    break;
                case 'last_login':
                    aVal = a.last_login === 'N/A' ? 0 : new Date(a.last_login).getTime();
                    bVal = b.last_login === 'N/A' ? 0 : new Date(b.last_login).getTime();
                    break;
                case 'created_at':
                default:
                    aVal = new Date(a.created_at).getTime();
                    bVal = new Date(b.created_at).getTime();
                    break;
            }
            if (sortOrder === 'asc') {
                return aVal > bVal ? 1 : -1;
            } else {
                return aVal < bVal ? 1 : -1;
            }
        }) : [];

    const handleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('desc');
        }
    };

    /**
     * Toggles the visibility of the action menu for a specific user.
     * @param {number} userId - The ID of the user.
     */
    const handleActionMenu = (userId) => {
        setActiveActionMenu(activeActionMenu === userId ? null : userId);
    };

    /**
     * Opens the delete confirmation modal for a specific user.
     * @param {object} user - The user object to be deleted.
     */
    const handleDeleteClick = (user) => {
        setModal({ type: 'delete-confirm', data: user });
        setActiveActionMenu(null); // Close the action menu
    };

    /**
     * Confirms the deletion of a user.
     * It filters the user out of the `users` state and then shows the success modal.
     */
    const handleConfirmDelete = async () => {
        const res = await fetch(`/api/admin/users/${modal.data.id}`, {
            method: 'DELETE',
        });
        if (res.ok) {
            setUsers(users.filter(user => user.id !== modal.data.id));
            setModal({ type: 'delete-success', data: modal.data });
        }
    };

    const handleSyncDeleted = async () => {
        try {
            setSyncing(true);
            setSyncResult(null);
            const res = await fetch('/api/admin/users/sync-deleted', { method: 'POST' });
            const data = await res.json();
            setSyncResult(data);
            // refresh list after sync (respect current filter)
            const url = filterStatus === 'deleted' ? '/api/admin/users?status=deleted' : '/api/admin/users';
            const refresh = await fetch(url);
            setUsers(await refresh.json());
        } catch (e) {
            setSyncResult({ error: String(e?.message || e) });
        } finally {
            setSyncing(false);
        }
    };

    /**
     * Closes any open modal.
     */
    const closeModal = () => {
        setModal({ type: null, data: null });
    };

    return (
        <>
            <div className="bg-white p-8 rounded-2xl shadow-lg">
                {/* Header with search bar and 'Create New User' button */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <div className="relative w-full md:w-1/3">
                        <Input
                            type="text"
                            placeholder="Search Users..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3"
                        />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><SearchIcon /></div>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        <Button 
                            variant="outline" 
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex-1 md:flex-initial"
                        >
                            <Filter className="h-4 w-4 mr-2" />
                            Filters
                        </Button>
                        <Button 
                            variant="outline"
                            onClick={handleSyncDeleted}
                            disabled={syncing}
                            className="flex-1 md:flex-initial"
                        >
                            {syncing ? 'Syncing…' : 'Sync Deleted from Clerk'}
                        </Button>
                        <Link href="/admin/users/create" passHref className="flex-1 md:flex-initial">
                            <Button className="w-full px-5 py-3">
                                <Plus className="h-5 w-5 mr-2" />
                                Create New User
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Advanced Filters */}
                {showFilters && (
                    <div className="mb-6 p-4 bg-muted/40 rounded-xl border border-border/60">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Filter by Role</label>
                                <select 
                                    value={filterRole} 
                                    onChange={(e) => setFilterRole(e.target.value)}
                                    className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                                >
                                    <option value="all">All Roles</option>
                                    <option value="admin">Administrator</option>
                                    <option value="team_leader">Team Leader</option>
                                    <option value="support_worker">Support Worker</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Filter by Status</label>
                                <select 
                                    value={filterStatus} 
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                                >
                                    <option value="all">All Statuses</option>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                    <option value="suspended">Suspended</option>
                                    <option value="deleted">Deleted</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {/* Sort Controls */}
                <div className="flex flex-wrap gap-2 mb-4">
                    <span className="text-sm font-medium text-muted-foreground flex items-center">Sort by:</span>
                    <Button 
                        variant={sortBy === 'name' ? 'default' : 'outline'} 
                        size="sm"
                        onClick={() => handleSort('name')}
                    >
                        Name {sortBy === 'name' && <ArrowUpDown className="ml-1 h-3 w-3" />}
                    </Button>
                    <Button 
                        variant={sortBy === 'role' ? 'default' : 'outline'} 
                        size="sm"
                        onClick={() => handleSort('role')}
                    >
                        Role {sortBy === 'role' && <ArrowUpDown className="ml-1 h-3 w-3" />}
                    </Button>
                    <Button 
                        variant={sortBy === 'last_login' ? 'default' : 'outline'} 
                        size="sm"
                        onClick={() => handleSort('last_login')}
                    >
                        Last Login {sortBy === 'last_login' && <ArrowUpDown className="ml-1 h-3 w-3" />}
                    </Button>
                    <Button 
                        variant={sortBy === 'created_at' ? 'default' : 'outline'} 
                        size="sm"
                        onClick={() => handleSort('created_at')}
                    >
                        Created {sortBy === 'created_at' && <ArrowUpDown className="ml-1 h-3 w-3" />}
                    </Button>
                    {sortBy && (
                        <span className="text-xs text-muted-foreground flex items-center ml-2">
                            ({sortOrder === 'asc' ? 'A→Z' : 'Z→A'})
                        </span>
                    )}
                </div>

                {/* Table view for desktop */}
                <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-muted/30 sticky top-0 z-10 border-b border-border">
                            <tr className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                <th className="text-left py-3 px-4">Name</th>
                                <th className="text-left py-3 px-4">Role</th>
                                <th className="text-left py-3 px-4">Last Login</th>
                                <th className="text-left py-3 px-4">Created</th>
                                <th className="text-left py-3 px-4">Status</th>
                                <th className="text-right py-3 px-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-8 text-muted-foreground">No results found</td>
                                </tr>
                            ) : (
                                filteredUsers.map(user => (
                                    <tr key={user.id} className="hover:bg-muted/50 transition-colors">
                                        {/* Name */}
                                        <td className="py-4 px-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                                    <span className="text-sm font-semibold text-primary">
                                                        {user.first_name?.[0]}{user.last_name?.[0]}
                                                    </span>
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="font-semibold text-foreground truncate">
                                                        {user.first_name} {user.last_name}
                                                    </h3>
                                                    <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                                                    <p className="text-xs text-muted-foreground/70 mt-0.5">ID: {user.id.slice(-12)}</p>
                                                </div>
                                            </div>
                                        </td>
                                        {/* Role */}
                                        <td className="py-4 px-4">
                                            <p className="font-medium text-foreground">{user.role.role_name}</p>
                                        </td>
                                        {/* Last Login */}
                                        <td className="py-4 px-4">
                                            <p className="font-medium text-foreground">{user.last_login || 'N/A'}</p>
                                        </td>
                                        {/* Created */}
                                        <td className="py-4 px-4">
                                            <p className="font-medium text-foreground">{user.created_at}</p>
                                        </td>
                                        {/* Status */}
                                        <td className="py-4 px-4">
                                            <p className="font-medium text-foreground">{user.status}</p>
                                        </td>
                                        {/* Actions */}
                                        <td className="py-4 px-4 text-right">
                                            <div className="flex justify-end relative">
                                                <Button variant="ghost" size="icon" onClick={() => handleActionMenu(user.id)}>
                                                    <Settings className="h-5 w-5" />
                                                </Button>
                                                {activeActionMenu === user.id && (
                                                    <div className="absolute right-0 top-full mt-2 w-40 bg-card border border-border rounded-lg shadow-xl z-20">
                                                        <button 
                                                            onClick={() => router.push(`/admin/users/${user.id}/edit`)} 
                                                            className="block w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted rounded-t-lg"
                                                        >
                                                            Edit User
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDeleteClick(user)} 
                                                            className="block w-full text-left px-4 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-b-lg"
                                                        >
                                                            Delete User
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile card view */}
                <div className="lg:hidden grid grid-cols-1 gap-4">
                    {filteredUsers.length === 0 ? (
                        <p className="text-center py-8 text-muted-foreground">No results found</p>
                    ) : (
                        filteredUsers.map(user => (
                            <div key={user.id} className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between gap-4">
                                    {/* Avatar and Name */}
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                            <span className="text-sm font-semibold text-primary">
                                                {user.first_name?.[0]}{user.last_name?.[0]}
                                            </span>
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-semibold text-foreground truncate">
                                                {user.first_name} {user.last_name}
                                            </h3>
                                            <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                                            <p className="text-xs text-muted-foreground/70 mt-0.5">ID: {user.id.slice(-12)}</p>
                                        </div>
                                    </div>

                                    {/* Action menu */}
                                    <div className="flex-shrink-0 relative">
                                        <Button variant="ghost" size="icon" onClick={() => handleActionMenu(user.id)}>
                                            <Settings className="h-5 w-5" />
                                        </Button>
                                        {activeActionMenu === user.id && (
                                            <div className="absolute right-0 top-full mt-2 w-40 bg-card border border-border rounded-lg shadow-xl z-10">
                                                <button 
                                                    onClick={() => router.push(`/admin/users/${user.id}/edit`)} 
                                                    className="block w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted rounded-t-lg"
                                                >
                                                    Edit User
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteClick(user)} 
                                                    className="block w-full text-left px-4 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-b-lg"
                                                >
                                                    Delete User
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Mobile view - show details below */}
                                <div className="mt-3 pt-3 border-t border-border grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <span className="text-muted-foreground text-xs">Role</span>
                                        <p className="font-medium text-foreground">{user.role.role_name}</p>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground text-xs">Status</span>
                                        <p className="font-medium text-foreground">{user.status}</p>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground text-xs">Last Login</span>
                                        <p className="font-medium text-foreground truncate">{user.last_login || 'Never'}</p>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground text-xs">Created</span>
                                        <p className="font-medium text-foreground truncate">{user.created_at}</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Conditionally render the modals based on the modal state */}
            {modal.type === 'delete-confirm' && <DeleteUserModal user={modal.data} onConfirm={handleConfirmDelete} onCancel={closeModal} />}
            {modal.type === 'delete-success' && <DeleteSuccessModal onClose={closeModal} />}
            {syncResult && (
                <div className="mt-4 text-sm text-muted-foreground">
                    {syncResult.error ? (
                        <p className="text-red-600">Sync failed: {syncResult.error}</p>
                    ) : (
                        <p>Checked {syncResult.checked || 0} users; archived {syncResult.archived || 0}.</p>
                    )}
                </div>
            )}
        </>
    );
}