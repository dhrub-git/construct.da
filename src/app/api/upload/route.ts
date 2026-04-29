import { auth } from '@clerk/nextjs/server';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
    const body = (await request.json()) as HandleUploadBody;

    try {
        const jsonResponse = await handleUpload({
            body,
            request,
            onBeforeGenerateToken: async (
                // pathname,
                // clientPayload
            ) => {
                // Authenticate users before generating the token
                const { isAuthenticated, userId } = await auth();
                if (!isAuthenticated) throw new Error('Not authenticated');

                return {
                    allowedContentTypes: [
                        'image/jpeg',
                        'image/png',
                        'image/webp',
                        'application/pdf',

                        // Microsoft Word
                        'application/msword', // .doc
                        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx

                        // Excel
                        'application/vnd.ms-excel', // .xls
                        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx

                        // CSV
                        'text/csv',
                        'application/csv',
                        'text/plain'
                    ],
                    addRandomSuffix: true,
                    maximumSizeInBytes: 40 * 1024 * 1024, // 40MB
                    tokenPayload: JSON.stringify({
                        // Store the authenticated user's ID so you can use it
                        // in onUploadCompleted
                        userId: userId,
                    }),
                }
            },
            onUploadCompleted: async ({ blob, tokenPayload }) => {
                // Called by Vercel Blob when the client upload completes
                // Use tools like ngrok if you want this to work locally

                console.log('blob upload completed', blob, tokenPayload);

                try {
                    // Run any logic after the file upload completed
                    // const { userId } = JSON.parse(tokenPayload);
                    // await db.update({ avatar: blob.url, userId });
                } catch (error) {
                    console.error('Error in onUploadCompleted', error);
                    throw new Error('Could not update user');
                }
            },
        });

        return NextResponse.json(jsonResponse);
    } catch (error) {
        return NextResponse.json(
            { error: (error as Error).message },
            { status: 400 }, // The webhook will retry 5 times waiting for a 200
        );
    }
}