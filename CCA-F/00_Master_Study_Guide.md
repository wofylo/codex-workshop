# CCA-F Master Study Guide
## Claude Certified Architect - Foundations

**Exam code:** CCA-F | **Launched:** March 12, 2026 | **Cost:** $99 (free for first 5,000 Partner Network employees)
**Format:** 60 scenario-based MCQ | **Time:** 120 minutes | **Pass score:** 720 / 1000

---

## Table of Contents

1. [Exam Access Path](#exam-access-path)
2. [Domain Weights](#domain-weights)
3. [2-Week 60-Hour Prep Timeline](#2-week-60-hour-prep-timeline)
4. [Official Free Resources](#official-free-resources)
5. [What the Exam Actually Tests](#what-the-exam-actually-tests)
6. [Exam-Day Tips](#exam-day-tips)
7. [Known Operational Issues](#known-operational-issues)

---

## Exam Access Path

You must join the Claude Partner Network before you can register.

1. Apply at **[claude.com/partners](https://claude.com/partners)** (free, any organization eligible)
2. Once accepted, request exam access at **[anthropic.skilljar.com/claude-certified-architect-foundations-access-request](https://anthropic.skilljar.com/claude-certified-architect-foundations-access-request)**
3. Complete at least the core Anthropic Academy courses before attempting (see resources below)
4. Schedule and pay ($99) or redeem your free attempt if within the first 5,000 partner employees

The partner network join is free. The barrier is awareness, not cost.

---

## Domain Weights

| # | Domain | Weight | Difficulty |
|---|---|---|---|
| 1 | Agentic Architecture & Orchestration | 27% | Hardest |
| 2 | Claude Code Configuration | 20% | Moderate-Hard |
| 3 | Tool Design & MCP Integration | 18% | Moderate |
| 4 | Prompt Engineering | ~18% | Moderate |
| 5 | Context Management (CALM) | ~17% | Easiest once memorized |

Domain 1 (27%) + Domain 2 (20%) = 47% of your score. These two domains determine whether you pass or fail.

---

## 2-Week 60-Hour Prep Timeline

This is modeled on the [r/ClaudeAI passer who scored 843/1000](https://www.reddit.com/r/ClaudeAI/comments/1u43exm/passed_the_claude_certified_architect_foundations/) with a non-engineering background (quant trading + data science). Adjust based on your existing Claude experience.

### Week 1 — Foundation + Agentic Core (Days 1-7, ~35 hours)

**Days 1-2 (~10 hrs): API Foundation**
- Anthropic Academy: Claude 101 (core concepts, API basics)
- Anthropic Academy: Building with Claude API (tool use, streaming, advanced parameters)
- Goal: understand how the Claude API works at a production level, not just chat usage

**Days 3-4 (~10 hrs): Agent SDK + MCP**
- Anthropic Academy: Agent SDK course (building agentic applications)
- Anthropic Academy: MCP / Model Context Protocol course
- Read docs.anthropic.com/agents end to end — the exam appears directly derived from this document
- Goal: internalize the orchestrator/subagent mental model and MCP server architecture

**Days 5-7 (~15 hrs): Agentic Architecture Deep Work**
- Build a multi-agent pipeline (even a toy one with 2-3 subagents)
- Study all six scenario patterns from Domain 1 guide (see `01_Domain_Agentic_Architecture.md`)
- Focus: parallel vs sequential, minimal footprint, failure recovery, human-in-the-loop
- This is 27% of the exam. Spend the most time here.

### Week 2 — Claude Code + Context + Practice (Days 8-14, ~25 hours)

**Days 8-9 (~8 hrs): Claude Code**
- Anthropic Academy: Claude Code course
- Study the CLAUDE.md hierarchy in detail (root / subdirectory / project levels)
- Understand hooks and skills configuration
- See `02_Domain_Claude_Code.md` for the specific exam topics

**Days 10-11 (~7 hrs): Context Management**
- Read official Anthropic prompt caching documentation
- Read conversation compaction documentation
- Study the CALM framework (see `05_Domain_Context_Management.md`)
- These are "easy marks" per multiple passers — lock them in now

**Days 12-14 (~10 hrs): Prompt Engineering + Practice Tests**
- Review `04_Domain_Prompt_Engineering.md` — focus on production-grade, parseable outputs
- Take all available practice tests
- **Critical:** Practice tests are calibrated easier than the real exam. If you score 850+ on practice, expect 750-800 on the real thing.
- For every wrong answer: go back to the relevant documentation page, not another practice test

---

## Official Free Resources

All of these are free and available to Partner Network members:

| Resource | Location | Priority |
|---|---|---|
| Claude 101 | [anthropic.skilljar.com](https://anthropic.skilljar.com/page/claude-partner-network-learning-path) | Must-do |
| Building with Claude API | [anthropic.skilljar.com](https://anthropic.skilljar.com/page/claude-partner-network-learning-path) | Must-do |
| Prompt Engineering | [anthropic.skilljar.com](https://anthropic.skilljar.com/page/claude-partner-network-learning-path) | Must-do |
| Claude Code | [anthropic.skilljar.com](https://anthropic.skilljar.com/page/claude-partner-network-learning-path) | Must-do |
| Agent SDK | [anthropic.skilljar.com](https://anthropic.skilljar.com/page/claude-partner-network-learning-path) | Must-do |
| MCP / Model Context Protocol | [anthropic.skilljar.com](https://anthropic.skilljar.com/page/claude-partner-network-learning-path) | Must-do |
| Agentic design docs | [docs.anthropic.com/agents](https://docs.anthropic.com/agents) | Must-read |
| Prompt caching docs | [docs.anthropic.com](https://docs.anthropic.com) | Must-read |
| Community practice trainer | [r/ClaudeAI (community-built)](https://www.reddit.com/r/ClaudeAI/comments/1u325pt/built_an_interactive_practice_exam_trainer_for/) | High value |
| Free ebook (community-built with Claude Code) | [r/ClaudeAI](https://www.reddit.com/r/ClaudeAI/comments/1trc4fv/i_built_a_claude_certified_architect_guide_with/) | High value |

---

## What the Exam Actually Tests

The exam does NOT test:
- Definitions ("what is an agent?")
- Trivia ("what is the default context window size?")
- Pure syntax ("write this API call")

The exam DOES test:
- **Architectural judgment**: given a system with a specific failure, what is the correct fix?
- **Tradeoff reasoning**: when do you use parallel vs sequential? when do you add a human gate?
- **Design patterns**: minimal footprint, graceful degradation, context budgeting
- **Claude-specific behavior**: how Claude interprets CLAUDE.md, how MCP servers register tools, how cache_control works

Every question is scenario-based. The format is: "You have a system that does X. It is failing because Y. What is the right architectural response?"

The correct answer is usually the one that:
1. Is most conservative (minimal footprint, reversible actions)
2. Involves the human when stakes are high
3. Fails gracefully rather than catastrophically
4. Separates concerns cleanly (orchestrator plans, subagents act)

---

## Exam-Day Tips

- **Time math:** 60 questions in 120 minutes = 2 minutes per question. Mark and skip if uncertain; come back.
- **The agentic domain (27%) will feel harder than practice.** This is expected. Trust your preparation.
- **Context management questions are the most reliable easy marks.** If you know the CALM framework, these are 10+ free points.
- **Read every scenario fully before looking at answer choices.** The failure mode described in the scenario often directly maps to a design pattern you studied.
- **When two answers seem correct,** choose the one that is more conservative, more reversible, or involves more human oversight. Anthropic's design philosophy consistently favors these properties.
- **Do not rush.** Candidates who finish early and review typically catch 2-3 errors from misreading scenarios.

---

## Known Operational Issues

**Score display bug (present at launch, may be resolved):** Some candidates see "Score: 0/0" and "Assessment Already Completed" immediately after finishing. Do not panic. The dashboard can take up to 10 days to update. If it shows "Awaiting Instructor Review," contact support but expect 7-10 business days.

**Early Adopter badge:** Available to candidates who pass during the initial certification window. The window timing is not officially published; the May 2026 passer received it, suggesting the window was still open at that point.

---

## Score Interpretation

| Score Range | Interpretation |
|---|---|
| 720-799 | Pass - solid foundation |
| 800-899 | Pass - above average readiness |
| 900-1000 | Pass - high readiness |
| Below 720 | Fail - retake after addressing domain gaps |

The scoring report shows per-domain performance. If you fail, the report tells you exactly which domain(s) to focus on before retaking.

---

**Community passer reports referenced:**
- [843/1000 passer - r/ClaudeAI](https://www.reddit.com/r/ClaudeAI/comments/1u43exm/passed_the_claude_certified_architect_foundations/)
- [985/1000 passer - r/ClaudeAI](https://www.reddit.com/r/ClaudeAI/comments/1to0xfc/just_passed_the_new_claude_certified_architect/)
- [893/1000 passer - Medium](https://medium.com/@kishorkukreja/i-passed-anthropics-claude-certified-architect-foundations-exam-with-a-score-of-893-1000-2206c27efd6c)
- [Is it worth it? thread - r/ClaudeAI](https://www.reddit.com/r/ClaudeAI/comments/1ty4ivt/is_anthropic_cert_worth_it/)
- [Partner org access thread - r/ClaudeAI](https://www.reddit.com/r/ClaudeAI/comments/1u29zr4/looking_to_join_an_anthropic_partner_organization/)
- [Tutorials Dojo CCA-F study guide](https://tutorialsdojo.com/cca-f-claude-certified-architect-foundations-study-guide/)
- [DEV Community domain breakdown](https://dev.to/aws-builders/the-claude-certified-architect-exam-5-domains-6-scenarios-and-everything-you-need-to-know-4le3)
- [FindSkill.ai pass rate data](https://findskill.ai/blog/claude-certified-architect-exam-cost-format-pass-rate/)

*All study documents in this folder are based on community research, passer reports from r/ClaudeAI, and official Anthropic documentation as of June 2026. Verify against the current official exam guide before your attempt.*
