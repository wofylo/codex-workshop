# 主題 2：Claude Code 設定
## 權重：20%｜中偏難｜約 12 題

這個主題常讓考生措手不及，因為細節非常多。不只是知道 CLAUDE.md 存在而已，你還要知道 Claude Code 如何讀取它、設定階層如何運作，以及 hooks 和 skills 如何串接。考試測的是具體機制，而不是泛泛而談。

---

## CLAUDE.md 階層

這是本主題最常考的內容。Claude Code 會讀取三個層級的 CLAUDE.md，考試會故意出現配置在錯誤層級的情境。

### 三個層級

```text
Project Root
└── CLAUDE.md          Level 1: Root（全域專案指示）
    ├── src/
    │   └── CLAUDE.md  Level 2: 子目錄（覆蓋該子樹的 root 規則）
    │       └── components/
    │           └── CLAUDE.md  Level 3: 更深層子目錄（覆蓋父層規則）
    └── tests/
        └── CLAUDE.md  Level 2（不同分支）
```

### 合併與覆蓋規則

- **較低層級會覆蓋較高層級**中相同範圍的衝突指令
- **非衝突指令會累加**：root 指令仍會套用到子目錄，除非被明確覆蓋
- **Claude Code 會讀取路徑上所有適用的 CLAUDE.md**，不是只讀最近的一份
- **使用者層級 CLAUDE.md**（`~/.claude/CLAUDE.md`）會全域生效，且優先權最低；專案層級指令優先

### 題目型態

> 「開發者在 root CLAUDE.md 加了一條規則：『不要修改測試檔。』之後又在 `tests/CLAUDE.md` 加了一條：『你可以新增測試案例。』在 `tests/` 目錄中，新增測試案例時哪條規則生效？」

**正確答案：** `tests/CLAUDE.md` 的規則對該子目錄優先。Claude Code 可以在那裡新增測試案例，儘管 root 說不要修改測試檔。子目錄規則會覆蓋其作用範圍內的 root 規則。

---

## CLAUDE.md 內容結構

一份合格的 CLAUDE.md 通常包含以下區塊（考試會測你是否知道哪些內容放在哪裡）：

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

**不該放在 CLAUDE.md 的內容：**
- 秘密、API keys、憑證
- 應該寫在程式碼註解中的指示（CLAUDE.md 是給 Claude 的行為規則，不是程式文件）
- 程式碼庫裡已經有的重複資訊（Claude 可以直接讀程式碼）

---

## Skills 設定

Skills 會替 Claude Code 增加可重用的指令集。

### Skills 的運作方式

- skill 是一個 markdown 檔，Claude Code 在被呼叫時會把它載入 context
- skills 位於 `~/.claude/skills/`（使用者層級）或 `.claude/skills/`（專案層級）
- 在 Claude Code 介面中以 `/skill-name` 形式呼叫
- skills 可以互相引用（skill chaining）
- skills 具有 `name`、`description`、`allowed-tools` 和 body 內容

### Skill 檔案結構

```markdown
---
name: my-skill
description: What this skill does (used to decide when to invoke it)
allowed-tools: Read, Edit, Bash
---

# Skill Content

Instructions for Claude to follow when this skill is active.
```

### 技能考題情境

考試會測：
- skill 檔在專案層級與使用者層級時，必須放在哪裡
- `description` 欄位的用途（用來匹配自動呼叫，不是顯示文字）
- `allowed-tools` 的限制效果（限制 skill 啟用時 Claude 能呼叫哪些工具）
- skill 與 CLAUDE.md 衝突時如何處理（專案層級 config 由 CLAUDE.md 優先；skill 則在 skill 內部行為上優先）

---

## Hooks 設定

Hooks 是會在 Claude Code 事件發生時自動執行的 shell 指令。

### Hook 事件

| 事件 | 觸發時機 |
|---|---|
| `PreToolUse` | 任何工具呼叫執行前 |
| `PostToolUse` | 工具呼叫完成後 |
| `Notification` | Claude Code 發出通知時 |
| `Stop` | Claude Code 停止時（turn 結束） |
| `SubagentStop` | subagent 完成時 |

### Hook 設定位置

Hooks 可在 `.claude/settings.json`（專案層級）或 `~/.claude/settings.json`（使用者層級）設定：

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

### Hook 行為規則

- Hooks 會在啟動 Claude Code 的 shell 環境中執行
- `PreToolUse` 若以非 0 結束，會**阻止**該工具呼叫執行
- `PostToolUse` 若以非 0 結束，不會撤銷已執行的工具呼叫
- Hooks 無法存取 Claude 的完整 context 或對話，只會收到工具名稱與參數
- Hook 的輸出（stdout / stderr）會顯示在 Claude Code 介面，並回饋進對話 context

### Hooks 題目情境

> 「你想防止 Claude Code 在任何 Bash 命令中執行 `rm -rf`。哪種 hook 設定可以做到？」

**正確答案：** 使用一個 `PreToolUse` hook，匹配 `Bash`，檢查 command 參數是否包含 `rm -rf`，若有則以非 0 code 結束。這樣會在工具執行前阻止它。

> 「你設定一個 `PostToolUse` hook，只要 Claude 寫入受保護檔案就退出 1。Claude 寫入了檔案，會發生什麼？」

**正確答案：** 檔案已經被寫入了（`PostToolUse` 是在工具執行後才觸發）。hook 的退出碼會在對話 context 中產生錯誤，但不會撤銷檔案寫入。要阻止動作要用 `PreToolUse`，不是 `PostToolUse`。

---

## settings.json 結構

這個設定檔會控制 Claude Code 的權限、hooks 和環境變數。

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

### 權限萬用字元模式

- `Bash(npm run *)` - 允許任何 npm run 指令
- `Read(*)` - 允許讀取任何檔案
- `Edit(src/**)` - 允許編輯 src/ 底下任何檔案
- `Bash(*)` - 允許任何 bash 指令（危險，考試會要你辨認這種過度寬鬆設定）

### 優先順序

- `deny` 規則會覆蓋 `allow` 規則
- 專案層級設定會覆蓋使用者層級設定中的衝突規則
- 在同一層級中，更具體的模式優先於更一般的模式

---

## Claude Code 工作流程

考試也會測你對 Claude Code 在開發流程中的使用方式是否熟悉：

### `/` 指令系統

- `/help` - 顯示可用指令與 skills
- `/memory` - 存取與更新 Claude 的 project memory
- `/clear` - 清除對話 context
- `/<skill-name>` - 呼叫 skill
- `/compact` - 壓縮當前對話（摘要並減少 context）

### Claude Code 在 CI/CD 中

考試可能會出現 Claude Code 非互動模式的情境：
- `claude --print` 用於非互動式輸出
- `claude -p "prompt"` 用於一次性執行
- `--output-format json` 讓輸出可供機器解析
- 把輸出 pipe 給其他工具

---

## 練習題

**Q1.** 一個專案的 root CLAUDE.md 寫著「永遠使用 2 個空白縮排」。`frontend/` 子目錄的 CLAUDE.md 寫著「JSX 檔案使用 4 個空白縮排」。開發者正在 `frontend/components/Button.jsx` 工作。哪個縮排規則適用？

- A) 2 個空白（root CLAUDE.md 優先）
- B) 4 個空白（子目錄 CLAUDE.md 優先）
- C) Claude 會問開發者要用哪個
- D) Claude 會用最近修改的 CLAUDE.md

**答案：B** - 子目錄的 CLAUDE.md 會覆蓋其子樹中的 root 規則。

---

**Q2.** 一個 PreToolUse hook 被設定為：當偵測到包含 `DROP TABLE` 的 Bash 指令時退出 1。hook 被觸發後會怎樣？

- A) Bash 指令會執行，之後再回滾
- B) Bash 指令會被阻止執行
- C) Claude 收到錯誤訊息後自動改寫指令並重試
- D) hook 只會記錄嘗試，而 Bash 指令還是會執行

**答案：B** - `PreToolUse` 的非 0 結束會阻止工具呼叫。

---

**Q3.** 你希望一個 skill 能在所有專案中都可用，而不是只有單一專案。skill 檔應放在哪裡？

- A) 每個專案的 `./CLAUDE.md`
- B) `~/.claude/skills/`（使用者層級 skills 目錄）
- C) `.claude/skills/`（專案層級 skills 目錄）
- D) `/etc/claude/skills/`（系統層級）

**答案：B** - 使用者層級 skills 目錄會全域生效。

---

## 關鍵詞彙

| 術語 | 定義 |
|---|---|
| CLAUDE.md | Claude Code 讀取的專案 / 目錄指示檔 |
| Skill | 透過 `/skill-name` 呼叫的可重用指令集 |
| Hook | 在 Claude Code 事件上執行的 shell 指令（PreToolUse、PostToolUse、Stop 等） |
| settings.json | 權限、hooks 與環境變數的設定檔 |
| PreToolUse | 工具執行前觸發的 hook；可阻擋工具 |
| PostToolUse | 工具執行後觸發的 hook；不能撤銷工具效果 |
| allowed-tools | 限制 skill 可使用哪些工具的 frontmatter 欄位 |

---

**來源：**
- [Anthropic Claude Code documentation](https://docs.anthropic.com)
- [Partner Network learning path (Skilljar)](https://anthropic.skilljar.com/page/claude-partner-network-learning-path)
- [Tutorials Dojo CCA-F study guide - Claude Code section](https://tutorialsdojo.com/cca-f-claude-certified-architect-foundations-study-guide/)
- [893/1000 passer on Claude Code domain](https://medium.com/@kishorkukreja/i-passed-anthropics-claude-certified-architect-foundations-exam-with-a-score-of-893-1000-2206c27efd6c)

*這個主題占考試 20%。階層與 hook 機制是最常被測的細節。*
