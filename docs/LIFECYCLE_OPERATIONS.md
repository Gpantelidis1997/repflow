# RepFlow V8 Lifecycle Operations

## Included
- Four-step onboarding completion model.
- In-app notification inbox with unread state.
- User-generated weekly summary endpoint.
- Preference schema for weekly summaries, inactivity reminders and product updates.
- Referral attribution data model without active financial rewards.

## Recommended production scheduler
Run a secured server job once daily. It should:
1. Find users with weekly summaries enabled and matching local weekday.
2. Create no more than one weekly summary notification per seven-day window.
3. Create an inactivity notification after seven days without a completed workout.
4. Avoid sending another inactivity notification for at least seven days.
5. Respect notification preferences and expiration dates.

## Safety defaults
- No notification can block workout execution.
- Referral rewards are disabled until fraud controls and commercial terms are approved.
- Email delivery is not included; V8 stores lifecycle messages in-app.
