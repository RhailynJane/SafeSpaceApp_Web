/**
 * Appointments API Route
 * 
 * comments added using claude ai
 * prompt : "add proper comments and documentation to this file"
 * 
 * This file handles HTTP requests for managing appointments in the application.
 * It provides two main endpoints:
 * - GET: Retrieve all appointments for the authenticated user
 * - POST: Create a new appointment for a client
 * 
 * @module app/api/appointments/route
 */

// Import NextResponse - a utility from Next.js for creating HTTP responses
import { NextResponse } from "next/server";

/**
 * GET Handler - Retrieves all appointments for the authenticated user
 * 
 * This function:
 * 1. Authenticates the user using Clerk
 * 2. Finds the user in our database
 * 3. Fetches all appointments scheduled by this user
 * 4. Formats the appointment data for the frontend
 * 
 * @param {Request} req - The incoming HTTP request object
 * @returns {NextResponse} JSON response containing appointments array or error
 */
export async function GET() { return NextResponse.json({ message: 'Appointments API deprecated. Use Convex.' }, { status: 410 }); }

/**
 * POST Handler - Creates a new appointment
 * 
 * This function:
 * 1. Authenticates the user
 * 2. Validates or creates a client
 * 3. Processes date/time data to avoid timezone issues
 * 4. Creates the appointment in the database
 * 
 * @param {Request} req - The incoming HTTP request object with appointment data
 * @returns {NextResponse} JSON response with created appointment or error
 */
export async function POST() { return NextResponse.json({ message: 'Appointments API deprecated. Use Convex.' }, { status: 410 }); }