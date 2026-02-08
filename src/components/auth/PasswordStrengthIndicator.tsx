import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { PasswordValidationResult, getStrengthColor } from "@/lib/passwordValidation";

interface PasswordStrengthIndicatorProps {
  validation: PasswordValidationResult;
  show: boolean;
}

export function PasswordStrengthIndicator({ validation, show }: PasswordStrengthIndicatorProps) {
  if (!show) return null;

  const { score, label, requirements } = validation;
  const strengthColor = getStrengthColor(score);
  const progressWidth = score === 0 ? 0 : (score / 5) * 100;

  return (
    <div className="space-y-3 animate-fade-in-up">
      {/* Strength Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Password strength</span>
          {label && (
            <span 
              className="text-xs font-semibold transition-colors"
              style={{ color: strengthColor }}
            >
              {label}
            </span>
          )}
        </div>
        <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full transition-all duration-300 ease-out rounded-full"
            style={{ 
              width: `${progressWidth}%`,
              backgroundColor: strengthColor
            }}
          />
        </div>
      </div>

      {/* Requirements Checklist */}
      <div className="grid grid-cols-1 gap-1">
        {requirements.map((req) => (
          <div 
            key={req.key} 
            className={cn(
              "flex items-center gap-2 text-xs transition-colors",
              req.met ? "text-emerald-600 dark:text-emerald-500" : "text-muted-foreground"
            )}
          >
            {req.met ? (
              <Check className="h-3 w-3 shrink-0" />
            ) : (
              <X className="h-3 w-3 shrink-0 text-muted-foreground/50" />
            )}
            <span>{req.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
