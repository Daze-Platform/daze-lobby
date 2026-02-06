import { useState } from "react";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Upload, Download, FileText, Palette, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface OnboardingTask {
  key: string;
  name: string;
  isCompleted: boolean;
  data?: Record<string, unknown>;
}

interface TaskAccordionProps {
  tasks: OnboardingTask[];
  onTaskUpdate: (taskKey: string, data: Record<string, unknown>) => void;
  onFileUpload: (taskKey: string, file: File, fieldName: string) => void;
}

export function TaskAccordion({ tasks, onTaskUpdate, onFileUpload }: TaskAccordionProps) {
  const [brandColor, setBrandColor] = useState("#3B82F6");
  
  const getTaskIndex = (key: string) => {
    const index = tasks.findIndex(t => t.key === key);
    return index >= 0 ? index : 999;
  };

  const isTaskLocked = (key: string) => {
    const taskIndex = getTaskIndex(key);
    if (taskIndex === 0) return false;
    
    // Check if previous task is completed
    const prevTask = tasks[taskIndex - 1];
    return prevTask ? !prevTask.isCompleted : false;
  };

  const handleFileChange = (taskKey: string, fieldName: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(taskKey, file, fieldName);
    }
  };

  return (
    <Accordion type="single" collapsible className="w-full space-y-3">
      {/* Step A: Legal & Agreement */}
      <AccordionItem 
        value="legal" 
        className={cn(
          "border rounded-lg px-4 bg-card",
          isTaskLocked("legal") && "opacity-50 pointer-events-none"
        )}
        disabled={isTaskLocked("legal")}
      >
        <AccordionTrigger className="hover:no-underline py-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
              tasks.find(t => t.key === "legal")?.isCompleted 
                ? "bg-success text-success-foreground" 
                : "bg-muted text-muted-foreground"
            )}>
              {tasks.find(t => t.key === "legal")?.isCompleted ? <Check className="w-4 h-4" /> : "A"}
            </div>
            <div className="text-left">
              <p className="font-medium">Legal & Agreement</p>
              <p className="text-sm text-muted-foreground">Download and sign the pilot agreement</p>
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent className="pb-4">
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-4">
              <Button variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Download Pilot Agreement.pdf
              </Button>
            </div>
            <div className="space-y-2">
              <Label htmlFor="signed-agreement">Upload Signed Agreement (PDF only)</Label>
              <div className="flex items-center gap-2">
                <Input 
                  id="signed-agreement" 
                  type="file" 
                  accept=".pdf"
                  onChange={handleFileChange("legal", "signed_agreement")}
                  className="cursor-pointer"
                />
              </div>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* Step B: Brand Identity */}
      <AccordionItem 
        value="brand" 
        className={cn(
          "border rounded-lg px-4 bg-card",
          isTaskLocked("brand") && "opacity-50 pointer-events-none"
        )}
        disabled={isTaskLocked("brand")}
      >
        <AccordionTrigger className="hover:no-underline py-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
              tasks.find(t => t.key === "brand")?.isCompleted 
                ? "bg-success text-success-foreground" 
                : "bg-muted text-muted-foreground"
            )}>
              {tasks.find(t => t.key === "brand")?.isCompleted ? <Check className="w-4 h-4" /> : "B"}
            </div>
            <div className="text-left">
              <p className="font-medium">Brand Identity</p>
              <p className="text-sm text-muted-foreground">Upload your logo and select brand color</p>
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent className="pb-4">
          <div className="space-y-6 pt-2">
            <div className="space-y-2">
              <Label htmlFor="logo-upload">Upload Logo (PNG/SVG)</Label>
              <Input 
                id="logo-upload" 
                type="file" 
                accept=".png,.svg"
                onChange={handleFileChange("brand", "logo")}
                className="cursor-pointer"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="brand-color">Brand Color</Label>
              <div className="flex items-center gap-3">
                <Input 
                  id="brand-color" 
                  type="color" 
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value)}
                  className="w-16 h-10 p-1 cursor-pointer"
                />
                <Input 
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value)}
                  className="w-28 font-mono"
                  placeholder="#3B82F6"
                />
                <Palette className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>

            {/* Live Preview */}
            <div className="space-y-2">
              <Label>Preview: Mock Daze Order Screen</Label>
              <div 
                className="border rounded-lg p-4 bg-background"
                style={{ borderColor: brandColor }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: brandColor }}
                  >
                    D
                  </div>
                  <span className="font-semibold">Your Hotel Name</span>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
                <Button 
                  className="mt-4 w-full"
                  style={{ backgroundColor: brandColor }}
                >
                  Place Order
                </Button>
              </div>
            </div>

            <Button 
              onClick={() => onTaskUpdate("brand", { brand_color: brandColor })}
              className="w-full"
            >
              Save Brand Settings
            </Button>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* Step C: Menu Configuration */}
      <AccordionItem 
        value="menu" 
        className={cn(
          "border rounded-lg px-4 bg-card",
          isTaskLocked("menu") && "opacity-50 pointer-events-none"
        )}
        disabled={isTaskLocked("menu")}
      >
        <AccordionTrigger className="hover:no-underline py-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
              tasks.find(t => t.key === "menu")?.isCompleted 
                ? "bg-success text-success-foreground" 
                : "bg-muted text-muted-foreground"
            )}>
              {tasks.find(t => t.key === "menu")?.isCompleted ? <Check className="w-4 h-4" /> : "C"}
            </div>
            <div className="text-left">
              <p className="font-medium">Menu Configuration</p>
              <p className="text-sm text-muted-foreground">Upload menu files and set hours of operation</p>
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent className="pb-4">
          <div className="space-y-6 pt-2">
            <div className="space-y-2">
              <Label htmlFor="menu-upload">Upload Menu Files (PDF/Images)</Label>
              <Input 
                id="menu-upload" 
                type="file" 
                accept=".pdf,.png,.jpg,.jpeg"
                multiple
                onChange={handleFileChange("menu", "menu_files")}
                className="cursor-pointer"
              />
              <p className="text-xs text-muted-foreground">You can upload multiple files</p>
            </div>

            <div className="space-y-4">
              <Label className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Hours of Operation
              </Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hours-weekday" className="text-sm">Weekdays</Label>
                  <Input 
                    id="hours-weekday" 
                    placeholder="e.g., 6:00 AM - 10:00 PM"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hours-weekend" className="text-sm">Weekends</Label>
                  <Input 
                    id="hours-weekend" 
                    placeholder="e.g., 7:00 AM - 11:00 PM"
                  />
                </div>
              </div>
            </div>

            <Button 
              onClick={() => onTaskUpdate("menu", { hours_configured: true })}
              className="w-full"
            >
              Save Menu Configuration
            </Button>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
