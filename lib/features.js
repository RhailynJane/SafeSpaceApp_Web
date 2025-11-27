// Shared feature definitions used by access control UI and backend.
// Keep this in sync with FEATURE_DEFINITIONS in `convex/featurePermissions.ts`.
// Icons are simple keys you can map to an actual icon library (lucide, heroicons, etc.).

export const FEATURES = [
  { key: "selfAssessment", label: "Self-Assessment", icon: "bar-chart", description: "Periodic wellbeing assessments" },
  { key: "moodTracking", label: "Mood Tracking", icon: "smile", description: "Daily mood entries" },
  { key: "journaling", label: "Journaling", icon: "book-open", description: "Private reflective writing" },
  { key: "resources", label: "Resources", icon: "files", description: "Educational & support content" },
  { key: "announcements", label: "Announcements", icon: "megaphone", description: "Organization broadcast messages" },
  { key: "crisisSupport", label: "Crisis Support", icon: "alert-triangle", description: "Emergency contact pathways" },
  { key: "messages", label: "Messages", icon: "message-circle", description: "Direct & group chat" },
  { key: "appointments", label: "Appointments", icon: "calendar", description: "Scheduling & session management" },
  { key: "communityForum", label: "Community Forum", icon: "users", description: "Peer discussion space" },
  { key: "videoConsultations", label: "Video Consultations", icon: "video", description: "Live video sessions" },
];

// Map for quick lookup
export const FEATURE_MAP = Object.fromEntries(FEATURES.map(f => [f.key, f]));
