// File path: app/(admin)/users/page.js


// REFERENCES: Gemini Code Assist Agent / Gemini-Pro-2 

'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// --- ICONS ---
// A collection of simple, stateless functional components for rendering SVG icons.

/** Renders a search icon. */
const SearchIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg> );
/** Renders a plus icon for creating a new user. */
const PlusIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg> );
/** Renders a settings icon for the user action menu. */
const SettingsIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg> );
/** Renders a close icon ('X') for modals. */
const CloseIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500 hover:text-gray-800"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg> );

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
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-sm w-full">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Delete User</h2>
            <p className="text-gray-600 mb-8">Are you sure you want to delete user?</p>
            <div className="flex justify-center gap-4">
                <button onClick={onCancel} className="px-8 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-100">Cancel</button>
                <button onClick={onConfirm} className="px-8 py-3 border border-transparent rounded-lg font-semibold text-white bg-teal-600 hover:bg-teal-700">Confirm</button>
            </div>
        </div>
    </div>
);

/**
 * A modal to show that a user has been successfully deleted.
 * @param {object} props - The component props.
 * @param {Function} props.onClose - The function to call to close the modal.
 * @returns {JSX.Element} The DeleteSuccessModal component.
 */
const DeleteSuccessModal = ({ onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-sm w-full">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Delete User</h2>
            <p className="text-gray-600 mb-8">User deleted successfully!</p>
            <button onClick={onClose} className="w-full bg-teal-600 text-white font-semibold py-3 rounded-lg hover:bg-teal-700 transition-colors">Close</button>
        </div>
    </div>
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
            user.email.toLowerCase().includes(lowercasedQuery)
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
                        <input
                            type="text"
                            placeholder="Search Users..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><SearchIcon /></div>
                    </div>
                    <Link href="/admin/users/create" className="flex items-center justify-center gap-2 w-full md:w-auto px-5 py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors">
                        <PlusIcon />
                        Create New User
                    </Link>
                </div>

                {/* User table */}
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead>
                            <tr className="border-b border-gray-200">
                                {['ID', 'First Name', 'Last Name', 'Email Address', 'Last Login', 'Created At', 'Status', ''].map(header => (
                                    <th key={header} className="px-6 py-3 text-left text-xs font-bold text-teal-800 uppercase tracking-wider bg-teal-50">{header}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredUsers.map(user => (
                                <tr key={user.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{user.first_name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{user.last_name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.last_login}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.created_at}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">{user.status}</span>
                                    </td>
                                    {/* Action menu for each user */}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center relative">
                                        <button onClick={() => handleActionMenu(user.id)} className="text-gray-500 hover:text-gray-800">
                                            <SettingsIcon />
                                        </button>
                                        {/* The action menu dropdown, conditionally rendered */}
                                        {activeActionMenu === user.id && (
                                            <div className="absolute right-8 top-full mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-xl z-10">
                                                <button onClick={() => router.push(`/users/${user.id}/edit`)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Edit User</button>
                                                <button onClick={() => handleDeleteClick(user)} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">Delete User</button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {/* Message to display when no search results are found */}
                     {filteredUsers.length === 0 && (
                        <p className="text-center py-8 text-gray-500">No results found</p>
                    )}
                </div>
                 {/* A simple scrollbar placeholder */}
                 <div className="w-full h-2 bg-gray-200 rounded-full mt-6">
                    <div className="h-2 bg-gray-400 rounded-full" style={{ width: '50%' }}></div>
                </div>
            </div>

            {/* Conditionally render the modals based on the modal state */}
            {modal.type === 'delete-confirm' && <DeleteUserModal user={modal.data} onConfirm={handleConfirmDelete} onCancel={closeModal} />}
            {modal.type === 'delete-success' && <DeleteSuccessModal onClose={closeModal} />}
        </>
    );
}