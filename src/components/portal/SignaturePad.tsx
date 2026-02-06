import { useRef, useEffect, useState, forwardRef, useImperativeHandle } from "react";

export interface SignaturePadRef {
  getDataUrl: () => string | null;
  clear: () => void;
  hasSignature: () => boolean;
}

interface SignaturePadProps {
  onSignatureChange?: (hasSignature: boolean, dataUrl?: string) => void;
  disabled?: boolean;
}

export const SignaturePad = forwardRef<SignaturePadRef, SignaturePadProps>(
  ({ onSignatureChange, disabled = false }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasSignature, setHasSignature] = useState(false);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Set up canvas
      ctx.strokeStyle = "#1a1a1a";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // Fill with white background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }, []);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      getDataUrl: () => {
        if (!hasSignature) return null;
        return canvasRef.current?.toDataURL("image/png") || null;
      },
      clear: () => {
        clearSignature();
      },
      hasSignature: () => hasSignature,
    }));

    const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      if ("touches" in e) {
        return {
          x: (e.touches[0].clientX - rect.left) * scaleX,
          y: (e.touches[0].clientY - rect.top) * scaleY,
        };
      }
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
      if (disabled) return;
      e.preventDefault();
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!ctx) return;

      setIsDrawing(true);
      const { x, y } = getCoordinates(e);
      ctx.beginPath();
      ctx.moveTo(x, y);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
      if (disabled) return;
      e.preventDefault();
      if (!isDrawing) return;

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!ctx) return;

      const { x, y } = getCoordinates(e);
      ctx.lineTo(x, y);
      ctx.stroke();
      
      if (!hasSignature) {
        setHasSignature(true);
        onSignatureChange?.(true, canvas?.toDataURL("image/png"));
      }
    };

    const stopDrawing = () => {
      if (isDrawing && hasSignature) {
        onSignatureChange?.(true, canvasRef.current?.toDataURL("image/png"));
      }
      setIsDrawing(false);
    };

    const clearSignature = () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!ctx || !canvas) return;

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      setHasSignature(false);
      onSignatureChange?.(false);
    };

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-foreground">Draw your signature below</p>
        </div>
        <div className="relative border-2 border-dashed border-muted-foreground/30 rounded-lg overflow-hidden bg-white">
          <canvas
            ref={canvasRef}
            width={400}
            height={200}
            className={`w-full h-[150px] touch-none ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-crosshair'}`}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
          {!hasSignature && !disabled && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-muted-foreground/50 text-sm">Sign here</p>
            </div>
          )}
        </div>
      </div>
    );
  }
);

SignaturePad.displayName = "SignaturePad";
