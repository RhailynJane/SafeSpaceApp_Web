// File path: app/admin/users/[id]/edit/page.js

'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

// --- SUCCESS MODAL ---
/**
 * A modal component that is displayed upon successful saving of user settings.
 * @param {object} props - The component props.
 * @param {Function} props.onClose - The function to call to close the modal.
 * @returns {JSX.Element} The SaveSuccessModal component.
 */
const SaveSuccessModal = ({ onClose }) => (
    <div className="fixed inset-0 bg-white/20 backdrop-blur-2xl flex items-center justify-center z-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-sm w-full">
            <h2 className="text-xl font-bold text-gray-800 mb-4">User Settings Saved</h2>
            <p className="text-gray-600 mb-8">User settings saved successfully.</p>
            <button onClick={onClose} className="w-full bg-teal-600 text-white font-semibold py-3 rounded-lg hover:bg-teal-700 transition-colors">Close</button>
        </div>
    </div>
);


/**
 * The main page for editing an existing user's details.
 * It fetches the user's data based on the ID from the URL, populates a form with that data,
 * and allows the admin to update the information.
 * @returns {JSX.Element} The EditUserPage component.
 */
export default function EditUserPage() {
    const router = useRouter();
    const params = useParams();
    // State to hold the user data being edited.
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // State to control the visibility of the success modal.
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // This effect runs when the component mounts or when the id in the URL changes.
    // It fetches the user from the API and sets it in the state.
    useEffect(() => {
        async function fetchUser() {
            if (!params.id) return;
            
            try {
                setLoading(true);
                const res = await fetch(`/api/admin/users/${params.id}`);
                if (!res.ok) {
                    throw new Error('Failed to fetch user data');
                }
                const userData = await res.json();
                setUser(userData);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchUser();
    }, [params.id]);

    /**
     * Handles changes in the form fields and updates the user state.
     * @param {React.ChangeEvent<HTMLInputElement | HTMLSelectElement>} e - The input change event.
     */
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setUser(prevUser => ({ ...prevUser, [name]: value }));
    };

    /**
     * Handles the form submission.
     * It prevents the default form submission and shows the success modal.
     * In a real application, this would contain the logic to save the updated user data to the database.
     * @param {React.FormEvent<HTMLFormElement>} e - The form submission event.
     */
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`/api/admin/users/${params.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    first_name: user.first_name,
                    last_name: user.last_name,
                    email: user.email,
                    role: user.role,
                }),
            });
            if (!res.ok) {
                throw new Error('Failed to update user');
            }
            setShowSuccessModal(true);
        } catch (err) {
            console.error('Error updating user:', err);
            alert('Failed to update user. Please try again.');
        }
    };
    
    /**
     * Closes the success modal and navigates the user back to the main users list.
     */
    const handleCloseModal = () => {
        setShowSuccessModal(false);
        router.push('/admin/users');
    }

    // Display a loading spinner while the user data is being fetched.
    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
            </div>
        );
    }

    // Display an error message if the fetch failed.
    if (error) {
        return (
            <div className="bg-white p-8 rounded-2xl shadow-lg">
                <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
                <p className="text-gray-700 mb-4">{error}</p>
                <Button onClick={() => router.push('/admin/users')} variant="outline">
                    Back to Users
                </Button>
            </div>
        );
    }

    // Display a message if no user was found.
    if (!user) {
        return (
            <div className="bg-white p-8 rounded-2xl shadow-lg">
                <h1 className="text-2xl font-bold text-gray-800 mb-4">User Not Found</h1>
                <Button onClick={() => router.push('/admin/users')} variant="outline">
                    Back to Users
                </Button>
            </div>
        );
    }

    return (
        <>
            <div className="bg-white p-8 rounded-2xl shadow-lg">
                <h1 className="text-2xl font-bold text-gray-800 mb-8">Edit User</h1>
                <form onSubmit={handleSubmit}>
                    {/* Grid for form fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                        {/* First Name */}
                        <div>
                            <label htmlFor="first_name" className="block text-sm font-semibold text-gray-700">First Name</label>
                            <Input
                                type="text"
                                id="first_name"
                                name="first_name"
                                value={user.first_name || ''}
                                onChange={handleInputChange}
                                className="mt-1"
                            />
                        </div>
                        {/* Last Name */}
                        <div>
                            <label htmlFor="last_name" className="block text-sm font-semibold text-gray-700">Last Name</label>
                            <Input
                                type="text"
                                id="last_name"
                                name="last_name"
                                value={user.last_name || ''}
                                onChange={handleInputChange}
                                className="mt-1"
                            />
                        </div>
                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-semibold text-gray-700">Email</label>
                            <Input
                                type="email"
                                id="email"
                                name="email"
                                value={user.email || ''}
                                onChange={handleInputChange}
                                className="mt-1"
                            />
                        </div>
                        {/* Role */}
                        <div>
                            <label htmlFor="role" className="block text-sm font-semibold text-gray-700">Role</label>
                            <select
                                id="role"
                                name="role"
                                value={user.role || ''}
                                onChange={handleInputChange}
                                className="mt-1 block w-full p-3 border border-gray-300 rounded-lg"
                            >
                                <option value="">Select a role</option>
                                <option value="admin">Administrator</option>
                                <option value="team_leader">Team Leader</option>
                                <option value="support_worker">Support Worker</option>
                            </select>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-4 mt-8">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.push('/admin/users')}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="bg-teal-600 hover:bg-teal-700"
                        >
                            Save Changes
                        </Button>
                    </div>
                </form>
            </div>
            {/* Conditionally render the success modal */}
            {showSuccessModal && <SaveSuccessModal onClose={handleCloseModal} />}
        </>
    );
}
