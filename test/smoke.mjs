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
  // 设置页细分
  ['Theme mode', '主题模式'],
  ['Sync with system', '跟随系统'],
  ['Include private contributions on my profile', '在我的个人主页上包含私有贡献'],
  ['Change your username', '修改用户名'],
  ['Primary email address', '主邮箱地址'],
  ['Keep my email addresses private', '保持我的邮箱地址私密'],
  ['Two-factor authentication', '双重身份验证'],
  ['Recovery codes', '恢复代码'],
  ['Revoke all sessions', '撤销所有会话'],
  ['New SSH key', '新建 SSH 密钥'],
  ['Fine-grained tokens', '细粒度令牌'],
  ['Generate new token (classic)', '生成新令牌（经典）'],
  ['Read and write', '读写'],
  ['Only select repositories', '仅选择的仓库'],
  ['Your name may appear around GitHub where you contribute or are mentioned. You can remove it at any time.',
    '你的姓名会出现在 GitHub 上你贡献或被提及的地方，随时可以移除。'],
  ['Please correct the following errors:', '请修正以下错误：'],
  ['Search settings', '搜索设置'],
  // PR 收件箱
  ['Authored by me', '我创建的'],
  ['Involves me', '与我相关'],
  ['Review requests', '评审请求'],
  ['No saved views', '没有已保存的视图'],
  ['Select repositories', '选择仓库'],
  ['Needs your review', '需要你评审'],
  ["Needs your team's review", '需要你团队评审'],
  ['Waiting for review or checks', '等待评审或检查'],
  ['Ready to merge', '可以合并'],
  ['Updated: Last month', '更新时间：上个月'],
  // 组织仓库页筛选
  ['My contributions', '我的贡献'],
  ['My repositories', '我的仓库'],
  ['My forks', '我的复刻'],
  ['Admin access', '管理权限'],
  // 导入项目页
  ['Import your project to GitHub', '将你的项目导入 GitHub'],
  ['Your source repository details', '源仓库详情'],
  ['Your new repository details', '新仓库详情'],
  ['The URL for your source repository', '源仓库的 URL'],
  ['importing git repositories', '导入 git 仓库'],
  ['Your access token or password for your source repository', '源仓库的访问令牌或密码'],
  ['Required fields are marked with an asterisk (*).', '必填字段用星号（*）标记。'],
  [
    'Support for importing Mercurial, Subversion and Team Foundation Version Control (TFVC) repositories ended on April 12, 2024. For more details, see the changelog.',
    '对 Mercurial、Subversion 和 Team Foundation Version Control（TFVC）仓库的导入支持已于 2024 年 4 月 12 日结束。详情请参阅更新日志。'
  ],
  // 议题看板筛选
  ['Assigned to me', '指派给我的'],
  ['Created by me', '我创建的'],
  ['Mentioning me', '提及我的'],
  ['Recently updated', '最近更新'],
  // 设置页真实文案（来自缺漏报告）
  ['Breadcrumbs', '面包屑导航'],
  ['Dark theme', '深色主题'],
  ['You signed out in another tab or window.', '你在另一个标签页或窗口中退出了登录。'],
  ['Issue types', '议题类型'],
  ['You have no unread notifications', '你没有未读通知'],
  ['4 (Default)', '4（默认）'],
  ['0 keys', '0 个密钥'],
  ['3 GitHub Apps', '3 个 GitHub App'],
  ['0% used', '已用 0%'],
  ['250 characters remaining.', '还可输入 250 个字符。'],
  ['1 verified email configured', '已配置 1 个已验证邮箱'],
  // 仪表盘与 Copilot 应用（来自缺漏报告）
  ['Add files, and spaces', '添加文件和空间'],
  ['An agent-driven desktop experience built natively on GitHub.', '原生构建于 GitHub、由智能体驱动的桌面体验。'],
  ['Balance', '均衡'],
  ['Choose a GitHub Copilot app download', '选择要下载的 GitHub Copilot 应用'],
  ['Dismiss banner', '关闭横幅'],
  ['Download for Windows', '下载 Windows 版'],
  ['No issues found, try a different filter.', '未找到议题，请尝试其他筛选条件。'],
  ['Pin your favorite repositories to your dashboard', '将你常用的仓库固定到仪表盘'],
  ['The GitHub Copilot app, New', 'GitHub Copilot 应用（新）'],
  ['View changelog →', '查看更新日志 →'],
  ['View token usage', '查看令牌用量'],
  // 动态规则：问候语、快捷键序列
  ['Good afternoon, whandwh1!', '下午好，whandwh1！'],
  ['Good morning, octocat!', '早上好，octocat！'],
  ['g then d', 'g 然后 d'],
  // 仪表盘 / 动态 / 通知 / 仓库列表
  ['Optimized for: Balance', '优化目标：均衡'],
  ['Included credits: 0% used', '包含额度：已用 0%'],
  ['Take a break, write some code, do what you do best.', '休息一下，写点代码，做你最擅长的事。'],
  ['All caught up!', '全部处理完了！'],
  ['✋ Mentioned', '✋ 被提及'],
  ['Comfortable display density', '舒适显示密度'],
  ['Sort by Relevance descending', '按相关度降序排序'],
  ['react with thumbs up', '用「赞」回应'],
  ['Windows (ARM)', 'Windows（ARM）'],
  ['macOS (Silicon)', 'macOS（Apple 芯片）'],
  // 动态规则：计数、忽略提示、日期
  ['940 stars in Penty-d/qq-farm-bot-ui', 'Penty-d/qq-farm-bot-ui 有 940 个星标'],
  ['14 people reacted with thumbs up', '14 人用「赞」回应'],
  ['1 person reacted with hooray', '1 人用「欢呼」回应'],
  ['1068 stargazers', '1068 人标星'],
  ['Dismissed a release from chen08209/FlClash. Thank you for the feedback!', '已忽略来自 chen08209/FlClash 的发行版。感谢你的反馈！'],
  ["I'm not interested in published releases from pengchujin", '我对 pengchujin 发布的发行版不感兴趣'],
  ["whandwh1/loonnc's past year of commit activity", 'whandwh1/loonnc 过去一年的提交活动'],
  ['November 22, 2026 07:15', '2026年11月22日 07:15'],
  ['on Dec 1', '于 12 月 1 日'],
  ['6 months', '6 个月'],
  ['3 repositories', '3 个仓库'],
  // PR 收件箱分组：复数所有格
  ["Needs your teams' review", '需要你团队评审'],
  ['Needs your team\u2019s review', '需要你团队评审'],
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
