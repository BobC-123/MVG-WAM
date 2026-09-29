# MVG-WAM

Project page for **MVG-WAM: Multiple View Geometry-Aware World-Action Modeling for Robotic Manipulation**.

Live site: https://bobc-123.github.io/MVG-WAM/

## 本地查看

这是纯静态网页，没有构建步骤和第三方运行时依赖。可以直接打开 `index.html`，或者在此目录运行：

```powershell
python -m http.server 8000
```

然后访问 `http://localhost:8000/`。

## 维护内容

- `index.html`：论文题目、作者、介绍、方法和资源区。
- `style.css`：响应式布局、颜色、字体和动效。
- `app.js`：任务与视频映射、对比播放器、实验表格数据和交互。
- `assets/MVG-WAM.pdf`：与 LaTeX 内容一致的 8 页论文。
- `assets/videos/01.mp4` 至 `33.mp4`：从项目 PPT 提取的 33 段原始视频，未重新压缩或改变播放速度。
- `assets/images/`：原始视频封面、论文最终版方法图和预测对比图。
- `ASSETS.md`：每段视频的来源与用途。

论文中的作者为 Anonymous Authors，页面和临时 BibTeX 保留此署名。正式发布署名时，同时更新页面作者、BibTeX 和论文 PDF。没有填入未经提供的 arXiv 编号、录用会议、代码发布状态或作者单位。

## 发布

GitHub Pages 使用 `main` 分支的根目录。提交上述静态文件即可发布，`.nojekyll` 禁用 Jekyll 处理。全部资源使用相对路径，兼容 `/MVG-WAM/` 项目路径和本地预览。

## 数据口径

所有量化结果来自提供的 LaTeX 及根目录论文 PDF。标准 RoboTwin 结果包含随机化训练数据；Clean2Random 和消融采用独立训练设置，页面已分别说明。视频为选取的展示样例，并非总体成功率的计算依据。真机多视角演示标注 3×，方法对比和仿真演示标注 10×，沿用 PPT 中的速度说明。

网站参考 SLIP-VLA 页面所覆盖的学术展示内容，布局、样式、交互和代码独立实现。原始论文、图片、视频的权利归各自权利人所有。
