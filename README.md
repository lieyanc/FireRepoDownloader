# FireRepoDownloader

GitHub Release 下载代理，部署在 Cloudflare Workers 上。支持公有和私有仓库，提供 Web UI 浏览 Release 和 Admin 管理面板。

## 功能

- **下载代理** — 流式转发 GitHub Release asset，不缓冲整个文件
- **私有仓库支持** — 通过 Admin API 为每个仓库配置 GitHub Access Token
- **Web UI** — 浏览任意仓库的 Release 列表和 asset 详情
- **下载统计** — 自动记录每个 asset 的下载次数
- **Admin 面板** — Token 管理 + 统计概览，Bearer Token 认证

## 部署（Cloudflare Dashboard + Git）

### 1. 创建 KV Namespace

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 **Workers & Pages > KV**
3. 点击 **Create a namespace**，创建以下两个：
   - `REPO_TOKENS` — 存储仓库的 GitHub Token
   - `DOWNLOAD_STATS` — 存储下载次数统计

### 2. 连接 GitHub 仓库并部署

1. 进入 **Workers & Pages > Create**
2. 选择 **Connect to Git**，授权并选择本仓库
3. 构建配置：
   - **Framework preset**: `None`
   - **Build command**: `npm ci && npm run typecheck`
   - **Deploy command (Production)**: `npx wrangler@latest deploy --strict`
   - **Deploy command (Non-Production)**: `npx wrangler@latest versions upload`
   - **Build output directory**: 留空（Worker 项目不需要）
4. 点击 **Save and Deploy**

> 不要在仓库构建命令中使用 `npm run deploy` 或 `wrangler deploy`，避免把 Dashboard 运行时配置（例如 KV 绑定）被仓库文件覆盖。  
> Workers Builds 仍会执行 Deploy command（默认就是 `npx wrangler deploy`）；这里的目标是把部署入口放在 Dashboard 配置里统一管理。

### 3. 配置归属（防止 KV 被后续 Git 部署覆盖）

1. 生产配置以 Dashboard 为准：
   - **Settings > Bindings** 管理 `REPO_TOKENS`、`DOWNLOAD_STATS`
   - **Settings > Variables and Secrets** 管理 `ADMIN_TOKEN`
2. 若 Production Deploy command 使用 `--strict`，仓库中的 Wrangler 配置必须镜像当前远端运行时配置（例如 `routes`、`kv_namespaces`），否则构建会因冲突被拒绝。
3. 在 Dashboard 改动 Bindings 后，复制 Dashboard 提供的 TOML 片段到仓库配置并提交，再触发下一次 Git 构建。
4. Production Deploy command 使用 `--strict`，当本地配置与远端配置不一致时会阻止覆盖并报错（这是预期保护行为）。
5. Non-Production 建议使用默认 `npx wrangler versions upload` 产出预览版本，不直接影响生产流量。
6. 每次改完 Bindings/Secrets 后点击 **Deploy** 使其生效。

示例（将值替换为你的实际配置）：

```toml
workers_dev = true
preview_urls = true

routes = [
  { pattern = "dl.repo.chycloud.top", zone_name = "chycloud.top", custom_domain = true }
]

[[kv_namespaces]]
binding = "DOWNLOAD_STATS"
id = "<DOWNLOAD_STATS_NAMESPACE_ID>"

[[kv_namespaces]]
binding = "REPO_TOKENS"
id = "<REPO_TOKENS_NAMESPACE_ID>"
```

> 如果你不想在仓库中维护绑定镜像，则不要使用 `--strict`；但这样会失去“冲突即中断”的保护，存在误覆盖远端配置的风险。
### 4. 绑定 KV Namespace

1. 进入部署好的 Worker 项目 > **Settings > Bindings**
2. 点击 **Add**，选择 **KV Namespace**
3. 添加两个绑定：
   - Variable name: `REPO_TOKENS` → 选择步骤 1 中创建的 `REPO_TOKENS` namespace
   - Variable name: `DOWNLOAD_STATS` → 选择步骤 1 中创建的 `DOWNLOAD_STATS` namespace
4. 保存后重新部署生效

### 5. 设置环境变量

1. 进入 Worker 项目 > **Settings > Variables and Secrets**
2. 点击 **Add**，添加：
   - **Name**: `ADMIN_TOKEN`
   - **Value**: 你自定义的管理员密码
   - **Type**: 选择 **Secret**（加密存储）
3. 保存后重新部署生效

## 本地开发

```bash
# 安装依赖
npm install

# 创建本地环境变量
cp .dev.vars.example .dev.vars
# 编辑 .dev.vars，设置 ADMIN_TOKEN

# 启动开发服务器
npm run dev
```

本地开发建议使用 `wrangler dev --remote` 直接复用远端绑定，避免修改 `wrangler.toml`。

## 使用

### Web UI

| 路径 | 说明 |
|------|------|
| `/` | 首页，输入 `owner/repo` 浏览 |
| `/:owner/:repo` | 仓库 Release 列表 |
| `/:owner/:repo/:tag` | Release 详情 + 下载链接 |
| `/admin` | 管理面板（需要 Admin Token） |

### 下载 API

```
GET /download/:owner/:repo/:tag/:asset
GET /download/:owner/:repo/latest/:asset
```

### Release 查询 API

```
GET /api/releases/:owner/:repo?page=1&per_page=10
GET /api/releases/:owner/:repo/:tag
```

### Admin API（需 Bearer Token）

```
GET    /admin/api/auth                      # 验证 Admin Token
PUT    /admin/api/repos/:owner/:repo/token   # 设置 Token（body: {"token":"ghp_..."}）
DELETE /admin/api/repos/:owner/:repo/token   # 删除 Token
GET    /admin/api/repos                      # 列出已配置的仓库
GET    /admin/api/stats                      # 下载统计
```

## License

[MIT](LICENSE)
