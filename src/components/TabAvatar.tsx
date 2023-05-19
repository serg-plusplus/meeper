import { AppWindowIcon } from "lucide-react";

import { TabInfo } from "../core/types";

import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { cn } from "./ui/utils";

export default function TabAvatar({
  tab,
  className,
}: {
  tab: TabInfo;
  className?: string;
}) {
  return (
    <Avatar
      className={cn(
        "h-10 w-auto p-1",
        "rounded-sm border border-border",
        "bg-muted/75 text-foreground",
        className
      )}
    >
      <AvatarImage src={tab.favIconUrl} alt="" />
      <AvatarFallback className="rounded-none bg-transparent">
        <AppWindowIcon className="h-full w-auto" />
      </AvatarFallback>
    </Avatar>
  );
}
