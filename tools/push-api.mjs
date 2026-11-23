#!/usr/bin/env node
/**
 * 走 GitHub REST API 推送，绕开 git 的 HTTPS 通道（某些网络下 push 会被重置）。
 *
 * 用法：
 *   node tools/push-api.mjs "commit message"
 *
 * Token 来源（二选一）：
 *   1. 环境变量 GITHUB_TOKEN
 *   2. 文件 ~/.workbuddy/.secrets/github-zh.token（只读第一行非注释内容）
 *
 * 需要的权限：目标仓库的 Contents: Read and write。
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const OWNER = 'whandwh1';
const REPO = 'github-zh';
const BRANCH = 'main';

const ROOT = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const API = 'https://api.github.com';

function readToken() {
  if (process.env.GITHUB_TOKEN && process.env.GITHUB_TOKEN.trim()) {
    return process.env.GITHUB_TOKEN.trim();
  }
  const file = path.join(os.homedir(), '.workbuddy', '.secrets', 'github-zh.token');
  if (!fs.existsSync(file)) return null;
  const line = fs
    .readFileSync(file, 'utf8')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .find((l) => l && !l.startsWith('#'));
  return line || null;
}

async function api(method, url, body, token) {
  const res = await fetch(API + url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'github-zh-push',
      ...(body ? { 'Content-Type': 'application/json' } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    const msg = data && data.message ? data.message : String(text).slice(0, 200);
    const err = new Error(`${method} ${url} -> ${res.status} ${msg}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

function git(args) {
  return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim();
}

function collectFiles() {
  git(['add', '-A']);
  const list = git(['ls-files']).split(/\r?\n/).filter(Boolean);
  return list
    .filter((rel) => fs.existsSync(path.join(ROOT, rel)))
    .filter((rel) => !rel.startsWith('node_modules/') && !rel.startsWith('.git/'))
    .map((rel) => ({
      path: rel.split(path.sep).join('/'),
      mode: '100644',
      type: 'blob',
      content: fs.readFileSync(path.join(ROOT, rel), 'utf8')
    }));
}

async function main() {
  const message = process.argv[2] || 'chore: update';
  const token = readToken();
  if (!token) {
    console.error('缺少 token。请把 GitHub token 写入：');
    console.error(`  ${path.join(os.homedir(), '.workbuddy', '.secrets', 'github-zh.token')}`);
    console.error('或设置环境变量 GITHUB_TOKEN。');
    process.exit(1);
  }

  const me = await api('GET', '/user', null, token);
  console.log(`token: ${me.login}`);

  let baseCommit = null;
  let baseTree = null;
  try {
    const ref = await api('GET', `/repos/${OWNER}/${REPO}/git/ref/heads/${BRANCH}`, null, token);
    baseCommit = ref.object.sha;
    const commit = await api('GET', `/repos/${OWNER}/${REPO}/git/commits/${baseCommit}`, null, token);
    baseTree = commit.tree.sha;
    console.log(`base: ${baseCommit.slice(0, 7)}`);
  } catch (err) {
    if (err.status !== 409 && err.status !== 404) throw err;
    console.log('base: 空仓库，创建首个提交');
  }

  const files = collectFiles();
  console.log(`files: ${files.length}`);

  const tree = await api('POST', `/repos/${OWNER}/${REPO}/git/trees`, {
    ...(baseTree ? { base_tree: baseTree } : {}),
    tree: files
  }, token);

  const commit = await api('POST', `/repos/${OWNER}/${REPO}/git/commits`, {
    message,
    tree: tree.sha,
    parents: baseCommit ? [baseCommit] : []
  }, token);

  if (baseCommit) {
    await api('PATCH', `/repos/${OWNER}/${REPO}/git/refs/heads/${BRANCH}`, {
      sha: commit.sha,
      force: false
    }, token);
  } else {
    await api('POST', `/repos/${OWNER}/${REPO}/git/refs`, {
      ref: `refs/heads/${BRANCH}`,
      sha: commit.sha
    }, token);
  }

  console.log(`pushed: ${commit.sha.slice(0, 7)}  https://github.com/${OWNER}/${REPO}/commit/${commit.sha}`);

  try {
    git(['fetch', 'origin', '--quiet']);
    git(['reset', '--hard', `origin/${BRANCH}`, '--quiet']);
    console.log('local: 已同步到远端');
  } catch {
    console.log('local: 同步跳过（fetch 失败，不影响远端）');
  }
}

main().catch((err) => {
  console.error('FAILED:', err.message);
  process.exit(1);
});
