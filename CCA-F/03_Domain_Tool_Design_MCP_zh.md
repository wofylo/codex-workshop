# 主題 3：工具設計與 MCP 整合
## 權重：18%｜中等｜約 11 題

這個主題考你如何設計 Claude 能有效使用的工具，以及如何正確架構 Model Context Protocol（MCP）整合。題目大約 60/40 分布在工具設計與 MCP。

---

## A 部分：工具設計

### 什麼是 Tool

tool 是一個結構化函式定義，Claude 可以在對話中呼叫它。Claude 不會自己執行函式，而是產生 `tool_use` 區塊，由你的程式攔截、執行函式，再把結果以 `tool_result` 區塊回傳。

```text
User message
    -> Claude 思考並決定呼叫工具
    -> Claude 輸出: {"type": "tool_use", "name": "get_order", "input": {"order_id": "123"}}
    -> 你的程式執行 get_order("123") -> 回傳訂單資料
    -> 你送回: {"type": "tool_result", "content": "...order data..."}
    -> Claude 以結果繼續對話
```

### Tool 定義結構

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

### 工具設計原則（考試重點）

**1. description 的品質非常重要**

`description` 欄位是 Claude 用來決定何時呼叫工具的依據。描述太模糊，會導致漏叫或錯叫。

差：`"description": "Gets orders"`
好：`"description": "Retrieve all orders for a specific customer. Use this when the user asks about order history, past purchases, or delivery status. Do NOT use for product catalog lookups."`

考試會給你 Claude 呼叫錯工具、或沒叫對工具的情境。修正通常都在 description。

**2. 一個工具對應一個責任**

工具應該只做一件事。像 `manage_customer` 這種同時能讀、改、刪的工具是錯的，因為它破壞最小 footprint，也讓 Claude 不知道何時該叫它。

正確設計：
- `get_customer(customer_id)` - 只讀
- `update_customer_email(customer_id, new_email)` - 明確寫入
- `delete_customer(customer_id)` - 破壞性操作，與讀取分開

**3. input schema 要完整**

每個參數都應該有 `description`。`required` 陣列要準確。可選參數要有合理預設值。描述缺失會讓 Claude 猜參數。

**4. 回傳值設計**

tool 結果應該：
- 結構化且一致（每次形狀都一樣，即使錯誤也一樣）
- 大小適中（不要回傳 500KB 資料，只因為 50 bytes 摘要就夠）
- 自我描述性強（欄位名稱要讓結果在 context 中可讀）

好的錯誤回傳：
```json
{"success": false, "error_code": "NOT_FOUND", "message": "Customer ID 123 not found"}
```

壞的錯誤回傳：
```json
null
```

**5. 什麼時候不該用 tool**

考試也會測這個。不要在以下情況下定義 tool：
- 資訊已經在對話 context 裡
- Claude 不需要外部資料就能推理答案
- 所謂的「tool」其實只是 Claude 自己呼叫自己（這種情況改用 prompt engineering）

---

## Tool 使用模式

### 平行 Tool 呼叫

Claude 可以在同一則回應中呼叫多個獨立工具。你的系統必須處理平行的 `tool_use` 區塊：

```text
Claude response:
  tool_use: search_web(query="2026 GDP data")
  tool_use: search_db(table="economic_indicators", year=2026)
```

你必須兩個都執行、收集兩個結果，然後在 Claude 繼續前回傳兩個 `tool_result`。

**考題情境：** 系統一次只處理一個 `tool_use` 區塊。Claude 在平行呼叫兩個工具，結果品質下降。修正方式：更新工具執行器，在回傳結果前先處理同一回應中的所有 `tool_use`。

### Tool Result 處理

- 依照 `tool_use` 區塊的順序回傳結果
- 每個結果都要帶 `tool_use_id`
- 某個 tool 失敗時應回傳 error result，而不是丟例外導致迴圈崩潰

---

## B 部分：MCP（Model Context Protocol）

### 什麼是 MCP

MCP 是一個開放協議，標準化 Claude（以及其他 LLM）如何連接外部工具、資料來源與服務。與其為每個整合都寫客製 tool 定義，MCP 提供標準的 server-client 架構。

```text
Claude (MCP Client)
    -> MCP Protocol
MCP Server (your integration)
    -> External Service (database, API, filesystem, etc.)
```

### MCP 架構元件

| 元件 | 角色 |
|---|---|
| MCP Client | LLM runtime（Claude），負責發現與呼叫工具 |
| MCP Server | 你的 server，對 Claude 暴露 tools、resources、prompts |
| Tools | MCP server 暴露的函式，可由 Claude 呼叫 |
| Resources | MCP server 暴露的資料，Claude 可讀取（例如檔案或 DB 紀錄） |
| Prompts | MCP server 提供的可重用 prompt 模板 |

### Claude Code 中的 MCP Server 設定

MCP servers 會在 `.claude/settings.json` 或 `~/.claude/settings.json` 中註冊：

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

### 什麼時候用 MCP，什麼時候用直接 Tool 定義

**適合用 MCP 的情況：**
- 同一套整合要在多個 Claude Code 專案中共用
- 整合很複雜，適合隔離在自己的 process 中
- 想要把整合分享給其他相容 MCP 的 client
- 整合本身有自己的驗證、連線池或 state

**適合用直接 Tool 定義的情況：**
- 工具只屬於單一專案或單一 Claude API 整合
- 工具很簡單，可以直接 inline 實作
- 你在做的是 Claude API 應用，而不是 Claude Code

### MCP Tool 註冊

Claude Code 啟動時會連線到所有已設定的 MCP servers，並發現它們提供的工具。這些工具會和 Claude 內建工具一起出現，使用方式相同。

**考題情境：** 開發者註冊了 MCP server，但 Claude Code 看不到工具。可能原因：
- MCP server 沒有成功啟動（command 失敗）
- MCP server 是在專案設定中註冊，但 Claude Code 是從不同目錄啟動
- MCP server 回傳了格式錯誤的 tool 定義（缺少 `name` 或 `inputSchema`）
- 權限設定禁止 Claude Code 啟動該 process

### MCP Resources vs Tools

| | Resources | Tools |
|---|---|---|
| 方向 | Claude 從中讀取 | Claude 呼叫它們 |
| 狀態變更 | 唯讀 | 可有副作用 |
| 範例 | 檔案、資料庫列 | 寫入檔案的函式 |
| 協議 | `resources/read` | `tools/call` |

**考題情境：** 開發者把唯讀資料庫 view 以 MCP Tool 形式暴露，而不是 MCP Resource。後果是什麼？在簡單案例中功能上沒差，但概念上不正確：讀取應該是 Resource；寫入才應該是 Tool。考試可能測你是否知道這個差異。

---

## 練習題

**Q1.** 使用者詢問庫存量時，Claude 卻一直呼叫 `search_products` tool，明明你有 `get_inventory` tool。最可能的原因是什麼？

- A) `get_inventory` tool 有 bug
- B) `search_products` 的描述太廣，和庫存查詢重疊
- C) Claude 不能使用名稱相近的兩個工具
- D) `get_inventory` tool 沒有放在 `required` 清單中

**答案：B** - 工具選擇由 description 驅動。描述太廣或模糊會讓 Claude 叫錯工具。

---

**Q2.** 你在 `.claude/settings.json` 中設定了一個 MCP server。Claude Code 啟動了，但顯示沒有可用的 MCP tools。最可能的原因是：

- A) 這個版本的 Claude 不支援 MCP
- B) MCP server process 沒有成功啟動（檢查 `command` 與 `args`）
- C) 你需要重新開機
- D) MCP tools 必須每個對話手動註冊

**答案：B** - server process 如果沒起來，就不會註冊任何工具。

---

**Q3.** 當訂單找不到時，哪種 tool 設計最能給 Claude 有用的結果？

- A) 回傳 `null`
- B) 丟出 exception
- C) 回傳 `{"success": false, "error_code": "ORDER_NOT_FOUND", "message": "No order found with ID 456"}`
- D) 回傳空陣列 `[]`

**答案：C** - 結構化且自我描述的錯誤結果，能讓 Claude 對使用者產生有意義的回應。`null` 和空陣列都太模糊。

---

## 關鍵詞彙

| 術語 | 定義 |
|---|---|
| tool_use | Claude 想呼叫工具時輸出的 JSON 區塊 |
| tool_result | 你的程式執行工具後回傳的 JSON 區塊 |
| input_schema | 定義工具接受參數的 JSON Schema |
| MCP | Model Context Protocol - 連接 LLM 與外部工具 / 資料的標準 |
| MCP Server | 透過 MCP 協議暴露 tools、resources、prompts 的 process |
| MCP Resource | MCP server 暴露的唯讀資料 |
| MCP Tool | MCP server 暴露的可呼叫函式（可有副作用） |
| tool_use_id | 將 `tool_use` 區塊與 `tool_result` 區塊連接的唯一 ID |

---

**來源：**
- [Anthropic tool use documentation](https://docs.anthropic.com)
- [Model Context Protocol specification](https://docs.anthropic.com/agents)
- [DEV Community：包含 Tool Design 的考試主題拆解](https://dev.to/aws-builders/the-claude-certified-architect-exam-5-domains-6-scenarios-and-everything-you-need-to-know-4le3)
- [Tutorials Dojo CCA-F study guide - MCP section](https://tutorialsdojo.com/cca-f-claude-certified-architect-foundations-study-guide/)

*工具描述品質與 MCP 架構題，是本主題價值最高的部分。*
