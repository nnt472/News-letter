/* ===== Utilities ===== */
const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
const setYear = () => { const y = $("#year"); if (y) y.textContent = new Date().getFullYear(); };
const getQuery = (k) => new URLSearchParams(location.search).get(k);

const DEFAULT_START_MONTH = "2025-09"; // bắt đầu hiển thị từ 09/2025

/* ===== i18n ===== */
const i18n = (() => {
  const dict = {
    en:{
      weekly:"Weekly News", monthly:"Monthly Summary", analysis:"Legal Analysis",
      subscribeTitle:"Subscribe for updates",
      subscribeDesc:"Leave your email to get notified when new updates are published.",
      subscribeBtn:"Notify me", contact:"Contact: legal@phs.vn",
      readMore:"Read more", downloadPdf:"Download PDF", backHome:"Back to Home",
      thanks:"Thanks! We will keep you posted.",
      allTypes:"All types", allMonths:"All months", searchPH:"Search title, summary…"
    },
    vi:{
      weekly:"Bản tin hàng tuần", monthly:"Tổng hợp hàng tháng", analysis:"Phân tích pháp lý",
      subscribeTitle:"Đăng ký nhận tin",
      subscribeDesc:"Để lại email để nhận thông báo khi có cập nhật mới.",
      subscribeBtn:"Thông báo cho tôi", contact:"Liên hệ: legal@phs.vn",
      readMore:"Xem chi tiết", downloadPdf:"Tải PDF", backHome:"Về trang chủ",
      thanks:"Cảm ơn! Chúng tôi sẽ thông báo khi có cập nhật.",
      allTypes:"Tất cả loại", allMonths:"Tất cả tháng", searchPH:"Tìm tiêu đề, tóm tắt…"
    }
  };
  let lang = localStorage.getItem("lang") || "vi";
  const t=(k)=>dict[lang][k]||k;
  const set=(l)=>{lang=l;localStorage.setItem("lang",l);translate();};
  const translate=()=>{
    $$("[data-i18n]").forEach(el=>el.textContent=t(el.dataset.i18n));
    const s=$("#searchInput"); if(s) s.placeholder=t("searchPH");
    const typeSel=$("#typeFilter"); if(typeSel) typeSel.options[0].textContent=t("allTypes");
    const monthSel=$("#monthFilter"); if(monthSel) monthSel.options[0].textContent=t("allMonths");
  };
  return {t,set,get:()=>lang,translate};
})();

/* ===== Dark mode ===== */
(function initDark(){
  const root = document.documentElement;
  if (localStorage.getItem("theme") === "dark") root.classList.add("dark");
  const btn = $("#darkToggle");
  if (btn) btn.addEventListener("click", ()=>{
    root.classList.toggle("dark");
    localStorage.setItem("theme", root.classList.contains("dark") ? "dark" : "light");
  });
})();

/* ===== Language toggle ===== */
(function initLang(){
  $$(".lang-switch button").forEach(b=>{
    if (b.dataset.lang === i18n.get()) b.classList.add("active");
    b.addEventListener("click", ()=>{
      $$(".lang-switch button").forEach(x=>x.classList.remove("active"));
      b.classList.add("active");
      i18n.set(b.dataset.lang);
      renderAll();
    });
  });
})();

setYear();

/* ===== Fetch posts ===== */
let POSTS = [];
async function loadPosts(){
  if (POSTS.length) return POSTS;
  const res = await fetch("data/posts.json", {cache:"no-store"});
  POSTS = await res.json();
  return POSTS;
}

/* ===== Month options ===== */
function setupMonths(posts){
  const sel=$("#monthFilter"); if(!sel) return;
  sel.innerHTML = "";
  const allOpt=document.createElement("option");
  allOpt.value="all"; allOpt.textContent=i18n.t("allMonths");
  sel.appendChild(allOpt);

  const months = new Set(posts.map(p=>p.date.slice(0,7)).filter(m => m >= DEFAULT_START_MONTH));
  [...months].sort().reverse().forEach(m=>{
    const opt=document.createElement("option");
    opt.value=m; opt.textContent=m;
    sel.appendChild(opt);
  });
  if ([...months].includes(DEFAULT_START_MONTH)) sel.value = DEFAULT_START_MONTH;
}

/* ===== Card rendering ===== */
function postTitle(p){ return i18n.get()==="en" ? p.title_en : p.title_vi; }
function postSummary(p){ return i18n.get()==="en" ? p.summary_en : p.summary_vi; }
function card(p){
  const div = document.createElement("div");
  div.className = "card";
  div.innerHTML = `
    <div class="meta">${p.type.toUpperCase()} · ${p.date}</div>
    <h3>${postTitle(p)}</h3>
    <p>${postSummary(p)}</p>
    <div class="tags">${(p.tags||[]).map(t=>`<span class="tag">${t}</span>`).join("")}</div>
    <a class="btn readmore" href="post.html?id=${encodeURIComponent(p.id)}" data-i18n="readMore">${i18n.t("readMore")}</a>
  `;
  return div;
}

/* ===== Home ===== */
async function renderHome(){
  const weekly = $("#weeklyList"); if (!weekly) return;
  const posts = await loadPosts();
  setupMonths(posts);

  const monthSel = $("#monthFilter");
  const typeSel = $("#typeFilter");
  const search = $("#searchInput");

  function passFilters(p){
    const byType = typeSel.value==="all" || p.type===typeSel.value;
    const byMonth = monthSel.value==="all" || p.date.startsWith(monthSel.value);
    const q = (search.value||"").toLowerCase().trim();
    const bySearch = !q || [postTitle(p), postSummary(p), ...(p.tags||[])].join(" ").toLowerCase().includes(q);
    return byType && byMonth && bySearch;
  }

  function fillSection(container, type){
    container.innerHTML = "";
    posts.filter(p => p.type===type && passFilters(p))
         .sort((a,b)=> b.date.localeCompare(a.date))
         .slice(0,6)
         .forEach(p => container.appendChild(card(p)));
    if (!container.children.length) container.innerHTML = `<div class="card"><p>No posts.</p></div>`;
  }

  function renderLists(){
    fillSection($("#weeklyList"), "weekly");
    fillSection($("#monthlyList"), "monthly");
    fillSection($("#analysisList"), "analysis");
  }

  [typeSel, monthSel, search].forEach(el=> el.addEventListener("input", renderLists));
  renderLists();
}

/* ===== Tiny Markdown ===== */
function miniMarkdown(md=""){
  return md
    .replace(/^### (.*$)/gim, "<h3>$1</h3>")
    .replace(/^## (.*$)/gim, "<h2>$1</h2>")
    .replace(/^# (.*$)/gim, "<h1>$1</h1>")
    .replace(/\*\*(.*?)\*\*/gim, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/gim, "<em>$1</em>")
    .replace(/\[(.*?)\]\((.*?)\)/gim, `<a href="$2" target="_blank" rel="noopener">$1</a>`)
    .replace(/\n$/gim, "<br/>");
}

/* ===== Post ===== */
async function renderPost(){
  const el = $("#post"); if (!el) return;
  const id = getQuery("id");
  const posts = await loadPosts();
  const p = posts.find(x => String(x.id) === String(id));
  if (!p){ el.innerHTML = `<div class="card"><p>Post not found.</p></div>`; return; }

  const title = postTitle(p);
  const summary = postSummary(p);
  const body = (i18n.get()==="en" ? p.content_en : p.content_vi) || "";

  el.innerHTML = `
    <h1>${title}</h1>
    <div class="meta">${p.type.toUpperCase()} · ${p.date} · ${p.author || "PHS Legal"}</div>
    <div class="actions">
      ${p.pdf_url ? `<a class="btn" href="${p.pdf_url}" target="_blank" data-i18n="downloadPdf">${i18n.t("downloadPdf")}</a>` : ""}
      <a class="btn secondary" href="./" data-i18n="backHome">${i18n.t("backHome")}</a>
    </div>
    <p><em>${summary}</em></p>
    <div class="tags">${(p.tags||[]).map(t=>`<span class="tag">${t}</span>`).join("")}</div>
    <hr/>
    <div class="content">${miniMarkdown(body)}</div>
  `;
}

/* ===== Re-render ===== */
function renderAll(){ i18n.translate(); renderHome(); renderPost(); }
document.addEventListener("DOMContentLoaded", renderAll);
