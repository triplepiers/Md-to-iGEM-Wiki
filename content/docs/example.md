---
title: 排版样式测试 (Typography Test)
description: 用于测试 Markdown 渲染效果
---

# H1: 页面主标题 (Neo-Tokyo)

这是一个用于测试 **React 文档框架** 样式的标准测试页。本文档包含了 Markdown 的所有常见语法，用于验证 CSS 变量（如 `--c-accent` 和 `--c-text-primary`）是否正确应用。

> **设计理念**：
> 这是一个引用块 (Blockquote)。在 Tokyo Night 主题下，它应该有一个深色的背景和左侧的高亮边框。
>
> 支持多行引用。

## H2: 章节标题 (Chapter Title)

在此测试段落文本的行高和颜色。正文颜色应该是 `--c-text-primary`（深蓝灰或柔和白）。
我们可以在这里测试 **加粗 (Bold)**、*斜体 (Italic)*、~~删除线 (Strikethrough)~~ 以及 [超链接样式 (Link)](https://github.com)。

### H3: 模块标题 (Module Title)

当我们需要区分不同的功能模块时使用 H3。它的颜色应该是紫色系 (Purple/Violet)。

#### H4: 小节标题 (SUB-SECTION)

H4 通常用于参数列表或小步骤。在你的 CSS 中，它被设计为 **全大写 (UPPERCASE)** 且带有一定的字间距。

---

### 1. 列表测试 (Lists)

#### 无序列表 (Unordered)
* React 核心概念
    * 组件 (Components)
    * 属性 (Props)
    * 状态 (State)
* 静态站点生成 (SSG)
* 服务端渲染 (SSR)

#### 有序列表 (Ordered)
1.  安装依赖：`npm install`
2.  启动开发服务器：`npm run dev`
3.  构建生产版本：`npm run build`

#### 任务列表 (Task List)
- [x] 完成 CSS 变量定义
- [ ] 集成 Markdown 解析器
- [ ] 优化移动端适配

---

### 2. 代码高亮 (Code Blocks)

行内代码示例：我们可以使用 `console.log('Hello World')` 来输出信息。注意行内代码应该有背景色。

**JavaScript 代码块：**

```javascript
// utils/theme.js
export const toggleTheme = () => {
  const isDark = document.documentElement.classList.contains('dark');
  if (isDark) {
    document.documentElement.classList.remove('dark');
    localStorage.theme = 'light';
  } else {
    document.documentElement.classList.add('dark');
    localStorage.theme = 'dark';
  }
};

```

**CSS 代码块：**

```css
/* Component Styles */
.btn-primary {
  background-color: var(--c-accent);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 4px;
}

```

---

### 3. 表格样式 (Tables)

表格应该有斑马纹 (Zebra Striping) 效果，边框颜色应为 `--c-border`。

| 参数 (Prop) | 类型 (Type) | 默认值 (Default) | 描述 (Description) |
| --- | --- | --- | --- |
| `layout` | `string` | `'default'` | 页面布局模式 |
| `sidebar` | `boolean` | `true` | 是否显示侧边栏 |
| `toc` | `boolean` | `true` | 是否显示右侧目录 |
| `author` | `object` | `null` | 文章作者信息对象 |

---

### 4. 图片与媒体 (Images)

图片应当自适应宽度，并带有圆角和轻微的阴影。

<p class="description">图 1: 这是一个带有 description 类的段落，用于作为图片的注脚。颜色应为 --c-text-secondary。</p>

---

### 5. 其他元素

#### 细节折叠 (Details / Summary)

<details>
<summary>点击查看详细配置信息</summary>

这里是折叠的内容。通常用于隐藏大段的代码配置或不重要的信息。

</details>

#### 脚注 (Footnotes)

这是一个带有脚注的句子[^1](这是脚注的具体内容。)。

