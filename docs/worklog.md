# Worklog — Phase 2 實作紀錄

> 每個 Task 完成後記錄：做了什麼、取捨、驗證結果（含 Agent 視覺對照）。

## Task 0 — Scaffold
- Vite 8 + React 19.2 + TS 6 + Tailwind 4（@tailwindcss/vite）；react-router 實裝為 v8（計畫寫 v7，API 相同）；lint 工具為模板預設 oxlint。
- Tailwind `@theme` 定義 `--color-momo: #d4007f`、`--color-price: #e60012`，dev server 視覺確認生效（docs/checks/task0-scaffold.jpeg）。
- 本機 5173 被其他專案佔用，dev server 跑 5174。
