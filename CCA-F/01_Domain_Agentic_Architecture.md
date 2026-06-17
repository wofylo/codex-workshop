# Domain 1: Agentic Architecture & Orchestration
## Weight: 27% — Hardest Domain — ~16 questions

This is the domain that fails the most candidates. It is 100% scenario-based and tests your architectural judgment about multi-agent systems, not your ability to recall definitions. Spend more time here than on any other domain.

---

## Core Mental Model

The exam assumes you have internalized Anthropic's agentic design philosophy. Every correct answer flows from these three principles:

1. **Minimal footprint** - do only what is necessary; prefer reversible over irreversible; request only the permissions the task actually requires
2. **Fail gracefully** - design every pipeline to handle partial failure without catastrophic side effects
3. **Human in the loop at high-stakes decision points** - autonomous operation is a spectrum; know when to pause and surface uncertainty

If two answers seem equally valid, the one that is more conservative, more reversible, or involves more human oversight is almost always correct.

---

## The Six Core Scenario Patterns

### Pattern 1: Parallel vs Sequential Subagent Execution

**When to use parallel execution:**
- Subtasks are independent (output of task A does not feed task B)
- Latency matters and subtasks can safely run simultaneously
- Each subagent has its own isolated context and tools

**When to use sequential execution:**
- Step N depends on the output of step N-1
- A failure in step N should halt the pipeline (not continue with stale or missing data)
- The system has irreversible side effects and must confirm each step succeeded

**Exam question shape:**
> "Your pipeline fans out 5 research subagents in parallel. One returns an error. The orchestrator combines all outputs anyway. Users are reporting incorrect summaries. What is the architectural fix?"

**Correct answer pattern:** Add a validation gate before combining outputs. Fail the pipeline (or surface the gap to the user) rather than proceeding with incomplete data.

**Wrong answer patterns:** Retry the failed subagent automatically with no limit; increase timeout; ignore errors from individual subagents.

---

### Pattern 2: Minimal Footprint Design

This pattern appears in questions about permissions, tool scope, and resource access.

**Core rule:** An agent should request the minimum set of capabilities required for the current task. It should not pre-acquire permissions "in case" they are needed later.

**Specific exam scenarios:**
- Agent asks for write access to a file system when only read is needed → wrong
- Agent creates a persistent database entry during a one-time lookup task → wrong
- Agent requests user email credentials to send a notification when an email API with a scoped token exists → wrong
- Agent checks whether a reversible action is available before taking an irreversible one → correct

**Exam question shape:**
> "You are designing an agent that retrieves customer order history and generates a summary. Which tool set is appropriate?"

**Correct answer:** Read-only order history API. Nothing else.

**Wrong answer patterns:** Full CRM access "in case the agent needs to update records"; write access to order system; access to customer PII beyond what the summary requires.

---

### Pattern 3: Clarifying Ambiguity Before a Long Autonomous Run

This is one of the most tested patterns. The exam penalizes "just start and figure it out" as an answer.

**Core rule:** If a task is underspecified and a clarification is cheap (one question, one turn), always clarify before beginning a long autonomous run. An incorrect assumption at step 1 that is discovered at step 7 wastes compute, time, and potentially creates side effects.

**What counts as underspecified:**
- The goal is ambiguous ("make this better")
- The scope is unclear ("fix the bugs" - which bugs? all of them? in which files?)
- The output format is not specified when format matters for downstream systems
- Success criteria are not defined

**What does NOT require clarification:**
- Well-scoped, reversible tasks with clear success criteria
- Tasks where the agent has full context from prior conversation
- Tasks explicitly described as "autonomous" by the user

**Exam question shape:**
> "A user asks your agent: 'Update the reports.' The agent begins reading all reports in the directory. After 45 minutes and 300 API calls, the user clarifies they only meant the Q2 reports. How should this system have been designed?"

**Correct answer:** The orchestrator should detect scope ambiguity (no time range, no filter, no output format specified) and ask one clarifying question before beginning work.

---

### Pattern 4: Human-in-the-Loop Interrupt Design

**Core rule:** Irreversible actions, high-stakes decisions, and uncertainty above a threshold should trigger a human approval gate. The gate should not block the entire pipeline — it should pause the relevant branch and surface clearly to the user.

**Designing a good interrupt:**
- The interrupt message must include: what the agent is about to do, why it is flagging for approval, what information the user needs to make the decision, and what happens if the user approves vs declines
- The agent should not time out silently — it should make its pending state visible
- After an interrupt, the agent should resume from the exact point of interruption, not restart the pipeline

**High-stakes indicators that warrant a gate:**
- Deleting data
- Sending external communications (email, Slack, API calls to third-party systems)
- Making financial transactions or API calls with cost implications
- Publishing or deploying code to production
- Any action with a side effect that cannot be undone

**Exam question shape:**
> "Your agent is tasked with cleaning up old customer records. It identifies 847 records to delete. How should it proceed?"

**Correct answer:** Surface the 847 records (or a summary) to the user, describe the action, and wait for explicit approval before deleting.

**Wrong answer patterns:** Delete all records because the task description said "clean up"; delete in batches of 10 to "limit impact" without user approval; send a notification after deletion.

---

### Pattern 5: Subagent Failure Recovery

This pattern tests your ability to design pipelines that handle partial failure gracefully.

**Design checklist for failure recovery:**
- What is the recovery path if subagent N fails? (retry, skip, surface to user, halt)
- Is the pipeline idempotent? (can you safely re-run it without duplicate side effects?)
- Do you have checkpoints that allow resuming from mid-pipeline rather than restarting from scratch?
- Does the orchestrator log enough state to diagnose the failure?

**Retry rules:**
- Retry is appropriate for transient failures (network timeout, rate limit)
- Retry is NOT appropriate for semantic failures (the subagent returned an answer but it was wrong)
- Always set a maximum retry count with exponential backoff
- Communicate retry state to the user if the delay will be noticeable

**Exam question shape:**
> "Your 6-step pipeline completes steps 1-4. Step 5 (external API call) fails with a 503. Your current design restarts the entire pipeline. What is the better design?"

**Correct answer:** Add a checkpoint after each step. Store intermediate results. On failure at step 5, resume from the last checkpoint (step 4 output) rather than restarting from step 1.

**Wrong answer patterns:** Increase the API timeout; wrap the entire pipeline in a try/catch and restart on any error; alert the user only after all retries are exhausted (no intermediate state preservation).

---

### Pattern 6: Orchestrator vs Subagent Role Clarity

**Orchestrator responsibilities:**
- Plans the overall task decomposition
- Assigns subtasks to subagents
- Aggregates and validates subagent outputs
- Makes the final decision on pipeline state (proceed, pause, fail)
- Does NOT perform subtasks directly (unless the task is trivially simple)

**Subagent responsibilities:**
- Executes a single, well-defined subtask
- Reports output (and status) back to the orchestrator
- Does NOT make pipeline-level decisions
- Does NOT spawn additional subagents without orchestrator instruction (unless explicitly designed as a hierarchical multi-agent system)

**Common anti-patterns the exam tests:**
- Orchestrator that directly calls external APIs instead of delegating to a tool-equipped subagent → violates separation of concerns
- Subagent that modifies global pipeline state → violates subagent isolation
- Orchestrator that does not validate subagent output before passing it downstream → creates a garbage-in-garbage-out propagation failure

**Exam question shape:**
> "Your orchestrator is directly executing database queries while also coordinating three subagents. Response times are degrading as task complexity increases. What is the architectural fix?"

**Correct answer:** Extract the database operations into a dedicated data-retrieval subagent. The orchestrator should coordinate, not execute.

---

## Practice Questions

**Q1.** You have a multi-agent research system. Each subagent searches a different data source in parallel. One subagent consistently returns empty results for certain query types. What is the correct design response?
- A) Retry the subagent 3 times before giving up
- B) Remove the subagent from the pool for failing query types
- C) Surface the coverage gap to the user in the aggregated output rather than silently omitting it
- D) Route all queries through the working subagents only

**Answer: C** - Transparency over silent failure. The user should know their results are incomplete.

---

**Q2.** A user asks your agent to "send the weekly report to the team." The agent has access to an email sending tool. What should the agent do before sending?
- A) Send immediately — the task is unambiguous
- B) Generate the report, then confirm recipient list and send time with the user before sending
- C) Send to all addresses in the contact database tagged "team"
- D) Draft the report and email, then wait for user to trigger the send via a separate command

**Answer: B** - External communications are irreversible; confirm before sending.

---

**Q3.** Your pipeline processes 500 documents in sequence. Each processed document triggers a write to a database. The pipeline crashes at document 347. What is the minimum recovery design change?
- A) Wrap the entire pipeline in a transaction that rolls back on failure
- B) Add a checkpoint flag to each processed document so the pipeline resumes from document 348
- C) Increase the pipeline timeout
- D) Process documents in batches of 50 with a retry on each batch

**Answer: B** - Checkpointing allows resume without re-processing completed work.

---

## Key Vocabulary

| Term | Definition |
|---|---|
| Orchestrator | Agent that plans and coordinates; does not execute domain tasks directly |
| Subagent | Agent that executes a single delegated task |
| Minimal footprint | Requesting only the permissions and resources a task actually requires |
| Human-in-the-loop | A design gate that pauses for human approval before an irreversible action |
| Idempotent pipeline | A pipeline that can be safely re-run without duplicate side effects |
| Checkpoint | Persisted intermediate state that allows pipeline resumption without restart |
| Graceful degradation | System behavior that degrades partially rather than failing completely |

---

**Sources:**
- [Anthropic agentic design documentation](https://docs.anthropic.com/agents)
- [DEV Community: 5 domains, 6 scenarios breakdown](https://dev.to/aws-builders/the-claude-certified-architect-exam-5-domains-6-scenarios-and-everything-you-need-to-know-4le3)
- [985/1000 passer on agentic domain difficulty](https://www.reddit.com/r/ClaudeAI/comments/1to0xfc/just_passed_the_new_claude_certified_architect/)
- [843/1000 passer notes](https://www.reddit.com/r/ClaudeAI/comments/1u43exm/passed_the_claude_certified_architect_foundations/)

*This domain accounts for 27% of your score. Budget proportional study time.*
