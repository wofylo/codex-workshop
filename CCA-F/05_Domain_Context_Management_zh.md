# 主題 5：Context Management（CALM）
## 權重：約 17%｜背熟後最容易｜約 10 題

多位通過者都把這一章形容為「送分題」，前提是你熟悉 CALM 框架與 prompt caching 的機制。這個主題比另外四個更吃記憶。第 2 週把它拿下，就能穩穩把分數收進來。

---

## CALM 是什麼

**CALM = Context-Aware LLM Management**

這是 Anthropic 用來在 production Claude 應用中有效管理 context window 的框架。四大支柱如下：

1. **Prompt Caching** - 重複使用昂貴的 prompt 前綴
2. **Conversation Compaction** - 在不失去意義的前提下壓縮長對話歷史
3. **Token Budgeting** - 為每一輪或整個 session 設定明確的 context 消耗上限
4. **Multi-Turn Design** - 設計能高效率利用 context 的多輪對話

考試會測每個支柱的機制、何時該用，以及彼此如何互動。

---

## 支柱 1：Prompt Caching

### 什麼是 Prompt Caching

prompt caching 可以讓你把 prompt 的一部分標記成「可快取」，讓 Anthropic API 在多次呼叫時重用該前綴的 KV cache。這能降低重複呼叫相同 prefix 時的延遲與成本。

### 它怎麼運作

你會在 API request 的 messages 中加入 `cache_control` breakpoint：

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

`cache_control: ephemeral` 會告訴 Anthropic API：「把這個 breakpoint 之前的內容都快取起來。之後如果 prefix 一樣，就直接提供 KV cache，而不是重新計算。」

### 考試會測的關鍵機制

| 事實 | 細節 |
|---|---|
| Cache TTL | 5 分鐘（預設）- 5 分鐘沒用就過期 |
| 最小可快取 prefix | 1,024 tokens（比這更短時 cache_control 沒效果） |
| Cache storage billing | 快取 tokens 的儲存成本約為正常寫入 token 成本的 10% |
| Cache hit cost | Cache read 約為正常輸入 token 成本的 10% |
| 最大 breakpoint 數 | 每個 request 最多 4 個 `cache_control` breakpoints |
| 會被快取的內容 | breakpoint 之前的所有內容，包含被標記的 block |

### 什麼時候該用 Prompt Caching

當相同的大 prefix 會在多次呼叫中重複使用時，就應該用 caching：
- 大型 system prompt（指令、參考文件）
- 多輪 coding assistant 載入的 codebase
- 分多次分析的長文件
- 在多個 API 呼叫中都一樣的 tool definitions block

### 什麼時候不該用 Prompt Caching

- prefix 每次呼叫都不同（caching 沒效果，還要付 cache write 成本）
- 只做一次的單次請求（5 分鐘 TTL 會讓 cache 還沒重用就過期）
- prefix 少於 1,024 tokens（沒效果）

### 考題模式

> 「你的 API endpoint 有 200 個同時使用者，大家都在對同一份 80,000 token 的 policy document 提問。P50 latency 是 12 秒，每 1,000 次呼叫成本是 $3.20。你要怎麼同時降低兩者？」

**正確答案：** 在 system prompt 的 policy document 後加入 `cache_control: ephemeral` breakpoint。第一次呼叫在 cache window 內會付完整 token 成本，接下來 5 分鐘內的呼叫只要約 10% token 成本，而且 latency 會明顯下降。

**錯誤答案模式：** 把文件縮短（會犧牲準確度）；增加 concurrency（不會降低單次成本或 latency）；改模型（沒解決根本問題）。

---

## 支柱 2：Conversation Compaction

### 什麼是 Conversation Compaction

conversation compaction 是把長對話歷史摘要化或裁剪，以便在保留任務繼續所需資訊的前提下，讓對話能塞進 context window。

### 為什麼重要

對話中的每則訊息都會占用 context window。對話越長，就越接近上限。沒有 compaction，你最後只會：
- 撞到 context limit，對話失敗
- 被迫截掉舊訊息，失去重要 context

compaction 可以把舊回合壓縮成密集摘要，替新回合騰出空間。

### Compaction 策略

**策略 1：Sliding window**
只保留最近 N 回合，把前面全部丟掉。簡單，但會完全失去早期 context。
- 適用：早期回合對目前任務狀態不重要

**策略 2：Summary compaction**
丟掉舊回合前，先請 Claude 把它們摘要成緊湊表示。保存摘要，刪掉原始回合。
- 適用：早期回合包含未來還需要的關鍵決策、事實或狀態

**策略 3：Structured state extraction**
不是做自由文字摘要，而是在丟掉舊回合前，把關鍵 state 擷取成結構化格式（JSON、checklist、key-value facts）。
- 適用：需要追蹤複雜狀態的對話（多步驟任務、研究 session、debugging session）

**策略 4：Tiered context**
維持多層 context：一層是近期回合的「working memory」，另一層是整個 session 中萃取出的重要事實的「long-term memory」。
- 適用：非常長的 session，需要同時兼顧近期與歷史資訊

### 考題型態

> 「你的 40 回合客服對話快要超過 context limit。agent 需要第 3 回合的客戶帳號資訊，以及第 22 回合先前找出的問題根因。只保留最後 10 回合的 sliding window 會把這兩者都丟掉。正確的 compaction 策略是什麼？」

**正確答案：** Summary compaction 或 structured state extraction。先把帳號資訊與根因抽成緊湊結構化摘要，再丟掉早期回合。

**錯誤答案：** 純 sliding window（會失去關鍵資訊）。

---

## 支柱 3：Token Budgeting

### 什麼是 Token Budgeting

token budgeting 是為系統不同部分設定明確 token 上限，並設計系統在那些限制內運作。

### Token Budget 的組成

在典型 Claude API call 中：

```text
Total context window
├── System prompt          [固定 - 你的指示、tools 等]
├── Conversation history   [每回合成長]
├── Current user message   [可變]
└── Claude's response      [最多 max_tokens]
```

token budgeting 的意思是知道每個部分有多大，並確保總和小於 context window。

### 實務規則

1. **保留回應空間：** 一定要至少保留和你預期 Claude 回應相同數量的 tokens（用 `max_tokens` 設上限）
2. **為對話歷史做預算：** 追蹤每回合 token 數。當 history 接近上限時，觸發 compaction
3. **為 tool results 做預算：** tool 回傳可能很大（API response、檔案內容）。加入 context 前先限制大小
4. **為動態內容做預算：** 如果 system prompt 會插入動態內容（使用者資料、文件片段），每個插入點也要限制大小

### Token Budget 模式

```python
CONTEXT_WINDOW = 200000
SYSTEM_PROMPT_TOKENS = count_tokens(system_prompt)
MAX_RESPONSE_TOKENS = 4000
CONVERSATION_BUDGET = CONTEXT_WINDOW - SYSTEM_PROMPT_TOKENS - MAX_RESPONSE_TOKENS - 1000  # safety buffer

def should_compact(history_tokens):
    return history_tokens > CONVERSATION_BUDGET * 0.8  # compact at 80% to avoid hitting the limit
```

### 考題型態

> 「你的多輪研究 assistant 在長 session 中一直出現 context window exceeded。使用者說前 10 回合運作正常。你要怎麼在不降低 assistant 品質的情況下修正？」

**正確答案：** 實作對 conversation history 的 token budget 追蹤。當 history 預算達到 80% 時，觸發 summary compaction，先壓縮早期回合，再接受下一個使用者訊息。

---

## 支柱 4：Multi-Turn Design

### 什麼是 Multi-Turn Design

multi-turn design 是設計對話時，讓 context 使用效率更高、重要資訊更早出現（離目前回合更近）、並且避免一開始就載入不必要 context。

### 核心設計原則

**原則 1：把關鍵 context 放前面**
Claude 對 context 開頭與結尾的內容會稍微更注意（recency bias）。重要指示和限制應放在 system prompt，不要藏到第 30 回合。

**原則 2：把不變條件放 system prompt**
對話每一輪都成立的內容都應放 system prompt，包括角色、輸出格式、限制與永久領域 context。不要在每輪 user message 重複不變條件。

**原則 3：為重要決策做 checkpoint**
在長時間 agentic session 中，當 Claude 做出重要決策或找到關鍵事實時，應在該回合結尾明確擷取成短的「state note」。未來回合只放 state note，而不是完整歷史。

**原則 4：積極裁剪 tool results**
tool result 通常很冗長。在放入 context 前，只擷取相關部分。200KB 的 API response 若只帶來 3 個有用欄位，就只把那 3 個欄位放進 context。

**原則 5：讓使用者回合保持精簡**
使用者輸入應該是問題或指令，而不是把所有已建立的 context 再重貼一次。如果使用者一直貼超長歷史，表示系統沒有妥善保留 state。

---

## 四大支柱如何一起運作

考試可能出現整合情境，要求你同時套用多個 CALM 支柱：

**情境：** 一個文件分析工具，對同一份 100K token 的法律文件提出不同問題。
- 用 **prompt caching** 快取文件（同一 prefix、重複呼叫）
- 用 **token budgeting** 確保每次回答都保留足夠回應 token
- 用 **multi-turn design** 讓後續問題聚焦，不用重新建立 context

**情境：** 一個用於大型 codebase 的多輪 coding assistant
- 用 **multi-turn design** 把 codebase 摘要放在 system prompt，只在需要時載入特定檔案
- 用 **token budgeting** 追蹤對話成長
- session 很長時用 **conversation compaction**（摘要已解決問題，保留目前任務焦點）
- 對所有使用者共用的不變 system prompt content 用 **prompt caching**

---

## 練習題

**Q1.** 你的 API 每次都送出同一個 30,000 token 的 system prompt。成本很高。你在 system prompt 上加入 `cache_control: ephemeral`。24 小時後成本沒有下降。最可能的原因是什麼？

- A) prompt caching 只對少於 1,024 tokens 的 system prompt 有效
- B) 兩次呼叫間隔超過 5 分鐘，cache TTL 過期了
- C) prompt caching 不支援 Claude 3.5 API
- D) 你需要在 API headers 設定 `cache: true`

**答案：B** - 5 分鐘 TTL 代表只有在同一 prefix 於 5 分鐘內再次被呼叫時，cache 才省成本。如果呼叫很稀疏，cache 會先過期。

---

**Q2.** 一個 60 回合對話出現 "context window exceeded"。前 40 回合包含重要的已解決問題。後 20 回合是目前正在處理的任務。哪個 compaction 策略最能保留價值？

- A) 保留最後 20 回合的 sliding window（丟掉第 1-40 回合）
- B) Structured state extraction：把第 1-40 回合的關鍵決策與事實抽成 JSON 摘要，再丟掉第 1-40 回合
- C) 重新開始對話並請使用者重述 context
- D) 增加 max_tokens 讓 60 回合全部放得下

**答案：B** - structured state extraction 能以緊湊形式保留早期回合價值，同時替目前任務騰出空間。

---

**Q3.** 下列何者**不是** prompt caching 的有效使用情境？

- A) 法律研究工具在一小時內對同一份 50 頁條款文件，發出 100 個不同使用者問題
- B) 一次性文件翻譯工具，處理的每份文件都只用一次
- C) coding assistant 每個 session 都載入相同的大型 codebase context
- D) 客服 bot 對每次呼叫都送出相同的 policy instructions

**答案：B** - 一次性處理唯一文件不會重用快取 prefix。你只會付 cache write 成本，沒有 cache hit，反而比不快取更貴。

---

## 關鍵詞彙

| 術語 | 定義 |
|---|---|
| CALM | Context-Aware LLM Management - Anthropic 的 4 支柱 context 效率框架 |
| cache_control | 標記 prompt prefix 可快取的 API 參數 |
| Cache TTL | prompt cache entry 的存活時間；Anthropic API 預設為 5 分鐘 |
| Ephemeral cache | 目前支援的唯一 cache_control 類型；快取前綴 5 分鐘 |
| Conversation compaction | 壓縮或裁剪長對話歷史，以騰出 context 空間 |
| Token budget | 系統某個部分可消耗 token 的明確上限 |
| Sliding window | 只保留最近 N 回合的 compaction 策略 |
| Summary compaction | 在刪除舊回合前先將其摘要的策略 |
| Structured state extraction | 將關鍵事實抽成緊湊結構化格式的策略 |
| Multi-turn design | 在多輪對話中有效使用 context 的架構實務 |

---

**來源：**
- [Anthropic prompt caching documentation](https://docs.anthropic.com)
- [Partner Network learning path - context management](https://anthropic.skilljar.com/page/claude-partner-network-learning-path)
- [843/1000 passer：把 context management 稱為「最簡單送分題」](https://www.reddit.com/r/ClaudeAI/comments/1u43exm/passed_the_claude_certified_architect_foundations/)
- [FindSkill.ai CCA-F exam overview](https://findskill.ai/blog/claude-certified-architect-exam-cost-format-pass-rate/)
- [涵蓋 CALM 情境的社群練習模擬器](https://www.reddit.com/r/ClaudeAI/comments/1u325pt/built_an_interactive_practice_exam_trainer_for/)

*context management 題在通過者中的正確率最高。只要把 CALM 四支柱與 `cache_control` 機制背熟，本主題預期可拿下約 8-9 題。*
