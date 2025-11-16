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

    useEffect(() => {
        const getUsers = async () => {
            const res = await fetch('/api/admin/users');
            const data = await res.json();
            setUsers(data);
        };
        getUsers();
    }, []);

    // Filters the users based on the search query.
    // This is recalculated on every render, ensuring the list is always up-to-date with the search query.
    const filteredUsers = Array.isArray(users) ? users.filter(user => {
        const lowercasedQuery = searchQuery.toLowerCase();
        return (
            user.first_name.toLowerCase().includes(lowercasedQuery) ||
            user.last_name.toLowerCase().includes(lowercasedQuery) ||
            user.email.toLowerCase().includes(lowercasedQuery) ||
            user.role.role_name.toLowerCase().includes(lowercasedQuery)
        );
    }) : [];

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
                    <Link href="/admin/users/create" passHref>
                        <Button className="w-full md:w-auto px-5 py-3">
                            <Plus className="h-5 w-5 mr-2" />
                            Create New User
                        </Button>
                    </Link>
                </div>

                {/* User cards - responsive grid */}
                <div className="grid grid-cols-1 gap-4">
                    {filteredUsers.length === 0 ? (
                        <p className="text-center py-8 text-muted-foreground">No results found</p>
                    ) : (
                        filteredUsers.map(user => (
                            <div key={user.id} className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0 space-y-3">
                                        {/* Header with name and status */}
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-3 min-w-0">
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
                                                </div>
                                            </div>
                                            <span className="flex-shrink-0 px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                                {user.status}
                                            </span>
                                        </div>

                                        {/* Details grid */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                                            <div>
                                                <span className="text-muted-foreground text-xs">User ID</span>
                                                <p className="font-medium text-foreground">user_{user.id.slice(-8)}</p>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground text-xs">Role</span>
                                                <p className="font-medium text-foreground">{user.role.role_name}</p>
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
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Conditionally render the modals based on the modal state */}
            {modal.type === 'delete-confirm' && <DeleteUserModal user={modal.data} onConfirm={handleConfirmDelete} onCancel={closeModal} />}
            {modal.type === 'delete-success' && <DeleteSuccessModal onClose={closeModal} />}
        </>
    );
}