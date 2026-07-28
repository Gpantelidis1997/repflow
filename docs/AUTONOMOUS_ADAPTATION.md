# Autonomous Program Adaptation

RepFlow V13 converts completed set logs into transparent program decisions.

## Automatically applicable
- increase load after completing the top of the target range
- reduce load when minimum repetitions are missed
- keep load and build repetitions
- repeat the same target after very hard sets

## Never silently applied
- any decision after a pain report
- exercise replacement
- complete program regeneration
- low-confidence decisions

Every decision records its reason, confidence, evidence, previous state, next state, engine version and dedupe key. This preserves auditability and enables rollback without turning RepFlow into a manual coaching service.
