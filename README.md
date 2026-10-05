# bilibili 评论区图片修复（比例 + 动图）

修复 B站网页版评论区的两个显示问题：

1. **图片被拉伸变形** —— 评论区图片由 `bili-comment-pictures-renderer` 组件渲染，它按「横图 240×135 / 竖图 135×180」两套模板写死显示尺寸。正方形图会被塞进 3:4 的框里，于是被竖向拉长。
2. **GIF 不会动** —— B站 CDN 的 `_1s` 参数会把动图压成单帧静态图（avif / webp）。

## 安装

1. 先装一个用户脚本管理器：[Tampermonkey](https://www.tampermonkey.net/) 或 [Violentmonkey](https://violentmonkey.github.io/)
2. 安装脚本，任选一个：

   - **Greasy Fork（推荐，能收到更新提示）**：https://greasyfork.org/zh-CN/scripts/598785
   - GitHub 源码直链：<https://raw.githubusercontent.com/Hsyoungtick/bili-comment-img-fix/main/bili-comment-img-fix.user.js>

   两处内容一致；从 Greasy Fork 安装的会跟随脚本页的版本更新。

## 使用

装好即生效，无需配置。开关在**油猴扩展弹窗 → 脚本名 → 子菜单**里：

- `🐳 GIF 动图：开 / 关（点击切换）` —— 默认**开**。

## 局限（务必了解）

- **开启 GIF 会显著增加流量。** B站 CDN 不提供小体积动图，只能拉原图，单张最大见过 2.2 MB。关掉即恢复用 B站的静态压缩图。
- **图片可能短暂闪回拉伸状态。** 评论区组件由 Lit 渲染，重渲染会清掉注入的样式，脚本会在 1 秒内自动补上；这段时间可能看到一瞬间的拉伸。同理，重渲染后开着 GIF 的图会重新下载一次原图。
- **依赖 B站的组件标签名** `bili-comment-pictures-renderer`。B站改版换名后脚本会静默失效（不报错，只是没效果），届时需要更新。
- **只在网页版生效。** App、小程序、mhtml 离线存档都不适用——尤其是离线存档：存下来的本来就是 CDN 给的静态图，原动画数据不在文件里，脚本也救不回来。

## 隐私

- 脚本自身不发起任何网络请求，不读取 cookie / 登录态，不上报任何数据。
- 仅通过 `GM_setValue` 保存一个布尔值（GIF 开关状态）。
- 唯一产生的流量是浏览器按 B站自家 CDN 地址重新拉取图片。

## 许可

MIT