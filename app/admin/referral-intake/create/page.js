// File path: app/(admin)/referral-intake/create/page.js

'use client';
import React, { useState } from 'react';

// --- ICONS ---
// Simple, stateless functional components for rendering SVG icons.

/**
 * Renders a user icon.
 * @returns {JSX.Element} The user icon SVG.
 */
const UserIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> );

/**
 * Renders an upload icon.
 * @returns {JSX.Element} The upload icon SVG.
 */
const UploadIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> );

/**
 * Renders a file icon.
 * @returns {JSX.Element} The file icon SVG.
 */
const FileIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg> );

// --- SUCCESS MODAL ---
/**
 * A modal component that is displayed upon successful submission of the referral form.
 * @param {object} props - The component props.
 * @param {Function} props.onClose - The function to call to close the modal.
 * @returns {JSX.Element} The SubmissionSuccessModal component.
 */
const SubmissionSuccessModal = ({ onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-sm w-full">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Referral Submitted</h2>
            <p className="text-gray-600 mb-8">Referral submitted successfully to team leaders!</p>
            <button onClick={onClose} className="w-full bg-teal-600 text-white font-semibold py-3 rounded-lg hover:bg-teal-700 transition-colors">Close</button>
        </div>
    </div>
);

/**
 * The main page for creating a new referral.
 * This page contains a form for either uploading a referral document or manually entering the details.
 * It manages the state for the uploaded file name and the success modal visibility.
 * @returns {JSX.Element} The CreateReferralPage component.
 */
export default function CreateReferralPage() {
    // State to store the name of the uploaded file.
    const [fileName, setFileName] = useState(null);
    // State to control the visibility of the success modal.
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    /**
     * Handles the file input change event.
     * It updates the fileName state with the name of the selected file.
     * @param {React.ChangeEvent<HTMLInputElement>} e - The file input change event.
     */
    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFileName(e.target.files[0].name);
        }
    };

    /**
     * Handles the form submission.
     * It prevents the default form submission behavior and shows the success modal.
     * In a real application, this would also handle the form data submission to an API.
     * @param {React.FormEvent<HTMLFormElement>} e - The form submission event.
     */
    const handleSubmit = (e) => {
        e.preventDefault();
        setShowSuccessModal(true);
    };
    
    /**
     * Clears the form fields and resets the file name state.
     */
    const handleClearForm = () => {
        setFileName(null);
        document.getElementById("referral-form").reset();
    };

    return (
        <>
            <form id="referral-form" onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-lg">
                {/* Form header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center bg-gray-100 rounded-full p-3 mb-2">
                        <UserIcon />
                    </div>
                    <h1 className="text-xl font-bold text-gray-800">Referral Intake System</h1>
                    <p className="text-gray-500">Upload fax documents or manually input referral details</p>
                </div>

                {/* File Upload Section */}
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center mb-8">
                    {fileName ? (
                        // Display the file name if a file has been selected
                         <div className="flex items-center justify-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg max-w-xs mx-auto">
                            <FileIcon />
                            <span className="text-blue-700 font-medium">{fileName}</span>
                        </div>
                    ) : (
                        // Display the upload prompt if no file is selected
                        <>
                            <UploadIcon />
                            <p className="mt-2 text-gray-600">Upload fax document or referral form</p>
                            <p className="text-xs text-gray-400">PDF, PNG, JPG up to 10MB</p>
                        </>
                    )}
                    {/* The actual file input is hidden and triggered by the label */}
                    <label className="cursor-pointer mt-4 inline-block bg-gray-800 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-gray-900">
                        Choose File
                        <input type="file" className="hidden" onChange={handleFileChange} />
                    </label>
                </div>

                {/* Form Fields Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-6">
                    {/* Left column of form fields */}
                    <div className="space-y-6">
                        <div><label className="font-semibold text-gray-700">Client Name</label><input type="text" placeholder="Enter client's full name" className="w-full mt-1 p-3 border border-gray-300 rounded-lg"/></div>
                        <div><label className="font-semibold text-gray-700">Age</label><input type="text" placeholder="Enter age" className="w-full mt-1 p-3 border border-gray-300 rounded-lg"/></div>
                        <div><label className="font-semibold text-gray-700">Phone</label><input type="text" placeholder="(555) 123-4567" className="w-full mt-1 p-3 border border-gray-300 rounded-lg"/></div>
                        <div><label className="font-semibold text-gray-700">Address</label><input type="text" placeholder="123 Main St City State, ZIP" className="w-full mt-1 p-3 border border-gray-300 rounded-lg"/></div>
                        <div><label className="font-semibold text-gray-700">Email</label><input type="email" placeholder="client@gmail.com" className="w-full mt-1 p-3 border border-gray-300 rounded-lg"/></div>
                        <div><label className="font-semibold text-gray-700">Emergency Contact</label><input type="text" placeholder="Name (Relationship) - Phone Number" className="w-full mt-1 p-3 border border-gray-300 rounded-lg"/></div>
                    </div>
                    {/* Right column of form fields */}
                    <div className="space-y-6">
                        <div><label className="font-semibold text-gray-700">Referral Source</label><input type="text" placeholder="Enter Source" className="w-full mt-1 p-3 border border-gray-300 rounded-lg"/></div>
                        <div><label className="font-semibold text-gray-700">Priority Level</label><select className="w-full mt-1 p-3 border border-gray-300 rounded-lg bg-white"><option>Medium</option><option>High</option><option>Low</option></select></div>
                        <div><label className="font-semibold text-gray-700">Reason for Referral</label><textarea placeholder="Describe the client's needs and reason for referral" rows="4" className="w-full mt-1 p-3 border border-gray-300 rounded-lg"></textarea></div>
                        <div><label className="font-semibold text-gray-700">Additional Notes</label><textarea placeholder="Any additional information or special considerations" rows="4" className="w-full mt-1 p-3 border border-gray-300 rounded-lg"></textarea></div>
                    </div>
                </div>

                {/* Form Action Buttons */}
                <div className="flex justify-end gap-4 mt-10">
                    <button type="button" onClick={handleClearForm} className="px-8 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-100">Clear form</button>
                    <button type="submit" className="px-8 py-3 border border-transparent rounded-lg font-semibold text-white bg-teal-600 hover:bg-teal-700">Submit to Team Leaders</button>
                </div>
            </form>
            
            {/* Conditionally render the success modal based on its state */}
            {showSuccessModal && <SubmissionSuccessModal onClose={() => setShowSuccessModal(false)} />}
        </>
    );
}