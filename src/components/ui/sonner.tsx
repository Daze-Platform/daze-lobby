import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";
import { CheckCircle2, XCircle, AlertTriangle, Info } from "lucide-react";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="bottom-right"
      gap={12}
      icons={{
        success: <CheckCircle2 className="w-[18px] h-[18px] text-emerald-500" />,
        error: <XCircle className="w-[18px] h-[18px] text-rose-500" />,
        warning: <AlertTriangle className="w-[18px] h-[18px] text-amber-500" />,
        info: <Info className="w-[18px] h-[18px] text-primary" />,
      }}
      toastOptions={{
        duration: 4000,
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:dark:bg-slate-900 group-[.toaster]:text-foreground group-[.toaster]:border group-[.toaster]:border-border/50 group-[.toaster]:shadow-lg group-[.toaster]:shadow-black/10 group-[.toaster]:rounded-xl group-[.toaster]:px-4 group-[.toaster]:py-3.5 group-[.toaster]:gap-3 group-[.toaster]:items-start group-[.toaster]:backdrop-blur-none",
          title: "group-[.toast]:font-semibold group-[.toast]:text-sm group-[.toast]:tracking-tight group-[.toast]:text-foreground",
          description: "group-[.toast]:text-muted-foreground group-[.toast]:text-[13px] group-[.toast]:leading-relaxed",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:text-xs group-[.toast]:font-medium group-[.toast]:rounded-lg group-[.toast]:px-3 group-[.toast]:py-1.5 group-[.toast]:shadow-sm group-[.toast]:transition-all group-[.toast]:hover:opacity-90",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:text-xs group-[.toast]:font-medium group-[.toast]:rounded-lg group-[.toast]:px-3 group-[.toast]:py-1.5",
          closeButton:
            "group-[.toast]:bg-transparent group-[.toast]:border-0 group-[.toast]:text-muted-foreground group-[.toast]:opacity-60 group-[.toast]:hover:opacity-100 group-[.toast]:transition-opacity",
          success:
            "group-[.toaster]:!bg-emerald-50 group-[.toaster]:dark:!bg-emerald-950 group-[.toaster]:!border-emerald-200 group-[.toaster]:dark:!border-emerald-800",
          error:
            "group-[.toaster]:!bg-rose-50 group-[.toaster]:dark:!bg-rose-950 group-[.toaster]:!border-rose-200 group-[.toaster]:dark:!border-rose-800",
          warning:
            "group-[.toaster]:!bg-amber-50 group-[.toaster]:dark:!bg-amber-950 group-[.toaster]:!border-amber-200 group-[.toaster]:dark:!border-amber-800",
          info:
            "group-[.toaster]:!bg-sky-50 group-[.toaster]:dark:!bg-sky-950 group-[.toaster]:!border-sky-200 group-[.toaster]:dark:!border-sky-800",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
