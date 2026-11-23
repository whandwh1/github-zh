# GitHub 汉化 · 中文化插件

一个给 **Tampermonkey / Violentmonkey（油猴）** 用的 GitHub 界面汉化脚本：把 GitHub 上的英文界面换成简体中文，同时**绝不碰你的 README、代码、提交信息和仓库名**。

- 脚本文件：`github-zh.user.js`
- 版本：1.3.6
- 适用范围：`github.com`、`gist.github.com`
- 词库：47 个分组、1759 条词条，另有 20+ 条正则规则处理时间、数量、短句

## 效果示例

| 原文 | 汉化后 |
| --- | --- |
| Pull requests / Issues | 拉取请求 / 议题 |
| Star / Fork / Watch | 星标 / 复刻 / 关注 |
| Files changed | 文件变更 |
| 3 days ago | 3 天前 |
| 1,234 commits | 1,234 次提交 |
| Nov 20, 2026, 3:04 PM GMT+8 | 2026年11月20日 15:04 GMT+8 |
| There aren’t any open issues. | 没有打开的议题。 |

## 安装

### 方式一：从 GitHub 地址安装（推荐，可自动更新）

浏览器装好 Tampermonkey 后，直接打开仓库里的 raw 地址：

```
https://raw.githubusercontent.com/<你的用户名>/<仓库名>/main/github-zh.user.js
```

Tampermonkey 会弹出安装页，点**安装**即可。首次安装后，脚本头部的 `@updateURL` / `@downloadURL` 会指向这个地址，之后的版本更新由 Tampermonkey 自动完成，不需要再手动导入。

### 方式二：粘贴（不自动更新）

1. 点扩展图标 → **添加新脚本**。
2. 把编辑器里的模板全部删掉，粘贴 `github-zh.user.js` 的完整内容。
3. `Ctrl + S` 保存，打开 GitHub 刷新页面即可。

> 粘贴安装的副本没有更新地址，只能靠重新粘贴升级。想省事就用方式一。

### 方式三：导入文件

Tampermonkey 管理面板 → **实用工具 / Utilities** → **从文件导入 / Import from file** → 选择 `github-zh.user.js`。

> 直接把 `.user.js` 拖进浏览器窗口在部分浏览器会被当成普通文件打开（尤其 `file://`），此时用方式一。

## 自动更新怎么工作

- 脚本头部有两行地址：

  ```js
  // @updateURL    https://raw.githubusercontent.com/<用户名>/<仓库名>/main/github-zh.user.js
  // @downloadURL  https://raw.githubusercontent.com/<用户名>/<仓库名>/main/github-zh.user.js
  ```

- Tampermonkey 默认**每 24 小时**检查一次；在扩展设置里可以改短（如 1 小时）。
- 手动检查：Tampermonkey 面板 → 已安装脚本列表 → 点该脚本的**检查更新**，或脚本页里的「更新」。
- 判断依据是 `@version`：只有新版**大于**已装版本才会更新，所以每次发版都要改这个数字（当前 `1.0.6`）。
- raw 地址有约 5 分钟的 CDN 缓存，推完等 1～2 分钟再去检查更新。

> 如果所在网络访问 `raw.githubusercontent.com` 不稳定，可把 `@updateURL` / `@downloadURL` 换成 jsDelivr：`https://cdn.jsdelivr.net/gh/<用户名>/<仓库名>@main/github-zh.user.js`。代价是分支引用有约 12 小时缓存，更新会更慢。

## 发布到你自己的仓库

1. 在 GitHub 新建一个**空的公开仓库**（不要勾 README / .gitignore / license，否则首次推送会被拒）。

   > 必须是公开仓库：私有仓库的 raw 地址需要带 token，Tampermonkey 取不到。

2. 在本目录执行：

   ```bash
   bash setup.sh <你的GitHub用户名> [仓库名，默认 github-zh]
   ```

   脚本会做四件事：把 `__GH_OWNER__` / `__GH_REPO__` 占位符替换成你的用户名和仓库名、初始化本地仓库、提交、推送。

   > Windows 上如果仓库已经初始化好、只差推送，直接双击 `push.bat` 即可，它只执行 `git push -u origin main`。

3. 推送成功后按提示用 raw 地址安装一次，之后就能自动更新了。

## 使用

脚本默认开启。点 Tampermonkey 图标，在菜单里可以看到：

- **暂停汉化（刷新后生效）** —— 临时回到英文界面
- **重新翻译当前页面** —— 手动重扫一次（一般不需要）
- **审计本页未翻译文案（复制到剪贴板）** —— 把当前页还没覆盖的英文列出来
- **导出未翻译汇总（跨页面，复制到剪贴板）** —— 把浏览过的所有页面里没翻到的文案，按路径分组导出
- **清空未翻译汇总** —— 重置这份累计清单

开关状态存在 `localStorage` 的 `ghzh:enabled` 里，换浏览器/清除站点数据后会恢复默认开启。

调试接口（控制台可用）：

```js
__ghzh.rescan()            // 重新翻译当前页
__ghzh.translate('Issues') // 试翻译单个字符串
__ghzh.audit()             // 列出本页未覆盖的英文文案（并复制到剪贴板）
__ghzh.report()            // 汇总浏览过的所有页面里未覆盖的文案，按路径分组
__ghzh.clearGaps()         // 清空这份累计汇总
__ghzh.dict                // 完整词典（Map）
__ghzh.sections            // 按分组的原始词库
```

## 覆盖范围

- **全局导航与页脚**：搜索框、Dashboard、通知、账号菜单、页脚链接
- **仓库页**：Code / Issues / Pull requests / Actions / Projects / Wiki / Security / Insights 标签、About 侧栏、语言统计、Releases
- **代码浏览**：Go to file、Add file、分支/标签切换、文件操作菜单、Blame、Raw
- **提交与差异**：提交列表、父提交、Verified、文件变更统计、Split/Unified、隐藏空白
- **议题 / 拉取请求**：标签、里程碑、指派、评审状态、合并按钮、空状态提示
- **用户状态弹窗**：编辑状态、快捷状态（休假 / 生病 / 居家办公 / 专注）、Busy、过期时间、可见范围、字数提示
- **讨论、Actions、项目、包**
- **个人主页、通知中心、搜索页**
- **设置页（细分到子页面）**：个人资料 / 账户 / 外观 / 无障碍 / 通知 / 账单 / 邮箱 / 密码与双重验证 / 会话 / SSH 与 GPG 密钥 / 组织 / 仓库 / 代码空间 / 应用 / 开发者设置（令牌、权限、Webhook）/ 内容管理 / 已保存的回复 / 危险区域
- **表单与状态提示**：保存中、出错、必填校验、确认删除、保存成功、空结果
- **动态内容**：Turbo 局部刷新、React 二次渲染、无限滚动加载出来的节点

**有意不翻译的**：时区名（`(GMT+08:00) Beijing` 这类 180+ 条下拉数据）、ISO 639 语言名、用户数据（账号、邮箱、设备名、仓库名）、代码与 SVG 片段。这些是数据而非界面文案，硬翻反而会影响选择和识别。

## 设计取舍：为什么不做整句机翻

GitHub 页面上大量文本是**用户内容**——README、issue 正文、评论、提交信息、仓库名、分支名、代码。一旦做模糊的整句替换，很容易把代码或文案改坏。

所以脚本的策略是：

1. **整段精确匹配**：文本节点去掉首尾空白后，与词库或规则**完全相等**才翻译。
2. **主动跳过用户区域**：`.markdown-body`、`pre/code`、`.blob-code`、CodeMirror、`.commit-message`、`[data-hovercard-type=repository]`（仓库名）、`itemprop=name`（用户名）、`contenteditable`，以及指向具体内容的链接（`/blob/`、`/tree/`、`/commit/`、`/issues/123` 这类带数字 ID 的详情页）。
3. **长得像代码/路径的不碰**：长度 > 200 字符、包含中文、匹配 `owner/repo` 形态的字符串直接放行。

> 链接过滤只认数字 ID：`/issues/assigned` 是筛选项、要翻译，`/issues/123` 是议题标题、要放过。

代价是长句子（比如帮助文案）仍然是英文；换来的是不会破坏任何内容。

## 自定义词条

打开 `github-zh.user.js`，第 1 节的 `DICT_SECTIONS` 按页面区域分组，往对应组里加一行即可：

```js
'仓库': {
  'Your new label': '你的新标签',
  // ...
}
```

需要处理"带变量的句子"时，改第 2 节的 `RULES`（正则 + 替换串或回调）：

```js
[new RegExp('^' + NUM + '\\s+pull requests?$', 'i'), '$1 个拉取请求'],
```

> 注意：`String.replace` 的**回调参数是** `(整段匹配, 分组1, 分组2, ...)`，不是数组；回调若无法翻译请返回整段匹配原文，不要返回 `null`（会被转成字符串 `"null"`）。

改完保存，刷新 GitHub 生效。

## 实现要点

```
页面加载 ──► 全量扫描 ──► 文本节点/属性 → 匹配词库/正则 → 写回
                │
                ├─ MutationObserver 监听新增节点与文本变化
                ├─ turbo:load / pjax:end / soft-nav:end 重新扫描
                └─ 劫持 history.pushState / replaceState + popstate
```

- **栈式遍历**而不是 `TreeWalker`：遇到跳过容器直接不入栈，避免对 `.markdown-body` 里成千上万个节点做无谓判断。
- **WeakMap 缓存**记录"我们写进去的译文"，既避免重复翻译，也避免与 MutationObserver 形成自激循环。
- **批量调度**：变更先入 `Set`，用 `requestIdleCallback`（不支持则 `setTimeout`）合并成一次扫描。
- **属性也会翻译**：`aria-label`、`title`、`placeholder`、`alt`、`data-confirm`，以及按钮的 `value`。

## 测试

```bash
# 翻译引擎单测（无需依赖）
node test/smoke.mjs

# DOM 行为测试（需要 jsdom）
npm install
npm run test:dom
```

`test/smoke.mjs` 覆盖词条、时间/数量规则、应当放行的字符串；`test/dom.test.mjs` 用 jsdom 检查真实 DOM 场景，包括"README 和代码块不被污染""动态插入节点被翻译"。

仓库带了 `.github/workflows/ci.yml`，每次 push 会自动跑 `node --check` 和单测（不装依赖，十几秒跑完），改坏词条会直接红叉。

## 发版流程

1. 改词条 / 规则。
2. **把 `@version` 加一**（1.0.6 → 1.0.7），否则 Tampermonkey 认为没更新。
3. `node test/smoke.mjs` 确认全绿。
4. `git add -A && git commit -m "feat: ..." && git push`。
5. 等 1～2 分钟（raw 有 CDN 缓存），Tampermonkey 下次检查时会自动更新；想立刻生效就在面板里点「检查更新」。

## 已知限制

- 只覆盖**常见界面文案**，不是完整本地化；GitHub 改版后部分选择器/文案可能失效。
- 时间线里的复合句（`octocat opened this issue 3 days ago`）会变成"octocat 打开了此议题 3 天前"，语序偏英式中文——这是不做语序重排的取舍。
- 官方中文界面（GitHub 已提供 zh-CN 预览）与脚本同时开启时，脚本会自动跳过已是中文的文本，不冲突。
- 非官方项目，与 GitHub 无关；仅供个人学习与使用。

## 许可

MIT
