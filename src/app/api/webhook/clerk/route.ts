import { NextRequest } from "next/server";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { createUser } from "@actions/users";
import { updateUserMetadata } from "@auth/clerk";


export async function POST(request: NextRequest) {
    try {
        const evt = await verifyWebhook(request)
        if (!evt) {
            console.error("Invalid webhook event");
            console.dir(evt);
            return new Response("Invalid webhook", { status: 400 });
        }

        switch (evt.type) {
            case "user.created":
                const {
                    email_addresses,
                    first_name,
                    last_name,
                    id,
                } = evt.data;
                
                const newUser = await createUser(`${first_name} ${last_name}`, email_addresses[0].email_address, id);
                await updateUserMetadata(id, { applicationUserId: newUser.id });
                return new Response("User created", { status: 200 });
        }

        return new Response("Webhook event not handled", { status: 200 });

    } catch (error) {
        console.error("Error verifying webhook:", error);
        return new Response("Error verifying webhook", { status: 400 });
    }
}