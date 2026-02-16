# FireRepoDownloader

GitHub Release 下载代理，部署在 Cloudflare Workers 上。支持公有和私有仓库，提供 Web UI 浏览 Release 和 Admin 管理面板。

## 功能

- **下载代理** — 流式转发 GitHub Release asset，不缓冲整个文件
- **私有仓库支持** — 通过 Admin API 为每个仓库配置 GitHub Access Token
- **Web UI** — 浏览任意仓库的 Release 列表和 asset 详情
- **下载统计** — 自动记录每个 asset 的下载次数
- **Admin 面板** — Token 管理 + 统计概览，Bearer Token 认证

## 部署（Cloudflare 网页端）

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
   - **Build command**: `npm install && npm run deploy`
   - **Build output directory**: 留空（Worker 项目不需要）
4. 点击 **Save and Deploy**

> 如果使用 Workers（而非 Pages）部署，也可以直接在 **Workers & Pages > Create > Create Worker** 中创建，然后在 Settings 中连接 Git 仓库。

### 3. 绑定 KV Namespace

1. 进入部署好的 Worker 项目 > **Settings > Bindings**
2. 点击 **Add**，选择 **KV Namespace**
3. 添加两个绑定：
   - Variable name: `REPO_TOKENS` → 选择步骤 1 中创建的 `REPO_TOKENS` namespace
   - Variable name: `DOWNLOAD_STATS` → 选择步骤 1 中创建的 `DOWNLOAD_STATS` namespace
4. 保存后重新部署生效

### 4. 设置环境变量

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

本地开发时需要在 `wrangler.toml` 中临时添加 KV 绑定配置（加上 `id` 和 `preview_id`），或使用 `--local` 模式（Wrangler 会自动创建本地 KV 存储）。

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
PUT    /admin/api/repos/:owner/:repo/token   # 设置 Token（body: {"token":"ghp_..."}）
DELETE /admin/api/repos/:owner/:repo/token   # 删除 Token
GET    /admin/api/repos                      # 列出已配置的仓库
GET    /admin/api/stats                      # 下载统计
```

## License

[MIT](LICENSE)
