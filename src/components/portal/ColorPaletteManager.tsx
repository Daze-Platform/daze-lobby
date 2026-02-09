import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X, Palette } from "lucide-react";
import { cn } from "@/lib/utils";

interface ColorPaletteManagerProps {
  colors: string[];
  onChange: (colors: string[]) => void;
  maxColors?: number;
}

const hexRegex = /^#[0-9A-Fa-f]{0,6}$/;

export function ColorPaletteManager({ 
  colors, 
  onChange, 
  maxColors = 5 
}: ColorPaletteManagerProps) {
  const [newColor, setNewColor] = useState("#3B82F6");

  const addColor = () => {
    if (colors.length < maxColors && !colors.includes(newColor)) {
      onChange([...colors, newColor]);
    }
  };

  const removeColor = (index: number) => {
    onChange(colors.filter((_, i) => i !== index));
  };

  const updateColor = (index: number, value: string) => {
    // Only update if valid hex or partial hex (for typing)
    if (hexRegex.test(value) || value === "#") {
      const updated = [...colors];
      updated[index] = value.toUpperCase();
      onChange(updated);
    }
  };

  const handleColorPickerChange = (index: number, value: string) => {
    const updated = [...colors];
    updated[index] = value.toUpperCase();
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Label className="flex items-center gap-2">
          <Palette className="w-4 h-4" strokeWidth={1.5} />
          Brand Color Palette
        </Label>
        <span className="text-xs text-muted-foreground">
          ({colors.length}/{maxColors})
        </span>
      </div>

      {/* Empty State */}
      {colors.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 border-dashed border-border bg-muted/30">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted">
            <Palette className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">No colors added yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Add your first brand color below
            </p>
          </div>
        </div>
      )}

      {/* Current Colors */}
      <div className="flex flex-wrap gap-3">
        {colors.map((color, index) => (
          <div
            key={index}
            className="flex items-center gap-3 p-3 border rounded-xl bg-card shadow-sm transition-all hover:shadow-md"
          >
            {/* Color Swatch with improved touch target */}
            <div className="relative">
              <div 
                className="w-12 h-12 rounded-lg ring-2 ring-border hover:ring-primary transition-all cursor-pointer overflow-hidden"
                style={{ backgroundColor: color }}
              >
                <input
                  type="color"
                  value={color}
                  onChange={(e) => handleColorPickerChange(index, e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            </div>
            
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground font-medium">
                {index === 0 ? "Primary" : index === 1 ? "Secondary" : `Color ${index + 1}`}
              </span>
              <Input
                value={color}
                onChange={(e) => updateColor(index, e.target.value)}
                placeholder="#3B82F6"
                className="w-24 h-7 text-xs font-mono uppercase px-2"
              />
            </div>
            
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={() => removeColor(index)}
            >
              <X className="w-3.5 h-3.5" strokeWidth={1.5} />
            </Button>
          </div>
        ))}

        {/* Add Color Button */}
        {colors.length < maxColors && (
          <div className="flex items-center gap-3 p-3 border border-dashed rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
            <div className="relative">
              <div 
                className="w-12 h-12 rounded-lg ring-2 ring-border hover:ring-primary transition-all cursor-pointer overflow-hidden"
                style={{ backgroundColor: newColor }}
              >
                <input
                  type="color"
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value.toUpperCase())}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addColor}
              className="gap-1.5 h-9"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
              Add Color
            </Button>
          </div>
        )}
      </div>

      {/* Preview Strip */}
      {colors.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Palette Preview</Label>
          <div className="flex h-10 rounded-xl overflow-hidden border shadow-sm">
            {colors.map((color, index) => (
              <div
                key={index}
                className="flex-1 transition-all"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
