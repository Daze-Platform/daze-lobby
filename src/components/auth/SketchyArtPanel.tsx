import authArtwork from "@/assets/auth-artwork.png";

export function SketchyArtPanel() {
  return (
    <div className="relative h-full w-full overflow-hidden">
      <img 
        src={authArtwork} 
        alt="A brighter day awaits - Daze" 
        className="h-full w-full object-cover"
      />
      {/* Cover the baked-in "Preview Client Portal" button at the bottom-right of the image */}
      <div 
        className="absolute bottom-0 right-0 w-[300px] h-[80px]"
        style={{ 
          background: "radial-gradient(ellipse at 100% 100%, #d4842f 0%, #d4842f 60%, transparent 100%)"
        }}
      />
    </div>
  );
}
