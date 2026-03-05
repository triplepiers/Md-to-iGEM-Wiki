# Features

总的来说就是一个超级丐版 MkDocs：

- Markdown 与 HTML 混排非常自由，也可以让它 
    <span style="color: #FF0000; font-size: 2.5em; font-weight: bold;">非</span>
    <span style="color: #008000; font-size: 2em; vertical-align: middle;">常</span>
    <span style="color: #FF00FF; font-size: 1em;">的</span>
    <span style="color: #8B4513; font-size: 1.5em; font-family: serif;">丑</span>
    <span style="color: #6495ED; font-size: 0.8em; font-style: italic;">陋</span>
    => 我已经完全掌握了设计！


- 主要功能是 **Markdown 转 HTML**:

    大家比较熟悉吧 omo，然后可以用 Git 比较版本之类的

- 具体用法见 [Getting-Started](/Docs/getting-started.md) 的 **Modify** 部分，样式预览见本页对应章节

- 样式主要依赖 TailwindCSS（和官方模版的 Bootstrap 略有出入）

## 1 小功能

### 加载动画

- 在 `/components/LoadingOverlay.tsx` 中修改
- 在 `/config/loadingOverlay.ts` 中配置：
  - 开启/关闭
  - 最短显示时间：`0: 加载完成后立刻关闭, -1: 持续显示(调试), >0: 至少显示指定 ms`

### 亮暗主题切换

通过右上角的 button 切换

- 思路：手动给 `html` 添加/移除 `.dark` 类名
- 行为定义：CSS 的话，最前面加上 `.dark` 就行
- 取消功能：在 `/component/Header.tsx` 里把对应的 btn 注释掉就行

### 自动目录生成

- 捕捉 2 ～ 4 级目录
- 带**滚动进度追踪**、点击跳转

### MD 文件嵌入

- 支持在 MD 中嵌入其他 Markdown 文件：`{{ embed: Docs/snippets/example.md }}`

- 需要注意**路径的大小写**
- **被嵌入** 文件如果在 `content` 路径下也会被展示到 navBar

### 自动引用解析

1. 引用列表定义：在二级标题 Reference 下按照如下语法定义引用项目

    - 会 **自动编号**，只要换行就可以了
    - 可以在 Content 中按照基础语法 `[]()` 插入超链接

    ```md
    ## Reference

    [alias]: Content with [url](www.xxx.com)
    ```

    > `Reference` 节的标题 **不能** 加编号

2. 引用：在任意位置使用 `{{ ref: alias }}` 语法即可完成引用

    - 引用 **不存在** 的 alias 会标红
    - 多个引文之间 **不会** 自动生成逗号，注意手动打

3. 使用案例

    - 测试自定义引用标记：重复 alias 应复用同一编号

      `{{ ref: wiki-design }}`、`{{ ref: md-parser }}`、`{{ ref: wiki-design }}` {{ ref: wiki-design }}, {{ ref: md-parser }}, {{ ref: wiki-design }}

    - 测试不存在的 alias：标红

      `{{ ref: missing-alias }}` {{ ref: missing-alias }}

### 图表绘制 (Echarts)

- 基于 Ecahrts 实现，两个示例在 `components/Charts` 下

  不会写可以让 AI 糊弄一个

- 支持通过 `{{ chart: path-to-tsx }}` 语法嵌入常用图表示例（文件也得塞在 `components/Charts` 下）

  ```md
  {{ chart: PieChartExample.tsx }}
  ```

- 自定义参数：支持自定义 图题 + 图表高度

  ```md
  {{ chart: BarLineComboChartExample.tsx | height=400 | title="xxx" }}
  ```

{{ chart: PieChartExample.tsx | height=360 | title="饼图示例" }}

{{ chart: BarLineComboChartExample.tsx | height=380 | title="柱状 + 折线复合图示例" }}

## 2 Markdown 样式预览

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

### 数学公式 (Latex)

- **不支持** 自动编号
- 支持 `$` 包裹的 inline 公式，如 `$ E=mc^2 $` $ E=mc^2 $
- 支持 `$$` 包裹的公式块，如：

  $$
  \begin{aligned}
  \mathcal{L}(\theta) &= 
  \sum_{i=1}^{n} \left[ 
      y_i \log\left( \frac{e^{\mathbf{w}^\top \mathbf{x}_i + b}}{1 + e^{\mathbf{w}^\top \mathbf{x}_i + b}} \right) 
      + (1 - y_i) \log\left( \frac{1}{1 + e^{\mathbf{w}^\top \mathbf{x}_i + b}} \right)
  \right] \\
  &\quad - \frac{\lambda}{2} \|\mathbf{w}\|_2^2 \\[1em]
  \text{其中:}\quad 
  \mathbf{w} &= 
  \begin{bmatrix}
      w_1 \\ w_2 \\ \vdots \\ w_d
  \end{bmatrix}, \quad
  \mathbf{x}_i = 
  \begin{bmatrix}
      x_{i1} \\ x_{i2} \\ \vdots \\ x_{id}
  \end{bmatrix} \\[1em]
  \frac{\partial \mathcal{L}}{\partial \mathbf{w}} &= 
  \sum_{i=1}^{n} \left( y_i - \sigma(\mathbf{w}^\top \mathbf{x}_i + b) \right) \mathbf{x}_i 
  - \lambda \mathbf{w} \\[1em]
  \text{收敛条件:}\quad 
  \left\| \frac{\partial \mathcal{L}}{\partial \mathbf{w}} \right\|_2 
  &< \varepsilon, \quad \varepsilon = 10^{-6}
  \end{aligned}
  $$

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

- 支持亮暗色切换 + hover 时高亮 **整行**
- 支持 **自动标题编号**

- 数据来源
  1. 直接写 Markdown 表格：支持通过 `{{ table: title="xxx" }}` 定义表标题
  2. 解析 Excel 表格：
    - 放在 `attachment/excels` 下，用 `{{ table: url="xxx.xlsx" | title="yyy"}}` 嵌入
    - 仅解析 **第一张** 数据表、支持合并单元格

{{ table: title="A Title" }}
| 参数 (Prop) | 类型 (Type) | 默认值 (Default) | 描述 (Description) |
| --- | --- | --- | --- |
| `layout` | `string` | `'default'` | 页面布局模式 |
| `sidebar` | `boolean` | `true` | 是否显示侧边栏 |
| `toc` | `boolean` | `true` | 是否显示右侧目录 |
| `author` | `object` | `null` | 文章作者信息对象 |

{{ table: url="test.xlsx" | title="测试嵌入 + 合并单元格" }}

### 图片与媒体 (Images)

- 支持图题 **自动编号**（不带章节）
- 点击 **图片本体** 后，打开全屏图片预览组件：支持左右翻页 + 缩放

- 默认样式
  - 圆角和轻微的阴影
  - 水平居中 + **固定高度**

- 资源引用
  - Remote：正常填 URL 即可
  - Local：资源请放在 `@/attachment/imgs` 路径下，从 `imgs` **之后** 的路径开始填写即可

- 使用示例：

  ```md
  {{ figure: url="remote" | title="带标题 + 自定义宽高" | width=300px | height=280px }}
  {{ figure: url="local" | title="仅设置标题，使用默认固定高度" }}
  ```

{{ figure: url="Plant_Immunity.png" | title="带标题 + 自定义宽高" | height=280px }}

{{ figure: url="https://static.igem.wiki/teams/4628/wiki/safe/3.png" | title="仅设置标题，使用默认固定高度" }}

### 细节折叠 (Details / Summary)

<details>
<summary>点击查看详细配置信息</summary>

这里是折叠的内容。通常用于隐藏大段的代码配置或不重要的信息。

</details>

## Reference

[wiki-design]: iGEM Wiki Content Guide, version 2026. Accessed on team internal docs.

[md-parser]: Unified / Remark parsing pipeline design notes for this project. Read more: [Unified](https://unifiedjs.com/) and [Remark](https://remark.js.org/).
