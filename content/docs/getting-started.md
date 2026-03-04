# Getting Started

Welcome to the **iGEM FlowWiki** framework. This page demonstrates a standard documentation layout.

## Installation

按照以下步骤简单跑通这个项目

```bash
# 1 拉取项目到本地
git clone git@github.com:triplepiers/Md-to-iGEM-Wiki.git

# 2 安装依赖：这可能需要一些时间
npm run install

# 3 动起来：支持 **热更新** 的开发模式！
npm run dev
```

## Usage

### Config

1. 需要将 `/content/Docs/Team/Attributions.md` 中的 URL 修改为对应年份

    ```html
    <iframe
        下面这行
        src="https://attributions.igem.org?team=ZJU-China&year=2023"
    >
    </iframe>
    ```

2. 需要将 `/components/Footer.tsx` 中的 文本+URL 修改为今年的对应 iGEM 仓库

    ```html
    <p className="text-s">
       下面这行的 href 和 github...Wiki
       <small>The repository used to create this website is available at <a className="underline decoration-slate-400 underline-offset-4 hover:text-white" href="https://github.com/triplepiers/Md-to-iGEM-Wikia">github.com/triplepiers/Md-to-iGEM-Wiki</a>.</small>
    </p>
    ```

3. 左上角的 LOGO：修改 `/components/Logo.tsx` 中的内容即可

4. `NavBar`（顶栏）中的渲染顺序调整

    - 修改 `/config/navOrder.ts` 中的数组即可
    - **未定义** 的 文件/文件夹 将以默认顺序显示在 config 规定内容 **之后**

### Modify

- 样式：对应 `/stylesheet` 下的文件

    - 全局
      - `colorTheme.css`：整体配色文件，暗色模式需要用 `.dark` 开头的选择器定义
      - `default.css`：默认的 Markdown 样式
      - `index.css`：全局样式，目前只写了 font
      - `TableOfContent.css`：Markdown 页面目录样式
    - `home.css`：HOME 页面单独的样式

- 页面增删

    - HOME：目前有 `/content/index.html` 和 `/content/Home.md` 两个文件

        - 拼接逻辑：先显示 HTML，然后拼接 MD（目前是写了 iGEM 的官方要求）
        - 建议：删空 `Home.md`，全写在 `index.html`

    - 其他：直接在 `content` 目录下 新建/删除 即可，目录结构会体现在 `navBar` 上

        - 目前仅支持两级目录 omo

## Build

使用 `npm run build` 可以手动将网页打包至 `/dist`

- **不包含** `/content/Docs` 下的文件