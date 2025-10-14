'use client';

// REFERENCE:
// GEMini Code Assist Agent / Gemini-Pro-2
// Create the referral intake file upload, what event handlers are needed. how to make it upload an attach to the referral
// Refactor code so Javascript is organized and above the div 
// Fix syntax please


import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Field, TextArea } from '@/components/ui/form-elements'; // Reusable input components

// --- ICON COMPONENTS ---
// These are small SVG-based React components used for decorative icons in the UI.

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const UploadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
    strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const FileIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
    <polyline points="13 2 13 9 20 9" />
  </svg>
);

// --- SUCCESS MODAL ---
// Displays after successful form submission
const SubmissionSuccessModal = ({ onClose }) => {
  const router = useRouter();
  const handleClose = () => {
    onClose(); // close modal
    router.push('/admin/referral-intake'); // redirect to referral intake dashboard
  };

  return (
    <div className="fixed inset-0 bg-white/20 backdrop-blur-2xl flex items-center justify-center z-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-sm w-full">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Referral Submitted</h2>
        <p className="text-gray-600 mb-8">
          Referral submitted successfully to team leaders!
        </p>
        <button
          onClick={handleClose}
          className="w-full bg-teal-600 text-white font-semibold py-3 rounded-lg hover:bg-teal-700 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---
// This is the main page for creating a new referral.
export default function CreateReferralPage() {
  // State variables to store form data, uploaded file, and UI states
  const [formData, setFormData] = useState({
    client_first_name: '',
    client_last_name: '',
    age: '',
    gender: '',
    phone: '',
    address: '',
    email: '',
    emergency_first_name: '',
    emergency_last_name: '',
    emergency_phone: '',
    referral_source: '',
    reason_for_referral: '',
    additional_notes: '',
  });

  const [fileName, setFileName] = useState(null); // For displaying uploaded file name
  const [consentGiven, setConsentGiven] = useState(false); // Checkbox validation
  const [showSuccessModal, setShowSuccessModal] = useState(false); // Controls modal visibility

  // --- Handle File Upload ---
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name); // store uploaded file name
    }
  };

  // --- Handle Input Changes ---
  const handleChange = (e) => {
    const { id, value } = e.target;
    // Update the specific form field dynamically
    setFormData((prevData) => ({
      ...prevData,
      [id]: value,
    }));
  };

  // --- Handle Form Submission ---
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate consent checkbox
    if (!consentGiven) {
      alert('Please confirm consent before submitting.');
      return;
    }

    // Basic validation for required fields
    if (!formData.client_first_name || !formData.client_last_name) {
      alert('Please provide client first and last name');
      return;
    }

    // Send POST request to backend API (/api/referrals)
    const res = await fetch('/api/referrals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formData,
      }),
    });

    // Show success modal on success
    if (res.ok) setShowSuccessModal(true);
  };

  // --- Clear Form Fields ---
  const handleClearForm = () => {
    setFileName(null);
    setConsentGiven(false);
    setFormData({
      client_first_name: '',
      client_last_name: '',
      age: '',
      gender: '',
      phone: '',
      address: '',
      email: '',
      emergency_first_name: '',
      emergency_last_name: '',
      emergency_phone: '',
      referral_source: '',
      reason_for_referral: '',
      additional_notes: '',
    });
    document.getElementById('referral-form').reset(); // also clears the HTML form fields
  };

  // --- RENDER ---
  return (
    <>
      {/* Outer container */}
      <div className="bg-white rounded-2xl shadow-lg max-w-2xl mx-auto flex flex-col h-[90vh]">
        
        {/* Sticky Header */}
        <div className="sticky top-0 bg-white p-6 border-b border-gray-200 z-10 text-center">
          <div className="inline-flex items-center justify-center bg-gray-100 rounded-full p-3 mb-2">
            <UserIcon />
          </div>
          <h1 className="text-xl font-bold text-gray-800">Referral Intake System</h1>
          <p className="text-gray-500 text-sm">
            Upload fax documents or manually input referral details
          </p>
        </div>

        {/* Scrollable form body */}
        <form
          id="referral-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-6 py-6 space-y-6"
        >
          {/* File Upload Section */}
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
            {fileName ? (
              // If file is uploaded, show its name
              <div className="flex items-center justify-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg max-w-xs mx-auto">
                <FileIcon />
                <span className="text-blue-700 font-medium">{fileName}</span>
              </div>
            ) : (
              // Otherwise, show upload prompt
              <>
                <UploadIcon />
                <p className="mt-2 text-gray-600">Upload fax document or referral form</p>
                <p className="text-xs text-gray-400">PDF, PNG, JPG up to 10MB</p>
              </>
            )}
            <label className="cursor-pointer mt-4 inline-block bg-gray-800 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-gray-900">
              Choose File
              <input type="file" className="hidden" onChange={handleFileChange} />
            </label>
          </div>

          {/* All Input Fields */}
          <div className="space-y-6">
            <Field label="Client First Name" id="client_first_name" value={formData.client_first_name} onChange={handleChange} placeholder="Enter client's first name" />
            <Field label="Client Last Name" id="client_last_name" value={formData.client_last_name} onChange={handleChange} placeholder="Enter client's last name" />
            <Field label="Age" id="age" value={formData.age} onChange={handleChange} placeholder="Enter age" />

            {/* Gender dropdown */}
            <div>
              <label className="font-semibold text-gray-700">Gender</label>
              <select
                id="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full mt-1 p-3 border border-gray-300 rounded-lg bg-white"
              >
                <option value="">Select gender...</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <Field label="Phone" id="phone" value={formData.phone} onChange={handleChange} placeholder="(555) 123-4567" />
            <Field label="Address" id="address" value={formData.address} onChange={handleChange} placeholder="123 Main St, City, State ZIP" />
            <Field label="Email" id="email" type="email" value={formData.email} onChange={handleChange} placeholder="client@gmail.com" />

            {/* Emergency contact details */}
            <Field label="Emergency Contact First Name" id="emergency_first_name" value={formData.emergency_first_name} onChange={handleChange} placeholder="Enter emergency contact's first name" />
            <Field label="Emergency Contact Last Name" id="emergency_last_name" value={formData.emergency_last_name} onChange={handleChange} placeholder="Enter emergency contact's last name" />
            <Field label="Emergency Contact Phone" id="emergency_phone" value={formData.emergency_phone} onChange={handleChange} placeholder="(555) 123-4567" />

            {/* Referral source dropdown */}
            <div>
              <label className="font-semibold text-gray-700">Referral Source</label>
              <select
                id="referral_source"
                value={formData.referral_source}
                onChange={handleChange}
                className="w-full mt-1 p-3 border border-gray-300 rounded-lg bg-white"
              >
                <option value="">Select referral source...</option>
                <option value="Forensic Psychiatric center">Forensic Psychiatric center</option>
                <option value="Out patient Service">Out patient Service</option>
                <option value="Mental Health Rehabilitation Program">Mental Health Rehabilitation Program</option>
                <option value="Mental Health And Addiction Center">Mental Health And Addiction Center</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Textarea fields for notes */}
            <TextArea label="Reason for Referral" id="reason_for_referral" value={formData.reason_for_referral} onChange={handleChange} placeholder="Describe the client's needs and reason for referral" />
            <TextArea label="Additional Notes" id="additional_notes" value={formData.additional_notes} onChange={handleChange} placeholder="Any additional information or special considerations" />

            {/* Consent Checkbox */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="consent"
                checked={consentGiven}
                onChange={(e) => setConsentGiven(e.target.checked)}
                className="mt-1 h-5 w-5 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
              />
              <label htmlFor="consent" className="text-gray-700 text-sm leading-snug">
                I confirm that I have obtained consent from the referred individual to share their information.
              </label>
            </div>
          </div>
        </form>

        {/* Sticky Footer Buttons */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end gap-4">
          <button
            type="button"
            onClick={handleClearForm}
            className="px-8 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-100"
          >
            Clear form
          </button>
          <button
            form="referral-form"
            type="submit"
            className="px-8 py-3 rounded-lg font-semibold text-white bg-teal-600 hover:bg-teal-700"
          >
            Submit to Team Leaders
          </button>
        </div>
      </div>

      {/* Success Modal (conditionally rendered) */}
      {showSuccessModal && <SubmissionSuccessModal onClose={() => setShowSuccessModal(false)} />}
    </>
  );
}
