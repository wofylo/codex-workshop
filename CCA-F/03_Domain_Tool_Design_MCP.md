# Domain 3: Tool Design & MCP Integration
## Weight: 18% — Moderate — ~11 questions

This domain tests your ability to design tools Claude can use effectively, and to architect Model Context Protocol (MCP) integrations correctly. Questions split roughly 60/40 between tool design and MCP.

---

## Part A: Tool Design

### What a Tool Is

A tool is a structured function definition that Claude can call during a conversation. Claude does not execute the function itself — it generates a tool_use block, your code intercepts it, runs the function, and returns the result in a tool_result block.

```
User message
    → Claude thinks and decides to call a tool
    → Claude emits: {"type": "tool_use", "name": "get_order", "input": {"order_id": "123"}}
    → Your code runs get_order("123") → returns order data
    → You send: {"type": "tool_result", "content": "...order data..."}
    → Claude continues the conversation with the result
```

### Tool Definition Structure

```json
{
  "name": "get_customer_orders",
  "description": "Retrieve all orders for a specific customer. Use this when the user asks about order history, past purchases, or delivery status.",
  "input_schema": {
    "type": "object",
    "properties": {
      "customer_id": {
        "type": "string",
        "description": "The unique customer identifier from the CRM system"
      },
      "limit": {
        "type": "integer",
        "description": "Maximum number of orders to return. Default 10, max 100.",
        "default": 10
      }
    },
    "required": ["customer_id"]
  }
}
```

### Tool Design Principles (Exam-Tested)

**1. Description quality is load-bearing**

The `description` field is what Claude uses to decide when to call the tool. A vague description leads to missed calls or incorrect calls.

Bad: `"description": "Gets orders"`
Good: `"description": "Retrieve all orders for a specific customer. Use this when the user asks about order history, past purchases, or delivery status. Do NOT use for product catalog lookups."`

The exam will present scenarios where Claude calls the wrong tool or fails to call the right one. The fix is almost always in the description.

**2. One tool per responsibility**

A tool should do one thing. A tool named `manage_customer` that can read, update, and delete is wrong — it violates the minimal footprint principle and makes Claude's decision about when to call it ambiguous.

Correct design:
- `get_customer(customer_id)` - read only
- `update_customer_email(customer_id, new_email)` - specific write
- `delete_customer(customer_id)` - destructive, separate from reads

**3. Input schema completeness**

Every parameter should have a `description`. The `required` array should be accurate. Optional parameters should have sensible defaults. Missing descriptions cause Claude to guess at parameter values.

**4. Return value design**

Tool results should be:
- Structured and consistent (same shape every time, even on errors)
- Appropriately sized (don't return 500KB of data when a 50-byte summary suffices)
- Self-describing (include field names that make the result readable in context)

A good error return:
```json
{"success": false, "error_code": "NOT_FOUND", "message": "Customer ID 123 not found"}
```

A bad error return:
```json
null
```

**5. When NOT to use a tool**

The exam also tests this. Do not define a tool when:
- The information is already in the conversation context
- Claude can reason about the answer without external data
- The "tool" would just be Claude calling itself (use prompt engineering instead)

---

## Tool Use Patterns

### Parallel Tool Calls

Claude can call multiple tools in a single response when the calls are independent. Your system must handle parallel tool_use blocks:

```
Claude response:
  tool_use: search_web(query="2026 GDP data")
  tool_use: search_db(table="economic_indicators", year=2026)
```

You must run both, collect both results, and return both tool_result blocks before Claude continues.

**Exam scenario:** A system only processes one tool_use block per response. Claude is calling two tools in parallel. Results are degraded. Fix: update the tool runner to process all tool_use blocks in a single response before returning results.

### Tool Result Handling

- Return results in the same order as the tool_use blocks
- Include the `tool_use_id` in each result
- A failed tool should return an error result, not raise an exception that crashes the loop

---

## Part B: MCP (Model Context Protocol)

### What MCP Is

MCP is an open protocol that standardizes how Claude (and other LLMs) connect to external tools, data sources, and services. Instead of writing custom tool definitions for every integration, MCP provides a standard server-client architecture.

```
Claude (MCP Client)
    ↕ MCP Protocol
MCP Server (your integration)
    ↕
External Service (database, API, filesystem, etc.)
```

### MCP Architecture Components

| Component | Role |
|---|---|
| MCP Client | The LLM runtime (Claude) that discovers and calls tools |
| MCP Server | Your server that exposes tools, resources, and prompts to Claude |
| Tools | Functions the MCP server exposes (callable by Claude) |
| Resources | Data the MCP server exposes (readable by Claude, like files or DB records) |
| Prompts | Reusable prompt templates the MCP server provides |

### MCP Server Configuration in Claude Code

MCP servers are registered in `.claude/settings.json` or `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "my-database": {
      "command": "node",
      "args": ["./mcp-server/index.js"],
      "env": {
        "DB_CONNECTION_STRING": "postgresql://..."
      }
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/allowed/path"]
    }
  }
}
```

### MCP vs Direct Tool Definition

**Use MCP when:**
- You need the same integration available across multiple Claude Code projects
- The integration is complex and benefits from isolation in its own process
- You want to share the integration with other MCP-compatible clients
- The integration has its own authentication, connection pooling, or state

**Use direct tool definition when:**
- The tool is specific to one project or one Claude API integration
- The tool is simple enough to implement inline
- You are building a Claude API application (not Claude Code)

### MCP Tool Registration

When Claude Code starts, it connects to all configured MCP servers and discovers their available tools. These tools appear alongside Claude's built-in tools and can be called in the same way.

**Exam scenario:** A developer registers an MCP server but Claude Code does not see the tools. Possible causes:
- MCP server is not running (command fails to start)
- MCP server is registered in project settings but Claude Code is running from a different directory
- MCP server returns a malformed tool definition (missing `name` or `inputSchema`)
- Permissions deny Claude Code from spawning the process

### MCP Resources vs Tools

| | Resources | Tools |
|---|---|---|
| Direction | Claude reads from them | Claude calls them |
| State change | Read-only | Can have side effects |
| Example | A file, a database row | A function that writes a file |
| Protocol | `resources/read` | `tools/call` |

**Exam scenario:** A developer exposes a read-only database view via an MCP Tool instead of an MCP Resource. What is the consequence? No functional difference in a simple case, but conceptually wrong - reads should be Resources; writes should be Tools. The exam may test whether you know the distinction.

---

## Practice Questions

**Q1.** Claude is calling a `search_products` tool when users ask about inventory levels, even though you have a separate `get_inventory` tool. What is the most likely cause?

- A) The `get_inventory` tool has a bug
- B) The `search_products` description is too broad and overlaps with inventory queries
- C) Claude cannot use two tools with similar names
- D) The `get_inventory` tool is not in the `required` list

**Answer: B** - Tool selection is driven by description. A broad or ambiguous description causes Claude to call the wrong tool.

---

**Q2.** You configure an MCP server in `.claude/settings.json`. Claude Code starts but reports no MCP tools available. The most likely cause is:

- A) MCP is not supported in this version of Claude
- B) The MCP server process fails to start (check the `command` and `args` fields)
- C) You need to restart your computer
- D) MCP tools must be manually registered per conversation

**Answer: B** - If the server process doesn't start, no tools are registered.

---

**Q3.** Which tool design returns the most useful result to Claude when an order is not found?

- A) Return `null`
- B) Raise an exception
- C) Return `{"success": false, "error_code": "ORDER_NOT_FOUND", "message": "No order found with ID 456"}`
- D) Return an empty array `[]`

**Answer: C** - Structured, self-describing error results allow Claude to formulate a meaningful response to the user. null and empty array are ambiguous.

---

## Key Vocabulary

| Term | Definition |
|---|---|
| tool_use | The JSON block Claude emits when it wants to call a tool |
| tool_result | The JSON block your code returns after running the tool |
| input_schema | JSON Schema defining the parameters a tool accepts |
| MCP | Model Context Protocol - standard for connecting LLMs to external tools/data |
| MCP Server | Process that exposes tools, resources, and prompts via MCP protocol |
| MCP Resource | Read-only data exposed by an MCP server |
| MCP Tool | Callable function exposed by an MCP server (can have side effects) |
| tool_use_id | Unique ID linking a tool_use block to its tool_result block |

---

**Sources:**
- [Anthropic tool use documentation](https://docs.anthropic.com)
- [Model Context Protocol specification](https://docs.anthropic.com/agents)
- [DEV Community: exam domain breakdown including Tool Design](https://dev.to/aws-builders/the-claude-certified-architect-exam-5-domains-6-scenarios-and-everything-you-need-to-know-4le3)
- [Tutorials Dojo CCA-F study guide - MCP section](https://tutorialsdojo.com/cca-f-claude-certified-architect-foundations-study-guide/)

*Tool description quality and MCP architecture questions are the highest-value items in this domain.*
