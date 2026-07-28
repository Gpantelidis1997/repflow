# RepFlow V14B — Session Builder

The V14B engine converts user constraints into a deterministic training session.

## Pipeline

1. Translate focus, goal, duration and experience into movement slots.
2. Rank generator-enabled exercises against equipment, difficulty and contraindications.
3. Exclude already-used exercise IDs and duplicate clusters.
4. Estimate setup, work and rest time.
5. Remove optional slots when necessary; required slots are never silently removed.
6. Calculate a five-part quality score.
7. Reject sessions with errors or an overall score below 85.

## Safety and scope

The builder does not diagnose injuries. Contraindication tags are hard exclusions supplied by the product's assessment flow. A missing required movement candidate causes rejection rather than an unsafe guess.

## API

`POST /api/admin/session-builder/preview`

The endpoint is admin-only and persists an immutable generation record in `session_generation_runs`.

## Next module

V14C will coordinate multiple sessions into a weekly split, distribute volume across muscle groups and enforce recovery spacing.
