# Domain 5: Context Management (CALM)
## Weight: ~17% — Easiest Once Memorized — ~10 questions

Multiple passers have described this as "free marks" if you know the CALM framework and the mechanics of prompt caching. This domain rewards memorization more than the other four. Lock it down in Week 2 and bank the points.

---

## What CALM Stands For

**CALM = Context-Aware LLM Management**

It is Anthropic's framework for managing the context window efficiently in production Claude applications. The four pillars are:

1. **Prompt Caching** - reuse expensive prompt prefixes across API calls
2. **Conversation Compaction** - compress long conversation history without losing meaning
3. **Token Budgeting** - set explicit limits on context consumption per turn or per session
4. **Multi-Turn Design** - architect conversations so context is used efficiently over time

The exam tests the mechanics of each pillar, when to apply each, and how they interact with each other.

---

## Pillar 1: Prompt Caching

### What It Is

Prompt caching allows you to mark a portion of your prompt as "cacheable" so the Anthropic API can reuse the computed KV cache for that prefix across multiple API calls. This reduces latency and cost on repeated calls where the prefix is the same.

### How It Works

You add `cache_control` breakpoints to messages in your API request:

```python
messages = [
    {
        "role": "user",
        "content": [
            {
                "type": "text",
                "text": "Here is our 50,000-word policy document:\n\n" + policy_document,
                "cache_control": {"type": "ephemeral"}
            },
            {
                "type": "text",
                "text": "Summarize the section on data retention."
            }
        ]
    }
]
```

The `cache_control: ephemeral` marker tells Anthropic's API: "Cache everything up to this breakpoint. On future calls with the same prefix, serve the KV cache instead of recomputing."

### Key Mechanics the Exam Tests

| Fact | Detail |
|---|---|
| Cache TTL | 5 minutes (default) — the cache entry expires after 5 minutes of no use |
| Minimum cacheable prefix | 1,024 tokens (cache_control on shorter prefixes has no effect) |
| Cache storage billing | Cached tokens are stored at ~10% of normal token write cost |
| Cache hit cost | Cache read costs ~10% of normal input token cost |
| Maximum breakpoints | Up to 4 `cache_control` breakpoints per request |
| What gets cached | Everything BEFORE the breakpoint, up to and including the marked block |

### When to Use Prompt Caching

Use caching when the same large prefix is sent repeatedly across multiple calls:
- A large system prompt (instructions, reference documents)
- A codebase loaded into context for a multi-turn coding assistant
- A lengthy document being analyzed from multiple angles in separate calls
- A tool definitions block that is identical across many API calls

### When NOT to Use Prompt Caching

- When the prefix changes between every call (caching has no effect; you pay cache write cost for nothing)
- When requests are one-shot and non-repeated (the 5-minute TTL means the cache expires before reuse)
- When the prefix is under 1,024 tokens (no effect)

### Exam Scenario Pattern

> "Your API endpoint serves 200 simultaneous users, each asking questions against the same 80,000-token policy document. P50 latency is 12 seconds. Cost is $3.20 per 1,000 calls. How do you reduce both?"

**Correct answer:** Add a `cache_control: ephemeral` breakpoint after the policy document in the system prompt. The first call per cache window pays full token cost; subsequent calls within 5 minutes pay ~10% of token cost and get significantly lower latency.

**Wrong answer patterns:** Reduce the size of the document (loses accuracy); increase concurrency (doesn't reduce per-call cost or latency); use a different model (doesn't address the fundamental issue).

---

## Pillar 2: Conversation Compaction

### What It Is

Conversation compaction is the process of summarizing or pruning a long conversation history to fit within the context window while preserving the information needed for Claude to continue the task coherently.

### Why It Matters

Every message in a conversation occupies context window space. As conversations grow, you approach the context limit. Without compaction, you either:
- Hit the context limit and the conversation fails
- Must truncate old messages, losing important context

Compaction lets you compress old turns into a dense summary, freeing space for new turns.

### Compaction Strategies

**Strategy 1: Sliding window**
Keep the last N turns, drop everything before them. Simple but loses early context entirely.
- Use when: early turns have low importance for the current task state

**Strategy 2: Summary compaction**
Before dropping old turns, ask Claude to summarize them into a compact representation. Store the summary, drop the original turns.
- Use when: early turns contain important decisions, facts, or state that future turns may need

**Strategy 3: Structured state extraction**
Instead of a free-text summary, extract key state into a structured format (a JSON object, a checklist, a set of key-value facts) before dropping old turns.
- Use when: the conversation involves tracking complex state (a multi-step task, a research session with many findings, a debugging session)

**Strategy 4: Tiered context**
Maintain multiple context tiers - a "working memory" tier for recent turns and a "long-term memory" tier for important facts extracted over the session.
- Use when: very long sessions where both recency and historical facts matter

### Exam Question Shape

> "Your 40-turn customer support conversation is approaching the context limit. The agent needs information from turn 3 (customer account details) and turn 22 (the issue root cause identified earlier). A sliding window that keeps the last 10 turns will lose both. What is the correct compaction strategy?"

**Correct answer:** Summary compaction or structured state extraction. Extract the account details and root cause into a compact structured summary before dropping the early turns.

**Wrong answer:** Pure sliding window (loses critical information).

---

## Pillar 3: Token Budgeting

### What It Is

Token budgeting is the practice of setting explicit limits on how many tokens different parts of the system can consume, and designing the system to stay within those limits.

### The Token Budget Anatomy

In a typical Claude API call:

```
Total context window
├── System prompt          [fixed - your instructions, tools, etc.]
├── Conversation history   [grows with each turn]
├── Current user message   [variable]
└── Claude's response      [up to max_tokens]
```

Token budgeting means knowing the size of each component and ensuring they sum to less than the context window.

### Practical Budgeting Rules

1. **Reserve for response:** Always reserve at least as many tokens as you expect Claude's response to be (use `max_tokens` to set the ceiling)
2. **Budget conversation history:** Track the token count of each turn. When history approaches the budget limit, trigger compaction
3. **Budget tool results:** Tool call results can be very large (API responses, file contents). Set a maximum size for tool results before including them in context
4. **Budget dynamic content:** If your system prompt includes dynamically injected content (user profile, document excerpts), set a max size for each injection point

### The Token Budget Pattern

```python
CONTEXT_WINDOW = 200000
SYSTEM_PROMPT_TOKENS = count_tokens(system_prompt)
MAX_RESPONSE_TOKENS = 4000
CONVERSATION_BUDGET = CONTEXT_WINDOW - SYSTEM_PROMPT_TOKENS - MAX_RESPONSE_TOKENS - 1000  # safety buffer

def should_compact(history_tokens):
    return history_tokens > CONVERSATION_BUDGET * 0.8  # compact at 80% to avoid hitting the limit
```

### Exam Scenario Pattern

> "Your multi-turn research assistant is failing on long sessions with a context window exceeded error. Users report it works fine for the first 10 turns. How do you fix it without reducing the quality of the assistant?"

**Correct answer:** Implement token budget tracking on conversation history. When the history budget reaches 80% of the limit, trigger summary compaction to compress early turns before accepting the next user message.

---

## Pillar 4: Multi-Turn Design

### What It Is

Multi-turn design is the practice of structuring conversations so that context is used efficiently, important information is surfaced early (closer to the current turn), and unnecessary context is never loaded in the first place.

### Key Design Principles

**Principle 1: Front-load critical context**
Claude pays slightly more attention to content near the beginning of the context and near the end (recency bias). Important instructions and constraints should be in the system prompt, not buried in turn 30.

**Principle 2: Use the system prompt for invariants**
Anything that is true for every turn of the conversation belongs in the system prompt. This includes role, output format, constraints, and permanent domain context. Don't repeat invariants in every user turn.

**Principle 3: Checkpoint important decisions**
In long agentic sessions, when Claude makes an important decision or discovers a key fact, explicitly extract that into a short "state note" at the end of the turn. On future turns, include the state notes rather than the full history of turns that led to them.

**Principle 4: Prune tool results aggressively**
Tool results are often verbose. Before including a tool result in context, extract only the relevant portion. A 200KB API response that yields 3 relevant fields should contribute 3 fields to context, not 200KB.

**Principle 5: Keep user turns short**
The user's input should be the question/instruction, not a repeat of everything that's been established. If users are copy-pasting large amounts of prior context into their messages, the system is not retaining state properly.

---

## How the Four Pillars Work Together

The exam may include integration scenarios where you need to apply multiple CALM pillars together:

**Scenario: A document analysis tool processes the same 100K-token legal document with different questions.**
- Use **prompt caching** for the document (same prefix, repeated calls)
- Use **token budgeting** to ensure each answer call leaves sufficient tokens for response
- Use **multi-turn design** to keep follow-up questions focused rather than re-establishing context

**Scenario: A multi-turn coding assistant for a large codebase**
- Use **multi-turn design** to put the codebase summary in the system prompt and only load specific files when needed
- Use **token budgeting** to track conversation growth
- Use **conversation compaction** when the session grows long (summarize resolved issues, keep current task in focus)
- Use **prompt caching** for the invariant system prompt content shared across users

---

## Practice Questions

**Q1.** Your API sends the same 30,000-token system prompt on every request. Costs are high. You add `cache_control: ephemeral` to the system prompt. After 24 hours, costs have not changed. What is the most likely cause?

- A) Prompt caching only works for system prompts under 1,024 tokens
- B) The 5-minute cache TTL is expiring between requests because calls are spaced more than 5 minutes apart
- C) Prompt caching does not work with the Claude 3.5 API
- D) You need to set `cache: true` in the API headers

**Answer: B** - The 5-minute TTL means caching only saves cost when the same prefix is called again within 5 minutes. If calls are infrequent, the cache expires before reuse.

---

**Q2.** A 60-turn conversation is failing with "context window exceeded." The first 40 turns contain important resolved issues. The last 20 turns contain the active task. Which compaction strategy preserves the most value?

- A) Sliding window keeping last 20 turns (drops turns 1-40)
- B) Structured state extraction: extract key decisions and facts from turns 1-40 into a JSON summary, then drop turns 1-40
- C) Restart the conversation and ask the user to re-state the context
- D) Increase max_tokens to fit the full 60 turns

**Answer: B** - Structured state extraction preserves the value of early turns compactly while freeing space for the active task.

---

**Q3.** Which of the following is NOT a valid use case for prompt caching?

- A) A legal research tool that sends a 50-page terms document with 100 different user questions over the course of an hour
- B) A one-shot document translator that processes unique documents exactly once
- C) A coding assistant that loads the same large codebase context for every session
- D) A customer support bot that sends the same policy instructions to every call

**Answer: B** - One-shot processing of unique documents never reuses the cached prefix. You pay the cache write cost with no cache hit, making it strictly more expensive than not caching.

---

## Key Vocabulary

| Term | Definition |
|---|---|
| CALM | Context-Aware LLM Management - Anthropic's 4-pillar framework for context efficiency |
| cache_control | API parameter that marks a prompt prefix as cacheable |
| Cache TTL | Time-to-live for a prompt cache entry; default 5 minutes in Anthropic API |
| Ephemeral cache | The only currently supported cache_control type; stores prefix for 5 minutes |
| Conversation compaction | Summarizing or pruning long conversation history to free context space |
| Token budget | An explicit limit on how many tokens a component of the system may consume |
| Sliding window | Compaction strategy that keeps only the last N turns |
| Summary compaction | Compaction strategy that summarizes dropped turns before removing them |
| Structured state extraction | Compaction strategy that extracts key facts into a compact structured format |
| Multi-turn design | Architectural practice for efficient context use across many conversation turns |

---

**Sources:**
- [Anthropic prompt caching documentation](https://docs.anthropic.com)
- [Partner Network learning path - context management](https://anthropic.skilljar.com/page/claude-partner-network-learning-path)
- [843/1000 passer: called context management "easiest marks"](https://www.reddit.com/r/ClaudeAI/comments/1u43exm/passed_the_claude_certified_architect_foundations/)
- [FindSkill.ai CCA-F exam overview](https://findskill.ai/blog/claude-certified-architect-exam-cost-format-pass-rate/)
- [Community practice trainer covering CALM scenarios](https://www.reddit.com/r/ClaudeAI/comments/1u325pt/built_an_interactive_practice_exam_trainer_for/)

*Context management questions have the highest accuracy rate among passers. If you memorize the CALM pillars and the cache_control mechanics, expect 8-9 correct answers out of ~10 in this domain.*
