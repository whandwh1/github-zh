/**
 * 冒烟测试：用最小 DOM 桩在 Node 里加载油猴脚本，检查翻译引擎输出。
 * 运行：node test/smoke.mjs
 */
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const code = fs.readFileSync(path.join(here, '..', 'github-zh.user.js'), 'utf8');

class StubEl {
  constructor(tag = 'DIV') {
    this.nodeType = 1;
    this.tagName = tag;
    this.attrs = Object.create(null);
    this.children = [];
    this.firstChild = null;
    this.parentElement = null;
    this.isConnected = true;
  }
  getAttribute(name) {
    return name in this.attrs ? this.attrs[name] : null;
  }
  setAttribute(name, value) {
    this.attrs[name] = String(value);
  }
  hasAttributes() {
    return Object.keys(this.attrs).length > 0;
  }
  closest() {
    return null;
  }
}

const body = new StubEl('BODY');
const documentStub = {
  documentElement: { lang: '' },
  body,
  title: 'Issues · octocat/Hello-World',
  addEventListener() {},
  createTreeWalker() {}
};
const windowStub = {
  top: null,
  self: null,
  setTimeout,
  addEventListener() {},
  requestIdleCallback: undefined
};
windowStub.top = windowStub;
windowStub.self = windowStub;

const sandbox = {
  window: windowStub,
  document: documentStub,
  localStorage: { getItem: () => null, setItem() {} },
  history: { pushState() {}, replaceState() {} },
  location: { reload() {} },
  MutationObserver: class {
    observe() {}
  },
  Node: { TEXT_NODE: 3, ELEMENT_NODE: 1 },
  setTimeout,
  console
};
sandbox.globalThis = sandbox;

vm.createContext(sandbox);
vm.runInContext(code, sandbox, { filename: 'github-zh.user.js' });

const api = windowStub.__ghzh;
if (!api) {
  console.error('未拿到调试接口 __ghzh，脚本可能提前退出');
  process.exit(1);
}

const cases = [
  ['Issues', '议题'],
  ['Pull requests', '拉取请求'],
  ['Star', '星标'],
  ['open', '打开'],
  ['Settings', '设置'],
  ['3 days ago', '3 天前'],
  ['yesterday', '昨天'],
  ['1,234 commits', '1,234 次提交'],
  ['12 contributors', '12 位贡献者'],
  ['Nov 20, 2026', '2026年11月20日'],
  ['on Nov 5, 2026', '于 2026年11月5日'],
  ['Forked from octocat/Hello-World', '复刻自 octocat/Hello-World'],
  ['This branch is 3 commits ahead of main.', '此分支领先 main 3 个提交。'],
  ['showing 2 changed files with 12 additions and 3 deletions.', '显示 2 个变更文件，新增 12 行，删除 3 行。'],
  ["There aren\u2019t any open issues.", '没有打开的议题。'],
  ['   Open   ', '   打开   '],
  // Edit status 弹窗（用户状态）
  ['Edit status', '编辑状态'],
  ['What\u2019s happening', '正在做什么'],
  ['Busy', '忙碌'],
  ['On vacation', '休假中'],
  ['Out sick', '生病中'],
  ['Working from home', '居家办公'],
  ['Focusing', '专注中'],
  ['80 characters remaining', '还可输入 80 个字符'],
  ['1 character remaining', '还可输入 1 个字符'],
  ['Never', '永不'],
  ['Everyone', '所有人'],
  ['4 hours', '4 小时'],
  ['This week', '本周'],
  ['Set status', '设置状态'],
  ['Clear status', '清除状态'],
  ['Your status will be cleared after the selected time.', '到达所选时间后，你的状态将自动清除。'],
  ['Limit status visibility to a single organization.', '将状态可见范围限制在单个组织内。'],
  [
    'When others mention you, assign you, or request your review, GitHub will let them know that you have limited availability.',
    '当他人提及你、指派你或请求你评审时，GitHub 会告知他们你当前的可用性有限。'
  ],
  // 设置侧栏（新版分组）
  ['Access', '访问权限'],
  ['Billing and licensing', '账单与许可'],
  ['AI usage', 'AI 用量'],
  ['Budgets and alerts', '预算与警报'],
  ['Licensing', '许可'],
  ['Payment information', '付款信息'],
  ['Payment history', '付款历史'],
  ['Additional billing details', '其他账单详情'],
  ['Education benefits', '教育权益'],
  ['Credentials', '凭据'],
  ['Enterprises', '企业'],
  ['Code, planning, and automation', '代码、规划与自动化'],
  ['Planning', '规划'],
  ['Code security', '代码安全'],
  ['Scheduled reminders', '定时提醒'],
  ['Archives', '归档'],
  ['Security log', '安全日志'],
  ['Sponsorship log', '赞助日志'],
  // Copilot 下拉菜单
  ['Ask Copilot...', '询问 Copilot…'],
  ['In immersive chat', '在沉浸式对话中'],
  ['In a space', '在空间中'],
  ['Download for...', '下载适用于…'],
  // 左侧全局导航（新版）
  ['Feed', '动态'],
  ['All issues', '所有议题'],
  ['All pull requests', '所有拉取请求'],
  ['All repositories', '所有仓库'],
  ['MCP registry', 'MCP 注册表'],
  // 仓库菜单与 Agents
  ['Configure', '配置'],
  ['Customize environment', '自定义环境'],
  ['Feedback', '反馈'],
  ['Agents', '智能体'],
  // Security and quality 页面
  ['Security and quality', '安全与质量'],
  ['Findings', '发现项'],
  ['Malware', '恶意软件'],
  ['Vulnerabilities', '漏洞'],
  ['Reporting', '报告'],
  ['Advisories', '安全公告'],
  ['Set up a security policy', '设置安全策略'],
  ['Private vulnerability reporting', '私密漏洞报告'],
  ['Enable vulnerability reporting', '启用漏洞报告'],
  ['Code scanning alerts', '代码扫描警报'],
  ['Needs setup', '需要设置'],
  ['Set up code scanning', '设置代码扫描'],
  ['Secret scanning alerts', '机密扫描警报'],
  ['View detected secrets', '查看检测到的机密'],
  ['View security advisories', '查看安全公告'],
  ['Security policy ·', '安全策略 ·'],
  ['Dependabot alerts\u200b', 'Dependabot 警报'],
  ['Automatically detect common vulnerability and coding errors', '自动检测常见的漏洞和编码错误'],
  ['Get notified when a secret is pushed to this repository', '当有机密被推送到此仓库时收到通知'],
  // 议题看板筛选
  ['Assigned to me', '指派给我的'],
  ['Created by me', '我创建的'],
  ['Mentioning me', '提及我的'],
  ['Recently updated', '最近更新'],
  // 以下应当保持原样（返回 null）
  ['octocat/Hello-World', null],
  ['README.md', null],
  ['already 中文 mixed', null],
  ['', null]
];

let failed = 0;
for (const [input, expected] of cases) {
  const actual = api.translate(input);
  const ok = actual === expected;
  if (!ok) failed += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${JSON.stringify(input)} -> ${JSON.stringify(actual)}${ok ? '' : `  期望 ${JSON.stringify(expected)}`}`);
}

console.log(`\n词库分组：${Object.keys(api.sections).length}，原始词条：${Object.values(api.sections).reduce((n, g) => n + Object.keys(g).length, 0)}，索引后：${api.dict.size}`);
console.log(`用例：${cases.length}，失败：${failed}`);

// 页面标题翻译
setTimeout(() => {
  console.log(`标题：${documentStub.title}`);
  process.exit(failed === 0 ? 0 : 1);
}, 120);
