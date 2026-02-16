export interface Bindings {
  REPO_TOKENS: KVNamespace;
  DOWNLOAD_STATS: KVNamespace;
  ADMIN_TOKEN: string;
}

// GitHub API response types

export interface GitHubRelease {
  id: number;
  tag_name: string;
  name: string | null;
  body: string | null;
  draft: boolean;
  prerelease: boolean;
  created_at: string;
  published_at: string;
  assets: GitHubAsset[];
  html_url: string;
}

export interface GitHubAsset {
  id: number;
  name: string;
  label: string | null;
  content_type: string;
  size: number;
  download_count: number;
  browser_download_url: string;
  url: string;
  created_at: string;
  updated_at: string;
}

export interface GitHubRepo {
  id: number;
  full_name: string;
  private: boolean;
  description: string | null;
  html_url: string;
}

// KV stored types

export interface RepoTokenMetadata {
  owner: string;
  repo: string;
  created_at: string;
  updated_at: string;
}

export interface DownloadStat {
  count: number;
  last_downloaded_at: string;
}

export interface RepoStatsSummary {
  repo: string;
  total_downloads: number;
  assets: {
    tag: string;
    asset: string;
    count: number;
    last_downloaded_at: string;
  }[];
}
