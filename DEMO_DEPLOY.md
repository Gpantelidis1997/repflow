# RepFlow Interactive MVP

## What testers can do

1. Open `/demo`.
2. Complete or edit the short assessment.
3. View a generated athlete dashboard.
4. Start the sample Upper Body workout.
5. Log weight and reps for every set.
6. Finish the session and view the next progression target.

The demo uses browser `localStorage`, so Supabase and Stripe credentials are not required.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Deploy to Vercel

1. Push this folder to a GitHub repository.
2. Import the repository in Vercel.
3. Keep the detected framework as Next.js.
4. Deploy.

The public demo works without environment variables. Add the values from `.env.example` later to activate the production authentication, database and billing flows.

## Tester link

Send testers the deployed `/demo` URL, for example:

`https://your-project.vercel.app/demo`
