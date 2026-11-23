// ==UserScript==
// @name         GitHub 汉化 · 中文化插件
// @name:en      GitHub Chinese Localization
// @namespace    https://github.com/gh-zh-unofficial
// @version      1.3.6
// @description  把 GitHub 界面翻译成简体中文：全局导航、仓库、代码浏览、议题、拉取请求、讨论、Actions、设置、通知、搜索等，支持 Turbo 局部刷新与动态渲染。
// @description:en  Translate GitHub UI into Simplified Chinese, with Turbo / SPA navigation support.
// @author       WorkBuddy
// @homepageURL  https://github.com/whandwh1/github-zh
// @supportURL   https://github.com/whandwh1/github-zh/issues
// @match        https://github.com/*
// @match        https://gist.github.com/*
// @icon         https://github.githubassets.com/favicons/favicon.svg
// @updateURL    https://raw.githubusercontent.com/whandwh1/github-zh/main/github-zh.user.js
// @downloadURL  https://raw.githubusercontent.com/whandwh1/github-zh/main/github-zh.user.js
// @run-at       document-idle
// @grant        GM_registerMenuCommand
// @grant        GM_setClipboard
// @license      MIT
// ==/UserScript==

(function () {
  'use strict';

  // 只在顶层窗口运行，避免 iframe 内重复翻译
  if (window.top !== window.self) return;

  /* ============================================================
   * 0. 基础配置
   * ============================================================ */

  const STORE_KEY = 'ghzh:enabled';
  const GAP_KEY = 'ghzh:gaps'; // 跨页面累计的「未覆盖文案」
  const CJK_RE = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\u3040-\u30ff]/;
  const MAX_LEN = 200; // 超过这个长度的文本多半是用户内容，不翻译

  function readFlag() {
    try {
      const v = localStorage.getItem(STORE_KEY);
      return v === null ? true : v === '1';
    } catch (err) {
      return true;
    }
  }

  function writeFlag(v) {
    try {
      localStorage.setItem(STORE_KEY, v ? '1' : '0');
    } catch (err) {
      /* ignore */
    }
  }

  const enabled = readFlag();

  /* ============================================================
   * 1. 词库（按页面区域分组，想加词直接往对应组里加一行即可）
   * ============================================================ */

  const DICT_SECTIONS = {
    /* ---------- 1.1 全局导航 / 页脚 ---------- */
    '全局导航': {
      'Dashboard': '仪表盘',
      'Pull requests': '拉取请求',
      'Issues': '议题',
      'Codespaces': '代码空间',
      'Marketplace': '市场',
      'Explore': '探索',
      'Notifications': '通知',
      'Settings': '设置',
      'Sign in': '登录',
      'Sign up': '注册',
      'Sign out': '退出登录',
      'Search or jump to...': '搜索或跳转到…',
      'Search or jump to…': '搜索或跳转到…',
      'Type / to search': '按 / 搜索',
      'Search GitHub': '搜索 GitHub',
      'New repository': '新建仓库',
      'New gist': '新建代码片段',
      'New organization': '新建组织',
      'Import repository': '导入仓库',
      'Your profile': '你的个人主页',
      'Your repositories': '你的仓库',
      'Your organizations': '你的组织',
      'Your projects': '你的项目',
      'Your stars': '你的星标',
      'Your gists': '你的代码片段',
      'Your sponsors': '你的赞助者',
      'Upgrade': '升级',
      'Feature preview': '功能预览',
      'Help': '帮助',
      'Community': '社区',
      'Documentation': '文档',
      'Support': '支持',
      'Contact GitHub': '联系 GitHub',
      'Open Source': '开源',
      'Enterprise': '企业版',
      'Pricing': '定价',
      'Product': '产品',
      'Solutions': '解决方案',
      'Resources': '资源',
      'Team': '团队',
      'Blog': '博客',
      'About': '关于',
      'Careers': '招贤纳士',
      'Security': '安全',
      'Privacy': '隐私',
      'Terms': '条款',
      'Status': '状态',
      'Docs': '文档',
      'Contact': '联系',
      'Manage cookies': '管理 Cookie',
      'Do not share my personal information': '不要共享我的个人信息',
      'Skip to content': '跳到内容',
      'Skip to main content': '跳到主要内容',
      'Open global navigation menu': '打开全局导航菜单',
      'Close menu': '关闭菜单',
      'Toggle navigation': '切换导航',
      'Global navigation menu': '全局导航菜单',
      'Home': '首页',
      'Back to GitHub': '返回 GitHub',
      'Go back': '返回',
      'Go to dashboard': '转到仪表盘',
      'Feed': '动态',
      'All issues': '所有议题',
      'All pull requests': '所有拉取请求',
      'All repositories': '所有仓库',
      'MCP registry': 'MCP 注册表'
    },

    /* ---------- 1.2 通用动作 / 状态 ---------- */
    '通用动作': {
      'Add': '添加',
      'Remove': '移除',
      'Delete': '删除',
      'Edit': '编辑',
      'Save': '保存',
      'Save changes': '保存更改',
      'Cancel': '取消',
      'Close': '关闭',
      'Reopen': '重新打开',
      'Open': '打开',
      'Closed': '已关闭',
      'Submit': '提交',
      'Confirm': '确认',
      'Continue': '继续',
      'Back': '返回',
      'Next': '下一步',
      'Previous': '上一步',
      'Done': '已完成',
      'Apply': '应用',
      'Reset': '重置',
      'Clear': '清除',
      'Copy': '复制',
      'Copied!': '已复制！',
      'Copied to clipboard!': '已复制到剪贴板！',
      'Copy link': '复制链接',
      'Copy path': '复制路径',
      'Copy permalink': '复制永久链接',
      'Copy to clipboard': '复制到剪贴板',
      'Copy code': '复制代码',
      'Copy code to clipboard': '复制代码到剪贴板',
      'Download': '下载',
      'Upload': '上传',
      'Search': '搜索',
      'Filter': '筛选',
      'Filters': '筛选器',
      'Clear filter': '清除筛选',
      'Sort': '排序',
      'Refresh': '刷新',
      'Retry': '重试',
      'Loading': '加载中',
      'Loading...': '加载中…',
      'Load more': '加载更多',
      'Show more': '显示更多',
      'Show less': '收起',
      'View all': '查看全部',
      'See all': '查看全部',
      'Learn more': '了解更多',
      'Read more': '阅读更多',
      'Expand': '展开',
      'Collapse': '收起',
      'Expand all': '全部展开',
      'Collapse all': '全部折叠',
      'Hide': '隐藏',
      'Show': '显示',
      'Preview': '预览',
      'Write': '编写',
      'Comment': '评论',
      'Reply': '回复',
      'Quote reply': '引用回复',
      'Report': '举报',
      'Configure': '配置',
      'Feedback': '反馈',
      'Report content': '举报内容',
      'Block': '屏蔽',
      'Unblock': '取消屏蔽',
      'Block or Report': '屏蔽或举报',
      'Edit comment': '编辑评论',
      'Delete comment': '删除评论',
      'Subscribe': '订阅',
      'Unsubscribe': '取消订阅',
      'Unwatch': '取消关注',
      'Watch': '关注',
      'Star': '星标',
      'Unstar': '取消星标',
      'Starred': '已星标',
      'Fork': '复刻',
      'Follow': '关注',
      'Unfollow': '取消关注',
      'Following': '正在关注',
      'Sponsor': '赞助',
      'Required': '必填',
      'Optional': '可选',
      'Public': '公开',
      'Private': '私有',
      'Default': '默认',
      'Enabled': '已启用',
      'Disabled': '已禁用',
      'Active': '活跃',
      'Inactive': '未激活',
      'Yes': '是',
      'No': '否',
      'Beta': '测试版',
      'New': '新',
      'Updated': '已更新',
      'Archived': '已归档',
      'Template': '模板',
      'Public archive': '公开归档',
      'Private archive': '私有归档',
      'Public template': '公开模板'
    },

    /* ---------- 1.3 仓库首页 / 标签页 ---------- */
    '仓库': {
      'Code': '代码',
      'Actions': '操作',
      'Projects': '项目',
      'Wiki': '维基',
      'Insights': '洞察',
      'Agents': '智能体',
      'Discussions': '讨论',
      'Packages': '包',
      'Releases': '发行版',
      'Contributors': '贡献者',
      'Languages': '语言',
      'Activity': '活动',
      'Custom properties': '自定义属性',
      'My contributions': '我的贡献',
      'My repositories': '我的仓库',
      'My forks': '我的复刻',
      'Admin access': '管理权限',
      'Customize environment': '自定义环境',
      'Report repository': '举报仓库',
      'Edit repository details': '编辑仓库详情',
      'Edit repository metadata': '编辑仓库元数据',
      'Go to file': '转到文件',
      'Add file': '添加文件',
      'Create new file': '新建文件',
      'Upload files': '上传文件',
      'Find file': '查找文件',
      'Clone': '克隆',
      'Download ZIP': '下载 ZIP',
      'Open with GitHub Desktop': '使用 GitHub Desktop 打开',
      'Local': '本地',
      'Copy url to clipboard': '复制 URL 到剪贴板',
      'Branch': '分支',
      'Branches': '分支',
      'Tags': '标签',
      'Switch branches/tags': '切换分支/标签',
      'Find or create a branch...': '查找或创建分支…',
      'View all branches': '查看所有分支',
      'View all tags': '查看所有标签',
      'Latest commit': '最新提交',
      'History': '历史',
      'Commit history': '提交历史',
      'Folders and files': '文件夹和文件',
      'Name': '名称',
      'Last commit message': '最后提交信息',
      'Last commit date': '最后提交日期',
      'Parent directory': '上级目录',
      'Raw': '原始文件',
      'Blame': '追溯',
      'View file': '查看文件',
      'Edit this file': '编辑此文件',
      'Delete this file': '删除此文件',
      'Download file': '下载文件',
      'Open in github.dev': '在 github.dev 中打开',
      'Open in Codespaces': '在代码空间中打开',
      'More file actions': '更多文件操作',
      'Used by': '被使用',
      'Dependents': '依赖项',
      'Readme': '自述文件',
      'License': '许可证',
      'MIT license': 'MIT 许可证',
      'Apache-2.0 license': 'Apache-2.0 许可证',
      'GPL-3.0 license': 'GPL-3.0 许可证',
      'AGPL-3.0 license': 'AGPL-3.0 许可证',
      'BSD-3-Clause license': 'BSD-3-Clause 许可证',
      'LGPL-3.0 license': 'LGPL-3.0 许可证',
      'Mozilla Public License 2.0': 'Mozilla 公共许可证 2.0',
      'Code of conduct': '行为准则',
      'Contributing': '贡献指南',
      'Security policy': '安全策略',
      'Stars': '星标',
      'Watchers': '关注者',
      'Forks': '复刻',
      'Topics': '主题',
      'No description, website, or topics provided.': '未提供描述、网站或主题。',
      'Suggest new description': '建议新描述',
      'No releases published': '尚未发布发行版',
      'Create a new release': '创建新的发行版',
      'No packages published': '尚未发布包',
      'Publish your first package': '发布你的第一个包',
      'No contributors': '暂无贡献者',
      'This repository is empty.': '此仓库为空。',
      'No commits yet': '还没有提交',
      'Nothing to show': '没有可显示的内容',
      'No results found': '未找到结果',
      'No results matched your search.': '没有匹配的搜索结果。',
      'Oops!': '糟糕！',
      'Page not found': '页面未找到',
      'Take me home': '带我回首页',
      'Archived': '已归档',
      'This repository has been archived by the owner on': '此仓库已被所有者归档于'
    },

    /* ---------- 1.4 代码浏览 / 差异 ---------- */
    '代码浏览': {
      'Symbols': '符号',
      'Outline': '大纲',
      'Code navigation': '代码导航',
      'No symbols found': '未找到符号',
      'Binary file not shown.': '未显示二进制文件。',
      'Empty file.': '空文件。',
      'This file has been truncated.': '此文件已被截断。',
      'Show original': '显示原始内容',
      'Hide whitespace': '隐藏空白',
      'Show whitespace': '显示空白',
      'Split': '拆分',
      'Unified': '统一',
      'Diff view': '差异视图',
      'Jump to file': '跳转到文件',
      'Load diff': '加载差异',
      'Large diffs are not rendered by default.': '较大的差异默认不渲染。',
      'Show file tree': '显示文件树',
      'Hide file tree': '隐藏文件树',
      'Viewed': '已查看',
      'Viewed files': '已查看的文件',
      'Changes from all commits': '所有提交的变更',
      'Show options': '显示选项',
      'Select commit': '选择提交',
      'Add single comment': '添加单条评论',
      'Start a review': '开始评审',
      'Add review comment': '添加评审评论',
      'Resolve conversation': '解决对话',
      'Unresolve conversation': '取消解决',
      'Show resolved': '显示已解决',
      'Hide resolved': '隐藏已解决',
      'Mark as resolved': '标记为已解决',
      'Outdated': '已过时',
      'Hide comment': '隐藏评论',
      'Unhide comment': '取消隐藏评论',
      'Minimize': '折叠',
      'Unminimize': '展开'
    },

    /* ---------- 1.5 提交与历史 ---------- */
    '提交': {
      'Commit': '提交',
      'Commits': '提交',
      'Browse files': '浏览文件',
      'authored': '作者',
      'committed': '提交者',
      'parent': '父提交',
      '1 parent': '1 个父提交',
      '2 parents': '2 个父提交',
      'Verified': '已验证',
      'Unverified': '未验证',
      'Partially verified': '部分验证',
      'Go to commit': '转到提交',
      'View commit details': '查看提交详情',
      'Copy the full SHA': '复制完整 SHA',
      'Copy the full SHA1': '复制完整 SHA1',
      'Browse repository at this point in history': '浏览此时间点的仓库',
      'This commit does not belong to any branch on this repository, and may belong to a fork outside of the repository.':
        '此提交不属于此仓库的任何分支，可能属于仓库外的一个复刻。'
    },

    /* ---------- 1.6 议题 ---------- */
    '议题': {
      'New issue': '新建议题',
      'Create issue': '创建议题',
      'Labels': '标签',
      'Milestones': '里程碑',
      'Milestone': '里程碑',
      'Assignee': '指派给',
      'Assignees': '指派给',
      'No one assigned': '未指派',
      'No milestone': '无里程碑',
      'No labels': '无标签',
      'Author': '作者',
      'Assigned to me': '指派给我的',
      'Created by me': '我创建的',
      'Mentioning me': '提及我的',
      'Newest': '最新',
      'Oldest': '最早',
      'Most commented': '评论最多',
      'Least commented': '评论最少',
      'Recently updated': '最近更新',
      'Least recently updated': '最久未更新',
      'Best match': '最佳匹配',
      'Search all issues': '搜索所有议题',
      'Search all pull requests': '搜索所有拉取请求',
      'Welcome to issues!': '欢迎使用议题！',
      "Issues are used to track todos, bugs, feature requests, and more.":
        '议题用于跟踪待办事项、缺陷、功能请求等。',
      "ProTip!": '小提示！',
      'Close issue': '关闭议题',
      'Reopen issue': '重新打开议题',
      'Close with comment': '评论并关闭',
      'Close and comment': '关闭并评论',
      'Comment on this issue': '评论此议题',
      'Reference in new issue': '在新议题中引用',
      'Transfer issue': '转移议题',
      'Lock conversation': '锁定对话',
      'Unlock conversation': '解锁对话',
      'Pin issue': '置顶议题',
      'Unpin issue': '取消置顶议题',
      'Development': '开发',
      'Linked pull requests': '关联的拉取请求',
      'Successfully merging a pull request may close this issue.':
        '成功合并拉取请求后，可能会关闭此议题。',
      "There aren't any open issues.": '没有打开的议题。',
      "There aren't any closed issues.": '没有已关闭的议题。',
      "There aren't any open pull requests.": '没有打开的拉取请求。',
      "There aren't any closed pull requests.": '没有已关闭的拉取请求。',
      "There aren't any releases here": '这里还没有发行版',
      'Timeline': '时间线',
      'Comments': '评论',
      'No description provided.': '未提供描述。',
      'Add a description': '添加描述'
    },

    /* ---------- 1.7 拉取请求 ---------- */
    '拉取请求': {
      'New pull request': '新建拉取请求',
      'Compare & pull request': '比较并创建拉取请求',
      'Create pull request': '创建拉取请求',
      'Conversation': '对话',
      'Checks': '检查',
      'Files changed': '文件变更',
      'Merge pull request': '合并拉取请求',
      'Confirm merge': '确认合并',
      'Confirm squash and merge': '确认压缩并合并',
      'Confirm rebase and merge': '确认变基并合并',
      'Squash and merge': '压缩并合并',
      'Rebase and merge': '变基并合并',
      'Create a merge commit': '创建合并提交',
      'Update branch': '更新分支',
      'Delete branch': '删除分支',
      'Restore branch': '恢复分支',
      'Reviewers': '评审者',
      'Review required': '需要评审',
      'Approved': '已批准',
      'Changes requested': '已请求更改',
      'Draft': '草稿',
      'Ready for review': '准备评审',
      'Convert to draft': '转为草稿',
      'Approve': '批准',
      'Request changes': '请求更改',
      'Finish your review': '完成你的评审',
      'Submit review': '提交评审',
      'Review changes': '评审变更',
      'Add a comment': '添加评论',
      'Leave a comment': '留下评论',
      'Merged': '已合并',
      'All checks have passed': '所有检查已通过',
      'Some checks were not successful': '部分检查未通过',
      'Show all checks': '显示所有检查',
      'Details': '详情',
      'This branch has no conflicts with the base branch': '此分支与基础分支没有冲突',
      'Merging can be performed automatically.': '可以自动完成合并。',
      'Participants': '参与者',
      'Customize': '自定义',
      'Reviewers': '评审者',
      'Compare changes': '比较变更',
      'base': '基础分支',
      'compare': '对比分支',
      'Choose different branches': '选择不同的分支',
      'Able to merge.': '可以合并。',
      'These branches can be automatically merged.': '这些分支可以自动合并。',
      'Authored by me': '我创建的',
      'Involves me': '与我相关',
      'Review requests': '评审请求',
      'Views': '视图',
      'No saved views': '没有已保存的视图',
      'Select repositories': '选择仓库',
      'Needs your review': '需要你评审',
      "Needs your team's review": '需要你团队评审',
      'Your drafts': '你的草稿',
      'Waiting for review or checks': '等待评审或检查',
      'Needs action': '需要处理',
      'Ready to merge': '可以合并'
    },

    /* ---------- 1.8 讨论 ---------- */
    '讨论': {
      'New discussion': '新建讨论',
      'Categories': '分类',
      'Announcements': '公告',
      'General': '综合',
      'Ideas': '想法',
      'Polls': '投票',
      'Q&A': '问答',
      'Show and tell': '展示分享',
      'Answered': '已解答',
      'Unanswered': '未解答',
      'Upvote': '赞同',
      'Upvoted': '已赞同',
      'Mark as answer': '标记为答案',
      'Unmark as answer': '取消标记为答案'
    },

    /* ---------- 1.9 Actions ---------- */
    'Actions': {
      'Workflows': '工作流',
      'All workflows': '所有工作流',
      'Run workflow': '运行工作流',
      'Re-run jobs': '重新运行作业',
      'Re-run all jobs': '重新运行所有作业',
      'Re-run failed jobs': '重新运行失败的作业',
      'Cancel workflow': '取消工作流',
      'Summary': '摘要',
      'Artifacts': '产物',
      'Jobs': '作业',
      'Usage': '用量',
      'Workflow runs': '工作流运行',
      'Filter workflow runs': '筛选工作流运行',
      'Success': '成功',
      'Failure': '失败',
      'Queued': '排队中',
      'In progress': '进行中',
      'Cancelled': '已取消',
      'Skipped': '已跳过',
      'Completed': '已完成',
      'Started': '已开始',
      'Waiting': '等待中'
    },

    /* ---------- 1.10 个人主页 ---------- */
    '个人主页': {
      'Overview': '概览',
      'Repositories': '仓库',
      'Stars': '星标',
      'Sponsors': '赞助者',
      'Followers': '关注者',
      'Following': '正在关注',
      'Follow': '关注',
      'Unfollow': '取消关注',
      'Edit profile': '编辑个人资料',
      'Achievements': '成就',
      'Organizations': '组织',
      'Contribution activity': '贡献活动',
      'Contribution settings': '贡献设置',
      'contributions in the last year': '过去一年的贡献',
      'Contribution graph': '贡献图',
      'Activity overview': '活动概览',
      'Popular repositories': '热门仓库',
      'Pinned': '置顶',
      'Starred repositories': '星标仓库',
      'Joined': '加入于',
      'Highlights': '亮点',
      'Less': '少',
      'More': '多',
      'Learn how we count contributions': '了解我们如何统计贡献',
      'Block or Report': '屏蔽或举报',
      'Report abuse': '举报滥用',
      'Achievements': '成就'
    },

    /* ---------- 1.11 设置 ---------- */
    '设置': {
      'Public profile': '公开资料',
      'Account': '账户',
      'Appearance': '外观',
      'Accessibility': '无障碍',
      'Billing and plans': '账单与套餐',
      'Emails': '电子邮件',
      'Password and authentication': '密码与身份验证',
      'Sessions': '会话',
      'SSH and GPG keys': 'SSH 与 GPG 密钥',
      'Applications': '应用',
      'Developer settings': '开发者设置',
      'Moderation': '内容管理',
      'Integrations': '集成',
      'Saved replies': '已保存的回复',
      'Danger zone': '危险区域',
      'Preferences': '偏好设置',
      'Theme': '主题',
      'Tab size preference': '制表符宽度',
      'Update profile': '更新个人资料',
      'Profile picture': '头像',
      'Public email': '公开邮箱',
      'Bio': '个人简介',
      'Website': '网站',
      'Social accounts': '社交账号',
      'Company': '公司',
      'Location': '位置',
      'Change repository visibility': '更改仓库可见性',
      'Transfer ownership': '转移所有权',
      'Delete this repository': '删除此仓库',
      'Archive this repository': '归档此仓库',
      'Unarchive this repository': '取消归档此仓库',
      'Secrets and variables': '机密与变量',
      'Security overview': '安全概览',
      'Dependabot alerts': 'Dependabot 警报',
      'Code scanning': '代码扫描',
      'Secret scanning': '机密扫描',
      'Security advisories': '安全公告',
      'Pulse': '脉搏',
      'Graphs': '图表',
      'Network': '网络',
      'Traffic': '流量',
      'Code frequency': '代码频率',
      'Dependency graph': '依赖关系图',
      'Access': '访问权限',
      'Billing and licensing': '账单与许可',
      'AI usage': 'AI 用量',
      'Budgets and alerts': '预算与警报',
      'Licensing': '许可',
      'Payment information': '付款信息',
      'Payment history': '付款历史',
      'Additional billing details': '其他账单详情',
      'Education benefits': '教育权益',
      'Credentials': '凭据',
      'Enterprises': '企业',
      'Code, planning, and automation': '代码、规划与自动化',
      'Planning': '规划',
      'Code security': '代码安全',
      'Scheduled reminders': '定时提醒',
      'Archives': '归档',
      'Security log': '安全日志',
      'Sponsorship log': '赞助日志'
    },

    /* ---------- 1.12 安全与质量 ---------- */
    '安全与质量': {
      'Security and quality': '安全与质量',
      'Findings': '发现项',
      'Malware': '恶意软件',
      'Vulnerabilities': '漏洞',
      'Reporting': '报告',
      'Advisories': '安全公告',
      'Set up a security policy': '设置安全策略',
      'Define how users should report security vulnerabilities for this repository': '定义用户应如何报告此仓库的安全漏洞',
      'View security advisories': '查看安全公告',
      'View or disclose security advisories for this repository': '查看或披露此仓库的安全公告',
      'Private vulnerability reporting': '私密漏洞报告',
      'Allow users to privately report potential security vulnerabilities': '允许用户私下报告潜在的安全漏洞',
      'Enable vulnerability reporting': '启用漏洞报告',
      'Get notified when one of your dependencies has a vulnerability': '当你的某个依赖存在漏洞时收到通知',
      'Enable Dependabot alerts': '启用 Dependabot 警报',
      'Code scanning alerts': '代码扫描警报',
      'Needs setup': '需要设置',
      'Automatically detect common vulnerability and coding errors': '自动检测常见的漏洞和编码错误',
      'Set up code scanning': '设置代码扫描',
      'Secret scanning alerts': '机密扫描警报',
      'Get notified when a secret is pushed to this repository': '当有机密被推送到此仓库时收到通知',
      'View detected secrets': '查看检测到的机密'
    },

    /* ---------- 1.13 通知 ---------- */
    '通知': {
      'Inbox': '收件箱',
      'Saved': '已保存',
      'Unread': '未读',
      'All': '全部',
      'Participating': '参与中',
      'Mentioned': '被提及',
      'Assigned': '已指派',
      'Review requested': '请求评审',
      'Mark as read': '标记为已读',
      'Mark as done': '标记为完成',
      'Mark all as read': '全部标记为已读',
      'Mark all as done': '全部标记为完成',
      "You're all caught up!": '你已全部处理完毕！',
      'No unread notifications': '没有未读通知',
      'Done': '已完成'
    },

    /* ---------- 1.13 搜索 ---------- */
    '搜索': {
      'Repositories': '仓库',
      'Users': '用户',
      'Commits': '提交',
      'Wikis': '维基',
      'Advanced search': '高级搜索',
      'Sort by': '排序方式',
      'Most stars': '星标最多',
      'Fewest stars': '星标最少',
      'Most forks': '复刻最多',
      'Fewest forks': '复刻最少',
      'Search syntax tips': '搜索语法提示',
      'Saved searches': '已保存的搜索',
      'results': '个结果',
      'Filter by': '筛选条件'
    },

    /* ---------- 1.14 表单 / 新建仓库 ---------- */
    '表单': {
      'Create a new repository': '创建新仓库',
      'Repository name': '仓库名称',
      'Description': '描述',
      'Description (optional)': '描述（可选）',
      'Initialize this repository with:': '初始化此仓库：',
      'Add a README file': '添加 README 文件',
      'Add .gitignore': '添加 .gitignore',
      'Choose a license': '选择许可证',
      'Create repository': '创建仓库',
      'Owner': '所有者',
      'Repository': '仓库',
      'Visibility': '可见性',
      'Create': '创建',
      'Delete repository': '删除仓库',
      'Add a title': '添加标题',
      'Import your project to GitHub': '将你的项目导入 GitHub',
      'Import all the files, including revision history, from another version control system.':
        '从其他版本控制系统导入所有文件，包括修订历史。',
      'Required fields are marked with an asterisk (*).': '必填字段用星号（*）标记。',
      'Support for importing Mercurial, Subversion and Team Foundation Version Control (TFVC) repositories ended on April 12, 2024. For more details, see the changelog.':
        '对 Mercurial、Subversion 和 Team Foundation Version Control（TFVC）仓库的导入支持已于 2024 年 4 月 12 日结束。详情请参阅更新日志。',
      'Support for importing Mercurial, Subversion and Team Foundation Version Control (TFVC) repositories ended on April 12, 2024. For more details, see the':
        '对 Mercurial、Subversion 和 Team Foundation Version Control（TFVC）仓库的导入支持已于 2024 年 4 月 12 日结束。详情请参阅',
      'Your source repository details': '源仓库详情',
      'The URL for your source repository': '源仓库的 URL',
      'The URL for your source repository *': '源仓库的 URL *',
      'Learn more about': '详细了解',
      'importing git repositories': '导入 git 仓库',
      'Please enter your credentials if required for cloning your remote repository.':
        '如果克隆远程仓库需要凭据，请在此填写。',
      'Your username for your source repository': '源仓库的用户名',
      'Your access token or password for your source repository': '源仓库的访问令牌或密码',
      'Your new repository details': '新仓库详情',
      'changelog': '更新日志',
      'Add a description': '添加描述',
      'Write a comment': '写下评论',
      'Leave a comment': '留下评论',
      'Gist description...': '代码片段描述…',
      'Filename including extension...': '文件名（含扩展名）…',
      'Create secret gist': '创建私密代码片段',
      'Create public gist': '创建公开代码片段',
      'Create gist': '创建代码片段',
      'Secret': '私密',
      'Revisions': '修订'
    },

    /* ---------- 1.15 用户状态（Edit status 弹窗） ---------- */
    '用户状态': {
      'Edit status': '编辑状态',
      'Set status': '设置状态',
      'Clear status': '清除状态',
      'Set a status': '设置状态',
      'Add a status': '添加状态',
      'Clear your status': '清除你的状态',
      "What's happening": '正在做什么',
      'Busy': '忙碌',
      'Expiration': '过期时间',
      'Never': '永不',
      'Visible to': '可见范围',
      'Everyone': '所有人',
      'Organization only': '仅组织',
      '30 minutes': '30 分钟',
      '1 hour': '1 小时',
      '4 hours': '4 小时',
      'Today': '今天',
      'This week': '本周',
      'On vacation': '休假中',
      'Out sick': '生病中',
      'Working from home': '居家办公',
      'Focusing': '专注中',
      'characters remaining': '个字符剩余',
      'character remaining': '个字符剩余',
      'When others mention you, assign you, or request your review, GitHub will let them know that you have limited availability.':
        '当他人提及你、指派你或请求你评审时，GitHub 会告知他们你当前的可用性有限。',
      'Your status will be cleared after the selected time.': '到达所选时间后，你的状态将自动清除。',
      'Limit status visibility to a single organization.': '将状态可见范围限制在单个组织内。'
    },

    /* ---------- 1.16 Copilot 菜单 ---------- */
    'Copilot': {
      'Ask Copilot...': '询问 Copilot…',
      'Ask Copilot…': '询问 Copilot…',
      'Ask Copilot': '询问 Copilot',
      'In immersive chat': '在沉浸式对话中',
      'In a space': '在空间中',
      'Immersive chat': '沉浸式对话',
      'Copilot Spaces': 'Copilot 空间',
      'Download for...': '下载适用于…',
      'Download for…': '下载适用于…'
    },

    /* ---------- 1.17 事件动词（时间线） ---------- */
    '事件动词': {
      'opened this issue': '打开了此议题',
      'opened this pull request': '打开了此拉取请求',
      'closed this': '关闭了此',
      'closed this as completed': '将此标记为已完成并关闭',
      'closed this as not planned': '将此标记为不计划处理并关闭',
      'reopened this': '重新打开了此',
      'merged this pull request': '合并了此拉取请求',
      'commented': '评论了',
      'approved these changes': '批准了这些更改',
      'requested changes': '请求了更改',
      'dismissed a review': '驳回了评审',
      'edited': '已编辑',
      'self-assigned this': '将此指派给了自己',
      'marked this pull request as ready for review': '将此拉取请求标记为可评审',
      'added one commit': '添加了 1 个提交',
      'force-pushed the branch': '强制推送了分支',
      'deleted the branch': '删除了分支',
      'created the branch': '创建了分支',
      'mentioned this issue': '提及了此议题',
      'referenced this issue': '引用了此议题'
    },

    /* ---------- 1.18 设置·资料与账户 ---------- */
    '设置·资料与账户': {
      'Profile': '个人资料',
      'Your profile': '你的个人主页',
      'Avatar': '头像',
      'Edit avatar': '编辑头像',
      'Upload a photo...': '上传照片…',
      'Remove photo': '移除照片',
      'Name': '姓名',
      'Your name may appear around GitHub where you contribute or are mentioned. You can remove it at any time.':
        '你的姓名会出现在 GitHub 上你贡献或被提及的地方，随时可以移除。',
      'Select a verified email to display': '选择一个已验证的邮箱用于展示',
      'You can manage verified email addresses in your email settings.': '你可以在邮件设置中管理已验证的邮箱地址。',
      'You can @mention other users and organizations to link to them.':
        '你可以 @提及 其他用户和组织来链接到他们。',
      'URL': '网址',
      'Link to social profiles': '链接到社交资料',
      'Contributions & Activity': '贡献与活动',
      'Contributions & activity': '贡献与活动',
      'Include private contributions on my profile': '在我的个人主页上包含私有贡献',
      'Show Achievements on my profile': '在我的主页上显示成就',
      'Change your username': '修改用户名',
      'Change username': '修改用户名',
      'Changing your username can have unintended side effects.': '修改用户名可能带来意外影响。',
      'Export account data': '导出账户数据',
      'Start export': '开始导出',
      'Delete account': '删除账户',
      'Delete your account': '删除你的账户',
      'Once you delete your account, there is no going back. Please be certain.':
        '账户一旦删除将无法恢复，请务必确认。',
      'Are you absolutely sure?': '你确定要这么做吗？',
      'Deactivate account': '停用账户',
      'Blocked users': '已屏蔽的用户',
      'Block a user': '屏蔽用户',
      'You have no blocked users.': '你没有屏蔽任何用户。',
      'Unblock': '取消屏蔽',
      'Organizations you belong to': '你所属的组织',
      "You don't belong to any organizations yet.": '你还没有加入任何组织。',
      'Leave organization': '离开组织',
      'Primary email address': '主邮箱地址',
      'Backup email address': '备用邮箱地址',
      'Add email address': '添加邮箱地址',
      'Add email': '添加邮箱',
      'Keep my email addresses private': '保持我的邮箱地址私密',
      'Block command line pushes that expose my email': '阻止暴露我邮箱的命令行推送',
      'Resend verification email': '重新发送验证邮件',
      'Set as primary': '设为主邮箱',
      'There are no verified emails associated with your account.': '你的账户没有已验证的邮箱。',
      'Repository default branch': '仓库默认分支',
      'Default branch name': '默认分支名称',
      'Repository visibility': '仓库可见性',
      'Template repositories': '模板仓库',
      'Deleted repositories': '已删除的仓库',
      'Restore': '恢复',
      'Add saved reply': '添加已保存的回复',
      'Create saved reply': '创建已保存的回复',
      "You haven't created any saved replies yet.": '你还没有创建任何已保存的回复。',
      'Search settings': '搜索设置',
      'All settings': '所有设置',
      'General': '通用'
    },

    /* ---------- 1.19 设置·外观与通知 ---------- */
    '设置·外观与通知': {
      'Theme preferences': '主题偏好',
      'Theme mode': '主题模式',
      'Single theme': '单一主题',
      'Sync with system': '跟随系统',
      'Light': '浅色',
      'Dark': '深色',
      'Light default': '浅色（默认）',
      'Dark default': '深色（默认）',
      'Light high contrast': '浅色高对比度',
      'Dark high contrast': '深色高对比度',
      'Light colorblind': '浅色色觉辅助',
      'Dark colorblind': '深色色觉辅助',
      'Light dimmed': '浅色柔和',
      'Dark dimmed': '深色柔和',
      'Choose a theme': '选择主题',
      'Markdown editor font size preference': 'Markdown 编辑器字号偏好',
      'Keyboard shortcuts': '键盘快捷键',
      'Character keys': '字符键',
      'Link underlines': '链接下划线',
      'Show link underlines': '显示链接下划线',
      'Motion': '动效',
      'Enable motion': '启用动效',
      'Hovercards': '悬浮卡片',
      'Disable hovercards': '禁用悬浮卡片',
      'Notification preferences': '通知偏好',
      'Email notification preferences': '邮件通知偏好',
      'Default notification email': '默认通知邮箱',
      'Custom routing': '自定义路由',
      'Participating, @mentions and custom': '参与、@提及和自定义',
      'Automatically watch repositories': '自动关注仓库',
      'Automatically watch teams': '自动关注团队',
      'Include your own updates': '包含你自己的更新',
      'Everything': '全部',
      'Muted': '已静音',
      'Notification settings': '通知设置',
      'System': '系统',
      'Email': '邮件',
      'Web': '网页',
      'Plan': '套餐',
      'Plans': '套餐',
      'Current plan': '当前套餐',
      'Change plan': '更改套餐',
      'Cancel plan': '取消套餐',
      'Downgrade': '降级',
      'Free': '免费',
      'Payment method': '支付方式',
      'Add payment method': '添加支付方式',
      'Billing history': '账单历史',
      'Receipts': '收据',
      'Spending limits': '支出上限',
      'Monthly spending limit': '每月支出上限',
      'Included usage': '包含的用量',
      'Billing': '账单'
    },

    /* ---------- 1.20 设置·安全与登录 ---------- */
    '设置·安全与登录': {
      'Change password': '修改密码',
      'Old password': '当前密码',
      'New password': '新密码',
      'Confirm new password': '确认新密码',
      'Update password': '更新密码',
      'Password': '密码',
      'Two-factor authentication': '双重身份验证',
      'Enable two-factor authentication': '启用双重身份验证',
      'Disable two-factor authentication': '禁用双重身份验证',
      'Two-factor methods': '双重验证方式',
      'Authenticator app': '身份验证器应用',
      'SMS/Text message': '短信',
      'Recovery codes': '恢复代码',
      'View recovery codes': '查看恢复代码',
      'Security keys': '安全密钥',
      'Passkeys': '通行密钥',
      'Add passkey': '添加通行密钥',
      'Web sessions': '网页会话',
      'Current session': '当前会话',
      'This device': '此设备',
      'Revoke': '撤销',
      'Revoke all sessions': '撤销所有会话',
      'Sign out of other sessions': '退出其他会话',
      'Last accessed on': '最后访问于',
      'Device': '设备',
      'Signed in with': '登录方式',
      'SSH keys': 'SSH 密钥',
      'New SSH key': '新建 SSH 密钥',
      'Add new SSH key': '添加新的 SSH 密钥',
      'Add SSH key': '添加 SSH 密钥',
      'New GPG key': '新建 GPG 密钥',
      'Add new GPG key': '添加新的 GPG 密钥',
      'Add GPG key': '添加 GPG 密钥',
      'Title': '标题',
      'Key': '密钥',
      'Key type': '密钥类型',
      'Authentication key': '身份验证密钥',
      'Signing key': '签名密钥',
      'There are no SSH keys associated with your account.': '你的账户没有关联任何 SSH 密钥。',
      'There are no GPG keys associated with your account.': '你的账户没有关联任何 GPG 密钥。'
    },

    /* ---------- 1.21 设置·开发者与集成 ---------- */
    '设置·开发者与集成': {
      'GitHub Apps': 'GitHub Apps',
      'OAuth Apps': 'OAuth Apps',
      'Personal access tokens': '个人访问令牌',
      'Personal access tokens (classic)': '个人访问令牌（经典）',
      'Access tokens': '访问令牌',
      'Fine-grained tokens': '细粒度令牌',
      'Tokens (classic)': '令牌（经典）',
      'Generate new token': '生成新令牌',
      'Generate new token (classic)': '生成新令牌（经典）',
      'New personal access token': '新建个人访问令牌',
      'New fine-grained personal access token': '新建细粒度个人访问令牌',
      'Scopes': '权限范围',
      'Select scopes': '选择权限范围',
      'Note': '备注',
      'Token name': '令牌名称',
      'Repository access': '仓库访问权限',
      'Only select repositories': '仅选择的仓库',
      'All repositories': '所有仓库',
      'Public repositories': '公开仓库',
      'Repository permissions': '仓库权限',
      'Organization permissions': '组织权限',
      'Account permissions': '账户权限',
      'Add permissions': '添加权限',
      'Read-only': '只读',
      'Read and write': '读写',
      'No access': '无访问权限',
      'Generate token': '生成令牌',
      'Regenerate token': '重新生成令牌',
      'Delete token': '删除令牌',
      'Never used': '从未使用',
      'Expires on': '到期时间',
      'Manage': '管理',
      'Metadata': '元数据',
      'Installed GitHub Apps': '已安装的 GitHub Apps',
      'Authorized OAuth Apps': '已授权的 OAuth Apps',
      'Authorized GitHub Apps': '已授权的 GitHub Apps',
      'Revoke access': '撤销访问权限',
      'You have no authorized OAuth Apps.': '你没有已授权的 OAuth 应用。',
      'Permissions': '权限',
      'Last used': '最后使用',
      'Editor': '编辑器',
      'Default editor': '默认编辑器',
      'Default region': '默认区域',
      'Install dotfiles': '安装 dotfiles',
      'GPG verification': 'GPG 验证',
      'Trusted repositories': '受信任的仓库',
      'Delete codespace': '删除代码空间',
      'Codespaces settings': '代码空间设置',
      'Webhooks': 'Webhook'
    },

    /* ---------- 1.22 表单校验与状态提示 ---------- */
    '状态提示': {
      'Saving...': '保存中…',
      'Error': '错误',
      'Something went wrong': '出错了',
      'Please try again': '请重试',
      'This field is required': '此字段为必填项',
      'Changes saved': '更改已保存',
      'Are you sure?': '确定吗？',
      'Yes, delete this': '确定，删除',
      'There was a problem saving your changes.': '保存更改时出现问题。',
      'Please correct the following errors:': '请修正以下错误：',
      'Copied to clipboard': '已复制到剪贴板',
      'No results': '无结果',
      'Try again': '再试一次'
    },
    /* ---------- 1.23 设置·通用框架 ---------- */
    '设置·通用框架': {
      'Breadcrumbs': '面包屑导航',
      'Footer': '页脚',
      'Footer navigation': '页脚导航',
      'Homepage': '主页',
      'GitHub Homepage': 'GitHub 主页',
      'User avatar': '用户头像',
      'User settings': '用户设置',
      'Settings menu': '设置菜单',
      'Menu': '菜单',
      'Open menu': '打开菜单',
      'Open user navigation menu': '打开用户导航菜单',
      'Open quick search dialog, type / to search': '打开快速搜索对话框，输入 / 开始搜索',
      'Open Copilot…': '打开 Copilot…',
      'Chat with Copilot': '与 Copilot 对话',
      'Create new...': '新建…',
      'Type': '类型',
      'Dismiss alert': '关闭提醒',
      'Dismiss error': '关闭错误提示',
      'Reload': '重新加载',
      'Please reload this page': '请重新加载此页面',
      'There was an error while loading.': '加载时出错。',
      'Uh oh!': '哎呀！',
      "You can't perform that action at this time.": '此时无法执行该操作。',
      'You have no unread notifications': '你没有未读通知',
      'You signed in with another tab or window.': '你在另一个标签页或窗口中登录了。',
      'You signed out in another tab or window.': '你在另一个标签页或窗口中退出了登录。',
      'You switched accounts on another tab or window.': '你在另一个标签页或窗口中切换了账户。',
      'to refresh your session.': '以刷新会话。',
      'Your personal account': '你的个人账户',
      'Cloud': '云端',
      'Features': '功能',
      'Sorry, something went wrong.': '抱歉，出错了。',
      'Loading content...': '正在加载内容…'
    },

    /* ---------- 1.24 设置·外观与编辑 ---------- */
    '设置·外观与编辑': {
      'Active Mode': '当前模式',
      'Light mode': '浅色模式',
      'Dark mode': '深色模式',
      'Contrast': '对比度',
      'Increase contrast': '提高对比度',
      'Selected theme:': '已选主题：',
      'Single theme picker': '单主题选择器',
      'Light theme picker': '浅色主题选择器',
      'Dark theme picker': '深色主题选择器',
      'Light theme': '浅色主题',
      'Dark theme': '深色主题',
      'Soft dark': '柔和深色',
      'Neutral': '中性',
      "GitHub's standard light theme with full color contrast and brightness.":
        'GitHub 标准浅色主题，具备完整的色彩对比度与亮度。',
      "GitHub's standard dark theme with full color contrast and brightness on a dark background.":
        'GitHub 标准深色主题，在深色背景上提供完整的色彩对比度与亮度。',
      'A dark theme with reduced contrast for comfortable viewing in low-light environments.':
        '降低对比度的深色主题，适合在弱光环境下舒适阅读。',
      'GitHub theme will match your system active settings': 'GitHub 主题将跟随系统的当前设置',
      'GitHub will use your selected theme': 'GitHub 将使用你选择的主题',
      'Enable high contrast for light or dark mode (or both) based on your system settings':
        '根据系统设置，为浅色或深色模式（或两者）启用高对比度',
      'This theme will be active when your system is set to "dark mode"': '当系统设置为「深色模式」时使用此主题',
      'This theme will be active when your system is set to "light mode"': '当系统设置为「浅色模式」时使用此主题',
      'Light protanopia and deuteranopia': '浅色（红色盲与绿色盲）',
      'Dark protanopia and deuteranopia': '深色（红色盲与绿色盲）',
      'Light tritanopia': '浅色（蓝色盲）',
      'Dark tritanopia': '深色（蓝色盲）',
      'For people who may find it difficult to distinguish between reds and greens.': '适合难以区分红色与绿色的人。',
      'For people who may find it difficult to distinguish between reds and greens, with a dark background.':
        '适合难以区分红色与绿色的人，使用深色背景。',
      'For people who find it difficult to distinguish between blues and greens, as well as yellows and purples.':
        '适合难以区分蓝色与绿色、以及黄色与紫色的人。',
      'Editor settings': '编辑器设置',
      'Editor preference': '编辑器偏好',
      'Choose the number of spaces a tab is equal to when rendering code': '选择渲染代码时一个制表符等于多少个空格',
      'Markdown editor font preference': 'Markdown 编辑器字体偏好',
      'Use a fixed-width (monospace) font when editing Markdown': '编辑 Markdown 时使用等宽字体',
      'Emoji skin tone preference': 'Emoji 肤色偏好',
      'Preferred default emoji skin tone': '首选默认 Emoji 肤色',
      'Light Skin Tone': '浅肤色',
      'Medium-Light Skin Tone': '中浅肤色',
      'Medium Skin Tone': '中等肤色',
      'Medium-Dark Skin Tone': '中深肤色',
      'Dark Skin Tone': '深肤色',
      'Save editor settings': '保存编辑器设置'
    },

    /* ---------- 1.25 设置·无障碍与快捷键 ---------- */
    '设置·无障碍与快捷键': {
      'Assistive technology hints': '辅助技术提示',
      'Add or remove instructions for how to operate complex controls.': '添加或移除复杂控件的操作说明。',
      'Enable screen reader hint': '启用屏幕阅读器提示',
      'Disable screen reader hint': '禁用屏幕阅读器提示',
      'Save assistive technology hint preferences': '保存辅助技术提示偏好',
      'Autoplay animated images': '自动播放动图',
      'Automatically plays animated images': '自动播放动态图片',
      'Prevents animated images from playing automatically': '阻止动态图片自动播放',
      'Adopts your system preference for reduced motion': '跟随系统的“减少动态效果”偏好',
      'Save motion preferences': '保存动效偏好',
      'Content': '内容',
      'URL paste behavior': 'URL 粘贴行为',
      'Formatted link': '格式化链接',
      'Plain text': '纯文本',
      'Pasting a URL while having text selected will format to a Markdown link':
        '选中文字时粘贴 URL 会格式化为 Markdown 链接',
      'Pasting a URL while having text selected will replace the text': '选中文字时粘贴 URL 会替换所选文字',
      'Select if URLs should be formatted on paste. You can use': '选择粘贴时是否格式化 URL。你可以使用',
      'to paste a link in the opposite way.': '以相反方式粘贴链接。',
      'Save content preferences': '保存内容偏好',
      'Hide link underlines': '隐藏链接下划线',
      'Toggle the visibility of underlines on links that are adjacent to text.':
        '切换与文字相邻的链接下划线的显示。',
      'Show hovercards': '显示悬浮卡片',
      'preview information about other parts of GitHub.': '预览 GitHub 其他部分的信息。',
      'Save hovercard preferences': '保存悬浮卡片偏好',
      'GitHub shortcuts': 'GitHub 快捷键',
      'Save keyboard shortcut preferences': '保存键盘快捷键偏好',
      'shortcut to navigate notifications, or': '快捷键来浏览通知，或',
      'to view context relevant shortcuts.': '查看与当前情境相关的快捷键。',
      "that don't use modifier keys in their activation. For example, the": '它们激活时不使用修饰键。例如，',
      'question mark': '问号'
    },

    /* ---------- 1.26 设置·通知与订阅 ---------- */
    '设置·通知与订阅': {
      'Customize email updates': '自定义邮件更新',
      'Default notifications email': '默认通知邮箱',
      'Notify me:': '通知我：',
      'Subscriptions': '订阅',
      'Watching': '关注中',
      'Ignored repositories': '已忽略的仓库',
      'View ignored repositories': '查看已忽略的仓库',
      'View watched repositories': '查看已关注的仓库',
      'Dependabot alerts: Email digest': 'Dependabot 警报：邮件摘要',
      'Dependabot alerts: New vulnerabilities': 'Dependabot 警报：新漏洞',
      'Email a regular summary of Dependabot alerts for up to 10 of your repositories.':
        '定期以邮件汇总最多 10 个仓库的 Dependabot 警报。',
      'Failed workflows only': '仅失败的工作流',
      'GitHub Actions': 'GitHub Actions',
      'Security campaign emails': '安全活动邮件',
      'Receive email notifications about security campaigns in repositories where you have access to security alerts.':
        '在你可访问安全警报的仓库中，接收安全活动的邮件通知。',
      'Reviews, Pushes, Comments': '评审、推送、评论',
      'In-product messages': '站内消息',
      'Agent sessions': '智能体会话',
      'Notifications for agent sessions that you started.': '你发起的智能体会话的通知。',
      "Notifications for all repositories, teams, or conversations you're watching.":
        '你关注的所有仓库、团队或对话的通知。',
      'Notifications for workflow runs on repositories set up with': '已设置以下内容仓库中工作流运行的通知',
      "When you're given access to": '当你获得以下权限时',
      'automatically receive notifications when a new vulnerability is found in one of your dependencies.':
        '当某个依赖中发现新漏洞时自动收到通知。',
      "Don't send": '不发送',
      "You'll never be notified.": '你将不会收到通知。',
      'on GitHub, Email': '在 GitHub 上、邮件',
      'on GitHub, Email, CLI': '在 GitHub 上、邮件、CLI',
      "'Deploy key' alert email": '「部署密钥」警报邮件',
      "Choose which additional events you'll receive emails for when participating or watching.":
        '选择在参与或关注时额外接收哪些事件的邮件。'
    },

    /* ---------- 1.27 设置·安全与账户 ---------- */
    '设置·安全与账户': {
      'Change my username': '修改我的用户名',
      'Enter a new username': '输入新的用户名',
      'Really change your username?': '确定要修改用户名吗？',
      "I understand, let's change my username": '我明白，修改我的用户名',
      'Changing your username can have': '修改用户名可能会带来',
      'unintended side effects': '意外影响',
      'Renaming may take a few minutes to complete.': '重命名可能需要几分钟才能完成。',
      'Export all repositories and profile metadata for': '导出以下账户的所有仓库与资料元数据：',
      '. Exports will be available for 7 days.': '。导出文件可在 7 天内下载。',
      ', along with all of your forks, wikis, issues, pull requests, and GitHub Pages sites.':
        '，以及你的所有复刻、Wiki、议题、拉取请求和 GitHub Pages 站点。',
      'Deleting your user account': '删除你的用户账户',
      'delete my account': '删除我的账户',
      'You will no longer be billed, and after 90 days your username will be available to anyone on GitHub.':
        '你将不再被计费，90 天后你的用户名将对 GitHub 上的任何人开放。',
      "You'll be prompted to verify your identity before account deletion.": '删除账户前会要求你验证身份。',
      'immediately delete all of your repositories (9)': '立即删除你的所有仓库（9 个）',
      'You have not designated a successor.': '你尚未指定继任者。',
      'Designate Successor': '指定继任者',
      'Add Successor': '添加继任者',
      'Successor settings': '继任者设置',
      'Learn more about account successors.': '详细了解账户继任者。',
      'Are you sure you want to do this?': '你确定要这样做吗？',
      'This is extremely important.': '这一点极其重要。',
      "Unexpected bad things will happen if you don't read this!": '如果不读这段内容，可能会发生意想不到的糟糕后果！',
      'To verify, type': '为确认，请输入',
      'exactly as it appears:': '完全照此输入：',
      'designated below': '在下方指定',
      'create redirects for your repositories (web and git access).': '为你的仓库创建重定向（网页与 git 访问）。',
      'set up redirects for Pages sites.': '为 Pages 站点设置重定向。',
      'set up redirects for your old profile page.': '为你的旧个人主页设置重定向。',
      'Cancel plan and delete this account': '取消套餐并删除此账户',
      'Looking to manage account security settings? You can find them in the': '想管理账户安全设置？可以在',
      'Your username or email:': '你的用户名或邮箱：',
      'For more help, read our article "': '如需更多帮助，请阅读我们的文章「',
      ', or read more about it at our': '，或在我们',
      'privacy statement': '隐私声明',
      'to learn more about how we use this information.': '了解更多关于我们如何使用这些信息的内容。',
      'page.': '页面。',
      'our': '我们的',
      'You can': '你可以',
      'Sign in methods': '登录方式',
      'Passwordless sign-in with biometrics or security keys': '使用生物识别或安全密钥免密码登录',
      'Two-factor authentication is not enabled yet.': '尚未启用双重身份验证。',
      'at least 15 characters': '至少 15 个字符',
      'at least 8 characters': '至少 8 个字符',
      'including a number': '包含一个数字',
      'and a lowercase letter': '以及一个小写字母',
      "Make sure it's": '确保它',
      'I forgot my password': '我忘记密码了',
      'Learn more about strong passwords': '详细了解强密码',
      'Learn more about two-factor authentication': '详细了解双重身份验证',
      'Configured': '已配置',
      'Connect': '连接',
      'Disable': '禁用',
      'Are you sure you want to disable two-factor authentication?': '你确定要禁用双重身份验证吗？',
      'Sign in with your Google account': '使用 Google 账户登录',
      'Sign in with your Apple account': '使用 Apple 账户登录',
      'OR': '或',
      '1 verified email configured': '已配置 1 个已验证邮箱',
      'This is a list of devices that have logged into your account. Revoke any sessions that you do not recognize.':
        '这里列出了登录过你账户的设备。对于不认识的会话，请予以撤销。',
      'Your current session': '你的当前会话',
      'Last accessed -': '最后访问：',
      'Last used for authentication -': '最后用于身份验证：',
      'Registered -': '注册时间：',
      'GitHub Mobile sessions': 'GitHub Mobile 会话',
      'Vigilant mode': '警戒模式',
      'Enable Vigilant mode': '启用警戒模式',
      'Flag unsigned commits as unverified': '将未签名的提交标记为未验证',
      'This will include any commit attributed to your account but not signed with your GPG or S/MIME key.':
        '这包括归属于你的账户、但未用你的 GPG 或 S/MIME 密钥签名的所有提交。',
      'Note that this will include your existing unsigned commits.': '注意，这也会包含你已有的未签名提交。',
      'Learn about vigilant mode': '了解警戒模式',
      'Learn how to': '了解如何',
      'Check out our guide to': '查看我们的指南：',
      'or troubleshoot': '或排查',
      'common SSH problems': '常见 SSH 问题',
      'connecting to GitHub using SSH keys': '使用 SSH 密钥连接 GitHub',
      'generate a GPG key and add it to your account': '生成 GPG 密钥并添加到你的账户',
      'your GitHub Mobile app authorization to sign out of all your devices.':
        '你的 GitHub Mobile 应用授权，以从所有设备退出登录。',
      'GPG keys': 'GPG 密钥',
      'stale': '已过期',
      '250 characters remaining.': '还可输入 250 个字符。'
    },

    /* ---------- 1.28 设置·代码空间 ---------- */
    '设置·代码空间': {
      'Access and security': '访问与安全',
      'Codespace user secrets': '代码空间用户机密',
      'Choose your default region': '选择默认区域',
      'Default region': '默认区域',
      'Region': '区域',
      'Default idle timeout': '默认空闲超时',
      'Default retention period': '默认保留期',
      'Dotfiles': 'dotfiles',
      'Automatically install dotfiles': '自动安装 dotfiles',
      'Host image version preference': '主机镜像版本偏好',
      'Stable': '稳定版',
      'Deprecated': '已弃用',
      'Always use the latest stable configuration.': '始终使用最新的稳定配置。',
      'Use a beta image configuration when available. Otherwise, use the latest stable configuration.':
        '有可用测试版镜像配置时使用它，否则使用最新的稳定配置。',
      'GPG signing will be available in Codespaces': '代码空间中可使用 GPG 签名',
      'VS Code Settings Sync will be available in Codespaces': '代码空间中可使用 VS Code 设置同步',
      'Secrets': '机密',
      'New secret': '新建机密',
      'There are no Codespace secrets.': '没有代码空间机密。',
      'Select repository': '选择仓库',
      'Selected repositories': '已选择的仓库',
      'No matching repositories.': '没有匹配的仓库。',
      'Retention period must be 30 days or less.': '保留期必须不超过 30 天。',
      'Retention period must be between 0 and 30 days.': '保留期必须在 0 到 30 天之间。',
      'Timeout must be 240 minutes or less.': '超时时间必须不超过 240 分钟。',
      'Timeout must be 5 minutes or more.': '超时时间必须不少于 5 分钟。',
      'Warning notifications for codespace deletions will be enabled': '将启用代码空间删除的警告通知',
      'When enabled, you will receive emails when your codespaces are nearing deletion due to inactivity.':
        '启用后，当代码空间因长期未使用而即将被删除时，你会收到邮件。',
      'We will determine the closest available region based on your location (IP address) at codespace creation time.':
        '创建代码空间时，我们会根据你的位置（IP 地址）确定最近的可用区域。',
      'Limit access of personal Codespaces to the repository they were opened for':
        '将个人代码空间的访问限制在创建它的仓库内',
      'All Codespaces can access other repositories I own': '所有代码空间都可访问我拥有的其他仓库',
      'Personal Codespaces created for specific repositories can access other repositories I own':
        '为特定仓库创建的个人代码空间可访问我拥有的其他仓库',
      'Learn how to set up your dotfiles.': '了解如何设置 dotfiles。',
      'Learn more about host images': '详细了解主机镜像',
      'Learn about retention setting': '了解保留期设置',
      'Edit and preview changes straight from the browser.': '直接在浏览器中编辑和预览更改。',
      'Edit and run notebooks from the browser with JupyterLab.': '使用 JupyterLab 在浏览器中编辑和运行 notebook。',
      'Visual Studio Code for the Web': '网页版 Visual Studio Code',
      'Connect to the cloud from your local desktop client. Requires': '从本地桌面客户端连接到云端。需要',
      'Set automatically': '自动设置',
      'Set manually': '手动设置',
      'Australia': '澳大利亚',
      'Europe West': '西欧',
      'US East': '美国东部',
      'US West': '美国西部',
      'Southeast Asia': '东南亚'
    },

    /* ---------- 1.29 设置·Copilot ---------- */
    '设置·Copilot': {
      'Copilot Chat in GitHub.com': 'GitHub.com 上的 Copilot 对话',
      'Copilot in the cloud': '云端 Copilot',
      'Copilot in GitHub Desktop': 'GitHub Desktop 中的 Copilot',
      'GitHub Copilot app': 'GitHub Copilot 应用',
      'Inline suggestions': '行内建议',
      'Copilot can search the web': 'Copilot 可以搜索网页',
      'Suggestions matching public code': '匹配公开代码的建议',
      'Allowed': '已允许',
      'Blocked': '已阻止',
      'GitHub Copilot will show suggestions matching public code.': 'GitHub Copilot 会显示匹配公开代码的建议。',
      "GitHub Copilot won't show suggestions matching public code.":
        'GitHub Copilot 不会显示匹配公开代码的建议。',
      'Copilot-generated commit messages': 'Copilot 生成的提交信息',
      'Allow Copilot to suggest commit messages when you make changes on GitHub.com.':
        '允许 Copilot 在 GitHub.com 上做更改时建议提交信息。',
      'Agent Merge': '智能体合并',
      'With Agent Merge, Copilot can watch your pull requests, get them ready to merge and keep them ready to merge.':
        '启用智能体合并后，Copilot 可以监视你的拉取请求、让它们保持可合并状态。',
      'Enable Agent Merge automatically for pull requests I create': '对我创建的拉取请求自动启用智能体合并',
      'MCP servers in Copilot': 'Copilot 中的 MCP 服务器',
      'Connect MCP servers to Copilot in all Copilot editors and Copilot cloud agent.':
        '在所有 Copilot 编辑器和 Copilot 云端智能体中连接 MCP 服务器。',
      'Chat with Copilot anywhere': '随时随地与 Copilot 对话',
      'Allows instant chatting when landing on GitHub.com': '访问 GitHub.com 时立即开始对话',
      'Dashboard Entry Point': '仪表盘入口',
      'Show Copilot': '显示 Copilot',
      'Enable Copilot for all GitHub features, including navigation bar, search, and dashboard.':
        '为所有 GitHub 功能启用 Copilot，包括导航栏、搜索和仪表盘。',
      'When disabled, Copilot will be hidden and unavailable. This setting does not apply to Copilot search on GitHub Docs.':
        '禁用后 Copilot 将被隐藏且不可用。此设置不适用于 GitHub Docs 上的 Copilot 搜索。',
      'Copilot Spaces Individual Access': 'Copilot 空间个人访问',
      'Copilot Spaces Individual Sharing': 'Copilot 空间个人分享',
      'If enabled, you can view and create': '启用后，你可以查看和创建',
      'If enabled, you can share individually owned': '启用后，你可以分享个人拥有的',
      'If enabled, you can create individually owned': '启用后，你可以创建个人拥有的',
      '. When disabled, you cannot view or create any Copilot Spaces.': '。禁用后，你将无法查看或创建任何 Copilot 空间。',
      '. When disabled, you cannot share individual spaces.': '。禁用后，你将无法分享个人空间。',
      '. When disabled, you cannot create individual spaces.': '。禁用后，你将无法创建个人空间。',
      'Included credits': '包含额度',
      'Upgrade plan': '升级套餐',
      'Upgrade your Copilot plan for higher usage limits, premium models, AI reviews and more.':
        '升级 Copilot 套餐以获得更高用量上限、高级模型、AI 评审等。',
      'Coming soon': '即将推出',
      'Get Copilot from an organization': '从组织获取 Copilot',
      'Get started': '开始使用',
      'Getting started': '开始使用',
      'Install Copilot in your editor': '在你的编辑器中安装 Copilot',
      'Go to Copilot': '前往 Copilot',
      'Start building with Copilot': '开始用 Copilot 构建',
      'Learn more in the docs.': '在文档中了解更多。',
      'Learn more.': '了解更多。',
      'Semantic indexing for Non-GitHub Repositories': '非 GitHub 仓库的语义索引',
      'to index your non-GitHub repositories in VSCode.': '在 VS Code 中为你的非 GitHub 仓库建立索引。',
      'You can use': '你可以使用',
      'You will have access to the feature': '你将可以使用该功能',
      "You won't have access to the feature": '你将无法使用该功能',
      'Allow GitHub to use my data for AI model training': '允许 GitHub 将我的数据用于 AI 模型训练',
      'Privacy Statement': '隐私声明',
      "GitHub's Privacy Statement": 'GitHub 隐私声明',
      'Organizations can provide their members (including you) and their teams access to GitHub Copilot.':
        '组织可以为其成员（包括你）和团队提供 GitHub Copilot 访问权限。',
      'Remove section': '移除区块',
      'Ask about coding problems and get code completions while you work.':
        '随时提问编码问题，并在工作中获得代码补全。',
      'Copilot chat in the navigation from anywhere on GitHub. Try asking':
        '在 GitHub 任意页面的导航栏中使用 Copilot 对话。试着问',
      'More editors': '更多编辑器',
      'Copilot Auto model selection': 'Copilot 自动模型选择',
      'Evaluation models in Copilot auto model selection': 'Copilot 自动模型选择中的评估模型'
    },

    /* ---------- 1.30 设置·开发者与集成（补充） ---------- */
    '设置·开发者补充': {
      'New GitHub App': '新建 GitHub App',
      'New OAuth app': '新建 OAuth 应用',
      'No GitHub Apps': '没有 GitHub Apps',
      'No OAuth apps': '没有 OAuth 应用',
      'No installed GitHub Apps': '没有已安装的 GitHub Apps',
      'You have no GitHub Apps installed on this account.': '此账户没有安装任何 GitHub Apps。',
      'Visit Marketplace': '访问市场',
      'Application settings': '应用设置',
      'My GitHub Apps': '我的 GitHub Apps',
      'View documentation': '查看文档',
      'OAuth apps are used to access the GitHub API. Read the docs to find out more.':
        'OAuth 应用用于访问 GitHub API。阅读文档了解更多。',
      'Fine-grained personal access tokens': '细粒度个人访问令牌',
      'Fine-grained personal access tokens generated by your personal account.':
        '由你的个人账户生成的细粒度个人访问令牌。',
      'Personal access tokens (classic) generated by your personal account.':
        '由你的个人账户生成的个人访问令牌（经典）。',
      'GitHub Apps that have been authorized to access your account.': '已被授权访问你账户的 GitHub Apps。',
      'OAuth apps that have been authorized to access your account.': '已被授权访问你账户的 OAuth 应用。',
      'SSH keys associated with your account.': '与你账户关联的 SSH 密钥。',
      'View and manage all the credentials generated or authorized by your personal account.':
        '查看并管理你的个人账户生成或授权的所有凭据。',
      'Default Package Setting': '默认包设置',
      'Deleted Packages': '已删除的包',
      'Inherit access from source repository': '继承源仓库的访问权限',
      'Packages permissions': '包权限',
      'Search deleted packages': '搜索已删除的包',
      'This setting will be applied to new Container, npm, rubygems and NuGet packages.':
        '此设置将应用于新的 Container、npm、rubygems 和 NuGet 包。',
      'Add a domain': '添加域名',
      'Verified domains': '已验证的域名',
      'Verify domains to restrict who can publish GitHub Pages on them.':
        '验证域名，以限制谁可以在这些域名上发布 GitHub Pages。',
      'There are no verified domains.': '没有已验证的域名。',
      "You don't have any enterprises": '你没有任何企业',
      'Learn more about enterprises': '详细了解企业',
      'Start free for 30 days': '免费试用 30 天',
      'Designed for businesses or teams who collaborate on GitHub.com': '专为在 GitHub.com 上协作的企业或团队设计',
      'No reminders': '没有提醒',
      'Reminders allow you to push certain events to authorized instances of Microsoft Teams or Slack.':
        '提醒功能可将特定事件推送到已授权的 Microsoft Teams 或 Slack 实例。',
      'You are not a member of any organizations.': '你还不是任何组织的成员。',
      'Move to an organization': '移动到组织',
      'Move work to an organization': '将工作移动到组织'
    },

    /* ---------- 1.31 设置·个人资料（补充） ---------- */
    '设置·资料补充': {
      'Social account': '社交账号',
      'Time zone': '时区',
      'Display current local time': '显示当前本地时间',
      'Other users will see the time difference from their local time.': '其他用户会看到与他们本地时间的时差。',
      'Preferred spoken language': '首选语言',
      'Available for hire': '可接受雇佣',
      'Make profile private and hide activity': '将主页设为私密并隐藏活动',
      'Your achievements will be shown on your profile.': '你的成就将显示在个人主页上。',
      'Read more about viewing contributions on your profile': '详细了解如何在主页查看贡献',
      'Jobs profile': '求职资料',
      'Save jobs profile': '保存求职资料',
      'Trending settings': '趋势设置',
      'Trending Repositories': '趋势仓库',
      'Save Trending settings': '保存趋势设置',
      'GitHub Developer Program': 'GitHub 开发者计划',
      'Join the GitHub Developer Program': '加入 GitHub 开发者计划',
      'Building an application, service, or tool that integrates with GitHub?':
        '正在构建与 GitHub 集成的应用、服务或工具？',
      'Connect your ORCID iD': '连接你的 ORCID iD',
      'ORCID iD': 'ORCID iD',
      'ORCID.org': 'ORCID.org',
      "your company's GitHub organization to link it.": '你公司的 GitHub 组织来关联它。',
      'Upload a photo…': '上传照片…',
      'Are you sure you want to reset your current avatar?': '你确定要重置当前头像吗？',
      'Please upload a picture smaller than 1 MB.': '请上传小于 1 MB 的图片。',
      'Please upload a picture smaller than 10,000x10,000.': '请上传小于 10,000×10,000 的图片。',
      'We only support PNG, GIF, or JPG pictures.': '仅支持 PNG、GIF 或 JPG 图片。',
      "Something went really wrong and we can't process that picture.": '出了严重问题，无法处理该图片。',
      'This file is empty.': '此文件为空。',
      "File contents don't match the file extension.": '文件内容与扩展名不符。',
      'Update preferences': '更新偏好',
      'Profile settings': '个人资料设置'
    },

    /* ---------- 1.32 设置·议题类型与交互限制 ---------- */
    '设置·议题与交互': {
      'Issue types': '议题类型',
      'Issue fields': '议题字段',
      'New type': '新建类型',
      'New field': '新建字段',
      'Add starter fields': '添加初始字段',
      'Customize your issue types. Issue types can be used to classify and manage issues in your repositories.':
        '自定义议题类型。议题类型可用于对仓库中的议题进行分类和管理。',
      'Bug': '缺陷',
      'Feature': '功能',
      'Task': '任务',
      'A request, idea, or new functionality': '请求、想法或新功能',
      'A specific piece of work': '一项具体的工作',
      'An unexpected problem or behavior': '意外的问题或行为',
      'List of issue types': '议题类型列表',
      '3 types': '3 种类型',
      '(max 25)': '（最多 25 个）',
      "You don't have any issue fields yet": '你还没有任何议题字段',
      'Interaction limits': '交互限制',
      'Code review limits': '代码评审限制',
      'Collaborators': '协作者',
      'New users': '新用户',
      'Enable interaction limits for:': '为以下对象启用交互限制：',
      'Limit to existing users': '限制为现有用户',
      'Limit to prior contributors': '限制为此前的贡献者',
      'Limit to repository collaborators': '限制为仓库协作者',
      'Users that have recently created their account will be unable to interact with your repositories.':
        '最近注册的用户将无法与你的仓库交互。',
      'Users that are not collaborators of one of your repositories will not be able to interact with that repository.':
        '不是你仓库协作者的用户将无法与该仓库交互。',
      'This may be used to force a "cool-down" period during heated discussions or prevent unwanted interactions.':
        '这可用于在激烈讨论期间强制「冷却」，或防止不想要的互动。',
      '1 month': '1 个月',
      '1 week': '1 周',
      '24 hours': '24 小时',
      '3 days': '3 天',
      '6 months': '6 个月',
      'Limit reviews on all repositories': '限制所有仓库的评审',
      'Remove review limits from all repositories': '移除所有仓库的评审限制',
      'Restrict users who are permitted to approve or request changes on pull requests in your public repositories.':
        '限制哪些用户可以在你公开仓库的拉取请求中批准或请求更改。'
    },

    /* ---------- 1.33 设置·安全与分析 ---------- */
    '设置·安全分析': {
      'Security and analysis features help keep your repositories secure and updated.':
        '安全与分析功能有助于保持仓库的安全与更新。',
      'Dependabot security updates': 'Dependabot 安全更新',
      'Grouped security updates': '分组安全更新',
      'Push protection for yourself': '为你自己启用推送保护',
      'Enable all': '全部启用',
      'Disable all': '全部禁用',
      'Enable private vulnerability reporting': '启用私密漏洞报告',
      'Disable private vulnerability reporting': '禁用私密漏洞报告',
      'Enable Dependabot security updates': '启用 Dependabot 安全更新',
      'Disable Dependabot security updates': '禁用 Dependabot 安全更新',
      'Disable Dependabot alerts': '禁用 Dependabot 警报',
      'Enable grouped security updates': '启用分组安全更新',
      'Disable grouped security updates': '禁用分组安全更新',
      'Enable dependency graph': '启用依赖关系图',
      'Disable dependency graph': '禁用依赖关系图',
      'Configure alert notifications': '配置警报通知',
      'Understand your dependencies.': '了解你的依赖。',
      'Keep your dependencies secure and up-to-date.': '让你的依赖保持安全与最新。',
      'Learn more about Dependabot': '详细了解 Dependabot',
      'Learn more about private vulnerability reporting': '详细了解私密漏洞报告',
      'Automatically enable for new repositories': '自动为新仓库启用',
      'Automatically enable for new public repositories': '自动为新的公开仓库启用',
      'Enable by default for new repositories': '默认对新仓库启用',
      'Enable by default for new private repositories': '默认对新的私有仓库启用',
      'Enable by default for new public repositories': '默认对新的公开仓库启用',
      'Block commits that contain': '阻止包含以下内容的提交',
      'supported secrets': '受支持的机密',
      'Pushes that contain secrets will not be blocked.': '包含机密的推送将不会被阻止。',
      'Allow your community to privately report potential security vulnerabilities to maintainers and repository owners.':
        '允许社区私下向维护者和仓库所有者报告潜在的安全漏洞。'
    },
    /* ---------- 1.34 设置·账单 ---------- */
    '设置·账单': {
      'Amounts shown in USD': '金额以美元计',
      'You have not made any payments.': '你还没有任何付款记录。',
      'You have not added a payment method.': '你还没有添加支付方式。',
      'Add billing information': '添加账单信息',
      'Save billing information': '保存账单信息',
      'Save contact information': '保存联系信息',
      'Additional information': '其他信息',
      'Extra billing information': '其他账单信息',
      'Full business name or address of record': '登记的企业全称或地址',
      'This information will appear on all your receipts.': '此信息会出现在你的所有收据上。',
      'For your security, do not include any confidential or financial information (like credit card numbers).':
        '为了安全，请勿填写任何机密或财务信息（如信用卡号）。',
      'Required for certain countries': '部分国家必填',
      'VAT/GST ID': '增值税/GST 税号',
      'Postal/Zip code': '邮政编码',
      '(9-digit zip code for US)': '（美国为 9 位邮编）',
      'Select state': '选择州',
      'Select province': '选择省',
      'Credit or debit card': '信用卡或借记卡',
      'Pay with': '支付方式',
      'PayPal account': 'PayPal 账户',
      'Credit Card Form': '信用卡表单',
      'Prepaid debit and credit cards are not accepted as a valid form of payment.':
        '不接受预付借记卡和信用卡作为有效支付方式。',
      'Manage subscriptions': '管理订阅',
      'Next payment due': '下次付款日期',
      'Active subscription': '有效订阅',
      'Current GitHub base plan': '当前 GitHub 基础套餐',
      'Upgrade Individual Plan': '升级个人套餐',
      'Upgrade to Business': '升级到商业版',
      'Upgrade to GitHub Pro': '升级到 GitHub Pro',
      'Compare base plans': '对比基础套餐',
      'See all features and compare plans': '查看所有功能并对比套餐',
      'Redeem a coupon': '兑换优惠券',
      'Coupon': '优惠券',
      "You don't have an active coupon.": '你没有有效的优惠券。',
      'Current included usage': '当前包含用量',
      'Current metered usage': '当前按量用量',
      'Additional usage': '额外用量',
      'Metered usage': '按量用量',
      'Billed amount': '计费金额',
      'Gross amount': '总额',
      'Spent': '已花费',
      'Usage breakdown': '用量明细',
      'Usage by products': '按产品统计的用量',
      'Usage by repository': '按仓库统计的用量',
      'Get usage report': '获取用量报告',
      'Search or filter usage': '搜索或筛选用量',
      'Show Usage': '显示用量',
      'Show Usage Breakdown': '显示用量明细',
      'No usage': '无用量',
      'No usage data found for the selected filters.': '所选筛选条件下没有用量数据。',
      'Timeframe: Current month': '时间范围：本月',
      'Group by: None': '分组方式：无',
      'Scope:': '范围：',
      'Chart options': '图表选项',
      'Chart view': '图表视图',
      'Interactive chart': '交互式图表',
      'Loading usage data...': '正在加载用量数据…',
      'Loading budgets': '正在加载预算',
      'Loading payment information…': '正在加载支付信息…',
      'Budget': '预算',
      'Budgets': '预算',
      'New budget': '新建预算',
      'Included usage alerts:': '包含用量提醒：',
      'Advanced Security': '高级安全',
      'Pages for static website hosting': '用于静态网站托管的 Pages',
      'You can upgrade to Copilot Pro at any time. Check out this': '你可以随时升级到 Copilot Pro。查看这个',
      'for more details.': '了解更多详情。'
    },

    /* ---------- 1.35 设置·教育 ---------- */
    '设置·教育': {
      'GitHub Education': 'GitHub Education',
      'Education Benefits Application': '教育权益申请',
      'Free GitHub developer resources for students and teachers': '面向学生和教师的免费 GitHub 开发者资源',
      'Complete a teacher or student application to unlock tools and resources for your educational journey.':
        '完成教师或学生申请，解锁学习旅程中的工具与资源。',
      'Start an application': '开始申请',
      'Sponsorships': '赞助',
      'Start sponsoring': '开始赞助',
      "You're currently not sponsoring anyone.": '你目前没有赞助任何人。',
      'Learn more about GitHub Sponsors': '详细了解 GitHub Sponsors',
      'Connect with the community that builds the tools you use': '与你所用工具的构建社区建立联系',
      'Learn more about organizations': '详细了解组织',
      'Start your first organization': '创建你的第一个组织',
      'Create an organization': '创建组织',
      'Gathering available school information...': '正在获取可用的学校信息…'
    },

    /* ---------- 1.36 设置·审计与赞助日志 ---------- */
    '设置·日志': {
      'Filter audit logs': '筛选审计日志',
      'Filter by Action': '按操作筛选',
      'Filter by Member': '按成员筛选',
      'Search audit logs': '搜索审计日志',
      'Export': '导出',
      'Exporting': '正在导出',
      'Newer': '较新',
      'Older': '较早',
      'Recent events': '最近事件',
      "Yesterday's activity": '昨天的活动',
      'Show more details': '显示更多详情',
      'View advanced search syntax': '查看高级搜索语法',
      'Loading audit log entries…': '正在加载审计日志…',
      'Too many exports in progress. Please try again later.': '正在进行的导出过多，请稍后再试。',
      'Something went wrong.': '出错了。',
      'All-time': '全部时间',
      'Past day': '过去 24 小时',
      'Past week': '过去一周',
      'Past month': '过去一个月',
      'Past year': '过去一年',
      'Period:': '时间段：',
      'Filter activity': '筛选活动',
      'New sponsorships, changes, and cancellations': '新增赞助、变更与取消',
      'No sponsorship activity in this time period': '此时间段内没有赞助活动',
      'This is where you can review activity from your sponsorships.': '你可以在这里查看赞助相关的活动。',
      'items': '项'
    },

    /* ---------- 1.37 设置·安全分析（补充） ---------- */
    '设置·安全分析补充': {
      'Dependabot on self-hosted runners': '在自托管运行器上运行 Dependabot',
      'Run Dependabot security and version updates on self-hosted Actions runners.':
        '在自托管的 Actions 运行器上运行 Dependabot 安全与版本更新。',
      'Learn how to group updates.': '了解如何对更新分组。',
      'Security and analysis features help keep you secure and updated, wherever you are.':
        '无论你在哪里，安全与分析功能都能帮助你保持安全与更新。',
      'Disable all Dependabot alerts': '禁用所有 Dependabot 警报',
      'Disable all Dependabot security updates': '禁用所有 Dependabot 安全更新',
      'Disable all grouped security updates': '禁用所有分组安全更新',
      'Disable all dependency graph': '禁用所有依赖关系图',
      'Disable all private vulnerability reporting': '禁用所有私密漏洞报告',
      'Disable push protection': '禁用推送保护',
      'Disable push protection for yourself': '为你自己禁用推送保护',
      "You're about to disable Dependabot security updates on all your repositories.":
        '你即将在所有仓库上禁用 Dependabot 安全更新。',
      "You're about to disable grouped security updates on all your repositories.":
        '你即将在所有仓库上禁用分组安全更新。',
      "You're about to disable private vulnerability reporting on all public repositories in whandwh1.":
        '你即将在 whandwh1 的所有公开仓库上禁用私密漏洞报告。',
      "You're about to enable dependency graph on all your private repositories.":
        '你即将在所有私有仓库上启用依赖关系图。',
      "You're about to enable private vulnerability reporting on all public repositories in whandwh1.":
        '你即将在 whandwh1 的所有公开仓库上启用私密漏洞报告。',
      'across all public repositories on GitHub.': '覆盖 GitHub 上的所有公开仓库。'
    },

    /* ---------- 1.38 设置·Copilot（补充） ---------- */
    '设置·Copilot补充': {
      'GitHub Copilot for assistance in GitHub Desktop': 'GitHub Desktop 中的 GitHub Copilot 辅助',
      'GitHub Copilot for assistance in terminal': '终端中的 GitHub Copilot 辅助',
      'Learn more about Copilot in GitHub.com': '详细了解 GitHub.com 上的 Copilot',
      'Learn more about Copilot-generated commit messages.': '详细了解 Copilot 生成的提交信息。',
      'You can use Copilot Chat in GitHub.com. Preview features are only available for paid licenses.':
        '你可以在 GitHub.com 上使用 Copilot 对话。预览功能仅对付费许可证开放。',
      'This setting installs your dotfiles in environments created by Copilot in the cloud and Codespaces.':
        '此设置会在云端 Copilot 和代码空间创建的环境中安装你的 dotfiles。',
      'Copilot can allow or block suggestions matching public code. Learn more about':
        'Copilot 可以允许或阻止匹配公开代码的建议。详细了解',
      'Copilot can answer questions about new trends and give improved answers, via Bing. See':
        'Copilot 可通过 Bing 回答新趋势相关的问题并给出更好的答案。参见',
      'Microsoft Privacy Statement': 'Microsoft 隐私声明',
      'For more information about the data your organization receives regarding your use of GitHub Copilot, please review':
        '有关组织收到的你使用 GitHub Copilot 的数据的更多信息，请查看',
      'You do not belong to any organizations.': '你不属于任何组织。'
    },

    /* ---------- 1.39 仪表盘与 Copilot 应用 ---------- */
    '仪表盘与 Copilot 应用': {
      'Add files, and spaces': '添加文件和空间',
      'Agent': '智能体',
      'An agent-driven desktop experience built natively on GitHub.':
        '原生构建于 GitHub、由智能体驱动的桌面体验。',
      'Ask': '询问',
      'Auto': '自动',
      'Balance': '均衡',
      'Chat commands': '对话命令',
      'Choose a GitHub Copilot app download': '选择要下载的 GitHub Copilot 应用',
      'Debug': '调试',
      'Dismiss banner': '关闭横幅',
      'Download for Windows': '下载 Windows 版',
      'GitHub Desktop now supports multiple accounts per host':
        'GitHub Desktop 现在支持在同一主机上使用多个账户',
      'GitHub Enterprise Server 3.23 release candidate': 'GitHub Enterprise Server 3.23 候选版本',
      'Issue options': '议题选项',
      'Latest from our changelog': '更新日志最新内容',
      'Make Feed your homepage': '将动态设为你的主页',
      'Make Home your homepage': '将首页设为你的主页',
      'Model:': '模型：',
      'No issues found, try a different filter.': '未找到议题，请尝试其他筛选条件。',
      'No pull requests found, try a different filter.': '未找到拉取请求，请尝试其他筛选条件。',
      'Optimized for:': '优化目标：',
      'Pin your favorite repositories to your dashboard': '将你常用的仓库固定到仪表盘',
      'Pull request options': '拉取请求选项',
      'Security advisory permissions are now generally available': '安全公告权限现已全面可用',
      'Send now': '立即发送',
      'The GitHub Copilot app': 'GitHub Copilot 应用',
      'The GitHub Copilot app, New': 'GitHub Copilot 应用（新）',
      'View changelog →': '查看更新日志 →',
      'View token usage': '查看令牌用量',
      'Write code': '编写代码',
      'enter': '回车'
    },
    /* ---------- 1.40 仪表盘与 Copilot 模型选择 ---------- */
    '仪表盘与 Copilot 模型': {
      'AI credits': 'AI 额度',
      'Advanced Git commands': '高级 Git 命令',
      'Ask anything or type @ to add context': '提问，或输入 @ 添加上下文',
      'Ask anything or type @ to add context with Copilot': '提问，或输入 @ 让 Copilot 参与',
      'Balances speed and intelligence': '兼顾速度与智能',
      'Basic Git commands': '基础 Git 命令',
      'Cancel and close': '取消并关闭',
      'Create a profile README': '创建个人资料 README',
      'Dashboard menu': '仪表盘菜单',
      'Dashboard preview options': '仪表盘预览选项',
      'Design a Mermaid architecture overview': '设计一份 Mermaid 架构概览',
      'Edit repositories': '编辑仓库',
      'Efficiency': '效率',
      'Fast and cost-efficient': '快速且成本低',
      'Generate a simple calculator': '生成一个简单计算器',
      'Git branching': 'Git 分支',
      'Intelligence': '智能',
      'Item': '条目',
      'Items will be filtered as you type': '输入时会实时筛选条目',
      'Learn more about Included credits': '详细了解包含额度',
      'Make a Pong game': '制作一个 Pong 游戏',
      'Most powerful at complex tasks': '在复杂任务上最强',
      'Optimized for': '优化目标',
      'Optimized for: Balance': '优化目标：均衡',
      'Prioritizes intelligence': '优先考虑智能',
      'Prioritizes speed and efficiency': '优先考虑速度与效率',
      'Refresh for latest usage': '刷新以获取最新用量',
      'Resets': '重置时间',
      'Select a repository': '选择仓库',
      'Select repositories to attach to conversation': '选择要附加到对话的仓库',
      'Site navigation': '站点导航',
      'Token usage': '令牌用量',
      'Upgrade Copilot plan': '升级 Copilot 套餐',
      'Versatile and highly intelligent': '通用且高度智能',
      'Windows (ARM)': 'Windows（ARM）',
      'Windows (x64)': 'Windows（x64）',
      'macOS (Intel)': 'macOS（Intel）',
      'macOS (Silicon)': 'macOS（Apple 芯片）',
      'provider': '提供商',
      'to access more models and higher limits.': '以获取更多模型和更高限额。'
    },

    /* ---------- 1.41 动态（Feed） ---------- */
    '动态': {
      'Activity you want to see on your feed': '你希望在动态中看到的活动',
      'Add or remove reactions': '添加或移除回应',
      'Add this repository to a list': '将此仓库添加到列表',
      'All reactions': '全部回应',
      'By default, the feed shows events from repositories you sponsor or watch, and people you follow.':
        '默认情况下，动态会展示你赞助或关注的仓库以及你关注的用户的事件。',
      'Create list': '创建列表',
      'Customize filters': '自定义筛选',
      'Events': '事件',
      'Feed item options': '动态条目选项',
      'Filters are loading': '正在加载筛选条件',
      'Follows': '关注',
      'I want to see fewer published releases': '我想少看到一些已发布的发行版',
      'Include events from starred repositories': '包含来自已标星仓库的事件',
      'Issues and pull requests from repositories': '来自仓库的议题和拉取请求',
      'Lists': '列表',
      'Loading your activity...': '正在加载你的动态…',
      'New codespace': '新建代码空间',
      'New project': '新建项目',
      'One moment please...': '请稍候…',
      'Recommendations': '推荐',
      'Recommended for you': '为你推荐',
      'Relevant projects or people that are being sponsored': '正在接受赞助的相关项目或用户',
      'Reload this page': '重新加载此页面',
      'Repositories and people you may like': '你可能会喜欢的仓库和用户',
      'Repositories being starred by people': '用户正在标星的仓库',
      'Repositories that are created or forked by people': '用户创建或复刻的仓库',
      'Repository activity': '仓库活动',
      'Reset to default': '重置为默认',
      'See more': '查看更多',
      'Send feedback': '发送反馈',
      'Show less activity like this': '少显示这类动态',
      'Special discussion posts from repositories': '来自仓库的特别讨论帖',
      'Star this repository': '为此仓库标星',
      'Starred, click to unstar this repository': '已标星，点击可取消标星',
      'Tell us more about your preferences': '告诉我们更多你的偏好',
      'There was an error in loading the activity feed.': '加载动态时出错。',
      'Undo': '撤销',
      'Update posts from repositories': '来自仓库的更新帖',
      'Who people are following': '用户正在关注谁',
      "You don't have any lists yet.": '你还没有任何列表。',
      'released': '已发布',
      'eyes': '关注',
      'heart': '爱心',
      'hooray': '欢呼',
      'laugh': '大笑',
      'rocket': '火箭',
      'thumbs up': '赞',
      'react with eyes': '用「关注」回应',
      'react with heart': '用「爱心」回应',
      'react with hooray': '用「欢呼」回应',
      'react with laugh': '用「大笑」回应',
      'react with rocket': '用「火箭」回应',
      'react with thumbs up': '用「赞」回应'
    },

    /* ---------- 1.42 通知收件箱 ---------- */
    '通知收件箱': {
      'Add new filter': '添加新筛选',
      'All caught up!': '全部处理完了！',
      'Close dialog': '关闭对话框',
      'Date': '日期',
      'Folders': '文件夹',
      'Group by:': '分组方式：',
      'Inbox zero': '收件箱已清空',
      'Manage notifications': '管理通知',
      'Newest to oldest': '最新优先',
      'Not available': '不可用',
      'Notification filters': '通知筛选',
      'Notifications by date': '按日期分组的通知',
      'Oldest to newest': '最早优先',
      'Search for repositories': '搜索仓库',
      'Search notifications': '搜索通知',
      'Sort by:': '排序方式：',
      'Suggestions': '建议',
      'Switch inbox': '切换收件箱',
      'Take a break, write some code, do what you do best.': '休息一下，写点代码，做你最擅长的事。',
      'Team mentioned': '团队被提及',
      'Top repositories': '热门仓库',
      'Watched repositories': '已关注的仓库',
      '✋ Mentioned': '✋ 被提及',
      '🎯 Assigned': '🎯 已指派',
      '👀 Review requested': '👀 请求评审',
      '💬 Participating': '💬 参与中',
      '🙌 Team mentioned': '🙌 团队被提及'
    },

    /* ---------- 1.43 仓库列表 ---------- */
    '仓库列表': {
      'Collapse sidebar': '折叠侧栏',
      'Comfortable display density': '舒适显示密度',
      'Compact display density': '紧凑显示密度',
      'Create view': '创建视图',
      "Don't forget that you can create saved views to keep track of your most important repositories!":
        '别忘了，你可以创建已保存视图来跟踪最重要的仓库！',
      'Filter repositories': '筛选仓库',
      'Open Repository filters': '打开仓库筛选',
      'Relevance': '相关度',
      'Repositories list': '仓库列表',
      'Repositories list display density': '仓库列表显示密度',
      'Repository filters': '仓库筛选',
      'Repository settings': '仓库设置',
      'Search repositories': '搜索仓库',
      'Sort by Relevance descending': '按相关度降序排序',
      'Using a comma within certain filters will aggregate the results. For example:':
        '在部分筛选条件中使用逗号会合并结果。例如：',
      'will show all repositories that have either Go or Ruby as their primary language.':
        '将显示所有以 Go 或 Ruby 为主要语言的仓库。'
    },

    /* ---------- 1.44 设置页残留补充 ---------- */
    '设置·残留补充': {
      'Enable': '启用',
      'Off': '关闭',
      'On': '开启',
      'Update': '更新',
      'Commit comments': '提交评论',
      'Commit comments:': '提交评论：',
      'commit comments': '提交评论',
      'Email address': '邮箱地址',
      'Primary': '主邮箱',
      'Manage email preferences': '管理邮箱偏好',
      'At least one email is required.': '至少需要一个邮箱。',
      'Delete: At least one email is required.': '删除：至少需要一个邮箱。',
      'Allow all verified emails': '允许所有已验证邮箱',
      'Only allow primary email': '仅允许主邮箱',
      'Select email to become backup': '选择要设为备用邮箱的地址',
      'Select email to become primary': '选择要设为主邮箱的地址',
      'Select an email to be used for account-related notifications and can be used for password reset.':
        '选择一个用于接收账户相关通知、并可用于重置密码的邮箱。',
      'Previously authored commits associated with a public email will remain public.':
        '先前用公开邮箱提交的记录仍将保持公开。',
      "We'll remove your public profile email and use": '我们将移除你资料页的公开邮箱，改用',
      'set your email in Git': '在 Git 中设置你的邮箱',
      'Search by username, full name, or email address': '按用户名、全名或邮箱地址搜索',
      'Search by username, full name or email address': '按用户名、全名或邮箱地址搜索',
      'Search by username, full name, or public email': '按用户名、全名或公开邮箱搜索',
      'Select whether animated images should play automatically.': '选择是否自动播放动图。',
      'OAuth Apps': 'OAuth 应用',
      'GitHub Education': 'GitHub 教育',
      'GitHub Sponsors': 'GitHub 赞助',
      'Settings Sync': '设置同步',
      'GPG and VS Code Settings Sync will be available for Codespaces from these repositories.':
        '这些仓库的代码空间将支持 GPG 与 VS Code 设置同步。',
      'GPG signing and VS Code Settings Sync will be available for codespaces for all repositories':
        '所有仓库的代码空间都将支持 GPG 签名与 VS Code 设置同步',
      'GPG signing and VS Code Settings Sync will be available for codespaces from the selected repositories':
        '所选仓库的代码空间将支持 GPG 签名与 VS Code 设置同步',
      'The following repositories will be referenced by GPG verification and Settings Sync.':
        '以下仓库将被 GPG 验证和设置同步引用。',
      'This setting automatically installs your dotfiles in environments created by Codespaces and Copilot cloud agent.':
        '此设置会在代码空间和 Copilot 云智能体创建的环境中自动安装你的 dotfiles。',
      'Disabled by default': '默认禁用',
      'Enabled by default': '默认启用',
      'Choose whether': '选择是否',
      'Learn more about default branches.': '详细了解默认分支。',
      "You don't have any repositories yet. Would you like to": '你还没有任何仓库。要',
      'create one': '创建一个',
      'Block user': '屏蔽用户',
      'Currently blocked': '当前已屏蔽',
      'Find blocked users': '查找已屏蔽用户',
      'Learn more about blocking a user': '详细了解如何屏蔽用户',
      'Add an optional note': '添加可选备注',
      'Additionally, blocked users are not able to:': '此外，被屏蔽的用户无法：',
      'Blocking a user prevents the following on all your repositories:':
        '屏蔽某个用户后，该用户将无法在你所有仓库中执行以下操作：',
      'Close all open issues, pull requests, and discussions opened by this user':
        '关闭该用户创建的所有打开的议题、拉取请求和讨论',
      'Warn me when blocked users have contributed to a repository':
        '当被屏蔽用户对仓库有贡献时提醒我',
      'You can block a user to deny them access to repositories and more.':
        '你可以屏蔽用户，阻止其访问仓库等资源。',
      'You have not blocked anyone.': '你还没有屏蔽任何人。',
      'You are about to block:': '你即将屏蔽：',
      'adding or editing wiki pages': '添加或编辑 wiki 页面',
      "follow your account's public activity": '关注你账号的公开动态',
      'invite you as a collaborator to their repositories': '邀请你作为协作者加入其仓库',
      'opening or commenting on issues or pull requests': '打开议题或拉取请求，或在其下评论',
      'send you notifications by @mentioning your username in public repositories':
        '在公开仓库中 @ 你的用户名给你发送通知',
      'starring, forking, or watching': '标星、复刻或关注',
      'Enable interaction limit to existing users': '对现有用户启用交互限制',
      'Enable interaction limit to prior contributors': '对过去的贡献者启用交互限制',
      'Enable interaction limit to repository collaborators': '对仓库协作者启用交互限制',
      'Enable interaction limits for:': '为以下对象启用交互限制：',
      'Limit to existing users': '限制为现有用户',
      'Limit to prior contributors': '限制为过去的贡献者',
      'Limit to repository collaborators': '限制为仓库协作者',
      'New users': '新用户',
      'Collaborators': '协作者',
      "Interaction limits may already exist in your account's": '你账号的以下位置可能已存在交互限制：',
      '. Any changes here will override those limits.': '。此处的更改将覆盖那些限制。',
      'This may be used to force a "cool-down" period during heated discussions or prevent unwanted interactions.':
        '可用于在讨论激烈时强制一段冷静期，或防止不受欢迎的互动。',
      'Users that are not collaborators of one of your repositories will not be able to interact with that repository.':
        '不是你任一仓库协作者的用户将无法与该仓库互动。',
      'Users that have recently created their account will be unable to interact with your repositories.':
        '最近注册账号的用户将无法与你的仓库互动。',
      'Disable all dependabot self-hosted': '禁用所有自托管 Dependabot',
      'Disable dependabot self-hosted': '禁用自托管 Dependabot',
      'Enable all dependabot self-hosted': '启用所有自托管 Dependabot',
      'Enable dependabot self-hosted': '启用自托管 Dependabot',
      "You're about to disable dependabot self-hosted on all your repositories.":
        '你即将在你所有仓库上禁用自托管 Dependabot。',
      'Enable all Dependabot alerts': '启用所有 Dependabot 警报',
      'Enable all Dependabot security updates': '启用所有 Dependabot 安全更新',
      'Enable all dependency graph': '启用所有依赖关系图',
      'Enable all grouped security updates': '启用所有分组安全更新',
      'Enable all private vulnerability reporting': '启用所有私密漏洞报告',
      'User': '用户'
    },
    /* ---------- 1.45 新建仓库 ---------- */
    '新建仓库': {
      '(required)': '（必填）',
      '.gitignore tells git which files not to track.': '.gitignore 告诉 Git 哪些文件不需要跟踪。',
      'About READMEs': '关于 README',
      'About ignoring files': '关于忽略文件',
      'About licenses': '关于许可证',
      'Add README': '添加 README',
      'Add license': '添加许可证',
      'Choose visibility': '选择可见性',
      'Choose who can see and commit to this repository': '选择谁可以看到并提交到此仓库',
      'Configuration': '配置',
      'Great repository names are short and memorable. How about': '好的仓库名简短易记。不如试试',
      'Have a project elsewhere?': '已有项目在别处？',
      'Import a repository': '导入仓库',
      'Licenses explain how others can use your code.': '许可证说明他人可以如何使用你的代码。',
      'No .gitignore': '不使用 .gitignore',
      'No license': '不使用许可证',
      'READMEs can be used as longer descriptions.': 'README 可用作更长的描述。',
      "Repositories contain a project's files and version history.": '仓库包含项目的文件和版本历史。',
      'Repository owner and name': '仓库所有者和名称',
      'characters': '个字符'
    },
    /* ---------- 1.46 仓库筛选与排序下拉 ---------- */
    '仓库筛选下拉': {
      'Type:': '类型：',
      'Language': '语言',
      'Sources': '源仓库',
      'Mirrors': '镜像',
      'Templates': '模板',
      'Can be sponsored': '可接受赞助',
      'Recently starred': '最近标星',
      'Recently active': '最近活跃',
      'Sort by: Most stars': '排序：星标最多',
      'Sort by: Recently starred': '排序：最近标星',
      'Sort by: Recently active': '排序：最近活跃'
    }
  };

  /* 把分组词库拍平成一张 Map，并补一份小写索引做大小写兜底 */
  const DICT = new Map();
  Object.keys(DICT_SECTIONS).forEach(function (section) {
    const group = DICT_SECTIONS[section];
    Object.keys(group).forEach(function (en) {
      DICT.set(en, group[en]);
    });
  });
  Array.from(DICT.keys()).forEach(function (en) {
    const lower = en.toLowerCase();
    if (!DICT.has(lower)) DICT.set(lower, DICT.get(en));
  });

  /* ============================================================
   * 2. 规则（正则）：时间、数量、可推导的短句
   * ============================================================ */

  const MONTHS = {
    jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
    jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12
  };
  const UNITS = {
    second: '秒', minute: '分钟', hour: '小时',
    day: '天', week: '周', month: '个月', year: '年'
  };

  function agoCount(word) {
    const w = String(word).toLowerCase();
    if (w === 'a' || w === 'an' || w === 'one') return '1';
    return w;
  }

  function agoUnit(word) {
    return UNITS[String(word).toLowerCase()] || '';
  }

  /* "3:04 PM GMT+8" -> "15:04 GMT+8" */
  function formatClock(raw) {
    return String(raw).replace(/\b(\d{1,2}):(\d{2})\s*(AM|PM)\b/i, function (_, h, mi, ap) {
      let hour = parseInt(h, 10) % 12;
      if (/^pm$/i.test(ap)) hour += 12;
      return String(hour).padStart(2, '0') + ':' + mi;
    });
  }

  const NUM = '([\\d.,]+[kKmM]?)';

  const RULES = [
    /* ---- 相对时间 ---- */
    [/^(?:just now|now)$/i, '刚刚'],
    [/^today$/i, '今天'],
    [/^yesterday$/i, '昨天'],
    [/^last week$/i, '上周'],
    [/^last month$/i, '上个月'],
    [/^last year$/i, '去年'],
    [
      /^(?:about\s+)?(\d+|an?|one)\s+(second|minute|hour|day|week|month|year)s?\s+ago$/i,
      function (all, count, unit) {
        if (!agoUnit(unit)) return all;
        return agoCount(count) + ' ' + agoUnit(unit) + '前';
      }
    ],
    [
      /^(?:updated|last updated)\s+(?:about\s+)?(\d+|an?|one)\s+(second|minute|hour|day|week|month|year)s?\s+ago$/i,
      function (all, count, unit) {
        if (!agoUnit(unit)) return all;
        return '更新于 ' + agoCount(count) + ' ' + agoUnit(unit) + '前';
      }
    ],

    /* ---- 绝对日期 ---- */
    [
      /^([A-Z][a-z]{2})\s+(\d{1,2}),?\s+(\d{4})(?:,\s*(.+))?$/,
      function (all, mon, day, year, time) {
        const mo = MONTHS[String(mon).toLowerCase()];
        if (!mo) return all;
        const rest = time ? ' ' + formatClock(time) : '';
        return year + '年' + mo + '月' + day + '日' + rest;
      }
    ],
    [
      /^on\s+([A-Z][a-z]{2})\s+(\d{1,2}),?\s+(\d{4})$/,
      function (all, mon, day, year) {
        const mo = MONTHS[String(mon).toLowerCase()];
        if (!mo) return all;
        return '于 ' + year + '年' + mo + '月' + day + '日';
      }
    ],

    /* ---- 数量 ---- */
    [new RegExp('^' + NUM + '\\s+commits?$', 'i'), '$1 次提交'],
    [new RegExp('^' + NUM + '\\s+contributors?$', 'i'), '$1 位贡献者'],
    [new RegExp('^' + NUM + '\\s+branches?$', 'i'), '$1 个分支'],
    [new RegExp('^' + NUM + '\\s+tags?$', 'i'), '$1 个标签'],
    [new RegExp('^' + NUM + '\\s+releases?$', 'i'), '$1 个发行版'],
    [new RegExp('^' + NUM + '\\s+stars?$', 'i'), '$1 个星标'],
    [new RegExp('^' + NUM + '\\s+forks?$', 'i'), '$1 次复刻'],
    [new RegExp('^' + NUM + '\\s+watching$', 'i'), '$1 人关注'],
    [new RegExp('^' + NUM + '\\s+watchers?$', 'i'), '$1 位关注者'],
    [new RegExp('^' + NUM + '\\s+comments?$', 'i'), '$1 条评论'],
    [new RegExp('^' + NUM + '\\s+files? changed$', 'i'), '$1 个文件变更'],
    [new RegExp('^' + NUM + '\\s+changed files?$', 'i'), '$1 个变更文件'],
    [new RegExp('^' + NUM + '\\s+additions?$', 'i'), '$1 行新增'],
    [new RegExp('^' + NUM + '\\s+deletions?$', 'i'), '$1 行删除'],
    [new RegExp('^' + NUM + '\\s+results?$', 'i'), '$1 个结果'],
    [new RegExp('^' + NUM + '\\s+keys?$', 'i'), '$1 个密钥'],
    [new RegExp('^' + NUM + '\\s+tokens?$', 'i'), '$1 个令牌'],
    [new RegExp('^' + NUM + '\\s+GitHub Apps$', 'i'), '$1 个 GitHub App'],
    [new RegExp('^' + NUM + '\\s+OAuth apps$', 'i'), '$1 个 OAuth 应用'],
    [new RegExp('^' + NUM + '\\s+types$', 'i'), '$1 种类型'],
    [new RegExp('^' + NUM + '\\s+\\(Default\\)$', 'i'), '$1（默认）'],
    [new RegExp('^' + NUM + '% used$', 'i'), '已用 $1%'],
    [new RegExp('^' + NUM + '\\s+verified emails? configured$', 'i'), '已配置 $1 个已验证邮箱'],
    [new RegExp('^' + NUM + '\\s+characters?\\s+remaining\\.?$', 'i'), '还可输入 $1 个字符'],
    [new RegExp('^' + NUM + '\\s+characters?\\s+over\\s+(?:the\\s+)?limit$', 'i'), '已超出 $1 个字符'],
    [new RegExp('^' + NUM + '\\s+commits? ahead$', 'i'), '领先 $1 个提交'],
    [new RegExp('^' + NUM + '\\s+commits? behind$', 'i'), '落后 $1 个提交'],

    /* ---- 短句 ---- */
    [
      /^showing\s+([\d,]+)\s+changed\s+files?\s+with\s+([\d,]+)\s+additions?\s+and\s+([\d,]+)\s+deletions?\.$/i,
      '显示 $1 个变更文件，新增 $2 行，删除 $3 行。'
    ],
    [/^this branch is ([\d,]+) commits? ahead of (.+)\.$/i, '此分支领先 $2 $1 个提交。'],
    [/^this branch is ([\d,]+) commits? behind (.+)\.$/i, '此分支落后 $2 $1 个提交。'],
    [/^forked from (.+)$/i, '复刻自 $1'],
    [
      /^Updated:\s*(.+)$/i,
      function (all, rest) {
        const zh = translateString(String(rest));
        return '更新时间：' + (zh !== null ? zh.trim() : String(rest).trim());
      }
    ],
    [/^page (\d+) of (\d+)$/i, '第 $1 页，共 $2 页'],

    /* ---- 问候语（仪表盘顶部，名字是动态的） ---- */
    [
      /^Good (morning|afternoon|evening), (.+?)!$/,
      function (all, period, name) {
        const greet = { morning: '早上好', afternoon: '下午好', evening: '晚上好' }[period];
        if (!greet) return all;
        return greet + '，' + name + '！';
      }
    ],

    /* ---- 快捷键序列，如 "g then d" ---- */
    [
      /^([a-z0-9]|shift|ctrl|alt|esc|enter|tab|command) then ([a-z0-9]|shift|ctrl|alt|esc|enter|tab|command)$/i,
      '$1 然后 $2'
    ],

    /* ---- PR 收件箱分组：单数/复数所有格都覆盖 ---- */
    [/^Needs your teams?' review$/i, '需要你团队评审'],

    /* ---- 仓库卡片计数："940 stars in owner/repo" ---- */
    [
      /^([\d.,]+[kKmM]?) (forks|issues|pull requests|stars) in (.+)$/,
      function (all, count, unit, repo) {
        const t = {
          forks: '次复刻',
          issues: '个议题',
          'pull requests': '个拉取请求',
          stars: '个星标'
        }[unit];
        return t ? repo + ' 有 ' + count + ' ' + t : all;
      }
    ],

    /* ---- 回应 / 标星计数 ---- */
    [
      /^(\d+) (?:person|people) reacted with (.+)$/i,
      function (all, n, name) {
        const map = {
          'thumbs up': '赞',
          heart: '爱心',
          hooray: '欢呼',
          laugh: '大笑',
          eyes: '关注',
          rocket: '火箭'
        };
        return n + ' 人用「' + (map[name.toLowerCase()] || name) + '」回应';
      }
    ],
    [/^(\d+) reactions?$/i, '$1 个回应'],
    [/^(\d+) stargazers$/i, '$1 人标星'],

    /* ---- 动态里「已忽略」的反馈提示 ---- */
    [
      /^Dismissed a (recommendation|release|repository) from (.+?)\. Thank you for the feedback!$/,
      function (all, kind, name) {
        const t = { recommendation: '推荐', release: '发行版', repository: '仓库' }[kind];
        return t ? '已忽略来自 ' + name + ' 的' + t + '。感谢你的反馈！' : all;
      }
    ],
    [/^I'm not interested in published releases from (.+)$/i, '我对 $1 发布的发行版不感兴趣'],
    [/^I'm not interested in (.+)$/i, '我对 $1 不感兴趣'],

    /* ---- 图表标签 / 列表计数 ---- */
    [/^(.+)'s past year of commit activity$/i, '$1 过去一年的提交活动'],
    [/^Release interactions (\d+)$/i, '发行版互动 $1'],
    [/^Release Contributors (\d+)$/i, '发行版贡献者 $1'],
    [/^Included credits: (\d+)% used$/i, '包含额度：已用 $1%'],
    [/^Selected (\d+) repositories?\.$/i, '已选择 $1 个仓库。'],
    [/^No recoverable packages were found for (.+)\.$/i, '未找到 $1 的可恢复包。'],
    [/^Open type options for (.+)$/i, '打开 $1 的类型选项'],
    [/^View actions for (.+) budget for Account (.+)$/i, '查看账户 $2 的 $1 预算操作'],
    [
      /^View details of session from (.+?) last accessed (.+)$/i,
      '查看来自 $1 的会话详情（最后访问于 $2）'
    ],
    [/^(\d+) repositories?$/i, '$1 个仓库'],

    /* ---- 时长 ---- */
    [
      /^(\d+) (hour|day|week|month)s?$/i,
      function (all, n, unit) {
        const t = { hour: '小时', day: '天', week: '周', month: '个月' }[unit.toLowerCase()];
        return t ? n + ' ' + t : all;
      }
    ],

    /* ---- 完整月份 + 时间，如 "November 22, 2026 07:15" ---- */
    [
      /^([A-Z][a-z]+) (\d{1,2}), (\d{4}) (\d{1,2}:\d{2})$/,
      function (all, mon, day, year, time) {
        const mo = MONTHS[mon.slice(0, 3).toLowerCase()];
        return mo ? year + '年' + mo + '月' + day + '日 ' + time : all;
      }
    ],

    /* ---- "on Dec 1" ---- */
    [
      /^on ([A-Z][a-z]{2}) (\d{1,2})$/,
      function (all, mon, day) {
        const mo = MONTHS[mon.toLowerCase()];
        return mo ? '于 ' + mo + ' 月 ' + day + ' 日' : all;
      }
    ]
  ];

  /* ============================================================
   * 3. 文本翻译核心
   * ============================================================ */

  function normalize(s) {
    return String(s)
      .replace(/[\u200b-\u200d\ufeff]/g, '')
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201c\u201d]/g, '"')
      .replace(/\u00a0/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /* ---------- 3.1 未覆盖文案的跨页面收集 ---------- */

  function pageKey() {
    if (typeof location === 'undefined' || !location.pathname) return '/';
    const parts = location.pathname.split('/').filter(Boolean);
    return '/' + parts.slice(0, 2).join('/');
  }

  let gapBuf = new Set();
  let gapTimer = null;

  function flushGaps() {
    gapTimer = null;
    if (!gapBuf.size) return;
    try {
      const raw = localStorage.getItem(GAP_KEY);
      const db = raw ? JSON.parse(raw) : {};
      const key = pageKey();
      const bucket = db[key] || {};
      gapBuf.forEach(function (t) {
        if (Object.keys(bucket).length < 400 && !bucket[t]) bucket[t] = 1;
      });
      db[key] = bucket;
      localStorage.setItem(GAP_KEY, JSON.stringify(db));
    } catch (err) {
      /* 隐私模式下 localStorage 可能不可用 */
    }
    gapBuf = new Set();
  }

  /** 记下一条「英文但没翻译」的文案，稍后批量写入 localStorage */
  function noteGap(text) {
    if (!text || text.length > 120) return;
    gapBuf.add(text);
    if (gapTimer) return;
    gapTimer = setTimeout(flushGaps, 1500);
  }

  function readGaps() {
    try {
      const raw = localStorage.getItem(GAP_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (err) {
      return {};
    }
  }

  /* ---------- 3.2 导出面板 ---------- */

  let panelEl = null;

  function copyText(text) {
    if (typeof GM_setClipboard === 'function') {
      try {
        GM_setClipboard(text, 'text');
        return true;
      } catch (err) {
        /* 继续尝试其它方式 */
      }
    }
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text);
        return true;
      }
    } catch (err) {
      /* 忽略 */
    }
    return false;
  }

  function flash(btn, text) {
    const old = btn.textContent;
    btn.textContent = text;
    setTimeout(function () {
      btn.textContent = old;
    }, 1200);
  }

  /** 页面右下角弹一个只读面板，直接显示要复制的内容 */
  function showPanel(title, text) {
    if (panelEl && panelEl.parentNode) panelEl.parentNode.removeChild(panelEl);

    const wrap = document.createElement('div');
    wrap.className = 'ghzh-ui';
    wrap.style.cssText =
      'position:fixed;right:16px;bottom:16px;z-index:2147483647;width:560px;' +
      'max-width:calc(100vw - 32px);background:#1f2328;color:#e6edf3;' +
      'border:1px solid #3d444d;border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.45);' +
      'font:13px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;overflow:hidden';

    const head = document.createElement('div');
    head.style.cssText =
      'display:flex;align-items:center;gap:8px;padding:10px 12px;' +
      'border-bottom:1px solid #3d444d;background:#262c36';

    const titleEl = document.createElement('span');
    titleEl.textContent = title;
    titleEl.style.cssText =
      'flex:1;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis';

    const btnStyle =
      'background:#21262d;color:#e6edf3;border:1px solid #3d444d;border-radius:6px;' +
      'padding:3px 10px;font-size:12px;cursor:pointer';

    const area = document.createElement('textarea');
    area.readOnly = true;
    area.value = text;
    area.style.cssText =
      'display:block;width:100%;height:300px;box-sizing:border-box;resize:vertical;' +
      'border:0;outline:0;background:#0d1117;color:#e6edf3;padding:10px 12px;' +
      'font:12px/1.5 ui-monospace,SFMono-Regular,Consolas,monospace';

    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.textContent = '复制';
    copyBtn.style.cssText = btnStyle;
    copyBtn.addEventListener('click', function () {
      area.focus();
      area.select();
      let ok = false;
      try {
        ok = document.execCommand('copy');
      } catch (err) {
        ok = false;
      }
      if (!ok) ok = copyText(text);
      flash(copyBtn, ok ? '已复制' : '请按 Ctrl+C');
    });

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.textContent = '关闭';
    closeBtn.style.cssText = btnStyle;
    closeBtn.addEventListener('click', function () {
      wrap.remove();
      panelEl = null;
    });

    head.append(titleEl, copyBtn, closeBtn);
    wrap.append(head, area);
    document.body.appendChild(wrap);
    panelEl = wrap;

    area.focus();
    area.select();

    return wrap;
  }

  function translateString(raw) {
    if (!raw) return null;

    const m = /^(\s*)([\s\S]*?)(\s*)$/.exec(raw);
    if (!m) return null;
    const lead = m[1];
    const body = m[2];
    const tail = m[3];
    if (!body) return null;

    const norm = normalize(body);
    if (!norm || norm.length > MAX_LEN) return null;
    if (!/[A-Za-z]/.test(norm)) return null;
    if (CJK_RE.test(norm)) return null;
    // owner/repo、分支名、包名等原样保留
    if (/^[\w.@-]+\/[\w.@-]+$/.test(norm)) return null;

    let out = DICT.get(norm);
    if (out === undefined) out = DICT.get(norm.toLowerCase());

    // 兼容「标题 + 分隔符」粘在同一个文本节点的写法，如 "Security policy ·"
    if (out === undefined) {
      const core = norm.replace(/\s*[·•|]\s*$/, '');
      if (core !== norm && core) {
        const hit = DICT.get(core) || DICT.get(core.toLowerCase());
        if (typeof hit === 'string') out = hit + norm.slice(core.length);
      }
    }

    if (out === undefined) {
      for (let i = 0; i < RULES.length; i++) {
        const rule = RULES[i];
        if (!rule[0].test(norm)) continue;
        const candidate = norm.replace(rule[0], rule[1]);
        if (typeof candidate === 'string' && candidate && candidate !== norm) {
          out = candidate;
          break;
        }
      }
    }

    if (typeof out !== 'string' || !out || out === norm) {
      noteGap(norm);
      return null;
    }
    return lead + out + tail;
  }

  /* ============================================================
   * 4. DOM 扫描
   * ============================================================ */

  const SKIP_TAGS = new Set([
    'SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'PRE', 'CODE', 'KBD', 'SAMP',
    'VAR', 'SVG', 'MATH', 'CANVAS', 'IFRAME', 'TEXTAREA', 'OBJECT', 'EMBED',
    'HEAD', 'TITLE', 'META', 'LINK'
  ]);

  // 这些容器里放的是用户内容或代码，绝不能翻译
  const SKIP_CLASS_RE = /(?:^|\s)(?:markdown-body|comment-body|readme|blob-code|react-code-text|cm-editor|CodeMirror|highlight|diff-table|js-file-line-container|blob-wrapper|commit-message|commit-title|markdown-title|js-issue-title|repository-meta-content|ghzh-ui)(?:\s|$)/;

  const SKIP_SELECTOR = [
    'pre', 'code', 'kbd', 'samp', 'var', 'svg', 'math', 'canvas', 'iframe',
    'textarea', 'script', 'style', 'noscript', 'template',
    '.markdown-body', '.comment-body', '.readme', '.blob-code', '.react-code-text',
    '.cm-editor', '.CodeMirror', '.highlight', '.diff-table', '.js-file-line-container',
    '.blob-wrapper', '.commit-message', '.commit-title', '.markdown-title',
    '.js-issue-title', '.repository-meta-content'
  ].join(',');

  function isSkipped(el) {
    if (!el || el.nodeType !== 1) return false;
    if (SKIP_TAGS.has(el.tagName)) return true;

    const cls = el.getAttribute('class');
    if (cls && SKIP_CLASS_RE.test(cls)) return true;

    if (el.getAttribute('data-ghzh-skip') !== null) return true;
    if (el.getAttribute('contenteditable') === 'true') return true;
    if (el.getAttribute('itemprop') === 'description') return true;
    if (el.getAttribute('data-testid') === 'code-viewer') return true;

    return false;
  }

  // 指向文件、目录、提交、议题或 PR 详情的链接，文字属于用户内容
  const HREF_SKIP_RE = /\/(?:commit|blob|tree|raw|blame)\/|\/(?:issues|pull|discussions)\/\d+|\/releases\/tag\/[\w.-]+/;

  // 仓库名 / 用户名 / 议题标题等，避免误译
  function isNameContainer(el) {
    if (!el || el.nodeType !== 1) return false;

    const hover = el.getAttribute('data-hovercard-type');
    if (hover === 'repository' || hover === 'user' || hover === 'organization') return true;
    if (el.getAttribute('itemprop') === 'name') return true;

    const cls = el.getAttribute('class');
    if (cls && /(?:^|\s)(?:author|repo-name)(?:\s|$)/.test(cls)) return true;

    if (el.tagName === 'A') {
      const href = el.getAttribute('href');
      if (href && HREF_SKIP_RE.test(href)) return true;
    }

    return false;
  }

  const textCache = new WeakMap(); // Text -> 我们最后写入的文本
  const attrCache = new WeakMap(); // Element -> { attr: 译文 }

  function handleText(node) {
    if (!node || node.nodeType !== 3) return;

    const cur = node.nodeValue;
    if (!cur || !cur.trim()) return;
    if (textCache.get(node) === cur) return; // 是我们自己写的，跳过

    const out = translateString(cur);
    if (out == null) return;

    textCache.set(node, out);
    node.nodeValue = out;
  }

  const ATTRS = ['aria-label', 'title', 'placeholder', 'alt', 'data-confirm'];

  function attrCacheOf(el) {
    let cache = attrCache.get(el);
    if (!cache) {
      cache = Object.create(null);
      attrCache.set(el, cache);
    }
    return cache;
  }

  function handleAttrs(el) {
    if (!el.hasAttributes()) return;

    const cache = attrCacheOf(el);

    for (let i = 0; i < ATTRS.length; i++) {
      const name = ATTRS[i];
      const raw = el.getAttribute(name);
      if (!raw || raw.length > MAX_LEN) continue;
      if (cache[name] === raw) continue;

      const out = translateString(raw);
      if (!out) continue;

      cache[name] = out;
      el.setAttribute(name, out);
    }

    if (el.tagName === 'INPUT') {
      const type = (el.getAttribute('type') || '').toLowerCase();
      if (type === 'submit' || type === 'button' || type === 'reset') {
        const raw = el.getAttribute('value');
        if (raw && raw.length <= MAX_LEN && cache.value !== raw) {
          const out = translateString(raw);
          if (out) {
            cache.value = out;
            el.setAttribute('value', out);
          }
        }
      }
    }
  }

  function scanElement(root) {
    const stack = [root];

    while (stack.length) {
      const el = stack.pop();
      if (!el || el.nodeType !== 1) continue;

      if (isNameContainer(el)) continue;

      handleAttrs(el);

      for (let n = el.firstChild; n; n = n.nextSibling) {
        if (n.nodeType === 3) handleText(n);
      }

      const children = el.children;
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (isSkipped(child)) {
          // 输入框内容不翻译，但它的 placeholder 属于界面文案
          if (child.tagName === 'TEXTAREA') handleAttrs(child);
          continue;
        }
        stack.push(child);
      }
    }
  }

  function scan(root) {
    if (!root) return;

    if (root.nodeType === 3) {
      const parent = root.parentElement;
      if (!parent) return;
      if (isSkipped(parent) || isNameContainer(parent)) return;
      if (parent.closest(SKIP_SELECTOR)) return;
      handleText(root);
      return;
    }

    if (root.nodeType !== 1) return;
    if (isSkipped(root) || isNameContainer(root)) return;

    const parent = root.parentElement;
    if (parent && parent.closest(SKIP_SELECTOR)) return;

    scanElement(root);
  }

  /* ============================================================
   * 5. 调度：批量处理，避免频繁重排
   * ============================================================ */

  const pending = new Set();
  let scheduled = false;

  const idle = window.requestIdleCallback
    ? function (fn) { window.requestIdleCallback(fn, { timeout: 500 }); }
    : function (fn) { window.setTimeout(fn, 30); };

  function flush() {
    scheduled = false;
    const roots = Array.from(pending);
    pending.clear();

    for (let i = 0; i < roots.length; i++) {
      const node = roots[i];
      if (!node || !node.isConnected) continue;
      try {
        scan(node);
      } catch (err) {
        /* 单个节点出错不影响整体 */
      }
    }
  }

  function schedule(root) {
    if (!root) return;
    pending.add(root);
    if (scheduled) return;
    scheduled = true;
    idle(flush);
  }

  /* ============================================================
   * 6. 动态内容监听
   * ============================================================ */

  function onMutations(mutations) {
    for (let i = 0; i < mutations.length; i++) {
      const mu = mutations[i];

      if (mu.type === 'characterData') {
        if (mu.target && mu.target.nodeType === 3) schedule(mu.target);
        continue;
      }

      const added = mu.addedNodes;
      if (!added || !added.length) continue;

      for (let j = 0; j < added.length; j++) {
        const node = added[j];
        if (node.nodeType === 1 || node.nodeType === 3) schedule(node);
      }
    }
  }

  function startObserver() {
    const observer = new MutationObserver(onMutations);
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  /* ============================================================
   * 7. 页面导航（Turbo / PJAX / history）
   * ============================================================ */

  function translateTitle() {
    const title = document.title;
    if (!title || title.indexOf(' · ') === -1) return;

    const parts = title.split(' · ');
    const head = parts[0];
    if (!head || CJK_RE.test(head)) return;

    const zh = DICT.get(head) || DICT.get(head.toLowerCase());
    if (!zh) return;

    parts[0] = zh;
    document.title = parts.join(' · ');
  }

  function onNavigate() {
    schedule(document.body);
    window.setTimeout(translateTitle, 80);
  }

  function hookNavigation() {
    const events = [
      'turbo:load', 'turbo:render', 'turbo:frame-load', 'turbo:frame-render',
      'pjax:end', 'soft-nav:end', 'soft-nav:progress-bar:done'
    ];

    events.forEach(function (name) {
      document.addEventListener(name, onNavigate, true);
    });

    ['pushState', 'replaceState'].forEach(function (name) {
      const original = history[name];
      if (typeof original !== 'function') return;
      history[name] = function () {
        const result = original.apply(this, arguments);
        onNavigate();
        return result;
      };
    });

    window.addEventListener('popstate', onNavigate);
  }

  /* ============================================================
   * 8. 菜单 / 调试接口
   * ============================================================ */

  function registerMenu() {
    if (typeof GM_registerMenuCommand !== 'function') return;

    GM_registerMenuCommand(enabled ? '暂停汉化（刷新后生效）' : '开启汉化（刷新后生效）', function () {
      writeFlag(!enabled);
      location.reload();
    });

    GM_registerMenuCommand('重新翻译当前页面', function () {
      schedule(document.body);
      translateTitle();
    });

    GM_registerMenuCommand('审计本页未翻译文案（复制到剪贴板）', function () {
      if (!window.__ghzh || !window.__ghzh.audit) {
        alert('请先开启汉化（脚本当前处于暂停状态）。');
        return;
      }
      try {
        window.__ghzh.audit();
      } catch (err) {
        alert('审计失败：' + (err && err.message ? err.message : err));
      }
    });

    GM_registerMenuCommand('导出未翻译汇总（跨页面，复制到剪贴板）', function () {
      if (!window.__ghzh || !window.__ghzh.report) {
        alert('请先开启汉化（脚本当前处于暂停状态）。');
        return;
      }
      try {
        window.__ghzh.report();
      } catch (err) {
        alert('导出失败：' + (err && err.message ? err.message : err));
      }
    });

    GM_registerMenuCommand('清空未翻译汇总', function () {
      if (window.__ghzh && window.__ghzh.clearGaps) {
        window.__ghzh.clearGaps();
        console.log('[ghzh] 已清空未翻译汇总');
      }
    });
  }

  /* ============================================================
   * 9. 启动
   * ============================================================ */

  registerMenu();

  if (enabled) {
    document.documentElement.lang = 'zh-CN';

    startObserver();
    hookNavigation();

    schedule(document.body);
    translateTitle();

    window.__ghzh = {
      rescan: function () {
        schedule(document.body);
        translateTitle();
      },
      disable: function () {
        writeFlag(false);
        location.reload();
      },
      /**
       * 审计当前页面：列出「看起来是界面文案、但词库没覆盖」的英文片段。
       * 用法：__ghzh.audit()，结果打印到控制台并复制到剪贴板。
       */
      audit: function () {
        const hit = new Map();
        const stack = [document.body];

        while (stack.length) {
          const el = stack.pop();
          if (!el || el.nodeType !== 1) continue;
          if (isSkipped(el) || isNameContainer(el)) continue;

          for (let n = el.firstChild; n; n = n.nextSibling) {
            if (n.nodeType !== 3) continue;
            const raw = n.nodeValue;
            if (!raw || !raw.trim()) continue;

            const norm = normalize(raw);
            if (!norm || norm.length < 2 || norm.length > MAX_LEN) continue;
            if (!/[A-Za-z]/.test(norm) || CJK_RE.test(norm)) continue;
            if (/^[\w.@-]+\/[\w.@-]+$/.test(norm)) continue;
            if (translateString(raw) !== null) continue;

            hit.set(norm, (hit.get(norm) || 0) + 1);
          }

          const kids = el.children;
          for (let i = 0; i < kids.length; i++) stack.push(kids[i]);
        }

        const list = Array.from(hit.keys()).sort();
        console.log('[ghzh] 未覆盖的英文文案：' + list.length + ' 条');
        list.forEach(function (s, i) {
          console.log('  ' + (i + 1) + '. ' + s);
        });

        const json = JSON.stringify(list, null, 2);
        copyText(json);
        showPanel('本页未翻译 · ' + list.length + ' 条', json);
        console.log('[ghzh] 已弹出面板，点「复制」或直接 Ctrl+C');

        return list;
      },
      /**
       * 汇总所有访问过的页面里「没翻译」的文案，按页面路径分组。
       * 用法：__ghzh.report()，结果打印到控制台并复制到剪贴板。
       */
      report: function () {
        flushGaps();
        const db = readGaps();
        const summary = {};
        let total = 0;

        let stale = 0;
        Object.keys(db).sort().forEach(function (key) {
          const all = Object.keys(db[key]);
          // 只保留「当前版本仍未覆盖」的，历史记录自动过滤掉
          const list = all
            .filter(function (s) {
              return translateString(s) === null;
            })
            .sort();
          stale += all.length - list.length;
          if (!list.length) return;
          summary[key] = list;
          total += list.length;
        });

        console.log('[ghzh] 未翻译汇总：' + total + ' 条，来自 ' + Object.keys(summary).length + ' 个页面');
        if (stale) console.log('[ghzh] 已自动过滤 ' + stale + ' 条旧记录（已被当前词库覆盖）');

        if (!total) {
          const tip = '暂无记录。请先在设置里打开几个子页面（脚本会自动记录没翻到的英文），再回来导出。';
          showPanel('未翻译汇总 · 0 条', tip);
          return summary;
        }
        Object.keys(summary).forEach(function (key) {
          console.log('\n' + key + '（' + summary[key].length + ' 条）');
          summary[key].forEach(function (s, i) {
            console.log('  ' + (i + 1) + '. ' + s);
          });
        });

        const json = JSON.stringify(summary, null, 2);
        copyText(json);
        showPanel('未翻译汇总 · ' + total + ' 条 / ' + Object.keys(summary).length + ' 个页面', json);
        console.log('[ghzh] 已弹出面板，点「复制」或直接 Ctrl+C');

        return summary;
      },
      clearGaps: function () {
        try {
          localStorage.removeItem(GAP_KEY);
        } catch (err) {}
        gapBuf = new Set();
        return true;
      },
      dict: DICT,
      sections: DICT_SECTIONS,
      translate: translateString
    };
  }
})();
