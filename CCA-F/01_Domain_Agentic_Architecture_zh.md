# 主題 1：Agentic Architecture 與 Orchestration
## 權重：27%｜最難主題｜約 16 題

這是讓最多考生失分的主題。題目 100% 為情境題，測的是你對多代理系統的架構判斷，而不是背定義的能力。這部分要比其他任何主題都花更多時間。

---

## 核心心智模型

考試預設你已經內化 Anthropic 的 agentic 設計哲學。所有正確答案幾乎都從以下三個原則出發：

1. **最小 footprint** - 只做必要的事；優先可逆而非不可逆；只請求任務真正需要的權限
2. **優雅失敗** - 讓每條 pipeline 都能處理局部失敗，而不是產生災難性副作用
3. **高風險決策點要有人類介入** - 自動化是一個光譜；要知道何時暫停並揭露不確定性

如果兩個答案看起來都合理，通常更保守、更可逆、或更需要人類監督的那個才是正確答案。

---

## 六種核心情境模式

### 模式 1：平行 vs 序列的 subagent 執行

**什麼時候用平行執行：**
- 子任務彼此獨立（任務 A 的輸出不會餵給任務 B）
- 在意延遲，且子任務可以安全同時執行
- 每個 subagent 都有自己的隔離 context 與工具

**什麼時候用序列執行：**
- 第 N 步依賴第 N-1 步的輸出
- 第 N 步失敗時應該停止 pipeline，而不是帶著過時或缺失資料繼續
- 系統存在不可逆副作用，必須確認每一步都成功

**題目型態：**
> 「你的 pipeline 平行派出 5 個 research subagent。某一個回傳錯誤，orchestrator 卻照樣把所有輸出合併。使用者回報摘要不正確。架構上要怎麼修？」

**正確答案模式：** 在合併輸出前加入驗證關卡。應該讓 pipeline 失敗（或把缺口明確呈現給使用者），而不是拿不完整資料繼續。

**錯誤答案模式：** 不設上限地自動重試失敗的 subagent；增加 timeout；忽略單一 subagent 的錯誤。

---

### 模式 2：最小 footprint 設計

這類題目會出現在權限、工具範圍、資源存取等情境。

**核心規則：** agent 只應要求完成當前任務所需的最少能力，不要因為「也許之後會用到」就預先取得權限。

**常見考題情境：**
- agent 只有讀取需求，卻要求檔案系統寫入權限 - 錯
- 一次性的查詢任務卻建立永久資料庫紀錄 - 錯
- 明明有範圍受限的 email API token，卻要求使用者 email 密碼來發通知 - 錯
- 在做不可逆動作前先檢查是否有可逆替代方案 - 對

**題目型態：**
> 「你在設計一個 agent，要擷取客戶訂單歷史並產生摘要。哪個工具集合最合適？」

**正確答案：** 只提供唯讀的訂單歷史 API。沒有其他工具。

**錯誤答案模式：** 給完整 CRM 存取「以防 agent 需要更新紀錄」；給訂單系統寫入權限；取得超出摘要所需的客戶 PII。

---

### 模式 3：長時間自主執行前先釐清歧義

這是最常被測的模式之一。考試很不喜歡把「先開始做，之後再搞清楚」當正確答案。

**核心規則：** 如果任務定義不夠明確，而且釐清成本很低（只要問一個問題、一次回合），那就應該先釐清，再開始長時間的自主執行。第一步的錯誤假設如果到第七步才發現，會浪費算力、時間，甚至造成副作用。

**哪些算是不夠明確：**
- 目標模糊（例如「把這個變更好」）
- 範圍不清楚（例如「修 bugs」- 哪些 bug？全部嗎？哪些檔案？）
- 下游系統需要的輸出格式沒說明
- 成功標準沒定義

**哪些不需要釐清：**
- 範圍明確且可逆的任務
- 已經有前文完整 context 的任務
- 使用者明確要求 agent 自主處理的任務

**題目型態：**
> 「使用者對 agent 說：『更新報告。』agent 開始讀整個目錄的所有報告。45 分鐘、300 次 API 呼叫後，使用者才說他其實只想更新 Q2 報告。這個系統原本應該怎麼設計？」

**正確答案：** orchestrator 應偵測到範圍歧義（沒有時間範圍、沒有篩選條件、沒有輸出格式），並在開始前先問一個釐清問題。

---

### 模式 4：Human-in-the-loop 中斷設計

**核心規則：** 不可逆動作、高風險決策，以及超過閾值的不確定性，都應該觸發 human approval gate。這個 gate 不應該把整條 pipeline 卡死，而是暫停相關分支並清楚呈現給使用者。

**好的 interrupt 應該包含：**
- agent 即將做什麼
- 為什麼要請求批准
- 使用者需要知道哪些資訊才能決定
- 若批准或拒絕，各自會發生什麼

**高風險指標：**
- 刪除資料
- 對外傳訊（email、Slack、第三方 API 呼叫）
- 金融交易或會產生成本的 API 呼叫
- 發佈或部署到 production
- 任何不可逆副作用

**題目型態：**
> 「你的 agent 要清理舊客戶紀錄，找出了 847 筆要刪除。應該怎麼做？」

**正確答案：** 把這 847 筆記錄（或摘要）呈現給使用者，說明將要執行的動作，並等待明確批准後才刪除。

**錯誤答案模式：** 因為任務說要「清理」就直接刪；分批 10 筆刪減少影響但沒先批准；刪完才通知。

---

### 模式 5：Subagent 失敗復原

這類題目測的是你能否設計出能優雅處理局部失敗的 pipeline。

**失敗復原檢查清單：**
- 如果 subagent N 失敗，復原路徑是什麼？（重試、略過、顯示給使用者、停止）
- pipeline 是否具備 idempotent 特性？（重跑時不會產生重複副作用）
- 是否有 checkpoint，可從中途恢復，而不是整條重跑？
- orchestrator 是否記錄了足夠 state 來診斷失敗？

**重試規則：**
- 短暫性失敗適合重試（網路逾時、rate limit）
- 語意性失敗不適合重試（subagent 有回應，但內容錯了）
- 一定要有最大重試次數與指數退避
- 如果延遲會明顯，應把重試狀態告知使用者

**題目型態：**
> 「你的 6 步 pipeline 已完成步驟 1-4。第 5 步（外部 API 呼叫）回傳 503。你目前的設計會重啟整條 pipeline。更好的設計是什麼？」

**正確答案：** 在每一步後加入 checkpoint。儲存中間結果。第 5 步失敗時，從最近的 checkpoint（第 4 步輸出）繼續，而不是從第 1 步重跑。

**錯誤答案模式：** 增加 API timeout；把整條 pipeline 包在 try/catch 裡任何錯誤都重啟；等所有重試都失敗後才通知使用者而不保留中間狀態。

---

### 模式 6：Orchestrator 與 Subagent 的角色清楚分工

**Orchestrator 的責任：**
- 規劃整體任務拆解
- 將子任務分派給 subagent
- 彙整並驗證 subagent 輸出
- 對 pipeline 狀態做最終決策（繼續、暫停、失敗）
- 不直接執行子任務，除非任務極其簡單

**Subagent 的責任：**
- 執行單一、明確定義的子任務
- 將輸出（以及狀態）回報給 orchestrator
- 不做 pipeline 層級決策
- 沒有 orchestrator 指示時，不應自行產生其他 subagent（除非系統設計成階層式多代理）

**常見反模式：**
- Orchestrator 直接呼叫外部 API，而不是交給有工具的 subagent - 破壞職責分離
- Subagent 修改全域 pipeline state - 破壞隔離
- Orchestrator 沒有先驗證 subagent 輸出就往下傳 - 造成垃圾進、垃圾出

**題目型態：**
> 「你的 orchestrator 一邊協調三個 subagent，一邊自己直接執行資料庫查詢。隨著任務複雜度增加，反應時間變慢。架構上要怎麼修？」

**正確答案：** 把資料庫操作抽成專門的資料擷取 subagent。orchestrator 應負責協調，而不是直接執行。

---

## 練習題

**Q1.** 你有一個多代理研究系統。每個 subagent 平行搜尋不同資料來源。某一個 subagent 在特定查詢類型下持續回傳空結果。正確的設計回應是什麼？
- A) 在放棄前先重試這個 subagent 3 次
- B) 把這個 subagent 從會失敗的查詢類型中移除
- C) 在彙總輸出中把涵蓋範圍缺口告知使用者，而不是靜默省略
- D) 只把查詢路由給能正常工作的 subagent

**答案：C** - 透明度優先於靜默失敗。使用者應知道結果是不完整的。

---

**Q2.** 使用者要求你的 agent「把每週報告寄給團隊」。agent 有 email 傳送工具。送出前應該先做什麼？
- A) 直接寄送，因為任務很明確
- B) 先產生報告，再向使用者確認收件人名單和寄送時間後送出
- C) 寄給聯絡人資料庫中所有標記為「team」的地址
- D) 先起草報告與 email，然後等待使用者用另一個命令觸發寄送

**答案：B** - 對外傳訊是不可逆動作；發送前要先確認。

---

**Q3.** 你的 pipeline 依序處理 500 份文件。每處理完一份就寫入資料庫。pipeline 在第 347 份文件時當掉。最低限度的復原設計變更是什麼？
- A) 把整條 pipeline 包在失敗時回滾的 transaction 裡
- B) 為每份已處理文件加上 checkpoint 標記，讓 pipeline 從第 348 份開始繼續
- C) 增加 pipeline timeout
- D) 改成每 50 份一批並在每批上做 retry

**答案：B** - checkpoint 可以讓你在不重跑已完成工作的情況下恢復。

---

## 關鍵詞彙

| 術語 | 定義 |
|---|---|
| Orchestrator | 規劃與協調的 agent，不直接執行領域任務 |
| Subagent | 執行單一被委派任務的 agent |
| Minimal footprint | 只請求任務實際需要的權限與資源 |
| Human-in-the-loop | 在不可逆動作前暫停並等待人類批准的設計閘門 |
| Idempotent pipeline | 可安全重跑而不產生重複副作用的 pipeline |
| Checkpoint | 可讓 pipeline 不必重啟就能續跑的持久化中間狀態 |
| Graceful degradation | 系統局部降級而非全面失敗的行為 |

---

**來源：**
- [Anthropic agentic design documentation](https://docs.anthropic.com/agents)
- [DEV Community：5 domains, 6 scenarios breakdown](https://dev.to/aws-builders/the-claude-certified-architect-exam-5-domains-6-scenarios-and-everything-you-need-to-know-4le3)
- [985/1000 passer on agentic domain difficulty](https://www.reddit.com/r/ClaudeAI/comments/1to0xfc/just_passed_the_new_claude_certified_architect/)
- [843/1000 passer notes](https://www.reddit.com/r/ClaudeAI/comments/1u43exm/passed_the_claude_certified_architect_foundations/)

*這個主題占總分 27%。請按比例分配你的讀書時間。*
