#!/usr/bin/env bash
# 一键把脚本发布到你的 GitHub，并写好 Tampermonkey 的自动更新地址。
# 用法: bash setup.sh <GitHub 用户名> [仓库名，默认 github-zh]
set -euo pipefail

OWNER="${1:-}"
REPO="${2:-github-zh}"

if [ -z "$OWNER" ]; then
  echo "用法: bash setup.sh <GitHub 用户名> [仓库名，默认 github-zh]"
  echo "例如: bash setup.sh octocat"
  exit 1
fi

cd "$(dirname "$0")"

echo "==> 1/4 写入更新地址：https://github.com/$OWNER/$REPO"
if grep -q "__GH_OWNER__" github-zh.user.js; then
  sed -i "s/__GH_OWNER__/$OWNER/g; s/__GH_REPO__/$REPO/g" github-zh.user.js
elif grep -q "github.com/$OWNER/$REPO" github-zh.user.js; then
  echo "    脚本头部地址已是 $OWNER/$REPO，无需替换"
else
  echo "    警告：脚本头部地址与 $OWNER/$REPO 不一致，请手动检查"
fi

echo "==> 2/4 初始化本地仓库"
if [ ! -d .git ]; then
  git init -b main >/dev/null
fi
git config user.name >/dev/null 2>&1 || git config user.name "$OWNER"
git config user.email >/dev/null 2>&1 || git config user.email "$OWNER@users.noreply.github.com"
BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo main)"

echo "==> 3/4 提交"
git add -A
if git commit -m "feat: GitHub 汉化油猴脚本" >/dev/null 2>&1; then
  echo "    已提交"
else
  echo "    没有变更可提交"
fi

if ! git remote get-url origin >/dev/null 2>&1; then
  git remote add origin "https://github.com/$OWNER/$REPO.git"
fi

echo "==> 4/4 推送"
echo "    若仓库还不存在，先打开 https://github.com/new 新建一个【空的公开】仓库：$REPO"
echo "    不要勾选 Add a README / .gitignore / license，否则首次推送会被拒绝。"
echo
if git push -u origin "$BRANCH"; then
  echo
  echo "推送成功。用下面这个地址安装，之后 Tampermonkey 会自动检查更新："
  echo "  https://raw.githubusercontent.com/$OWNER/$REPO/$BRANCH/github-zh.user.js"
else
  echo
  echo "推送失败。常见原因：仓库未创建、仓库不是空的、或本机未登录 GitHub。"
  echo "登录后重试：git push -u origin $BRANCH"
fi
