# Features

> 主要功能是 **Markdown 转 HTML**
> 
> 大家比较熟悉吧 omo，然后可以用 Git 比较版本之类的

- 具体用法见 [Getting-Started](http://localhost:3000/#/Docs/getting-started.md) 的 **Modify** 部分

- 除了基本语法（样式预览如下）外，支持

    - 自动目录生成、带**滚动进度追踪**

    - 嵌入其他 Markdown 文件：`{{ embed: Docs/snippets/example.md }}`，需要注意路径的大小写

    - 引用解析
  
      1. 引用列表定义：在二级标题 Reference 下按照如下语法定义引用项目

          - 会 **自动编号**，只要换行就可以了
          - 可以在 Content 中按照基础语法 `[]()` 插入超链接

          ```md
          ## Reference

          [alias]: Content with [url](www.xxx.com)
          ```

      2. 引用：在任意位置使用 `{{ ref: alias }}` 语法即可完成引用

          - 引用 **不存在** 的 alias 会标红
          - 多个引文之间 **不会** 自动生成逗号，注意手动打

      3. 使用案例

          - 测试自定义引用标记：重复 alias 应复用同一编号

            `{{ ref: wiki-design }}`、`{{ ref: md-parser }}`、`{{ ref: wiki-design }}` {{ ref: wiki-design }}, {{ ref: md-parser }}, {{ ref: wiki-design }}

          - 测试不存在的 alias：标红
  
            `{{ ref: missing-alias }}` {{ ref: missing-alias }}

## 小功能

- 亮暗主题切换：通过右上角的 button 切换

  - 思路：手动给 `html` 添加/移除 `.dark` 类名
  - 行为定义：CSS 的话，最前面加上 `.dark` 就行
  - 去除功能：在 `/component/Header.tsx` 里把对应的 btn 注释掉就行


## Markdown 样式预览

在此测试段落文本的行高和颜色。正文颜色应该是 `--c-text-primary`（深蓝灰或柔和白）。
我们可以在这里测试 **加粗 (Bold)**、*斜体 (Italic)*、~~删除线 (Strikethrough)~~ 以及 [超链接样式 (Link)](https://github.com)。

### H3: 模块标题 (Module Title)

当我们需要区分不同的功能模块时使用 H3。它的颜色应该是紫色系 (Purple/Violet)。

#### H4: 小节标题 (SUB-SECTION)

H4 通常用于参数列表或小步骤。在你的 CSS 中，它被设计为 **全大写 (UPPERCASE)** 且带有一定的字间距。

### 列表测试 (Lists)

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

### 代码高亮 (Code Blocks)

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

### 表格样式 (Tables)

表格应该有斑马纹 (Zebra Striping) 效果，边框颜色应为 `--c-border`。

| 参数 (Prop) | 类型 (Type) | 默认值 (Default) | 描述 (Description) |
| --- | --- | --- | --- |
| `layout` | `string` | `'default'` | 页面布局模式 |
| `sidebar` | `boolean` | `true` | 是否显示侧边栏 |
| `toc` | `boolean` | `true` | 是否显示右侧目录 |
| `author` | `object` | `null` | 文章作者信息对象 |


### 图片与媒体 (Images)

图片应当自适应宽度，并带有圆角和轻微的阴影。

<p class="description">图 1: 这是一个带有 description 类的段落，用于作为图片的注脚。颜色应为 --c-text-secondary。</p>

### 其他元素

#### 细节折叠 (Details / Summary)

<details>
<summary>点击查看详细配置信息</summary>

这里是折叠的内容。通常用于隐藏大段的代码配置或不重要的信息。

</details>

## Reference

[wiki-design]: iGEM Wiki Content Guide, version 2026. Accessed on team internal docs.

[md-parser]: Unified / Remark parsing pipeline design notes for this project. Read more: [Unified](https://unifiedjs.com/) and [Remark](https://remark.js.org/).
