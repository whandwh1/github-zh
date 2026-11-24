#!/usr/bin/env node
/**
 * 走 GitHub REST API 推送，绕开 git 的 HTTPS 通道（某些网络下 push 会被重置）。
 *
 * 用法：
 *   node tools/push-api.mjs "commit message"
 *   node tools/push-api.mjs --check        # 只探测代理能不能通，不推送
 *
 * Token 来源（二选一）：
 *   1. 环境变量 GITHUB_TOKEN
 *   2. 文件 ~/.workbuddy/.secrets/github-zh.token（只读第一行非注释内容）
 *
 * 代理：按 GHZH_PROXY → HTTPS_PROXY → HTTP_PROXY → 127.0.0.1:7890 的顺序逐个实测，
 * 用第一个真正能连上 api.github.com 的；GHZH_PROXY=none 表示强制直连。
 * （环境变量里的端口是会话级的，可能随会话失效，所以必须实测而不是照抄。）
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

let PROXY = null; // 由 resolveProxy() 探测决定，null 表示直连
let PROXY_OK = false; // 探测是否真的连通（直连成功也算）

/** 代理候选，按优先级去重；显式 none/direct 会直接终止候选列表 */
function proxyCandidates() {
  const raw = [
    process.env.GHZH_PROXY,
    process.env.https_proxy,
    process.env.HTTPS_PROXY,
    process.env.http_proxy,
    process.env.HTTP_PROXY,
    'http://127.0.0.1:7890'
  ];

  const seen = new Set();
  const list = [];

  for (const item of raw) {
    const v = (item || '').trim();
    if (!v) continue;

    if (v.toLowerCase() === 'none' || v.toLowerCase() === 'direct') {
      list.push(null);
      break;
    }

    const url = /^[a-z][\w+.-]*:\/\//i.test(v) ? v : `http://${v}`;
    if (seen.has(url)) continue;
    seen.add(url);
    list.push(url);
  }

  return list;
}

/** 用一次廉价请求判断这个代理（或直连）能不能通 */
function probe(proxy) {
  // Windows 上 curl.exe 不认识 /dev/null（只有 bash 会翻译），要写 NUL
  const sink = process.platform === 'win32' ? 'NUL' : '/dev/null';

  const args = [
    '-sS', '-o', sink, '-m', '8', '--http1.1', '-w', '%{http_code}',
    ...(proxy ? ['-x', proxy] : []),
    `${API}/rate_limit`
  ];

  try {
    const out = execFileSync('curl', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    const code = parseInt(String(out).trim(), 10);
    return Number.isFinite(code) && code > 0;
  } catch {
    return false;
  }
}

/** 逐个候选实测，返回第一个可用的代理地址；都不通则退回直连 */
function resolveProxy() {
  for (const candidate of proxyCandidates()) {
    const label = candidate || '直连';
    if (probe(candidate)) {
      PROXY_OK = true;
      console.log(`proxy: ${label}`);
      return candidate;
    }
    console.log(`proxy: ${label} 不通，试下一个`);
  }

  if (probe(null)) {
    PROXY_OK = true;
    console.log('proxy: 直连可用');
    return null;
  }

  console.log('proxy: 代理和直连都不通，先检查网络 / 代理软件是否在运行');
  return null;
}

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

async function request(method, url, body, token) {
  const args = [
    '-sS', '-m', '60', '--http1.1',
    ...(PROXY ? ['-x', PROXY] : []),
    '-H', 'Expect:',
    '-w', '\\n%{http_code}', '-K', '-'
  ];
  let tmpFile = null;

  if (body) {
    tmpFile = path.join(os.tmpdir(), `ghzh-body-${process.pid}-${Date.now()}.json`);
    fs.writeFileSync(tmpFile, JSON.stringify(body));
    args.push('--data-binary', `@${tmpFile}`);
  }

  const conf = [
    `request = "${method}"`,
    `url = "${API}${url}"`,
    'header = "Authorization: Bearer ' + token + '"',
    'header = "Accept: application/vnd.github+json"',
    'header = "X-GitHub-Api-Version: 2022-11-28"',
    'header = "User-Agent: github-zh-push"',
    ...(body ? ['header = "Content-Type: application/json"'] : [])
  ].join('\n');

  let out;
  try {
    out = execFileSync('curl', args, {
      input: conf,
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024
    });
  } catch (err) {
    const detail = (err.stderr || err.message || '').toString().split('\n').slice(-3).join(' ').trim();
    const netErr = new Error(`curl 失败：${detail || '未知错误'}`);
    throw netErr;
  } finally {
    if (tmpFile) {
      try {
        fs.unlinkSync(tmpFile);
      } catch {}
    }
  }

  const m = /^([\s\S]*)\n(\d{3})$/.exec(out);
  const status = m ? parseInt(m[2], 10) : 0;
  const text = m ? m[1] : out;

  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!status || status >= 400) {
    const msg = data && data.message ? data.message : String(text).slice(0, 200);
    const err = new Error(`${method} ${url} -> ${status} ${msg}`);
    if (status) err.status = status;
    throw err;
  }
  return data;
}

/** 网络抖动（连接被重置 / 超时）自动重试，HTTP 状态错误不重试 */
async function api(method, url, body, token, tries = 5) {
  for (let i = 0; ; i++) {
    try {
      return await request(method, url, body, token);
    } catch (err) {
      const isNetwork = !err.status;
      if (!isNetwork || i >= tries - 1) throw err;
      const wait = Math.min(2000 * Math.pow(2, i), 20000);
      console.warn(`  网络错误（${err.message}），${Math.round(wait / 1000)}s 后重试…`);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
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

  // --check：只探测代理，不推送（没有 token 也能跑）
  if (process.argv.includes('--check')) {
    PROXY = resolveProxy();
    if (!PROXY_OK) console.log('不可用：代理和直连都连不上 api.github.com');
    else console.log(PROXY ? `可以推送（走代理 ${PROXY}）` : '可以推送（直连）');
    return;
  }

  PROXY = resolveProxy();

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
    // 只有远端引用确实指向刚推的提交时才 reset，否则会把工作区退回旧内容
    const remoteHead = git(['rev-parse', `origin/${BRANCH}`]);
    if (remoteHead !== commit.sha) {
      throw new Error(`origin/${BRANCH} = ${remoteHead.slice(0, 7)}，与刚推的 ${commit.sha.slice(0, 7)} 不一致`);
    }
    git(['reset', '--hard', `origin/${BRANCH}`, '--quiet']);
    console.log('local: 已同步到远端');
  } catch (err) {
    console.log(`local: 未同步（${err.message}），远端已更新，请勿手动 reset --hard origin/main`);
  }
}

main().catch((err) => {
  console.error('FAILED:', err.message);
  process.exit(1);
});
