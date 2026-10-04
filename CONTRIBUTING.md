# 貢獻指南

## 開發環境

```bash
nvm use            # Node 版本見 .nvmrc
npm install
npm run dev        # http://localhost:5173
```

送 PR 前請確認三件事都通過（CI 會跑同樣的指令）：

```bash
npm run lint
npm test
npm run build
```

## Commit 訊息：Conventional Commits

本專案用 [semantic-release](https://semantic-release.gitbook.io/) 自動發版，**版號完全由 commit 訊息決定**，請遵守 [Conventional Commits](https://www.conventionalcommits.org/)：

| 前綴 | 用途 | 版號影響 |
|---|---|---|
| `feat(scope):` | 新功能 | minor（1.x.0） |
| `fix(scope):` | 修 bug | patch（1.0.x） |
| `perf:` | 效能改善 | patch |
| `docs:` `chore:` `refactor:` `test:` `ci:` `style:` | 不影響使用者行為 | 不發版 |
| footer 含 `BREAKING CHANGE:` 或前綴加 `!`（`feat!:`） | 不相容變更 | major（x.0.0） |

scope 建議用 feature 名稱：`products`、`cart`、`discover`、`services`、`app`。

範例：

```
feat(cart): 購物車支援優惠券折抵

fix(services): keyword 比對改為不分大小寫
```

## 發版與部署流程

merge 到 `main` 後 CI 會自動：

1. 跑 lint / test / build
2. 以 semantic-release 計算版號、更新 `CHANGELOG.md`、建立 git tag 與 GitHub Release
3. 把 app 部署到 GitHub Pages

不需要手動改 `package.json` 的 version 或打 tag。

## Issue

請用 issue template 回報。新 issue 會自動帶 `needs-triage` label，分流規則見 `docs/agents/triage-labels.md`。

## 架構約定

- `features/` 之間不互相 import；跨 feature 共用的型別由 `services/` 邊界 re-export
- `pages/` 只做薄組裝，超過 100 行就把邏輯下沉
- 詳細的設計決策見 `README.md` 與 `docs/design.md`
