"use strict";
// Retain incoming links to the previous single-page website.
if (/(?:\/|\/index\.html)$/.test(location.pathname)) {
  const legacy = { writing: "blog.html", blog: "blog.html", projects: "projects.html", about: "about.html", contact: "about.html#contact" };
  const destination = legacy[location.hash.slice(1)];
  if (destination) location.replace(new URL(destination, location.href));
}
document.querySelectorAll("[data-back-top]").forEach(link => {
  link.addEventListener("click", event => {
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
    document.querySelector(".brand").focus({ preventScroll: true });
  });
});
const blogList = document.getElementById("blog-list");
if (blogList) {
  const text = value => typeof value === "string" ? value.trim() : "";
  const parsePostUrl = value => {
    if (!text(value)) return null;
    try {
      const url = new URL(value, location.href);
      if (["http:", "https:"].includes(url.protocol)) return url;
      if (location.protocol === "file:" && url.protocol === "file:") return url;
    } catch (_) { /* Ignore missing or malformed article links. */ }
    return null;
  };
  const entries = Array.isArray(window.SYLAS_BLOG_POSTS) ? window.SYLAS_BLOG_POSTS : [];
  const posts = entries.flatMap(post => {
    if (!post || post.source !== "wechat" || !text(post.title)) return [];
    const url = parsePostUrl(post.url);
    if (!url) return [];
    return [{
      title: text(post.title), date: text(post.date), category: text(post.category),
      excerpt: text(post.excerpt), url
    }];
  }).sort((a, b) => b.date.localeCompare(a.date));
  const search = document.getElementById("blog-search");
  const empty = document.getElementById("blog-empty");
  const requestedLimit = Number(blogList.dataset.limit);
  const limit = Number.isFinite(requestedLimit) && requestedLimit >= 1 ? Math.floor(requestedLimit) : Infinity;
  const createNode = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  };
  const render = () => {
    const query = (search?.value || "").trim().toLocaleLowerCase();
    const matching = posts.filter(post => [post.title, post.category, post.excerpt].join(" ").toLocaleLowerCase().includes(query));
    document.querySelectorAll("[data-blog-count]").forEach(node => { node.textContent = String(matching.length); });
    blogList.replaceChildren();
    for (const post of matching.slice(0, query ? Infinity : limit)) {
      const article = createNode("article", "blog-entry");
      const heading = createNode("h2");
      const title = createNode("a", "", post.title);
      title.href = post.url.href;
      heading.append(title);
      const meta = createNode("div", "entry-meta");
      if (post.date) {
        const date = createNode("time", "", post.date);
        date.dateTime = post.date;
        meta.append(date);
      }
      if (post.category) meta.append(createNode("span", "status-label", post.category));
      const excerpt = createNode("p", "blog-excerpt", post.excerpt);
      const more = createNode("a", "read-more", "继续读 →");
      more.href = post.url.href;
      more.setAttribute("aria-label", `继续阅读：${post.title}`);
      const links = createNode("div", "entry-links");
      links.append(more);
      article.append(heading, meta, excerpt, links);
      blogList.append(article);
    }
    if (empty) {
      empty.hidden = matching.length > 0;
      const title = empty.querySelector(".blog-empty-title");
      const copy = empty.querySelector("p:last-child");
      if (title) title.textContent = query ? "暂时没有匹配的文章" : "公众号文章，陆续整理";
      if (copy) copy.textContent = query ? "可以换个关键词，或清除搜索查看全部文章。" : "这里收录我在公众号发布的文章，稍后更新。";
    }
    const status = document.getElementById("blog-status");
    if (status) status.textContent = query ? `找到 ${matching.length} 篇文章` : "";
  };
  search?.addEventListener("input", render);
  render();
}
let toastTimer;
function notify(message) {
  const status = document.getElementById("copy-status");
  if (!status) return;
  clearTimeout(toastTimer);
  status.textContent = message;
  status.classList.add("visible");
  toastTimer = setTimeout(() => status.classList.remove("visible"), 2600);
}
async function copyText(value) {
  try {
    if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(value); return true; }
  } catch (_) { /* Use a local-file fallback if clipboard access is unavailable. */ }
  const field = document.createElement("textarea");
  field.value = value;
  field.setAttribute("readonly", "");
  field.style.cssText = "position:fixed;opacity:0";
  document.body.append(field);
  field.select();
  let success = false;
  try { success = document.execCommand("copy"); } catch (_) { /* Report manual copy instructions. */ }
  field.remove();
  return success;
}
document.querySelectorAll("[data-copy]").forEach(button => {
  button.addEventListener("click", async () => {
    button.disabled = true;
    const label = button.dataset.copyLabel?.trim() || "邮箱地址";
    try { notify(await copyText(button.dataset.copy) ? `${label}已复制` : `复制未成功，请选中${label}复制。`); }
    finally { button.disabled = false; button.focus({ preventScroll: true }); }
  });
});
