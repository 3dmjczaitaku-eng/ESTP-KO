@AGENTS.md

## プレビューワークフロー (Claude Preview MCP)

コード変更後のリアルタイム確認:
1. `npm run dev` でNext.jsサーバーを起動 (http://localhost:3000)
2. Claude Code内で `mcp__Claude_Preview__preview_start` を呼び出す
3. コード変更後 `mcp__Claude_Preview__preview_screenshot` でスクリーンショット確認
4. JavaScriptの動的テストは `mcp__Claude_Preview__preview_eval` を使用

注: "Claudecord" は存在しないツール名。上記MCPツールを使用すること。
