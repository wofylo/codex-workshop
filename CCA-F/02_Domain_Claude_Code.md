# Domain 2: Claude Code Configuration
## Weight: 20% — Moderate-Hard — ~12 questions

This domain catches many candidates off guard because it gets very specific. It is not enough to know that CLAUDE.md exists - you need to know how Claude Code reads it, how the configuration hierarchy works, and how hooks and skills are wired up. The exam tests the specific mechanics, not general awareness.

---

## The CLAUDE.md Hierarchy

This is the most tested topic in the domain. Claude Code reads CLAUDE.md files at three levels, and the exam will give you scenarios where the wrong level is configured.

### Three Levels

```
Project Root
├── CLAUDE.md          ← Level 1: Root (global project instructions)
├── src/
│   ├── CLAUDE.md      ← Level 2: Subdirectory (overrides root for this subtree)
│   └── components/
│       └── CLAUDE.md  ← Level 3: Nested subdirectory (overrides parent for this subtree)
└── tests/
    └── CLAUDE.md      ← Level 2 (different branch)
```

### Merge and Override Rules

- **Lower levels override higher levels** for conflicting instructions in the same scope
- **All levels are additive** for non-conflicting instructions (root instructions still apply to subdirectories unless explicitly overridden)
- **Claude Code reads all applicable CLAUDE.md files** in the path from root to current working directory, not just the nearest one
- **User-level CLAUDE.md** (`~/.claude/CLAUDE.md`) applies globally across all projects and is the lowest-priority override (project-level instructions take precedence)

### Exam Question Shape

> "A developer adds a rule to the root CLAUDE.md: 'Never modify test files.' They later add a rule to `tests/CLAUDE.md`: 'You may add new test cases.' Which rule governs adding test cases in the tests/ directory?"

**Correct answer:** The `tests/CLAUDE.md` rule takes precedence for that subdirectory. Claude Code can add new test cases there, even though the root says not to modify test files. The subdirectory instruction overrides the root for its own scope.

---

## CLAUDE.md Content Structure

A well-formed CLAUDE.md contains these sections (the exam tests awareness of what belongs where):

```markdown
# Project Instructions

## Project Overview
Brief description of the project, its purpose, and tech stack.

## Commands
- Build: npm run build
- Test: npm test
- Lint: npm run lint

## Code Style
- Use TypeScript strict mode
- Prefer functional components
- No default exports

## Constraints
- Never modify generated files in /dist
- Do not commit .env files
- Always run tests before suggesting a PR

## Context
[Any domain-specific knowledge Claude needs to do its job well]
```

**What does NOT belong in CLAUDE.md:**
- Secrets, API keys, credentials
- Instructions that belong in code comments (CLAUDE.md is for Claude's behavior, not code documentation)
- Redundant information already in the codebase (Claude can read the code)

---

## Skills Configuration

Skills extend Claude Code's capabilities with reusable instruction sets.

### How Skills Work

- A skill is a markdown file that Claude Code loads into its context when invoked
- Skills live in `~/.claude/skills/` (user-level) or `.claude/skills/` (project-level)
- Skills are invoked via `/skill-name` in the Claude Code interface
- Skills can reference other skills (skill chaining)
- Skills have a `name`, `description`, `allowed-tools`, and body content

### Skill File Structure

```markdown
---
name: my-skill
description: What this skill does (used to decide when to invoke it)
allowed-tools: Read, Edit, Bash
---

# Skill Content

Instructions for Claude to follow when this skill is active.
```

### Exam Scenarios for Skills

The exam tests:
- Where skill files must be located for project-level vs user-level scope
- What the `description` field is used for (auto-invocation matching, not display)
- What `allowed-tools` restricts (limits which tools Claude can call while the skill is active)
- What happens when a skill and CLAUDE.md conflict (CLAUDE.md wins for project-level config; skill wins for skill-specific behavior)

---

## Hooks Configuration

Hooks are shell commands that run automatically in response to Claude Code events.

### Hook Events

| Event | Triggers When |
|---|---|
| `PreToolUse` | Before any tool call is executed |
| `PostToolUse` | After any tool call completes |
| `Notification` | When Claude Code emits a notification |
| `Stop` | When Claude Code stops (turn ends) |
| `SubagentStop` | When a subagent finishes |

### Hook Configuration Location

Hooks are configured in `.claude/settings.json` (project-level) or `~/.claude/settings.json` (user-level):

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "echo 'About to run a Bash command'"
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "notify-send 'Claude Code finished'"
          }
        ]
      }
    ]
  }
}
```

### Hook Behavior Rules

- Hooks run in the shell environment where Claude Code was launched
- A hook that exits non-zero on `PreToolUse` **blocks the tool call** from executing
- A hook that exits non-zero on `PostToolUse` does NOT undo the tool call (the tool already ran)
- Hooks do not have access to Claude's context or conversation — they only receive tool name and arguments
- Hook output (stdout/stderr) is visible in Claude Code's interface and is fed back into the conversation context

### Exam Scenarios for Hooks

> "You want to prevent Claude Code from running `rm -rf` in any Bash command. Which hook configuration achieves this?"

**Correct answer:** A `PreToolUse` hook that matches `Bash`, checks the command argument for `rm -rf`, and exits with a non-zero code if found. This blocks the tool call before it executes.

> "You configure a `PostToolUse` hook that exits 1 when Claude writes to a protected file. Claude writes to the file. What happens?"

**Correct answer:** The file is already written (PostToolUse fires after the tool ran). The hook exit code generates an error in the conversation context, but does not undo the file write. Use `PreToolUse` to prevent actions, not `PostToolUse`.

---

## Settings.json Structure

The settings file controls Claude Code's permissions, hooks, and environment.

```json
{
  "permissions": {
    "allow": [
      "Bash(npm run *)",
      "Read(*)",
      "Edit(src/**)"
    ],
    "deny": [
      "Bash(rm -rf *)",
      "Edit(.env)"
    ]
  },
  "hooks": { ... },
  "env": {
    "NODE_ENV": "development"
  }
}
```

### Permission Glob Patterns

- `Bash(npm run *)` - allows any npm run command
- `Read(*)` - allows reading any file
- `Edit(src/**)` - allows editing any file under src/
- `Bash(*)` - allows any bash command (dangerous — exam will ask you to identify this as overly permissive)

### Precedence

- `deny` rules override `allow` rules
- Project-level settings override user-level settings for conflicting rules
- More specific patterns take precedence over more general ones within the same level

---

## Claude Code Workflows

The exam also tests awareness of how Claude Code is used in development workflows:

### The `/` Command System

- `/help` - show available commands and skills
- `/memory` - access and update Claude's project memory
- `/clear` - clear conversation context
- `/<skill-name>` - invoke a skill
- `/compact` - compact the current conversation (summarize and reduce context)

### Claude Code in CI/CD

The exam may include scenarios about Claude Code running non-interactively:
- `claude --print` flag for non-interactive output
- `claude -p "prompt"` for one-shot execution
- The `--output-format json` flag for machine-readable output
- Piping output to other tools

---

## Practice Questions

**Q1.** A project has a root CLAUDE.md that says "Always use 2-space indentation." The `frontend/` subdirectory has a CLAUDE.md that says "Use 4-space indentation for JSX files." A developer is working in `frontend/components/Button.jsx`. What indentation rule applies?

- A) 2-space (root CLAUDE.md takes precedence)
- B) 4-space (subdirectory CLAUDE.md takes precedence)
- C) Claude will ask the developer which to use
- D) Claude will use the most recently modified CLAUDE.md

**Answer: B** - Subdirectory CLAUDE.md overrides root for its subtree.

---

**Q2.** A PreToolUse hook is configured to exit 1 when it detects a Bash command containing `DROP TABLE`. The hook fires. What happens?

- A) The Bash command runs, then is rolled back
- B) The Bash command is blocked from running
- C) Claude receives an error message and retries with a modified command automatically
- D) The hook logs the attempt and the Bash command runs anyway

**Answer: B** - PreToolUse non-zero exit blocks the tool call.

---

**Q3.** You want a skill to be available across all your projects, not just one. Where should the skill file be placed?

- A) `./CLAUDE.md` in each project
- B) `~/.claude/skills/` (user-level skills directory)
- C) `.claude/skills/` (project-level skills directory)
- D) `/etc/claude/skills/` (system-level)

**Answer: B** - User-level skills directory applies globally.

---

## Key Vocabulary

| Term | Definition |
|---|---|
| CLAUDE.md | Markdown file Claude Code reads for project/directory instructions |
| Skill | Reusable instruction set invoked via `/skill-name` |
| Hook | Shell command that runs on Claude Code events (PreToolUse, PostToolUse, Stop, etc.) |
| settings.json | Config file for permissions, hooks, and environment variables |
| PreToolUse | Hook event that fires before a tool executes; can block the tool |
| PostToolUse | Hook event that fires after a tool executes; cannot undo it |
| allowed-tools | Skill frontmatter field that limits which tools the skill may use |

---

**Sources:**
- [Anthropic Claude Code documentation](https://docs.anthropic.com)
- [Partner Network learning path (Skilljar)](https://anthropic.skilljar.com/page/claude-partner-network-learning-path)
- [Tutorials Dojo CCA-F study guide - Claude Code section](https://tutorialsdojo.com/cca-f-claude-certified-architect-foundations-study-guide/)
- [893/1000 passer on Claude Code domain](https://medium.com/@kishorkukreja/i-passed-anthropics-claude-certified-architect-foundations-exam-with-a-score-of-893-1000-2206c27efd6c)

*This domain is 20% of the exam. The hierarchy and hook mechanics are the most frequently tested specifics.*
