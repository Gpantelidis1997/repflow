# Stripe setup

1. Create a recurring monthly Pro price and copy its price ID.
2. Optionally create a one-time Founder price.
3. Add the Stripe environment variables from `.env.example`.
4. Configure a webhook endpoint at `/api/stripe/webhook`.
5. Subscribe the webhook to `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, and `customer.subscription.deleted`.
6. Run migration `007_subscriptions_entitlements.sql`.
7. Test with Stripe test mode before enabling live mode.

The beta plan remains fully active when Stripe is not configured.
