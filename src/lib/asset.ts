import {
  AppWindowIcon,
  FileArchiveIcon,
  FileCodeIcon,
  FileIcon,
  FileTextIcon,
  ImageIcon,
  type LucideIcon,
} from "lucide-react";

const iconByExtension: Array<[LucideIcon, string[]]> = [
  [FileArchiveIcon, ["zip", "tar", "gz", "tgz", "bz2", "xz", "zst", "7z", "rar"]],
  [AppWindowIcon, ["exe", "msi", "dmg", "pkg", "deb", "rpm", "appimage", "apk", "snap", "flatpak"]],
  [FileCodeIcon, ["js", "mjs", "ts", "json", "wasm", "jar", "py", "sh", "ps1"]],
  [ImageIcon, ["png", "jpg", "jpeg", "gif", "svg", "webp", "ico"]],
  [FileTextIcon, ["txt", "md", "sha256", "sig", "asc", "sbom", "pem"]],
];

export function assetIcon(name: string): LucideIcon {
  const extension = name.split(".").pop()?.toLowerCase() ?? "";
  const match = iconByExtension.find(([, extensions]) => extensions.includes(extension));
  return match ? match[0] : FileIcon;
}
