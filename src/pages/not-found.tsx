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
  return (
    <Empty className="my-auto min-h-96 border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <SearchXIcon />
        </EmptyMedia>
        <EmptyTitle>Page not found</EmptyTitle>
        <EmptyDescription>
          The route may be incomplete, or the repository path may have changed.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button asChild>
          <Link to="/">
            <ArrowLeftIcon data-icon="inline-start" />
            Back to browse
          </Link>
        </Button>
      </EmptyContent>
    </Empty>
  );
}
