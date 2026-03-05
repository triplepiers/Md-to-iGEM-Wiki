# iGEM FlowWiki

- 总的来说就是**一个超级丐版** MkDocs，主要功能是 **Markdown 转 HTML**

- 样式依赖于 TailwindCSS（和官方模版的 Bootstrap 略有出入）

## 1 Feature

- Loading 动画
- 亮暗主题切换
- 自动目录生成
- 自动引用解析
- 内容嵌入
    - Markdown 文档片段
    - Echarts 图表
    - Excel 文档
    - 普通文件（Local / Remote）

## 2 Usage

按照以下步骤简单跑通这个项目

```bash
# 1 拉取项目到本地
git clone git@github.com:triplepiers/Md-to-iGEM-Wiki.git

# 2 安装依赖：这可能需要一些时间
npm run install

# 3 动起来：支持 **热更新** 的开发模式！
npm run dev
```

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

## 3 Build

### ⚠️ Default（目前的自动部署脚本）

```bash
npm run build
```

- 产物目录： `/dist`

- **不包含** `/content/Docs` 下的文件

### 👍 Static

如果需要将页面导出为独立 HTML 文件，使用：

```bash
npm run build:static
```

- 产物目录：`/dist-static`
- 执行流程：先按 `ignore` 临时生成过滤版 `constants.ts` 再打包，导出完成后会自动恢复完整版 `constants.ts`

- 可在 `/config/static-export.config.json` 中配置 `ignore`：忽略 `content` 下的文件或目录（相对路径，大小写敏感）

    ```json
    {
        "ignore": ["Docs", "Team/Attributions.md"] // 直接删掉 md 也行
    }
    ```

- 导出规则（ignore 之外）：
  - Home 固定导出为 `index.html`
  - 其他页面统一导出为 `全小写源文件名.html`，示例：

    `Engagement/Human-Practices.md -> human-practices.html`
