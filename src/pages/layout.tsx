import type { FC, PropsWithChildren } from "hono/jsx";
import { raw } from "hono/utils/html";

const css = raw(`
:root{
  --color-bg:#f0f2f5;--color-surface:#fff;--color-text:#1a1a2e;--color-text-muted:#57606a;
  --color-border:#e1e4e8;--color-border-light:#ddd;--color-border-subtle:#f0f2f5;
  --color-primary:#0969da;--color-primary-hover:#0757b3;
  --color-danger:#cf222e;--color-danger-hover:#a40e26;
  --color-nav-bg:#1a1a2e;
  --color-tag-bg:#ddf4ff;--color-tag-pre-bg:#fff8c5;--color-tag-pre-text:#9a6700;
  --color-badge-bg:#1a1a2e;--color-code-bg:#f0f2f5;
  --color-input-border:#d0d7de;--color-success:#1a7f37;
  --color-shadow:rgba(0,0,0,.08);--color-focus-ring:rgba(9,105,218,.15)
}
[data-theme="dark"]{
  --color-bg:#0d1117;--color-surface:#161b22;--color-text:#e6edf3;--color-text-muted:#8b949e;
  --color-border:#30363d;--color-border-light:#21262d;--color-border-subtle:#21262d;
  --color-primary:#58a6ff;--color-primary-hover:#79c0ff;
  --color-danger:#f85149;--color-danger-hover:#da3633;
  --color-nav-bg:#010409;
  --color-tag-bg:#122d42;--color-tag-pre-bg:#3d2e00;--color-tag-pre-text:#d29922;
  --color-badge-bg:#30363d;--color-code-bg:#161b22;
  --color-input-border:#30363d;--color-success:#3fb950;
  --color-shadow:rgba(0,0,0,.3);--color-focus-ring:rgba(88,166,255,.2)
}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
  line-height:1.6;color:var(--color-text);background:var(--color-bg);min-height:100vh;display:flex;flex-direction:column}
a{color:var(--color-primary);text-decoration:none}
a:hover{text-decoration:underline}
.container{max-width:960px;margin:0 auto;padding:0 20px;width:100%}
nav{background:var(--color-nav-bg);color:#fff;padding:12px 0;position:sticky;top:0;z-index:100;
  box-shadow:0 2px 8px rgba(0,0,0,.15)}
nav .container{display:flex;align-items:center;justify-content:space-between}
nav a{color:#fff;font-weight:600;font-size:1.1rem}
nav a:hover{opacity:.85;text-decoration:none}
nav .nav-links{display:flex;gap:16px;font-size:.9rem;align-items:center}
nav .nav-links a{font-weight:400;opacity:.8}
nav .nav-links a:hover{opacity:1}
.theme-toggle{background:none;border:1px solid rgba(255,255,255,.3);color:#fff;cursor:pointer;
  padding:4px 8px;border-radius:6px;font-size:1rem;line-height:1;opacity:.8;transition:opacity .15s}
.theme-toggle:hover{opacity:1}
main{flex:1;padding:32px 0}
footer{text-align:center;padding:20px 0;color:var(--color-text-muted);font-size:.85rem;
  border-top:1px solid var(--color-border-light);margin-top:auto}
.card{background:var(--color-surface);border-radius:10px;padding:24px;margin-bottom:16px;
  box-shadow:0 1px 3px var(--color-shadow);border:1px solid var(--color-border)}
.card h2{margin-bottom:8px}
.btn{display:inline-block;padding:8px 16px;border-radius:6px;font-size:.9rem;
  font-weight:500;cursor:pointer;border:none;transition:all .15s}
.btn-primary{background:var(--color-primary);color:#fff}
.btn-primary:hover{background:var(--color-primary-hover);text-decoration:none}
.btn-danger{background:var(--color-danger);color:#fff}
.btn-danger:hover{background:var(--color-danger-hover);text-decoration:none}
.btn-sm{padding:4px 10px;font-size:.8rem}
input[type="text"],input[type="password"]{padding:8px 12px;border:1px solid var(--color-input-border);
  border-radius:6px;font-size:.95rem;width:100%;background:var(--color-surface);color:var(--color-text)}
input:focus{outline:none;border-color:var(--color-primary);box-shadow:0 0 0 3px var(--color-focus-ring)}
.tag{display:inline-block;padding:2px 8px;border-radius:12px;font-size:.8rem;
  font-weight:500;background:var(--color-tag-bg);color:var(--color-primary)}
.tag-pre{background:var(--color-tag-pre-bg);color:var(--color-tag-pre-text)}
.badge{display:inline-block;padding:2px 8px;border-radius:4px;font-size:.75rem;
  background:var(--color-badge-bg);color:#fff;margin-left:8px}
table{width:100%;border-collapse:collapse}
th,td{text-align:left;padding:10px 12px;border-bottom:1px solid var(--color-border)}
th{font-weight:600;font-size:.85rem;color:var(--color-text-muted);text-transform:uppercase;letter-spacing:.5px}
.text-muted{color:var(--color-text-muted)}
.text-sm{font-size:.85rem}
.mt-2{margin-top:8px}
.mt-4{margin-top:16px}
.mb-2{margin-bottom:8px}
.mb-4{margin-bottom:16px}
.flex{display:flex}
.items-center{align-items:center}
.justify-between{justify-content:space-between}
.gap-2{gap:8px}
.gap-4{gap:16px}
.grid-2{display:grid;grid-template-columns:1fr 1fr;gap:16px}
@media(max-width:600px){.grid-2{grid-template-columns:1fr}}
.search-box{display:flex;gap:8px;max-width:480px;margin:0 auto}
.search-box input{flex:1}
.empty{text-align:center;padding:40px 20px;color:var(--color-text-muted)}
.asset-row{display:flex;align-items:center;justify-content:space-between;padding:10px 0;
  border-bottom:1px solid var(--color-border-subtle)}
.asset-row:last-child{border-bottom:none}
.asset-name{font-weight:500;word-break:break-all}
.asset-size{color:var(--color-text-muted);font-size:.85rem;white-space:nowrap;margin-left:12px}
.release-asset-divider{padding-top:8px;border-top:1px solid var(--color-border-subtle)}
.markdown-body{line-height:1.7}
.markdown-body p{margin-bottom:12px}
.markdown-body ul,.markdown-body ol{margin-bottom:12px;padding-left:24px}
.markdown-body code{background:var(--color-code-bg);padding:2px 6px;border-radius:3px;font-size:.9em}
.markdown-body pre{background:var(--color-code-bg);padding:12px;border-radius:6px;overflow-x:auto;margin-bottom:12px}
.markdown-body pre code{background:none;padding:0}
.status-danger{color:var(--color-danger)}
.status-muted{color:var(--color-text-muted)}
.status-success{color:var(--color-success)}
`);

const headScript = raw(`
<script>
(function(){
  var t=localStorage.getItem('theme');
  if(!t){t=window.matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'}
  document.documentElement.setAttribute('data-theme',t);
})();
</script>
`);

const themeScript = raw(`
(function(){
  var btn=document.getElementById('theme-toggle');
  function getTheme(){return document.documentElement.getAttribute('data-theme')||'light'}
  function setIcon(){btn.textContent=getTheme()==='dark'?'\\u2600':'\\u263D'}
  setIcon();
  btn.addEventListener('click',function(){
    var next=getTheme()==='dark'?'light':'dark';
    document.documentElement.setAttribute('data-theme',next);
    localStorage.setItem('theme',next);
    setIcon();
  });
  window.matchMedia('(prefers-color-scheme:dark)').addEventListener('change',function(e){
    if(!localStorage.getItem('theme')){
      var t=e.matches?'dark':'light';
      document.documentElement.setAttribute('data-theme',t);
      setIcon();
    }
  });
})();
`);

export const Layout: FC<PropsWithChildren<{ title?: string }>> = (props) => {
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{props.title ? `${props.title} - FireRepoDownloader` : "FireRepoDownloader"}</title>
        <style>{css}</style>
        {headScript}
      </head>
      <body>
        <nav>
          <div class="container">
            <a href="/">FireRepoDownloader</a>
            <div class="nav-links">
              <a href="/">Home</a>
              <a href="/admin">Admin</a>
              <button id="theme-toggle" class="theme-toggle" aria-label="Toggle theme"></button>
            </div>
          </div>
        </nav>
        <main>
          <div class="container">{props.children}</div>
        </main>
        <footer>
          <div class="container">
            FireRepoDownloader &mdash; GitHub Release Download Proxy
          </div>
        </footer>
        <script>{themeScript}</script>
      </body>
    </html>
  );
};
