'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';


// REFERENCES: Gemini Code Assist Agent / Gemini-Pro-2 

// --- Create User Form Page ---
/**
 * The main page for creating a new user account.
 * It provides a form to enter user details like name, role, and email.
 * On submission, it adds the new user to the list stored in localStorage and shows a success modal.
 * @returns {JSX.Element} The CreateUserPage component.
 */
export default function CreateUserPage() {
    // State to control the visibility of the success modal.
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    // State to manage the form data for the new user.
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        role: 'Select Role',
        email: '',
        password: '',
    });
    const router = useRouter();

    /**
     * Handles changes in the form fields and updates the formData state.
     * @param {React.ChangeEvent<HTMLInputElement | HTMLSelectElement>} e - The input change event.
     */
    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [id]: value,
        }));
    };

    /**
     * Handles the form submission.
     * It creates a new user object, adds it to the list of users in localStorage, and shows the success modal.
     * @param {React.FormEvent<HTMLFormElement>} e - The form submission event.
     */
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const res = await fetch('/api/admin/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
        });

        if (res.ok) {
            setShowSuccessModal(true);
        }
    };

    /**
     * Closes the success modal and navigates the user back to the main users list.
     * It also refreshes the page to ensure the new user is displayed in the list.
     */
    const handleCloseModal = () => {
        setShowSuccessModal(false);
        router.push('/admin/users'); // Navigate back to the user list page
    };

    return (
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-800 mb-8">Create New User Account</h1>
            
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Grid for first name and last name fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">First Name</label>
                        <input type="text" id="firstName" placeholder="Enter First Name" value={formData.firstName} onChange={handleChange} className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500" />
                    </div>
                    <div>
                        <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Last Name</label>
                        <input type="text" id="lastName" placeholder="Enter Last Name" value={formData.lastName} onChange={handleChange} className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500" />
                    </div>
                </div>

                {/* Role selection field */}
                <div>
                    <label htmlFor="role" className="block text-sm font-medium text-gray-700">Role</label>
                    <select id="role" value={formData.role} onChange={handleChange} className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500">
                        <option>Select Role</option>
                        <option>Support Worker</option>
                        <option>Therapist</option>
                        <option>Admin</option>
                        <option>Patient</option>
                    </select>
                </div>

                {/* Email address field */}
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
                    <input type="email" id="email" placeholder="Enter email address" value={formData.email} onChange={handleChange} className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500" />
                </div>

                {/* Temporary password field (read-only) */}
                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                    <input type="password" id="password" placeholder="Enter a password" value={formData.password} onChange={handleChange} className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500" />
                </div>

                {/* Form action buttons */}
                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={() => router.push('/admin/users')} className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                    <button type="submit" className="px-6 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700">Create User</button>
                </div>
            </form>

            {/* Success Modal, conditionally rendered */}
            {showSuccessModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-sm w-full">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">User Created</h2>
                        <p className="text-gray-600 mb-6">User created successfully.</p>
                        <button 
                            onClick={handleCloseModal} 
                            className="w-full bg-teal-600 text-white font-semibold py-3 rounded-lg hover:bg-teal-700 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}