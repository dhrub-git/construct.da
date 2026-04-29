import { createClerkClient } from "@clerk/nextjs/server";

export const clerkClient = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY,
})

export async function updateUserMetadata(userId: string, metadata: Record<string, unknown>) {
    try {
        await clerkClient.users.updateUserMetadata(userId, metadata);
    } catch (error) {
        console.error(`Error updating user metadata for user ${userId}:`, error);
        throw error;
    }
}