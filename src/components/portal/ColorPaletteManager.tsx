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
    const updated = [...colors];
    updated[index] = value;
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

      {/* Current Colors */}
      <div className="flex flex-wrap gap-3">
        {colors.map((color, index) => (
          <div
            key={index}
            className="flex items-center gap-2 p-2 border rounded-lg bg-card"
          >
            <Input
              type="color"
              value={color}
              onChange={(e) => updateColor(index, e.target.value)}
              className="w-10 h-10 p-1 cursor-pointer border-0"
            />
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">
                {index === 0 ? "Primary" : index === 1 ? "Secondary" : `Color ${index + 1}`}
              </span>
              <Input
                value={color}
                onChange={(e) => updateColor(index, e.target.value)}
                className="w-24 h-6 text-xs font-mono px-1"
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => removeColor(index)}
            >
              <X className="w-3 h-3" strokeWidth={1.5} />
            </Button>
          </div>
        ))}

        {/* Add Color Button */}
        {colors.length < maxColors && (
          <div className="flex items-center gap-2 p-2 border border-dashed rounded-lg">
            <Input
              type="color"
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              className="w-10 h-10 p-1 cursor-pointer border-0"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addColor}
              className="gap-1"
            >
              <Plus className="w-3 h-3" strokeWidth={1.5} />
              Add
            </Button>
          </div>
        )}
      </div>

      {/* Preview Strip */}
      {colors.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Palette Preview</Label>
          <div className="flex h-8 rounded-lg overflow-hidden border">
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
