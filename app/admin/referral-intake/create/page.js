'use client';

// REFERENCE:
// This page was documented with guidance from ChatGPT (OpenAI GPT-5)
// Prompt -"add explanatory comments for each line of code."
// Purpose: Provides an admin-facing form to collect client referral information,
// upload documents, and submit data to the backend (/api/referrals).

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useRouter } from 'next/navigation';
import { Field, TextArea } from '@/components/ui/form-elements'; // Reusable input components

// --- ICON COMPONENTS ---
// These are small SVG-based React components used for decorative icons in the UI.
// created using Chatgpt (OpenAI) - prompt { create icon for user, upload and file }

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
    secondary_phone: '',
    address: '',
    email: '',
    emergency_first_name: '',
    emergency_last_name: '',
    emergency_phone: '',
    preferred_contact_method: '',
    preferred_language: '',
    pronouns: '',
    availability_notes: '',
    referring_provider_name: '',
    referring_provider_phone: '',
    referring_provider_email: '',
    relationship_to_client: '',
    consent_date: '',
    referral_source: '',
    reason_for_referral: '',
    additional_notes: '',
  });

  const [fileName, setFileName] = useState(null); // For displaying uploaded file name
  const [consentGiven, setConsentGiven] = useState(false); // Checkbox validation
  const [showSuccessModal, setShowSuccessModal] = useState(false); // Controls modal visibility
  const [errors, setErrors] = useState({}); // Inline validation messages
  const [isProcessingFile, setIsProcessingFile] = useState(false); // OCR processing state

  // Mapbox Places Autocomplete state
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';
  const [addressQuery, setAddressQuery] = useState('');
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [isAddrLoading, setIsAddrLoading] = useState(false);
  const addrAbortRef = useRef(null);

  // --- Handle File Upload with OCR ---
  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileName(file.name);
      
      // Check if it's an image or PDF
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        alert('Please upload a PDF, PNG, or JPG file');
        return;
      }

      setIsProcessingFile(true);
      
      try {
        // Use Gemini API for document extraction
        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
        if (!apiKey) {
          alert('Gemini API key not configured. Please add NEXT_PUBLIC_GEMINI_API_KEY to .env.local');
          setIsProcessingFile(false);
          return;
        }

        // Convert file to base64
        const reader = new FileReader();
        reader.readAsDataURL(file);
        
        reader.onload = async () => {
          try {
            const base64Data = reader.result.split(',')[1];
            const mimeType = file.type;

            // Call backend API to extract form data
            const response = await fetch('/api/extract-referral', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ base64Data, mimeType })
            });

            if (!response.ok) {
              const errorData = await response.json();
              console.error('Extraction error:', errorData);
              throw new Error(errorData.suggestion || errorData.error || 'Failed to process document');
            }

            const { data: extractedData } = await response.json();
              
            // Auto-fill form fields with extracted data
            setFormData(prev => ({
              ...prev,
              ...Object.fromEntries(
                Object.entries(extractedData).map(([key, value]) => [
                  key,
                  value || prev[key] // Keep existing value if extraction is empty
                ])
              )
            }));
            
            // Update address query for autocomplete
            if (extractedData.address) {
              setAddressQuery(extractedData.address);
            }
            
            alert('Form fields auto-filled from uploaded document! Please review and update as needed.');
          } catch (err) {
            console.error('OCR error:', err);
            alert('Could not extract data from document. Please fill the form manually.');
          } finally {
            setIsProcessingFile(false);
          }
        };

        reader.onerror = () => {
          alert('Failed to read file');
          setIsProcessingFile(false);
        };
        
      } catch (err) {
        console.error('File processing error:', err);
        alert('Error processing file');
        setIsProcessingFile(false);
      }
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

    // Live-validate individual fields when they change
    if (id === 'email') {
      setErrors((prev) => ({ ...prev, email: value && !isValidEmail(value) ? 'Enter a valid email' : undefined }));
    }
    if (id === 'phone') {
      setErrors((prev) => ({ ...prev, phone: value && !isValidPhone(value) ? 'Enter a valid phone number' : undefined }));
    }
    if (id === 'secondary_phone') {
      setErrors((prev) => ({ ...prev, secondary_phone: value && !isValidPhone(value) ? 'Enter a valid phone number' : undefined }));
    }
    if (id === 'emergency_phone') {
      setErrors((prev) => ({ ...prev, emergency_phone: value && !isValidPhone(value) ? 'Enter a valid emergency phone' : undefined }));
    }
    if (id === 'referring_provider_phone') {
      setErrors((prev) => ({ ...prev, referring_provider_phone: value && !isValidPhone(value) ? 'Enter a valid provider phone' : undefined }));
    }
    if (id === 'age') {
      setErrors((prev) => ({ ...prev, age: value && !isValidAge(value) ? 'Age must be between 0 and 120' : undefined }));
    }
    if (id === 'referring_provider_email') {
      setErrors((prev) => ({ ...prev, referring_provider_email: value && !isValidEmail(value) ? 'Enter a valid email' : undefined }));
    }
    if (id === 'consent_date') {
      setErrors((prev) => ({ ...prev, consent_date: value && !isValidDate(value) ? 'Enter a valid date (YYYY-MM-DD)' : undefined }));
    }

    if (id === 'address') {
      setAddressQuery(value);
    }
  };

  // --- Handle Form Submission ---
  const createReferral = useMutation(api.referrals.create);

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

    // Optional field validations (only if provided)
    const newErrors = {};
    if (formData.email && !isValidEmail(formData.email)) newErrors.email = 'Enter a valid email';
    if (formData.phone && !isValidPhone(formData.phone)) newErrors.phone = 'Enter a valid phone number';
    if (formData.secondary_phone && !isValidPhone(formData.secondary_phone)) newErrors.secondary_phone = 'Enter a valid phone number';
    if (formData.emergency_phone && !isValidPhone(formData.emergency_phone)) newErrors.emergency_phone = 'Enter a valid emergency phone';
    if (formData.age && !isValidAge(formData.age)) newErrors.age = 'Age must be between 0 and 120';
    if (formData.referring_provider_phone && !isValidPhone(formData.referring_provider_phone)) newErrors.referring_provider_phone = 'Enter a valid provider phone';
    if (formData.referring_provider_email && !isValidEmail(formData.referring_provider_email)) newErrors.referring_provider_email = 'Enter a valid email';
    if (formData.consent_date && !isValidDate(formData.consent_date)) newErrors.consent_date = 'Enter a valid date (YYYY-MM-DD)';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    // Compose extra optional fields into additional_notes so backend stores them without schema changes
    const extraLines = [];
    const addLine = (label, val) => { if (val) extraLines.push(`${label}: ${val}`); };
    addLine('Secondary Phone', formData.secondary_phone);
    addLine('Preferred Contact', formData.preferred_contact_method);
    addLine('Preferred Language', formData.preferred_language);
    addLine('Pronouns', formData.pronouns);
    addLine('Availability', formData.availability_notes);
    addLine('Referring Provider Name', formData.referring_provider_name);
    addLine('Referring Provider Phone', formData.referring_provider_phone);
    addLine('Referring Provider Email', formData.referring_provider_email);
    addLine('Relationship To Client', formData.relationship_to_client);
    addLine('Consent Date', formData.consent_date);
    const composedAdditional = [formData.additional_notes || '', extraLines.join('\n')]
      .filter(Boolean)
      .join('\n');

    // Send POST request to backend API (/api/referrals)
    try {
      await createReferral({
        client_first_name: formData.client_first_name,
        client_last_name: formData.client_last_name,
        age: formData.age ? Number(formData.age) : undefined,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
        email: formData.email || undefined,
        emergency_first_name: formData.emergency_first_name || undefined,
        emergency_last_name: formData.emergency_last_name || undefined,
        emergency_phone: formData.emergency_phone || undefined,
        referral_source: formData.referral_source || 'Unknown',
        reason_for_referral: formData.reason_for_referral || '',
        additional_notes: composedAdditional || undefined,
      });
      handleClearForm();
      setShowSuccessModal(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to submit referral';
      alert(msg);
    }
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
      secondary_phone: '',
      address: '',
      email: '',
      emergency_first_name: '',
      emergency_last_name: '',
      emergency_phone: '',
      preferred_contact_method: '',
      preferred_language: '',
      pronouns: '',
      availability_notes: '',
      referring_provider_name: '',
      referring_provider_phone: '',
      referring_provider_email: '',
      relationship_to_client: '',
      consent_date: '',
      referral_source: '',
      reason_for_referral: '',
      additional_notes: '',
    });
    setErrors({});
    setAddressQuery('');
    setAddressSuggestions([]);
    document.getElementById('referral-form').reset(); // also clears the HTML form fields
  };

  // --- Validation helpers ---
  function isValidEmail(email) {
    // Basic email regex
    const re = /[^\s@]+@[^\s@]+\.[^\s@]+/;
    return re.test(String(email).toLowerCase());
  }

  function isValidPhone(input) {
    // Accept common formats; check for 10-15 digits after stripping non-digits
    const digits = String(input).replace(/\D/g, '');
    return digits.length >= 10 && digits.length <= 15;
  }

  function isValidAge(input) {
    const n = Number(input);
    return Number.isInteger(n) && n >= 0 && n <= 120;
  }

  function isValidDate(input) {
    // Expect YYYY-MM-DD, allow Date.parse fallback
    if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(input)) return false;
    const t = Date.parse(input);
    return !Number.isNaN(t);
  }

  // --- Mapbox address autocomplete ---
  const debouncedQuery = useDebounce(addressQuery, 300);

  useEffect(() => {
    if (!mapboxToken || !debouncedQuery || debouncedQuery.length < 3) {
      setAddressSuggestions([]);
      return;
    }

    // Abort previous in-flight request
    if (addrAbortRef.current) addrAbortRef.current.abort();
    const controller = new AbortController();
    addrAbortRef.current = controller;

    const fetchSuggestions = async () => {
      try {
        setIsAddrLoading(true);
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          debouncedQuery
        )}.json?autocomplete=true&limit=5&access_token=${mapboxToken}`;
        const resp = await fetch(url, { signal: controller.signal });
        if (!resp.ok) throw new Error('Mapbox error');
        const data = await resp.json();
        setAddressSuggestions(Array.isArray(data?.features) ? data.features : []);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setAddressSuggestions([]);
        }
      } finally {
        setIsAddrLoading(false);
      }
    };

    fetchSuggestions();
  }, [debouncedQuery, mapboxToken]);

  const handleSelectSuggestion = (feature) => {
    const place = feature?.place_name || '';
    setFormData((prev) => ({ ...prev, address: place }));
    setAddressQuery(place);
    setAddressSuggestions([]);
  };

  // Debounce hook
  function useDebounce(value, delay) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
      const handler = setTimeout(() => setDebounced(value), delay);
      return () => clearTimeout(handler);
    }, [value, delay]);
    return debounced;
  }

  // --- RENDER ---
  return (
    <>
      {/* Outer container */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg max-w-5xl mx-auto flex flex-col h-[90vh]">
        
        {/* Sticky Header */}
        <div className="sticky top-0 bg-gradient-to-r from-teal-600 to-cyan-600 p-4 md:p-3 border-b border-teal-700/20 z-10 text-center text-white">
          <div className="inline-flex items-center justify-center bg-white/15 rounded-full p-2.5 mb-1.5">
            <UserIcon />
          </div>
          <h1 className="text-lg md:text-xl font-bold">Referral Intake System</h1>
          <p className="text-white/80 text-xs md:text-sm">Upload fax documents or manually input referral details</p>
        </div>

        {/* Scrollable form body */}
        <form
          id="referral-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-6 py-6 space-y-6"
        >
          {/* File Upload Section */}
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
            {isProcessingFile ? (
              // Show processing state
              <div className="py-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-3"></div>
                <p className="text-teal-600 font-medium">Processing document...</p>
                <p className="text-xs text-gray-500 mt-1">Extracting form data using AI</p>
              </div>
            ) : fileName ? (
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
                <p className="text-xs text-gray-400">PDF, PNG, JPG up to 10MB - AI will auto-fill the form</p>
              </>
            )}
            <label className={`cursor-pointer mt-4 inline-block px-6 py-2.5 rounded-lg font-semibold ${
              isProcessingFile 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-gray-800 hover:bg-gray-900'
            } text-white`}>
              {isProcessingFile ? 'Processing...' : 'Choose File'}
              <input 
                type="file" 
                className="hidden" 
                onChange={handleFileChange} 
                disabled={isProcessingFile}
                accept=".pdf,.png,.jpg,.jpeg"
              />
            </label>
          </div>

          {/* All Input Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Field label="Client First Name" id="client_first_name" value={formData.client_first_name} onChange={handleChange} placeholder="Enter client's first name" />
            </div>
            <div>
              <Field label="Client Last Name" id="client_last_name" value={formData.client_last_name} onChange={handleChange} placeholder="Enter client's last name" />
            </div>
            <div>
              <Field label="Age" id="age" value={formData.age} onChange={handleChange} placeholder="Enter age" type="number" />
              {errors.age && (
                <p className="text-red-600 text-sm mt-1">{errors.age}</p>
              )}
            </div>

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

            <div>
              <Field label="Phone" id="phone" value={formData.phone} onChange={handleChange} placeholder="(555) 123-4567" />
              {errors.phone && (
                <p className="text-red-600 text-sm mt-1">{errors.phone}</p>
              )}
            </div>

            <div>
              <Field label="Secondary Phone (optional)" id="secondary_phone" value={formData.secondary_phone} onChange={handleChange} placeholder="(555) 234-5678" />
              {errors.secondary_phone && (
                <p className="text-red-600 text-sm mt-1">{errors.secondary_phone}</p>
              )}
            </div>

            {/* Address with Mapbox autocomplete */}
            <div className="relative md:col-span-2">
              <label className="font-semibold text-gray-700">Address</label>
              <input
                id="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="123 Main St, City, State ZIP"
                className="w-full mt-1 p-3 border border-gray-300 rounded-lg"
                autoComplete="off"
              />
              {mapboxToken && addressSuggestions.length > 0 && (
                <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow max-h-56 overflow-auto">
                  {addressSuggestions.map((f) => (
                    <li
                      key={f.id}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                      onClick={() => handleSelectSuggestion(f)}
                    >
                      {f.place_name}
                    </li>
                  ))}
                </ul>
              )}
              {!mapboxToken && (
                <p className="text-xs text-gray-400 mt-1">Set NEXT_PUBLIC_MAPBOX_TOKEN to enable address suggestions</p>
              )}
            </div>

            <div>
              <Field label="Email" id="email" type="email" value={formData.email} onChange={handleChange} placeholder="client@gmail.com" />
              {errors.email && (
                <p className="text-red-600 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            {/* Emergency contact details */}
            <div>
              <Field label="Emergency Contact First Name" id="emergency_first_name" value={formData.emergency_first_name} onChange={handleChange} placeholder="Enter emergency contact's first name" />
            </div>
            <div>
              <Field label="Emergency Contact Last Name" id="emergency_last_name" value={formData.emergency_last_name} onChange={handleChange} placeholder="Enter emergency contact's last name" />
            </div>
            <div>
              <Field label="Emergency Contact Phone" id="emergency_phone" value={formData.emergency_phone} onChange={handleChange} placeholder="(555) 123-4567" />
              {errors.emergency_phone && (
                <p className="text-red-600 text-sm mt-1">{errors.emergency_phone}</p>
              )}
            </div>

            {/* Preferences */}
            <div>
              <label className="font-semibold text-gray-700">Preferred Contact Method</label>
              <select
                id="preferred_contact_method"
                value={formData.preferred_contact_method}
                onChange={handleChange}
                className="w-full mt-1 p-3 border border-gray-300 rounded-lg bg-white"
              >
                <option value="">Select method...</option>
                <option value="phone">Phone</option>
                <option value="email">Email</option>
                <option value="sms">SMS</option>
              </select>
            </div>

            <div>
              <Field label="Preferred Language" id="preferred_language" value={formData.preferred_language} onChange={handleChange} placeholder="e.g., English, French" />
            </div>
            <div>
              <Field label="Pronouns" id="pronouns" value={formData.pronouns} onChange={handleChange} placeholder="e.g., she/her, he/him, they/them" />
            </div>
            <div className="md:col-span-2">
              <TextArea label="Availability Notes" id="availability_notes" value={formData.availability_notes} onChange={handleChange} placeholder="Days/times that work best" />
            </div>

            {/* Referring provider details */}
            <div>
              <Field label="Referring Provider Name" id="referring_provider_name" value={formData.referring_provider_name} onChange={handleChange} placeholder="Provider full name" />
            </div>
            <div>
              <Field label="Referring Provider Phone" id="referring_provider_phone" value={formData.referring_provider_phone} onChange={handleChange} placeholder="(555) 987-6543" />
              {errors.referring_provider_phone && (
                <p className="text-red-600 text-sm mt-1">{errors.referring_provider_phone}</p>
              )}
            </div>
            <div>
              <Field label="Referring Provider Email" id="referring_provider_email" value={formData.referring_provider_email} onChange={handleChange} placeholder="provider@example.com" />
              {errors.referring_provider_email && (
                <p className="text-red-600 text-sm mt-1">{errors.referring_provider_email}</p>
              )}
            </div>

            <div>
              <Field label="Relationship To Client" id="relationship_to_client" value={formData.relationship_to_client} onChange={handleChange} placeholder="e.g., parent, guardian, case worker" />
            </div>
            <div>
              <Field label="Consent Date" id="consent_date" value={formData.consent_date} onChange={handleChange} placeholder="YYYY-MM-DD" type="date" />
              {errors.consent_date && (
                <p className="text-red-600 text-sm mt-1">{errors.consent_date}</p>
              )}
            </div>

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
            <div className="md:col-span-2">
              <TextArea label="Reason for Referral" id="reason_for_referral" value={formData.reason_for_referral} onChange={handleChange} placeholder="Describe the client's needs and reason for referral" />
            </div>
            <div className="md:col-span-2">
              <TextArea label="Additional Notes" id="additional_notes" value={formData.additional_notes} onChange={handleChange} placeholder="Any additional information or special considerations" />
            </div>

            {/* Consent Checkbox */}
            <div className="flex items-start gap-3 md:col-span-2">
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
