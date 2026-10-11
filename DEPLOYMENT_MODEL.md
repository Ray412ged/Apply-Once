# Apply Once Deployment Model

## Product model

Apply Once is one reusable software product with one separate customer deployment per organization.

Each customer deployment is intended to have its own:

- application instance
- customer branding and configuration
- staff access
- participants
- employer network
- curated jobs
- reporting data
- operational settings

Auberle is one deployment. A future customer receives a separate deployment built from the same reusable Apply Once core.

## Why organization scoping remains in the code

The reusable core still uses organization IDs, organization staff accounts, scoped backend functions, and organization-owned records. Those controls remain intentionally because they:

- provide an internal safety boundary
- keep the reusable core configurable
- make future customer deployments easier to create
- reduce the risk of accidental cross-scope access inside a deployment
- preserve migration flexibility

They do not mean that multiple paying customers are intended to share one live production deployment.

## Product rule

Do not build customer-facing workflows around switching between organizations, browsing multiple organizations, or platform-wide customer management.

Customer users should experience their deployment as their own Apply Once environment.

## Platform administration

Platform administration inside a customer deployment is for maintaining that deployment, its job supply, configuration, and support. Cross-customer reporting and multi-customer administration should be handled outside the customer deployment if needed in the future.