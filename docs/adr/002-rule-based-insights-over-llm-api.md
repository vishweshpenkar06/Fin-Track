# ADR 002: Rule-based Insights Over LLM API

## Status
✅ Accepted (MVP), 🔄 Evolving (future: LLM option in Prompt C)

## Context
FinTrack needs to generate financial insights (e.g., "You spent 30% more on groceries this month"). Options were:
1. Rule-based: Deterministic SQL/JS logic
2. LLM API: Claude/OpenAI API calls

## Decision
Ship with **rule-based insights** for MVP. Plan LLM option for future release.

## Rationale

| Factor | Rule-based | LLM API |
|--------|-----------|---------|
| **Cost** | $0 | $0.01–$0.10/call |
| **Speed** | <10ms | 500–2000ms |
| **Deterministic** | Yes | No |
| **Requires API key** | No | Yes |
| **Scalability** | Unlimited | Rate-limited |

## Trade-offs

**MVP (Rule-based):**
- ✅ Zero operational costs
- ✅ Instant results (real-time dashboard)
- ✅ Fully deterministic—same user = same insights
- ❌ Rule set is fixed (no ML learning)

**Future (LLM):**
- ✅ Context-aware insights
- ✅ Natural language explanations
- ❌ Per-user API costs
- ❌ Requires API key management

## Consequences
- Current insights in `app/actions/insights.ts`:
  - Spending trend: Month-over-month >20% increase
  - Budget recommendation: Average spend × 1.1 for 3+ transactions
  - Anomaly: Expense >3× category average
- Future: LLM wrapper around these rules (not replacement)
