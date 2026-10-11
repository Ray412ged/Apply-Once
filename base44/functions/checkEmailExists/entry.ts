import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Checks whether a user account already exists for the given email.
// Called during onboarding BEFORE the user creates an account, so the
// caller is an unauthenticated prospect. Service role is required to
// read the User entity. This is an intentional, product-requested
// pre-registration check (the "sign in or continue" branching flow).
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const email = (body?.email || "").toString().trim().toLowerCase();
    if (!email || !email.includes("@")) {
      return Response.json({ error: "A valid email is required" }, { status: 400 });
    }

    const matches = await base44.asServiceRole.entities.User.filter({ email });
    const exists = Array.isArray(matches) && matches.some(
      (u) => (u.email || "").toLowerCase() === email
    );
    return Response.json({ exists });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});