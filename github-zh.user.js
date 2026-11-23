// ==UserScript==
// @name         GitHub 汉化 · 中文化插件
// @name:en      GitHub Chinese Localization
// @namespace    https://github.com/gh-zh-unofficial
// @version      1.0.6
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
  const CJK_RE = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\u3040-\u30ff]/;
  const MAX_LEN = 150; // 超过这个长度的文本多半是用户内容，不翻译

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
      'Discussions': '讨论',
      'Packages': '包',
      'Releases': '发行版',
      'Contributors': '贡献者',
      'Languages': '语言',
      'Activity': '活动',
      'Custom properties': '自定义属性',
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
      'These branches can be automatically merged.': '这些分支可以自动合并。'
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

    /* ---------- 1.12 通知 ---------- */
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
    [new RegExp('^' + NUM + '\\s+characters?\\s+remaining$', 'i'), '还可输入 $1 个字符'],
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
    [/^page (\d+) of (\d+)$/i, '第 $1 页，共 $2 页']
  ];

  /* ============================================================
   * 3. 文本翻译核心
   * ============================================================ */

  function normalize(s) {
    return String(s)
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201c\u201d]/g, '"')
      .replace(/\u00a0/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
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

    if (typeof out !== 'string' || !out || out === norm) return null;
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
      dict: DICT,
      sections: DICT_SECTIONS,
      translate: translateString
    };
  }
})();
