import { useEffect } from "react";
import { ArrowLeftIcon, SearchXIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export function NotFoundPage() {
  useEffect(() => {
    document.title = "Not found · FireRepoDownloader";
  }, []);

  return (
    <Empty className="my-auto min-h-96 border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <SearchXIcon />
        </EmptyMedia>
        <EmptyTitle>Page not found</EmptyTitle>
        <EmptyDescription>That path doesn&apos;t match a repository or release.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="outline" size="sm" asChild>
          <Link to="/">
            <ArrowLeftIcon data-icon="inline-start" />
            Back to browse
          </Link>
        </Button>
      </EmptyContent>
    </Empty>
  );
}
