/**
 * DOM 行为测试：用 jsdom 加载一份模拟 GitHub 页面，验证
 * 1) 常规 UI 文本/属性被翻译
 * 2) README、代码块、仓库名不被污染
 * 3) 动态插入的节点也会被翻译
 * 运行：node test/dom.test.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const here = path.dirname(fileURLToPath(import.meta.url));
const code = fs.readFileSync(path.join(here, '..', 'github-zh.user.js'), 'utf8');

const html = `<!doctype html>
<html lang="en">
<head><title>Issues · octocat/Hello-World</title></head>
<body>
  <header>
    <nav aria-label="Open global navigation menu">
      <a href="/pulls">Pull requests</a>
      <a href="/issues">Issues</a>
    </nav>
    <input placeholder="Search or jump to...">
  </header>
  <main>
    <nav aria-label="Repository tabs">
      <a href="/code">Code</a>
      <a href="/issues">Issues</a>
      <a href="/actions">Actions</a>
      <a href="/settings">Settings</a>
    </nav>
    <h1><a data-hovercard-type="repository" href="/octocat/Hello-World">octocat/Hello-World</a></h1>
    <span title="Nov 20, 2026, 3:04 PM GMT+8">3 days ago</span>
    <button aria-label="Star">Star</button>
    <div class="markdown-body">
      <p>Star this repository with 3 days ago to see Pull requests.</p>
      <pre><code>const open = "Issues";</code></pre>
    </div>
    <div id="mount"></div>
    <p id="raw-en">Totally untranslated sentence here</p>
    <a id="commit-count" href="/octocat/Hello-World/commits/main">1,234 Commits</a>
    <ul>
      <li><a id="dir-settings" href="/octocat/Hello-World/tree/main/settings">settings</a></li>
      <li><a id="file-issues" href="/octocat/Hello-World/blob/main/Issues.md">Issues.md</a></li>
      <li><a id="issue-title" href="/octocat/Hello-World/issues/12">Open</a></li>
      <li><a id="pr-title" href="/octocat/Hello-World/pull/7">Star</a></li>
      <li><a id="filter-assigned" href="/issues/assigned">Assigned to me</a></li>
      <li><a id="filter-updated" href="/issues/recently_updated">Recently updated</a></li>
    </ul>
    <div id="status-dialog" role="dialog" aria-label="Edit status">
      <h2>Edit status</h2>
      <button aria-label="Close">x</button>
      <h3>What&rsquo;s happening</h3>
      <textarea placeholder="What's happening"></textarea>
      <span id="counter-whole">80 characters remaining</span>
      <span id="counter-split"><span>80</span> characters remaining</span>
      <button>On vacation</button>
      <button>Working from home</button>
      <label><input type="checkbox" id="busy"> Busy</label>
      <p id="busy-note">When others mention you, assign you, or request your review, GitHub will let them know that you have limited availability.</p>
      <h3>Expiration</h3>
      <select><option id="opt-never">Never</option><option>4 hours</option></select>
      <p id="exp-note">Your status will be cleared after the selected time.</p>
      <h3>Visible to</h3>
      <select><option id="opt-everyone">Everyone</option></select>
      <p id="vis-note">Limit status visibility to a single organization.</p>
      <button id="btn-clear">Clear status</button>
      <button id="btn-set">Set status</button>
    </div>
  </main>
</body>
</html>`;

const dom = new JSDOM(html, {
  url: 'https://github.com/octocat/Hello-World/issues',
  runScripts: 'dangerously',
  pretendToBeVisual: true
});

const { window } = dom;
const doc = window.document;

// 先抓引用：翻译后 aria-label 会变，选择器会失效
const refs = {
  nav: doc.querySelector('header nav'),
  navLinks: Array.from(doc.querySelectorAll('header nav a')),
  input: doc.querySelector('input'),
  tabLinks: Array.from(doc.querySelectorAll('main nav a')),
  span: doc.querySelector('span'),
  button: doc.querySelector('button'),
  repoLink: doc.querySelector('h1 a'),
  readme: doc.querySelector('.markdown-body p'),
  code: doc.querySelector('.markdown-body code'),
  mount: doc.querySelector('#mount'),
  commitCount: doc.querySelector('#commit-count'),
  dirSettings: doc.querySelector('#dir-settings'),
  fileIssues: doc.querySelector('#file-issues'),
  issueTitle: doc.querySelector('#issue-title'),
  prTitle: doc.querySelector('#pr-title'),
  filterAssigned: doc.querySelector('#filter-assigned'),
  filterUpdated: doc.querySelector('#filter-updated'),
  dialog: doc.querySelector('#status-dialog'),
  dialogTitle: doc.querySelector('#status-dialog h2'),
  dialogTextarea: doc.querySelector('#status-dialog textarea'),
  counterWhole: doc.querySelector('#counter-whole'),
  counterSplit: doc.querySelector('#counter-split'),
  busyLabel: doc.querySelector('#status-dialog label'),
  busyNote: doc.querySelector('#busy-note'),
  optNever: doc.querySelector('#opt-never'),
  expNote: doc.querySelector('#exp-note'),
  optEveryone: doc.querySelector('#opt-everyone'),
  visNote: doc.querySelector('#vis-note'),
  btnClear: doc.querySelector('#btn-clear'),
  btnSet: doc.querySelector('#btn-set')
};

// jsdom 没实现 requestIdleCallback，脚本会退化为 setTimeout
window.eval(code);

const checks = [];
function check(name, actual, expected) {
  checks.push({ name, ok: actual === expected, actual, expected });
}

setTimeout(() => {
  check('全局导航链接 1', refs.navLinks[0].textContent, '拉取请求');
  check('全局导航链接 2', refs.navLinks[1].textContent, '议题');
  check('搜索框 placeholder', refs.input.getAttribute('placeholder'), '搜索或跳转到…');
  check('导航 aria-label', refs.nav.getAttribute('aria-label'), '打开全局导航菜单');
  check('仓库标签页', refs.tabLinks.map((a) => a.textContent).join('/'), '代码/议题/操作/设置');
  check('时间文本', refs.span.textContent, '3 天前');
  check('时间 title', refs.span.getAttribute('title'), '2026年11月20日 15:04 GMT+8');
  check('按钮文本', refs.button.textContent, '星标');
  check('按钮 aria-label', refs.button.getAttribute('aria-label'), '星标');
  check('仓库名保持不变', refs.repoLink.textContent, 'octocat/Hello-World');
  check('README 未被翻译', refs.readme.textContent, 'Star this repository with 3 days ago to see Pull requests.');
  check('代码块未被翻译', refs.code.textContent, 'const open = "Issues";');
  check('页面标题', doc.title, '议题 · octocat/Hello-World');
  check('html lang', doc.documentElement.lang, 'zh-CN');
  check('提交数链接被翻译', refs.commitCount.textContent, '1,234 次提交');
  check('目录名不翻译', refs.dirSettings.textContent, 'settings');
  check('文件名不翻译', refs.fileIssues.textContent, 'Issues.md');
  check('议题标题不翻译', refs.issueTitle.textContent, 'Open');
  check('PR 标题不翻译', refs.prTitle.textContent, 'Star');
  check('筛选链接（/issues/assigned）被翻译', refs.filterAssigned.textContent, '指派给我的');
  check('筛选链接（/issues/recently_updated）被翻译', refs.filterUpdated.textContent, '最近更新');

  // Edit status 弹窗
  check('弹窗 aria-label', refs.dialog.getAttribute('aria-label'), '编辑状态');
  check('弹窗标题', refs.dialogTitle.textContent, '编辑状态');
  check('弹窗 textarea placeholder', refs.dialogTextarea.getAttribute('placeholder'), '正在做什么');
  check('字数提示（整段）', refs.counterWhole.textContent, '还可输入 80 个字符');
  check('字数提示（数字分离）', refs.counterSplit.textContent.trim(), '80 个字符剩余');
  check('快捷状态按钮', refs.dialog.querySelectorAll('button')[1].textContent, '休假中');
  check('Busy 标签', refs.busyLabel.textContent.trim(), '忙碌');
  check(
    'Busy 说明',
    refs.busyNote.textContent,
    '当他人提及你、指派你或请求你评审时，GitHub 会告知他们你当前的可用性有限。'
  );
  check('过期时间选项', refs.optNever.textContent, '永不');
  check('过期说明', refs.expNote.textContent, '到达所选时间后，你的状态将自动清除。');
  check('可见范围选项', refs.optEveryone.textContent, '所有人');
  check('可见范围说明', refs.visNote.textContent, '将状态可见范围限制在单个组织内。');
  check('清除状态按钮', refs.btnClear.textContent, '清除状态');
  check('设置状态按钮', refs.btnSet.textContent, '设置状态');

  // 动态插入（模拟 Turbo 局部刷新）
  refs.mount.innerHTML =
    '<a href="/pulls">Pull requests</a><div class="markdown-body"><p>Open Codespaces</p></div>';

  setTimeout(() => {
    check('动态节点被翻译', refs.mount.querySelector('a').textContent, '拉取请求');
    check('动态插入的用户内容不翻译', refs.mount.querySelector('.markdown-body p').textContent, 'Open Codespaces');

    const auditList = window.__ghzh.audit();
    check('审计能列出未覆盖文案', auditList.includes('Totally untranslated sentence here'), true);
    check('审计不会把已翻译文案算进去', auditList.includes('Issues'), false);

    let failed = 0;
    for (const c of checks) {
      if (!c.ok) failed += 1;
      console.log(`${c.ok ? 'PASS' : 'FAIL'}  ${c.name}${c.ok ? '' : `  实际=${JSON.stringify(c.actual)} 期望=${JSON.stringify(c.expected)}`}`);
    }
    console.log(`\n用例：${checks.length}，失败：${failed}`);
    process.exit(failed === 0 ? 0 : 1);
  }, 150);
}, 200);
