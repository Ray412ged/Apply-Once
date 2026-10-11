import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Platform Administrator overview (Phase 8). Default admin access is
// aggregate-only, per the design established back in Phase 1 — this
// function returns organization adoption and platform-wide counts, NEVER
// any participant-identifiable data. Individual participant lookups
// remain a separate, reason-gated, logged path (adminParticipantLookup,
// already built in Phase 1) — this function does not replace or bypass
// that in any way.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const svc = base44.asServiceRole;

    const [organizations, allLinks, recentLogs] = await Promise.all([
      svc.entities.Organization.filter({}, '-created_date', 500),
      svc.entities.ParticipantOrgLink.filter({}, '-linked_at', 5000),
      svc.entities.AdminAccessLog.filter(
        { timestamp: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() } },
        '-timestamp',
        1000
      ),
    ]);

    const activeLinksByOrg = new Map();
    const everLinksByOrg = new Map();
    for (const link of allLinks) {
      everLinksByOrg.set(link.organization_id, (everLinksByOrg.get(link.organization_id) || 0) + 1);
      if (link.status === 'active') {
        activeLinksByOrg.set(link.organization_id, (activeLinksByOrg.get(link.organization_id) || 0) + 1);
      }
    }

    const orgSummaries = organizations.map((org) => ({
      id: org.id,
      name: org.display_name || org.name,
      organization_type: org.organization_type,
      active: org.active,
      slug: org.slug || null,
      active_participants: activeLinksByOrg.get(org.id) || 0,
      total_ever_enrolled: everLinksByOrg.get(org.id) || 0,
    }));

    const organizationsWithActiveParticipants = orgSummaries.filter((o) => o.active_participants > 0).length;
    const totalActiveParticipantLinks = allLinks.filter((l) => l.status === 'active').length;

    return Response.json({
      total_organizations: organizations.length,
      active_organizations: organizations.filter((o) => o.active).length,
      organizations_with_active_participants: organizationsWithActiveParticipants,
      total_active_participant_links: totalActiveParticipantLinks,
      total_ever_enrolled_links: allLinks.length,
      admin_lookups_last_30_days: recentLogs.length,
      organizations: orgSummaries.sort((a, b) => b.active_participants - a.active_participants),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}