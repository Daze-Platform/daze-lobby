import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface OrDividerProps {
  className?: string;
}

export function OrDivider({ className }: OrDividerProps) {
  return (
    <div className={cn("flex items-center gap-4 my-2", className)}>
      <Separator className="flex-1" />
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        or
      </span>
      <Separator className="flex-1" />
    </div>
  );
}
