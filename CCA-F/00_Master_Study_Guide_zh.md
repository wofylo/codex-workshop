# CCA-F 主管學習指南
## Claude Certified Architect - Foundations

**考試代碼：** CCA-F | **上線日期：** 2026 年 3 月 12 日 | **費用：** $99（前 5,000 名 Partner Network 員工免費）
**形式：** 60 題情境式選擇題 | **時間：** 120 分鐘 | **通過分數：** 720 / 1000

---

## 目錄

1. [考試存取路徑](#考試存取路徑)
2. [各主題權重](#各主題權重)
3. [2 週 60 小時準備時程](#2-週-60-小時準備時程)
4. [官方免費資源](#官方免費資源)
5. [考試實際測什麼](#考試實際測什麼)
6. [應試技巧](#應試技巧)
7. [已知作業問題](#已知作業問題)

---

## 考試存取路徑

你必須先加入 Claude Partner Network，才能進行報名。

1. 前往 **[claude.com/partners](https://claude.com/partners)** 申請（免費，任何組織皆可）
2. 通過後，前往 **[anthropic.skilljar.com/claude-certified-architect-foundations-access-request](https://anthropic.skilljar.com/claude-certified-architect-foundations-access-request)** 申請考試存取
3. 在嘗試考試前，至少完成 Anthropic Academy 的核心課程（見下方資源）
4. 安排並付款（$99），或在前 5,000 名 partner 員工資格內兌換免費名額

加入 partner network 本身是免費的，門檻在於知曉流程，而不是費用。

---

## 各主題權重

| # | 主題 | 權重 | 難度 |
|---|---|---|---|
| 1 | Agentic Architecture & Orchestration | 27% | 最難 |
| 2 | Claude Code Configuration | 20% | 中偏難 |
| 3 | Tool Design & MCP Integration | 18% | 中等 |
| 4 | Prompt Engineering | ~18% | 中等 |
| 5 | Context Management (CALM) | ~17% | 只要背熟就最簡單 |

主題 1（27%）+ 主題 2（20%）= 47% 的分數。這兩個主題通常決定你是否通過。

---

## 2 週 60 小時準備時程

這份時程參考了一位來自非工程背景（量化交易 + 資料科學）、拿到 [843/1000 分的 r/ClaudeAI 通過者](https://www.reddit.com/r/ClaudeAI/comments/1u43exm/passed_the_claude_certified_architect_foundations/)。請依你自己的 Claude 經驗調整。

### 第 1 週：基礎 + Agentic 核心（第 1-7 天，約 35 小時）

**第 1-2 天（約 10 小時）：API 基礎**
- Anthropic Academy：Claude 101（核心概念、API 基礎）
- Anthropic Academy：Building with Claude API（工具使用、串流、進階參數）
- 目標：理解 Claude API 在生產環境中的運作方式，而不只是聊天用法

**第 3-4 天（約 10 小時）：Agent SDK + MCP**
- Anthropic Academy：Agent SDK 課程（建立 agentic 應用）
- Anthropic Academy：MCP / Model Context Protocol 課程
- 逐頁閱讀 docs.anthropic.com/agents，考試題目看起來直接取材自這份文件
- 目標：內化 orchestrator / subagent 心智模型與 MCP server 架構

**第 5-7 天（約 15 小時）：Agentic Architecture 深度學習**
- 實作一個多代理 pipeline（即使只是 2-3 個 subagent 的玩具範例也可以）
- 研讀 Domain 1 指南中的六種情境模式（見 `01_Domain_Agentic_Architecture.md`）
- 重點：平行 vs 序列、最小權限、失敗復原、human-in-the-loop
- 這占考試 27%。這一段要花最多時間。

### 第 2 週：Claude Code + Context + 練習（第 8-14 天，約 25 小時）

**第 8-9 天（約 8 小時）：Claude Code**
- Anthropic Academy：Claude Code 課程
- 詳細研究 CLAUDE.md 階層（root / subdirectory / project levels）
- 理解 hooks 與 skills 的設定
- 參考 `02_Domain_Claude_Code.md` 了解具體考點

**第 10-11 天（約 7 小時）：Context Management**
- 閱讀 Anthropic 官方 prompt caching 文件
- 閱讀 conversation compaction 文件
- 研讀 CALM 框架（見 `05_Domain_Context_Management.md`）
- 多位通過者都把這些稱為「送分題」，現在就先拿下

**第 12-14 天（約 10 小時）：Prompt Engineering + 模擬測驗**
- 複習 `04_Domain_Prompt_Engineering.md`，重點放在可解析的 production-grade 輸出
- 完成所有可取得的模擬測驗
- **關鍵：** 模擬測驗比正式考試容易。若你在模擬測驗拿到 850+，正式考試通常約 750-800。
- 每個錯題都要回到對應的官方文件頁面，而不是再做另一份模擬題

---

## 官方免費資源

以下資源都免費，且 Partner Network 成員可使用：

| 資源 | 位置 | 優先級 |
|---|---|---|
| Claude 101 | [anthropic.skilljar.com](https://anthropic.skilljar.com/page/claude-partner-network-learning-path) | 必做 |
| Building with Claude API | [anthropic.skilljar.com](https://anthropic.skilljar.com/page/claude-partner-network-learning-path) | 必做 |
| Prompt Engineering | [anthropic.skilljar.com](https://anthropic.skilljar.com/page/claude-partner-network-learning-path) | 必做 |
| Claude Code | [anthropic.skilljar.com](https://anthropic.skilljar.com/page/claude-partner-network-learning-path) | 必做 |
| Agent SDK | [anthropic.skilljar.com](https://anthropic.skilljar.com/page/claude-partner-network-learning-path) | 必做 |
| MCP / Model Context Protocol | [anthropic.skilljar.com](https://anthropic.skilljar.com/page/claude-partner-network-learning-path) | 必做 |
| Agentic design docs | [docs.anthropic.com/agents](https://docs.anthropic.com/agents) | 必讀 |
| Prompt caching docs | [docs.anthropic.com](https://docs.anthropic.com) | 必讀 |
| 社群練習模擬器 | [r/ClaudeAI (community-built)](https://www.reddit.com/r/ClaudeAI/comments/1u325pt/built_an_interactive_practice_exam_trainer_for/) | 高價值 |
| 免費電子書（社群用 Claude Code 製作） | [r/ClaudeAI](https://www.reddit.com/r/ClaudeAI/comments/1trc4fv/i_built_a_claude_certified_architect_guide_with/) | 高價值 |

---

## 考試實際測什麼

考試**不會**測：
- 定義（「什麼是 agent？」）
- 瑣碎知識（「預設 context window 多大？」）
- 純語法（「寫出這個 API call」）

考試**會**測：
- **架構判斷**：系統發生特定失敗時，正確修正方式是什麼？
- **取捨推理**：何時用平行、何時用序列？何時加入 human gate？
- **設計模式**：最小 footprint、優雅降級、context 預算管理
- **Claude 特有行為**：Claude 如何解讀 CLAUDE.md、MCP server 如何註冊工具、cache_control 如何運作

每一題都是情境題。題型通常是：「你的系統做 X，但因為 Y 而失敗。正確的架構回應是什麼？」

正確答案通常具有以下特性：
1. 最保守（最小 footprint、可逆操作）
2. 高風險時引入人類
3. 優雅失敗，而不是災難性失敗
4. 清楚分離責任（orchestrator 規劃，subagents 執行）

---

## 應試技巧

- **時間分配：** 60 題 / 120 分鐘 = 每題 2 分鐘。若不確定就先標記跳過，之後再回來。
- **Agentic 主題（27%）會比模擬題更難。** 這是正常的，信任你的準備。
- **Context management 題通常是最穩的送分題。** 如果你懂 CALM 框架，這部分可拿 10 分以上。
- **先完整讀完情境，再看選項。** 情境中的失敗模式通常直接對應到你學過的模式。
- **若有兩個答案都看起來合理，** 選更保守、更可逆、或更有人類監督的那個。Anthropic 的設計哲學通常偏好這些特性。
- **不要急。** 提前完成的人如果有時間回頭檢查，通常能抓到 2-3 個誤讀題。

---

## 已知作業問題

**分數顯示 bug（上線初期存在，之後可能已修正）：** 有些考生在完成後會看到「Score: 0/0」與「Assessment Already Completed」。先不要慌。儀表板最多可能需要 10 天才更新。如果顯示「Awaiting Instructor Review」，可以聯繫客服，但預期要等 7-10 個工作天。

**Early Adopter 徽章：** 在初始認證窗口通過的考生可獲得。這個窗口時間沒有官方公開；但 2026 年 5 月的通過者拿到了徽章，表示當時窗口仍然開啟。

---

## 分數解讀

| 分數區間 | 解讀 |
|---|---|
| 720-799 | 通過 - 基礎穩固 |
| 800-899 | 通過 - 水準高於平均 |
| 900-1000 | 通過 - 準備非常充分 |
| 720 以下 | 未通過 - 先補齊主題缺口再重考 |

成績報告會顯示各主題表現。如果你沒過，報告會直接指出你重考前要補哪些主題。

---

**參考的社群通過報告：**
- [843/1000 通過者 - r/ClaudeAI](https://www.reddit.com/r/ClaudeAI/comments/1u43exm/passed_the_claude_certified_architect_foundations/)
- [985/1000 通過者 - r/ClaudeAI](https://www.reddit.com/r/ClaudeAI/comments/1to0xfc/just_passed_the_new_claude_certified_architect/)
- [893/1000 通過者 - Medium](https://medium.com/@kishorkukreja/i-passed-anthropics-claude-certified-architect-foundations-exam-with-a-score-of-893-1000-2206c27efd6c)
- [值得嗎？討論串 - r/ClaudeAI](https://www.reddit.com/r/ClaudeAI/comments/1ty4ivt/is_anthropic_cert_worth_it/)
- [Partner org access 討論串 - r/ClaudeAI](https://www.reddit.com/r/ClaudeAI/comments/1u29zr4/looking_to_join_an_anthropic_partner_organization/)
- [Tutorials Dojo CCA-F 學習指南](https://tutorialsdojo.com/cca-f-claude-certified-architect-foundations-study-guide/)
- [DEV Community 主題拆解](https://dev.to/aws-builders/the-claude-certified-architect-exam-5-domains-6-scenarios-and-everything-you-need-to-know-4le3)
- [FindSkill.ai 通過率資料](https://findskill.ai/blog/claude-certified-architect-exam-cost-format-pass-rate/)

*本資料夾中的所有學習文件，皆基於社群研究、r/ClaudeAI 的通過者報告，以及截至 2026 年 6 月的 Anthropic 官方文件。請在實際應試前再次核對最新官方考試指南。*
