'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

// --- ICONS ---
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
    strokeLinecap="round" strokeLinejoin="round"
    className="text-blue-500">
    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
    <polyline points="13 2 13 9 20 9" />
  </svg>
);

// --- SUCCESS MODAL ---
const SubmissionSuccessModal = ({ onClose }) => {
  const router = useRouter();
  const handleClose = () => {
    onClose();
    router.push('/admin/referral-intake');
  };
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-sm w-full">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Referral Submitted</h2>
        <p className="text-gray-600 mb-8">Referral submitted successfully to team leaders!</p>
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

// --- MAIN PAGE ---
export default function CreateReferralPage() {
  const [formData, setFormData] = useState({
    client_first_name: '',
    client_last_name: '',
    age: '',
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
  const [fileName, setFileName] = useState(null);
  const [consentGiven, setConsentGiven] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name);
    }
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [id]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!consentGiven) {
      alert('Please confirm consent before submitting.');
      return;
    }

    if (!formData.client_first_name || !formData.client_last_name) {
      alert('Please provide client first and last name');
      return;
    }

    const res = await fetch('/api/referrals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    if (res.ok) setShowSuccessModal(true);
  };

  const handleClearForm = () => {
    setFileName(null);
    setConsentGiven(false);
    setFormData({
      client_first_name: '',
      client_last_name: '',
      age: '',
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
    document.getElementById("referral-form").reset();
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-lg max-w-2xl mx-auto flex flex-col h-[90vh]">
        {/* Sticky Header */}
        <div className="sticky top-0 bg-white p-6 border-b border-gray-200 z-10 text-center">
          <div className="inline-flex items-center justify-center bg-gray-100 rounded-full p-3 mb-2">
            <UserIcon />
          </div>
          <h1 className="text-xl font-bold text-gray-800">Referral Intake System</h1>
          <p className="text-gray-500 text-sm">Upload fax documents or manually input referral details</p>
        </div>

        {/* Scrollable Form Body */}
        <form
          id="referral-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-6 py-6 space-y-6"
        >
          {/* File Upload */}
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
            {fileName ? (
              <div className="flex items-center justify-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg max-w-xs mx-auto">
                <FileIcon />
                <span className="text-blue-700 font-medium">{fileName}</span>
              </div>
            ) : (
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

          {/* All Form Fields */}
          <div className="space-y-6">
            <Field label="Client First Name" id="client_first_name" value={formData.client_first_name} onChange={handleChange} placeholder="Enter client's first name" />
            <Field label="Client Last Name" id="client_last_name" value={formData.client_last_name} onChange={handleChange} placeholder="Enter client's last name" />
            <Field label="Age" id="age" value={formData.age} onChange={handleChange} placeholder="Enter age" />
            <Field label="Phone" id="phone" value={formData.phone} onChange={handleChange} placeholder="(555) 123-4567" />
            <Field label="Address" id="address" value={formData.address} onChange={handleChange} placeholder="123 Main St, City, State ZIP" />
            <Field label="Email" id="email" type="email" value={formData.email} onChange={handleChange} placeholder="client@gmail.com" />
            <Field label="Emergency Contact First Name" id="emergency_first_name" value={formData.emergency_first_name} onChange={handleChange} placeholder="Enter emergency contact's first name" />
            <Field label="Emergency Contact Last Name" id="emergency_last_name" value={formData.emergency_last_name} onChange={handleChange} placeholder="Enter emergency contact's last name" />
            <Field label="Emergency Contact Phone" id="emergency_phone" value={formData.emergency_phone} onChange={handleChange} placeholder="(555) 123-4567" />

            {/* Referral Source Dropdown */}
            <div>
              <label className="font-semibold text-gray-700">Referral Source</label>
              <select
                id="referral_source"
                value={formData.referral_source}
                onChange={handleChange}
                className="w-full mt-1 p-3 border border-gray-300 rounded-lg bg-white"
              >
                <option value="">Select referral source...</option>
                <option value="Self">Self</option>
                <option value="Family Member">Family Member</option>
                <option value="Healthcare Provider">Healthcare Provider</option>
                <option value="School Counselor">School Counselor</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <TextArea label="Reason for Referral" id="reason_for_referral" value={formData.reason_for_referral} onChange={handleChange} placeholder="Describe the client's needs and reason for referral" />
            <TextArea label="Additional Notes" id="additional_notes" value={formData.additional_notes} onChange={handleChange} placeholder="Any additional information or special considerations" />

            {/* Consent Section */}
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

      {showSuccessModal && <SubmissionSuccessModal onClose={() => setShowSuccessModal(false)} />}
    </>
  );
}

// --- Reusable Input Components ---
const Field = ({ label, id, value, onChange, placeholder, type = 'text' }) => (
  <div>
    <label className="font-semibold text-gray-700">{label}</label>
    <input
      type={type}
      id={id}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full mt-1 p-3 border border-gray-300 rounded-lg"
    />
  </div>
);

const TextArea = ({ label, id, value, onChange, placeholder }) => (
  <div>
    <label className="font-semibold text-gray-700">{label}</label>
    <textarea
      id={id}
      rows="4"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full mt-1 p-3 border border-gray-300 rounded-lg"
    ></textarea>
  </div>
);
