import { Webhook } from "svix";
import { headers } from "next/headers";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { WebhookEvent } from "@clerk/nextjs/server";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error(
      "Please add CLERK_WEBHOOK_SECRET to your .env.local file"
    );
  }

  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Verify the webhook signature
  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Invalid signature", { status: 400 });
  }

  // Handle the event
  const eventType = evt.type;

  if (eventType === "user.created") {
    const { id, first_name, last_name, email_addresses } = evt.data;
    const name = [first_name, last_name].filter(Boolean).join(" ") || "Unknown";
    const email = email_addresses?.[0]?.email_address ?? "";

    await convex.mutation(api.users.upsertFromWebhook, {
      clerkId: id,
      name,
      email,
    });

    return new Response("User created", { status: 200 });
  }

  if (eventType === "user.updated") {
    const { id, first_name, last_name, email_addresses, public_metadata } =
      evt.data;
    const name = [first_name, last_name].filter(Boolean).join(" ") || "Unknown";
    const email = email_addresses?.[0]?.email_address ?? "";

    // Extract role from public metadata
    const metadataRole = public_metadata?.role as string | undefined;
    const role =
      metadataRole === "admin" ||
      metadataRole === "manager" ||
      metadataRole === "staff" ||
      metadataRole === "customer_service"
        ? metadataRole
        : undefined;

    await convex.mutation(api.users.upsertFromWebhook, {
      clerkId: id,
      name,
      email,
      role,
    });

    return new Response("User updated", { status: 200 });
  }

  // Unhandled event type
  return new Response("Event type not handled", { status: 200 });
}
