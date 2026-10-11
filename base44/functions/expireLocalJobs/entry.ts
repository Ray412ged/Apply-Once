import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin access required' }, { status: 403 });

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const activeLocalJobs = await base44.asServiceRole.entities.JobPosting.filter({
      local_job: true,
      status: 'Active',
    }, '-created_date', 500);

    let expired = 0;
    let flaggedForReview = 0;

    for (const job of activeLocalJobs) {
      const deadline = job.application_deadline || job.expiration_date;

      if (deadline && new Date(deadline) < now) {
        await base44.asServiceRole.entities.JobPosting.update(job.id, {
          status: 'Expired',
        });
        expired++;
      } else if (!deadline) {
        const postingDate = job.posting_date ? new Date(job.posting_date) : new Date(job.created_date);
        if (postingDate < thirtyDaysAgo) {
          await base44.asServiceRole.entities.JobPosting.update(job.id, {
            status: 'Expired',
          });
          flaggedForReview++;
        }
      }
    }

    return Response.json({
      expired,
      flaggedForReview,
      total: expired + flaggedForReview,
      message: `${expired} expired by deadline, ${flaggedForReview} flagged for review (30+ days without closing date)`,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});