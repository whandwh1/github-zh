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
  // 新建仓库页
  ['Choose who can see and commit to this repository', '选择谁可以看到并提交到此仓库'],
  ['Repositories contain a project\'s files and version history.', '仓库包含项目的文件和版本历史。'],
  ['.gitignore tells git which files not to track.', '.gitignore 告诉 Git 哪些文件不需要跟踪。'],
  ['Import a repository', '导入仓库'],
  ['(required)', '（必填）'],
  ['characters', '个字符'],
  // 仓库筛选/排序下拉
  ['Type:', '类型：'],
  ['Sources', '源仓库'],
  ['Can be sponsored', '可接受赞助'],
  ['Recently starred', '最近标星'],
  ['Sort by: Recently starred', '排序：最近标星'],
  // 仓库设置·常规
  ['Allow squash merging', '允许压缩合并'],
  ['Automatically delete head branches', '自动删除头分支'],
  ['Default branch', '默认分支'],
  ['Discussions is the space for your community to have conversations, ask questions and post answers without opening issues.', '讨论是让你的社区无需创建议题即可交流、提问和发布回答的空间。'],
  ['Images should be at least 640\u00d7320px (1280\u00d7640px for best display).', '图片至少应为 640\u00d7320 像素（1280\u00d7640 像素显示效果最佳）。'],
  ['Once you delete a repository, there is no going back. Please be certain.', '仓库一旦删除将无法恢复。请确认无误。'],
  ['Upload an image\u2026', '上传图片\u2026'],
  // 带 owner/repo 的动态标题
  ['0 branch protection rules', '0 条分支保护规则'],
  ['Make whandwh1/github-zh private', '将 whandwh1/github-zh 设为私有'],
  ['Settings: whandwh1/github-zh', '设置：whandwh1/github-zh'],
  // 仓库通知级别（Watch 菜单）
  ['Participating and @mentions', '参与和 @ 提及'],
  ['All Activity', '所有活动'],
  ['Notified of all notifications on this repository.', '接收此仓库的所有通知。'],
  ['Never be notified.', '永不接收通知。'],
  ['Select events you want to be notified of in addition to participating and @mentions.', '选择除参与和 @ 提及之外，你还希望接收通知的事件。'],
  // 代码页 / 代码空间
  ["You don't have any public SSH keys in your GitHub account.", '你的 GitHub 账号中没有任何公开的 SSH 密钥。'],
  [', or try cloning this repository via HTTPS.', '，或改用 HTTPS 克隆此仓库。'],
  ['Clone using the web URL.', '使用网页 URL 克隆。'],
  ['Work fast with our official CLI.', '使用我们的官方 CLI 快速操作。'],
  ['New with options...', '使用选项新建…'],
  ['What are codespaces?', '什么是代码空间？'],
  ['Auto-delete codespace', '自动删除代码空间'],
  // 代码空间空状态
  ['No codespaces', '没有代码空间'],
  ["You don't have any codespaces with this repository checked out", '你还没有检出此仓库的代码空间'],
  ['Create codespace on main', '在 main 上创建代码空间'],
  ['Learn more about codespaces...', '详细了解代码空间…'],
  ['Codespace usage for this repository is paid for by whandwh1.', '此仓库的代码空间用量由 whandwh1 支付。'],
  // 列表弹窗
  ['Add this repository to one or more lists', '将此仓库添加到一个或多个列表'],
  ['Filter lists', '筛选列表'],
  ['No lists yet', '还没有列表'],
  ['Create a list to organize your starred repositories.', '创建列表来整理你已标星的仓库。'],
  // 新建发行版
  ['Publish release', '发布发行版'],
  ['Release notes', '发行说明'],
  ['Generate release notes', '生成发行说明'],
  ['Attach binaries by dropping them here or selecting them.', '拖放到此处或选择文件来附加二进制文件。'],
  ['Tags previously bound to immutable releases can never be reused.', '曾经绑定到不可变发行版的标签永远无法重复使用。'],
  ['Too many assets. Releases are limited to 1000 assets.', '资源过多。每个发行版最多 1000 个资源。'],
  ["We don't support that file type. Try zipping it.", '我们不支持该文件类型。请尝试将其压缩。'],
  ['Saving draft failed. Try again?', '保存草稿失败。要重试吗？'],
  // 关注者计数（用户资料页）
  ['1 follower', '1 位关注者'],
  ['9 followers', '9 位关注者'],
  ['1.2k followers', '1.2k 位关注者'],
  ['2 following', '2 正在关注'],
  // Actions 性能指标
  ['Actions performance metrics', 'Actions 性能指标'],
  ['Avg job queue time', '作业平均排队时间'],
  ['Job failure rate', '作业失败率'],
  ['Community standards', '社区准则'],
  ['Period: Current month', '周期：本月'],
  ['Insights: whandwh1/github-zh', '洞察：whandwh1/github-zh'],
  ['Showing data from 2026/11/1 to', '显示 2026/11/1 至'],
  // 复刻（Fork）页面
  ['Create a new fork', '创建新复刻'],
  ['Create fork', '创建复刻'],
  ['You are creating a fork in your personal account.', '你正在你的个人账户中创建复刻。'],
  ['View existing forks.', '查看现有复刻。'],
  ['Contribute back to', '回馈给'],
  ['Copy the', '仅复制'],
  ['branch only', '分支'],
  ['is available.', '可用。'],
  ['to search', '进行搜索'],
  [
    'is a copy of a repository. Forking a repository allows you to freely experiment with changes without affecting the original project.',
    '是仓库的副本。复刻仓库让你可以自由试验改动，而不影响原项目。'
  ],
  [
    'By default, forks are named the same as their upstream repository. You can customize the name to distinguish it further.',
    '默认情况下，复刻的名称与其上游仓库相同。你可以自定义名称以便进一步区分。'
  ],
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

// 漏翻收集的噪声过滤（用户名 / URL / 文件名 / 快捷键 / 版权行不进 gaps 列表）
const noiseCases = [
  ['SYJun404', true],
  ['whandwh1', true],
  ['alt shift r', true],
  ['www.b...', true],
  ['© 2026 GitHub, Inc.', true],
  ['README.md', true],
  ['package.json', true],
  ['github.com', true],
  ['https://github.com/whandwh1/github-zh', true],
  ['2026', true],
  ['v1.3.16', true],
  ['Showing 3 of 12', false],
  ['learn more', false],
  ['Unwatch', false],
  ['Fork page title', false]
];

let noiseFailed = 0;
for (const [input, expected] of noiseCases) {
  const actual = api.isNoiseGap(input, null);
  const ok = actual === expected;
  if (!ok) noiseFailed += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  noise ${JSON.stringify(input)} -> ${actual}${ok ? '' : `  期望 ${expected}`}`);
}

const totalCases = cases.length + noiseCases.length;
const totalFailed = failed + noiseFailed;
console.log(`用例：${totalCases}，失败：${totalFailed}`);

// 页面标题翻译
setTimeout(() => {
  console.log(`标题：${documentStub.title}`);
  process.exit(totalFailed === 0 ? 0 : 1);
}, 120);
