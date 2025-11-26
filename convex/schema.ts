import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Comprehensive Convex Schema for SafeSpace Web & Mobile App
 * This schema combines the web application's Prisma models with the mobile app's Convex schema
 * and adds SuperAdmin and Organization management capabilities.
 */

export default defineSchema({
	// ============================================
	// ORGANIZATIONS & SUPERADMIN
	// ============================================
	
	organizations: defineTable({
		name: v.string(),
		slug: v.string(), // URL-friendly identifier (e.g., 'cmha-calgary', 'sait', 'unaffiliated')
		description: v.optional(v.string()),
		contactEmail: v.optional(v.string()),
		contactPhone: v.optional(v.string()),
		address: v.optional(v.string()),
		website: v.optional(v.string()),
		logoUrl: v.optional(v.string()),
		status: v.string(), // 'active' | 'inactive' | 'suspended'
		settings: v.optional(v.object({
			maxUsers: v.optional(v.number()),
			features: v.optional(v.array(v.string())), // enabled features for this org
			customBranding: v.optional(v.boolean()),
		})),
		createdAt: v.number(),
		updatedAt: v.number(),
		createdBy: v.optional(v.string()), // clerk user id of creator
	})
		.index("by_slug", ["slug"])
		.index("by_status", ["status"])
		.index("by_createdAt", ["createdAt"]),

	// ============================================
	// USERS & ROLES
	// ============================================
	
	// UNIFIED users table (supports both mobile and web)
	// Mobile app uses: clerkId, email, firstName, lastName, imageUrl, orgId
	// Web app adds: roleId, status, phoneNumber, address, emergency contacts
	users: defineTable({
		clerkId: v.string(), // Clerk user ID (unique identifier)
		email: v.optional(v.string()), // Optional for mobile compatibility
		firstName: v.optional(v.string()), // Optional for mobile compatibility
		lastName: v.optional(v.string()), // Optional for mobile compatibility
		imageUrl: v.optional(v.string()), // Mobile app uses this field name
		profileImageUrl: v.optional(v.string()), // Web app alternative
		// Web-specific fields (all optional for mobile compatibility)
		roleId: v.optional(v.string()), // Reference to role (role slug: 'superadmin', 'admin', 'team_leader', 'support_worker', 'peer_support', 'client')
		orgId: v.optional(v.string()), // Organization slug they belong to
		lastLogin: v.optional(v.number()),
		status: v.optional(v.string()), // 'active' | 'inactive' | 'suspended' | 'deleted' (default: 'active' if not set)
		phoneNumber: v.optional(v.string()),
		address: v.optional(v.string()),
		emergencyContactName: v.optional(v.string()),
		emergencyContactPhone: v.optional(v.string()),
		// Weekly availability for scheduling
		availability: v.optional(v.array(v.object({
			day: v.string(), // 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
			startTime: v.string(), // HH:mm format (e.g., '09:00')
			endTime: v.string(), // HH:mm format (e.g., '17:00')
			enabled: v.boolean(), // whether this day is available
		}))),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_clerkId", ["clerkId"])
		.index("by_email", ["email"])
		.index("by_orgId", ["orgId"])
		.index("by_roleId", ["roleId"])
		.index("by_org_and_role", ["orgId", "roleId"]),

	roles: defineTable({
		slug: v.string(), // 'superadmin', 'admin', 'team_leader', 'support_worker', 'peer_support', 'client'
		name: v.string(), // Display name
		description: v.optional(v.string()),
		permissions: v.array(v.string()), // Array of permission strings
		level: v.number(), // Hierarchy level (0 = superadmin, 1 = admin, 2 = team_leader, 3 = support roles, 4 = client)
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_slug", ["slug"])
		.index("by_level", ["level"]),

	// ============================================
	// CLIENTS
	// ============================================
	
	clients: defineTable({
		clientId: v.optional(v.number()), // Legacy numeric ID
		firstName: v.string(),
		lastName: v.string(),
		email: v.optional(v.string()),
		phone: v.optional(v.string()),
		address: v.optional(v.string()),
		dateOfBirth: v.optional(v.string()),
		gender: v.optional(v.string()),
		status: v.optional(v.string()), // 'active' | 'inactive' | 'discharged'
		riskLevel: v.optional(v.string()), // 'low' | 'medium' | 'high' | 'critical'
		lastSessionDate: v.optional(v.number()),
		// Emergency contact
		emergencyContactName: v.optional(v.string()),
		emergencyContactPhone: v.optional(v.string()),
		emergencyContactRelationship: v.optional(v.string()),
		// Assignment
		assignedUserId: v.optional(v.string()), // Clerk ID of assigned staff (support/peer)
		orgId: v.optional(v.string()), // Organization they belong to
		// Additional fields
		pronouns: v.optional(v.string()),
		primaryLanguage: v.optional(v.string()),
		mentalHealthConcerns: v.optional(v.string()),
		supportNeeded: v.optional(v.string()),
		ethnoculturalBackground: v.optional(v.string()),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_clientId", ["clientId"])
		.index("by_email", ["email"])
		.index("by_assignedUser", ["assignedUserId"])
		.index("by_orgId", ["orgId"])
		.index("by_status", ["status"])
		.index("by_riskLevel", ["riskLevel"]),

	// ============================================
	// APPOINTMENTS
	// ============================================
	
	appointments: defineTable({
		// Mobile app fields (required for backward compatibility)
		userId: v.optional(v.string()), // Mobile: user ID
		supportWorker: v.optional(v.string()), // Mobile: support worker name
		date: v.optional(v.string()), // Mobile: ISO date string (YYYY-MM-DD)
		time: v.optional(v.string()), // Mobile: HH:mm format
		specialization: v.optional(v.string()), // Mobile: support worker specialization
		avatarUrl: v.optional(v.string()), // Mobile: support worker avatar
		
		// Web app fields (optional for mobile compatibility)
		clientId: v.optional(v.string()), // Web: reference to client (Convex ID or Clerk ID)
		scheduledByUserId: v.optional(v.string()), // Clerk ID of user who scheduled
		supportWorkerId: v.optional(v.string()), // Clerk ID of assigned staff (support/peer)
		appointmentDate: v.optional(v.string()), // Web: ISO date string (YYYY-MM-DD)
		appointmentTime: v.optional(v.string()), // Web: HH:mm format
		duration: v.optional(v.number()), // Duration in minutes
		type: v.string(), // 'video' | 'phone' | 'in_person' | 'initial_assessment' | 'follow_up'
		status: v.string(), // 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
		meetingLink: v.optional(v.string()),
		notes: v.optional(v.string()),
		details: v.optional(v.string()),
		cancellationReason: v.optional(v.string()),
		orgId: v.optional(v.string()),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_client", ["clientId"])
		.index("by_user", ["userId"]) // Mobile index
		.index("by_user_and_date", ["userId", "date"]) // Mobile index
		.index("by_supportWorker", ["supportWorkerId"])
		.index("by_date", ["date"]) // Changed to mobile field name
		.index("by_appointmentDate", ["appointmentDate"]) // Web-specific index
		.index("by_status", ["status"])
		.index("by_orgId", ["orgId"])
		.index("by_client_and_date", ["clientId", "appointmentDate"]),

	// ============================================
	// NOTES (Session Notes)
	// ============================================
	
	notes: defineTable({
		clientId: v.string(), // Reference to client
		authorUserId: v.string(), // Clerk ID of note author
		noteDate: v.string(), // ISO date string
		sessionType: v.optional(v.string()), // 'individual' | 'group' | 'family' | 'assessment'
		durationMinutes: v.optional(v.number()),
		summary: v.optional(v.string()),
		detailedNotes: v.optional(v.string()),
		riskAssessment: v.optional(v.string()),
		nextSteps: v.optional(v.string()),
		activities: v.optional(v.array(v.object({
			type: v.string(),
			minutes: v.union(v.number(), v.string())
		}))),
		orgId: v.optional(v.string()),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_client", ["clientId"])
		.index("by_author", ["authorUserId"])
		.index("by_noteDate", ["noteDate"])
		.index("by_orgId", ["orgId"])
		.index("by_client_and_date", ["clientId", "noteDate"]),

	// ============================================
	// REFERRALS
	// ============================================
	
	referrals: defineTable({
		clientId: v.optional(v.string()), // Reference to existing client (if applicable)
		clientFirstName: v.string(),
		clientLastName: v.string(),
		age: v.optional(v.number()),
		phone: v.optional(v.string()),
		email: v.optional(v.string()),
		address: v.optional(v.string()),
		emergencyFirstName: v.optional(v.string()),
		emergencyLastName: v.optional(v.string()),
		emergencyPhone: v.optional(v.string()),
		referralSource: v.string(), // 'self' | 'family' | 'healthcare_provider' | 'school' | 'other'
		reasonForReferral: v.string(),
		additionalNotes: v.optional(v.string()),
		submittedDate: v.optional(v.number()),
		status: v.string(), // 'pending' | 'in_review' | 'accepted' | 'rejected' | 'completed'
		processedDate: v.optional(v.number()),
		processedByUserId: v.optional(v.string()), // Clerk ID of user who processed
		orgId: v.optional(v.string()),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_client", ["clientId"])
		.index("by_status", ["status"])
		.index("by_processedBy", ["processedByUserId"])
		.index("by_orgId", ["orgId"])
		.index("by_submittedDate", ["submittedDate"]),

	referralTimeline: defineTable({
		referralId: v.id("referrals"),
		message: v.string(),
		createdBy: v.optional(v.string()), // Clerk ID of user who created this timeline entry
		createdAt: v.number(),
	})
		.index("by_referral", ["referralId"])
		.index("by_createdAt", ["createdAt"]),

	// ============================================
	// CRISIS EVENTS
	// ============================================
	
	crisisEvents: defineTable({
		clientId: v.optional(v.string()),
		initiatorUserId: v.optional(v.string()), // Clerk ID of user who initiated
		eventType: v.string(), // 'hotline_call' | 'emergency_call' | 'supervisor_contact' | 'client_contact'
		eventDate: v.number(),
		description: v.optional(v.string()),
		riskLevelAtEvent: v.optional(v.string()), // 'low' | 'medium' | 'high' | 'critical'
		interventionDetails: v.optional(v.string()),
		contactMethod: v.optional(v.string()), // 'phone' | 'video' | 'in_person'
		contactPurpose: v.optional(v.string()),
		urgencyLevel: v.optional(v.string()),
		supervisorContactedUserId: v.optional(v.string()),
		outcome: v.optional(v.string()),
		followUpRequired: v.optional(v.boolean()),
		orgId: v.optional(v.string()),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_client", ["clientId"])
		.index("by_initiator", ["initiatorUserId"])
		.index("by_eventDate", ["eventDate"])
		.index("by_orgId", ["orgId"])
		.index("by_riskLevel", ["riskLevelAtEvent"]),

	// ============================================
	// NOTIFICATIONS
	// ============================================
	
	notifications: defineTable({
		userId: v.string(), // Clerk ID
		title: v.string(),
		message: v.string(),
		type: v.string(), // 'appointment' | 'referral' | 'crisis' | 'system' | 'message' | 'reminder'
		relatedId: v.optional(v.string()), // ID of related entity
		isRead: v.boolean(),
		orgId: v.optional(v.string()),
		createdAt: v.number(),
	})
		.index("by_user", ["userId"])
		.index("by_user_and_read", ["userId", "isRead"])
		.index("by_type", ["type"])
		.index("by_createdAt", ["createdAt"]),

	// ============================================
	// AUDIT LOGS
	// ============================================
	
	auditLogs: defineTable({
		userId: v.optional(v.string()), // Clerk ID of user who performed action
		action: v.string(), // Action performed (e.g., 'user_created', 'client_updated', 'referral_accepted')
		entityType: v.optional(v.string()), // Type of entity affected (e.g., 'user', 'client', 'referral')
		entityId: v.optional(v.string()), // ID of affected entity
		details: v.optional(v.string()), // JSON string with additional details
		ipAddress: v.optional(v.string()),
		userAgent: v.optional(v.string()),
		orgId: v.optional(v.string()),
		timestamp: v.number(),
	})
		.index("by_user", ["userId"])
		.index("by_action", ["action"])
		.index("by_entityType", ["entityType"])
		.index("by_orgId", ["orgId"])
		.index("by_timestamp", ["timestamp"]),

	// ============================================
	// SYSTEM ALERTS
	// ============================================
	
	systemAlerts: defineTable({
		message: v.string(),
		type: v.string(), // 'info' | 'warning' | 'error' | 'critical'
		severity: v.optional(v.string()),
		isRead: v.boolean(),
		orgId: v.optional(v.string()), // null for global alerts
		createdAt: v.number(),
	})
		.index("by_type", ["type"])
		.index("by_isRead", ["isRead"])
		.index("by_orgId", ["orgId"])
		.index("by_createdAt", ["createdAt"]),

	// ============================================
	// METRICS BUCKETS (per-minute snapshots)
	// ============================================

	metricsBuckets: defineTable({
		orgId: v.string(),
		minute: v.number(), // epoch ms floored to minute
		users: v.number(),
		sessions: v.number(),
		dbOk: v.boolean(),
		authOk: v.boolean(),
		apiMs: v.number(),
		alerts: v.number(),
		uptime: v.number(), // percentage 0..100
		createdAt: v.number(),
	})
		.index("by_org_minute", ["orgId", "minute"]) 
		.index("by_minute", ["minute"]),

	// ============================================
	// MESSAGING (from mobile schema)
	// ============================================
	
	presence: defineTable({
		userId: v.string(),
		status: v.string(), // 'online' | 'away' | 'offline'
		lastSeen: v.number(),
	})
		.index("by_userId", ["userId"])
		.index("by_lastSeen", ["lastSeen"]),

	conversations: defineTable({
		title: v.optional(v.string()),
		createdBy: v.string(), // clerk user id
		createdAt: v.number(),
		updatedAt: v.number(),
		participantKey: v.optional(v.string()), // sorted unique participants key for dedupe
		orgId: v.optional(v.string()),
	})
		.index("by_createdBy", ["createdBy"])
		.index("by_createdAt", ["createdAt"])
		.index("by_participantKey", ["participantKey"])
		.index("by_orgId", ["orgId"]),

	conversationParticipants: defineTable({
		conversationId: v.id("conversations"),
		userId: v.string(),
		role: v.optional(v.string()),
		joinedAt: v.number(),
		lastReadAt: v.optional(v.number()),
	})
		.index("by_conversation", ["conversationId"])
		.index("by_user", ["userId"]),

	messages: defineTable({
		conversationId: v.id("conversations"),
		senderId: v.string(),
		body: v.string(),
		messageType: v.optional(v.string()), // 'text' | 'image' | 'file' etc.
		attachmentUrl: v.optional(v.string()),
		fileName: v.optional(v.string()),
		fileSize: v.optional(v.number()),
		storageId: v.optional(v.id("_storage")),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_conversation", ["conversationId"])
		.index("by_createdAt", ["createdAt"]),

	// ============================================
	// COMMUNITY POSTS (from mobile schema)
	// ============================================
	
	communityPosts: defineTable({
		authorId: v.string(),
		title: v.string(),
		content: v.string(),
		category: v.optional(v.string()),
		isDraft: v.boolean(),
		imageUrls: v.optional(v.array(v.string())),
		mood: v.optional(v.object({
			id: v.string(),
			emoji: v.string(),
			label: v.string(),
		})),
		orgId: v.optional(v.string()),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_author", ["authorId"])
		.index("by_createdAt", ["createdAt"])
		.index("by_category", ["category", "createdAt"])
		.index("by_orgId", ["orgId"]),

	postReactions: defineTable({
		postId: v.id("communityPosts"),
		userId: v.string(),
		emoji: v.string(),
		createdAt: v.number(),
	})
		.index("by_post", ["postId"])
		.index("by_user", ["userId"])
		.index("by_user_and_post", ["userId", "postId"]),

	postBookmarks: defineTable({
		postId: v.id("communityPosts"),
		userId: v.string(),
		createdAt: v.number(),
	})
		.index("by_user", ["userId"])
		.index("by_post", ["postId"])
		.index("by_user_and_post", ["userId", "postId"]),

	// ============================================
	// MOOD TRACKING (from mobile schema)
	// ============================================
	
	moods: defineTable({
		userId: v.string(),
		moodType: v.string(),
		moodEmoji: v.optional(v.string()),
		moodLabel: v.optional(v.string()),
		intensity: v.optional(v.number()),
		factors: v.optional(v.array(v.string())),
		shareWithSupportWorker: v.optional(v.boolean()),
		notes: v.optional(v.string()),
		createdAt: v.number(),
		updatedAt: v.optional(v.number()),
	})
		.index("by_user", ["userId"])
		.index("by_createdAt", ["createdAt"])
		.index("by_user_and_date", ["userId", "createdAt"]),

	// ============================================
	// VIDEO CALL SESSIONS (from mobile schema)
	// ============================================
	
	videoCallSessions: defineTable({
		appointmentId: v.optional(v.id("appointments")),
		userId: v.string(),
		supportWorkerName: v.string(),
		supportWorkerId: v.optional(v.string()),
		sessionStatus: v.string(),
		joinedAt: v.number(),
		connectedAt: v.optional(v.number()),
		endedAt: v.optional(v.number()),
		duration: v.optional(v.number()),
		audioOption: v.optional(v.string()),
		cameraEnabled: v.optional(v.boolean()),
		micEnabled: v.optional(v.boolean()),
		qualityIssues: v.optional(v.array(v.string())),
		endReason: v.optional(v.string()),
		metadata: v.optional(v.any()),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_user", ["userId"])
		.index("by_appointment", ["appointmentId"])
		.index("by_status", ["sessionStatus"])
		.index("by_user_and_date", ["userId", "createdAt"])
		.index("by_support_worker", ["supportWorkerId"]),

	// ============================================
	// PROFILES (from mobile schema)
	// ============================================
	
	profiles: defineTable({
		clerkId: v.string(),
		phoneNumber: v.optional(v.string()),
		location: v.optional(v.string()),
		bio: v.optional(v.string()),
		profileImageUrl: v.optional(v.string()),
		dateOfBirth: v.optional(v.string()),
		gender: v.optional(v.string()),
		pronouns: v.optional(v.string()),
		isLGBTQ: v.optional(v.string()),
		primaryLanguage: v.optional(v.string()),
		mentalHealthConcerns: v.optional(v.string()),
		supportNeeded: v.optional(v.string()),
		ethnoculturalBackground: v.optional(v.string()),
		canadaStatus: v.optional(v.string()),
		dateCameToCanada: v.optional(v.string()),
		address: v.optional(v.string()),
		city: v.optional(v.string()),
		postalCode: v.optional(v.string()),
		country: v.optional(v.string()),
		emergencyContactName: v.optional(v.string()),
		emergencyContactPhone: v.optional(v.string()),
		emergencyContactRelationship: v.optional(v.string()),
		preferences: v.optional(v.object({
			theme: v.optional(v.string()),
			notifications: v.optional(v.boolean()),
			darkMode: v.optional(v.boolean()),
			textSize: v.optional(v.string()),
			notificationsEnabled: v.optional(v.boolean()),
			notifMoodTracking: v.optional(v.boolean()),
			notifJournaling: v.optional(v.boolean()),
			notifMessages: v.optional(v.boolean()),
			notifPostReactions: v.optional(v.boolean()),
			notifAppointments: v.optional(v.boolean()),
			notifSelfAssessment: v.optional(v.boolean()),
			reminderFrequency: v.optional(v.string()),
			moodReminderEnabled: v.optional(v.boolean()),
			moodReminderTime: v.optional(v.string()),
			moodReminderFrequency: v.optional(v.string()),
			moodReminderCustomSchedule: v.optional(v.any()),
			journalReminderEnabled: v.optional(v.boolean()),
			journalReminderTime: v.optional(v.string()),
			journalReminderFrequency: v.optional(v.string()),
			journalReminderCustomSchedule: v.optional(v.any()),
			appointmentReminderEnabled: v.optional(v.boolean()),
			appointmentReminderAdvanceMinutes: v.optional(v.number()),
		})),
		updatedAt: v.number(),
	}).index("by_clerkId", ["clerkId"]),

	// ============================================
	// ACTIVITIES (from mobile schema)
	// ============================================
	
	activities: defineTable({
		userId: v.string(),
		activityType: v.string(),
		metadata: v.optional(v.any()),
		createdAt: v.number(),
	})
		.index("by_user", ["userId"])
		.index("by_type", ["activityType"])
		.index("by_user_and_date", ["userId", "createdAt"])
		.index("by_user_type", ["userId", "activityType"]),

	// ============================================
	// HELP & SUPPORT (from mobile schema)
	// ============================================
	
	helpSections: defineTable({
		slug: v.string(),
		title: v.string(),
		icon: v.optional(v.string()),
		description: v.optional(v.string()),
		category: v.optional(v.string()),
		priority: v.optional(v.string()),
		sort_order: v.optional(v.number()),
		createdAt: v.number(),
		updatedAt: v.number(),
	}).index("by_slug", ["slug"]).index("by_sort", ["sort_order"]),

	helpItems: defineTable({
		sectionId: v.id("helpSections"),
		title: v.string(),
		content: v.string(),
		title_lc: v.optional(v.string()),
		content_lc: v.optional(v.string()),
		type: v.optional(v.string()),
		sort_order: v.optional(v.number()),
		related_features: v.optional(v.array(v.string())),
		estimated_read_time: v.optional(v.number()),
		last_updated: v.optional(v.string()),
		createdAt: v.number(),
		updatedAt: v.number(),
	}).index("by_section", ["sectionId"]).index("by_title", ["title"]).index("by_title_lc", ["title_lc"]).index("by_sort", ["sort_order"]),

	// ============================================
	// CRISIS RESOURCES (from mobile schema)
	// ============================================
	
	crisisResources: defineTable({
		slug: v.string(),
		title: v.string(),
		subtitle: v.optional(v.string()),
		type: v.string(),
		value: v.string(),
		icon: v.optional(v.string()),
		color: v.optional(v.string()),
		region: v.optional(v.string()),
		country: v.optional(v.string()),
		priority: v.optional(v.string()),
		sort_order: v.optional(v.number()),
		active: v.boolean(),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_slug", ["slug"])
		.index("by_region", ["region"])
		.index("by_country", ["country"])
		.index("by_type", ["type"])
		.index("by_sort", ["sort_order"])
		.index("by_active", ["active"]),

	// ============================================
	// JOURNAL (from mobile schema)
	// ============================================
	
	journalEntries: defineTable({
		clerkId: v.string(),
		title: v.string(),
		content: v.string(),
		emotionType: v.optional(v.string()),
		emoji: v.optional(v.string()),
		templateId: v.optional(v.number()),
		tags: v.optional(v.array(v.string())),
		shareWithSupportWorker: v.optional(v.boolean()),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_user", ["clerkId"])
		.index("by_createdAt", ["createdAt"])
		.index("by_user_and_createdAt", ["clerkId", "createdAt"]),

	journalTemplates: defineTable({
		tplId: v.number(),
		name: v.string(),
		description: v.optional(v.string()),
		prompts: v.array(v.string()),
		icon: v.string(),
		active: v.boolean(),
		sort_order: v.optional(v.number()),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_tplId", ["tplId"])
		.index("by_active", ["active"])
		.index("by_sort", ["sort_order"]),

	// ============================================
	// RESOURCES (from mobile schema)
	// ============================================
	
	resources: defineTable({
		title: v.string(),
		type: v.string(),
		duration: v.string(),
		category: v.string(),
		content: v.string(),
		author: v.optional(v.string()),
		imageEmoji: v.string(),
		backgroundColor: v.string(),
		tags: v.optional(v.array(v.string())),
		isExternal: v.optional(v.boolean()),
		active: v.boolean(),
		sortOrder: v.optional(v.number()),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_category", ["category"])
		.index("by_type", ["type"])
		.index("by_active", ["active"])
		.index("by_sort", ["sortOrder"]),

	resourceBookmarks: defineTable({
		userId: v.string(),
		resourceId: v.id("resources"),
		createdAt: v.number(),
	})
		.index("by_user", ["userId"])
		.index("by_resource", ["resourceId"])
		.index("by_user_and_resource", ["userId", "resourceId"]),

	// ============================================
	// ASSESSMENTS (from mobile schema)
	// ============================================
	
	assessments: defineTable({
		userId: v.string(),
		assessmentType: v.string(),
		responses: v.any(),
		totalScore: v.number(),
		completedAt: v.number(),
		nextDueDate: v.optional(v.number()),
		notes: v.optional(v.string()),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_user", ["userId"])
		.index("by_user_and_completed", ["userId", "completedAt"])
		.index("by_next_due", ["nextDueDate"]),

	// ============================================
	// SETTINGS (from mobile schema)
	// ============================================
	
	settings: defineTable({
		userId: v.string(),
		darkMode: v.boolean(),
		textSize: v.string(),
		notificationsEnabled: v.boolean(),
		notifMoodTracking: v.boolean(),
		notifJournaling: v.boolean(),
		notifMessages: v.boolean(),
		notifPostReactions: v.boolean(),
		notifAppointments: v.boolean(),
		notifSelfAssessment: v.boolean(),
		reminderFrequency: v.string(),
		moodReminderEnabled: v.boolean(),
		moodReminderTime: v.string(),
		moodReminderFrequency: v.string(),
		moodReminderCustomSchedule: v.any(),
		journalReminderEnabled: v.boolean(),
		journalReminderTime: v.string(),
		journalReminderFrequency: v.string(),
		journalReminderCustomSchedule: v.any(),
		appointmentReminderEnabled: v.boolean(),
		appointmentReminderAdvanceMinutes: v.number(),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_user", ["userId"]),

	// ============================================
	// SUPPORT WORKERS (from mobile schema)
	// ============================================
	
	supportWorkers: defineTable({
		name: v.string(),
		title: v.optional(v.string()),
		avatarUrl: v.optional(v.string()),
		specialization: v.optional(v.string()),
		specialties: v.optional(v.array(v.string())),
		bio: v.optional(v.string()),
		yearsOfExperience: v.optional(v.number()),
		hourlyRate: v.optional(v.number()),
		languagesSpoken: v.optional(v.array(v.string())),
		orgId: v.optional(v.string()),
		createdAt: v.number(),
		updatedAt: v.number(),
	}).index("by_name", ["name"]).index("by_orgId", ["orgId"]),

	// ============================================
	// ANNOUNCEMENTS (from mobile schema)
	// ============================================
	
	announcements: defineTable({
		orgId: v.string(),
		title: v.string(),
		body: v.string(),
		visibility: v.optional(v.string()),
		priority: v.optional(v.string()),
		active: v.boolean(),
		createdAt: v.number(),
		updatedAt: v.optional(v.number()),
		authorId: v.optional(v.string()),
		readBy: v.optional(v.array(v.string())),
		images: v.optional(v.array(v.string())), // Base64 data URLs for images
	})
		.index("by_org_created", ["orgId", "createdAt"])
		.index("by_org_active", ["orgId", "active"])
		.index("by_active", ["active"])
		.index("by_createdAt", ["createdAt"]),

	// ============================================
	// FEATURE PERMISSIONS / ACCESS CONTROL (NEW)
	// ============================================
	// Allows a superadmin to enable/disable features per organization
	// and specify granular read/write/delete permissions.
	// If a record does not exist for a feature/org pair, UI will assume defaults (all enabled).
	featurePermissions: defineTable({
		orgId: v.string(), // organization _id or slug reference (store slug for stability)
		featureKey: v.string(), // e.g. 'selfAssessment', 'moodTracking', 'journaling', 'resources', 'announcements', 'crisisSupport', 'messages', 'appointments', 'communityForum', 'videoConsultations'
		enabled: v.boolean(), // master toggle for the feature visibility
		updatedAt: v.number(),
		updatedBy: v.optional(v.string()), // clerkId of admin who changed
	})
		.index("by_org", ["orgId"])
		.index("by_org_and_feature", ["orgId", "featureKey"]),

	// ============================================
	// REPORTS (Generated analytics with optional stored files)
	// ============================================

	reports: defineTable({
		title: v.string(),
		reportType: v.string(), // e.g., 'client-summary' | 'caseload' | 'sessions' | 'outcomes' | 'crisis'
		sizeBytes: v.optional(v.number()),
		createdAt: v.number(),
		createdBy: v.optional(v.string()), // clerkId of user
		orgId: v.optional(v.string()),
		// Structured data snapshot used to render charts/metrics
		dataJson: v.optional(v.any()),
		// Optional stored file (PDF/Excel/Word) in Convex storage
		fileStorageId: v.optional(v.id("_storage")),
		fileMimeType: v.optional(v.string()),
		// Optional chart image snapshot stored separately
		chartStorageId: v.optional(v.id("_storage")),
		chartMimeType: v.optional(v.string()),
	})
		.index("by_org", ["orgId", "createdAt"]).index("by_createdAt", ["createdAt"]).index("by_type", ["reportType", "createdAt"]).index("by_creator", ["createdBy", "createdAt"]),
});
