import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

type SaveButtonState = "idle" | "loading" | "success";

interface SaveButtonProps extends Omit<ButtonProps, "onClick"> {
  onClick: () => Promise<void> | void;
  onSuccess?: () => void;
  idleText?: string;
  loadingText?: string;
  successText?: string;
  successDuration?: number;
}

const SaveButton = React.forwardRef<HTMLButtonElement, SaveButtonProps>(
  (
    {
      className,
      onClick,
      onSuccess,
      idleText = "Save Changes",
      loadingText = "Saving...",
      successText = "Saved!",
      successDuration = 2000,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const [state, setState] = useState<SaveButtonState>("idle");

    // Reset to idle after success duration
    useEffect(() => {
      if (state === "success") {
        const timer = setTimeout(() => {
          setState("idle");
        }, successDuration);
        return () => clearTimeout(timer);
      }
    }, [state, successDuration]);

    const handleClick = useCallback(async () => {
      if (state !== "idle") return;

      setState("loading");
      try {
        await onClick();
        setState("success");
        // Fire onSuccess callback after entering success state
        onSuccess?.();
      } catch (error) {
        // On error, go back to idle
        setState("idle");
        throw error;
      }
    }, [onClick, onSuccess, state]);

    const isDisabled = disabled || state === "loading" || state === "success";

    const buttonText = {
      idle: children || idleText,
      loading: loadingText,
      success: successText,
    }[state];

    return (
      <Button
        ref={ref}
        className={cn(
          "transition-all duration-300",
          state === "success" && "bg-success hover:bg-success text-success-foreground",
          className
        )}
        disabled={isDisabled}
        onClick={handleClick}
        {...props}
      >
        {state === "loading" && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        {state === "success" && (
          <Check className="mr-2 h-4 w-4" />
        )}
        {buttonText}
      </Button>
    );
  }
);

SaveButton.displayName = "SaveButton";

export { SaveButton };
export type { SaveButtonProps, SaveButtonState };
