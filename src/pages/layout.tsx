import type { FC, PropsWithChildren } from "hono/jsx";

const css = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
  line-height:1.6;color:#1a1a2e;background:#f0f2f5;min-height:100vh;display:flex;flex-direction:column}
a{color:#0969da;text-decoration:none}
a:hover{text-decoration:underline}
.container{max-width:960px;margin:0 auto;padding:0 20px;width:100%}
nav{background:#1a1a2e;color:#fff;padding:12px 0;position:sticky;top:0;z-index:100;
  box-shadow:0 2px 8px rgba(0,0,0,.15)}
nav .container{display:flex;align-items:center;justify-content:space-between}
nav a{color:#fff;font-weight:600;font-size:1.1rem}
nav a:hover{opacity:.85;text-decoration:none}
nav .nav-links{display:flex;gap:16px;font-size:.9rem}
nav .nav-links a{font-weight:400;opacity:.8}
nav .nav-links a:hover{opacity:1}
main{flex:1;padding:32px 0}
footer{text-align:center;padding:20px 0;color:#666;font-size:.85rem;border-top:1px solid #ddd;margin-top:auto}
.card{background:#fff;border-radius:10px;padding:24px;margin-bottom:16px;
  box-shadow:0 1px 3px rgba(0,0,0,.08);border:1px solid #e1e4e8}
.card h2{margin-bottom:8px}
.btn{display:inline-block;padding:8px 16px;border-radius:6px;font-size:.9rem;
  font-weight:500;cursor:pointer;border:none;transition:all .15s}
.btn-primary{background:#0969da;color:#fff}
.btn-primary:hover{background:#0757b3;text-decoration:none}
.btn-danger{background:#cf222e;color:#fff}
.btn-danger:hover{background:#a40e26;text-decoration:none}
.btn-sm{padding:4px 10px;font-size:.8rem}
input[type="text"],input[type="password"]{padding:8px 12px;border:1px solid #d0d7de;
  border-radius:6px;font-size:.95rem;width:100%}
input:focus{outline:none;border-color:#0969da;box-shadow:0 0 0 3px rgba(9,105,218,.15)}
.tag{display:inline-block;padding:2px 8px;border-radius:12px;font-size:.8rem;
  font-weight:500;background:#ddf4ff;color:#0969da}
.tag-pre{background:#fff8c5;color:#9a6700}
.badge{display:inline-block;padding:2px 8px;border-radius:4px;font-size:.75rem;
  background:#1a1a2e;color:#fff;margin-left:8px}
table{width:100%;border-collapse:collapse}
th,td{text-align:left;padding:10px 12px;border-bottom:1px solid #e1e4e8}
th{font-weight:600;font-size:.85rem;color:#57606a;text-transform:uppercase;letter-spacing:.5px}
.text-muted{color:#57606a}
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
.empty{text-align:center;padding:40px 20px;color:#57606a}
.asset-row{display:flex;align-items:center;justify-content:space-between;padding:10px 0;
  border-bottom:1px solid #f0f2f5}
.asset-row:last-child{border-bottom:none}
.asset-name{font-weight:500;word-break:break-all}
.asset-size{color:#57606a;font-size:.85rem;white-space:nowrap;margin-left:12px}
.markdown-body{line-height:1.7}
.markdown-body p{margin-bottom:12px}
.markdown-body ul,.markdown-body ol{margin-bottom:12px;padding-left:24px}
.markdown-body code{background:#f0f2f5;padding:2px 6px;border-radius:3px;font-size:.9em}
.markdown-body pre{background:#f0f2f5;padding:12px;border-radius:6px;overflow-x:auto;margin-bottom:12px}
.markdown-body pre code{background:none;padding:0}
`;

export const Layout: FC<PropsWithChildren<{ title?: string }>> = (props) => {
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{props.title ? `${props.title} - FireRepoDownloader` : "FireRepoDownloader"}</title>
        <style>{css}</style>
      </head>
      <body>
        <nav>
          <div class="container">
            <a href="/">FireRepoDownloader</a>
            <div class="nav-links">
              <a href="/">Home</a>
              <a href="/admin">Admin</a>
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
      </body>
    </html>
  );
};
