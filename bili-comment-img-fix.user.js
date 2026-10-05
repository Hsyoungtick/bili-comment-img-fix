// ==UserScript==
// @name         bilibili 评论区图片修复（比例 + 动图）
// @name:en      Bilibili Comment Image Fix (Aspect Ratio + GIF)
// @namespace    https://github.com/Hsyoungtick/bili-comment-img-fix
// @version      1.0.0
// @description  修复B站评论区图片被拉伸变形，并让被压成静态图的GIF恢复播放
// @description:en  Fix stretched comment images on Bilibili and restore GIF animation
// @author       Hsyoungtick
// @license      MIT
// @icon         https://static.hdslb.com/images/favicon.ico
// @homepageURL  https://github.com/Hsyoungtick/bili-comment-img-fix
// @supportURL   https://github.com/Hsyoungtick/bili-comment-img-fix/issues
// @match        *://*.bilibili.com/*
// @run-at       document-start
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==
(() => {
  'use strict';

  const TAG = 'bili-comment-pictures-renderer';
  // 只改高度：宽度仍用组件给出的 135 / 240，布局不变，图片按自身比例显示
  const CSS = 'img{height:auto!important;object-fit:contain!important}';
  const KEY = 'bili_img_fix_gif';
  const roots = new Set();

  let gifOn = GM_getValue(KEY, true); // 默认开：GIF 按原图加载

  // B站 CDN 的 `_1s` 参数会把动图压成单帧静态图（avif/webp），这里换回原图恢复动画
  function applyGif(sr) {
    if (gifOn) {
      for (const img of sr.querySelectorAll('img[src*=".gif@"]')) {
        img.dataset.staticSrc = img.src;                 // 备份静态图地址，便于关掉时还原
        img.src = img.src.replace(/\.gif@.*$/, '.gif');
      }
    } else {
      for (const img of sr.querySelectorAll('img[data-static-src]')) {
        if (img.src.includes('.gif@')) continue;         // 尚未换过，无需还原
        img.src = img.dataset.staticSrc;
        delete img.dataset.staticSrc;
      }
    }
  }

  function tune(sr) {
    if (!sr.host || sr.host.localName !== TAG) return;
    // 组件是 Lit 渲染的，重渲染会清空 shadow root，样式没了就补一次
    if (!sr.querySelector('style[data-bili-fix]')) {
      const s = document.createElement('style');
      s.setAttribute('data-bili-fix', '1');
      s.textContent = CSS;
      sr.appendChild(s);
    }
    applyGif(sr);
  }

  // 评论区组件层层嵌套在 shadow DOM 里
  // （bili-comments → bili-comment-renderer → bili-comment-pictures-renderer），
  // document.querySelectorAll 不穿透 shadow DOM，必须递归收集。
  function discover(root) {
    const stack = [root];
    while (stack.length) {
      const r = stack.pop();
      for (const el of r.querySelectorAll('*')) {
        if (el.shadowRoot) { roots.add(el.shadowRoot); stack.push(el.shadowRoot); }
      }
    }
  }

  let tick = 0;

  function pass() {
    if (tick++ % 5 === 0) discover(document); // 兜底扫描：启动时 + 每 5 秒一次
    for (const sr of roots) {
      // 剔除已卸载的组件，避免长时间会话里 roots 只增不减
      if (!sr.host || !sr.host.isConnected) { roots.delete(sr); continue; }
      tune(sr);
    }
  }

  // document-start 就 hook attachShadow：页面自建 shadow root 时立刻登记
  const origAttachShadow = Element.prototype.attachShadow;
  Element.prototype.attachShadow = function (init) {
    const sr = origAttachShadow.call(this, init);
    roots.add(sr);
    return sr;
  };

  discover(document);
  setInterval(pass, 1000);

  // ---------- 油猴菜单：点扩展图标 → 脚本名 → 这里 ----------
  let menuId = null;

  function registerMenu() {
    // GM_registerMenuCommand 只追加、不会按标题覆盖，必须先注销旧条目再注册，否则每点一次多一条
    if (menuId !== null && typeof GM_unregisterMenuCommand === 'function') {
      try { GM_unregisterMenuCommand(menuId); } catch (e) { /* 注销失败不影响功能 */ }
      menuId = null;
    }
    if (menuId === null) {
      menuId = GM_registerMenuCommand(`🐳 GIF 动图：${gifOn ? '开' : '关'}（点击切换）`, onMenuClick);
    }
  }

  function onMenuClick() {
    gifOn = !gifOn;
    GM_setValue(KEY, gifOn);
    pass();
    registerMenu();
  }

  registerMenu();
})();