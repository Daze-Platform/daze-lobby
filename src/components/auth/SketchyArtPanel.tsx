import authArtwork from "@/assets/auth-artwork.png";

export function SketchyArtPanel() {
  return (
    <div className="relative h-full w-full overflow-hidden">
      <img 
        src={authArtwork} 
        alt="A brighter day awaits - Daze" 
        className="h-full w-full object-cover"
      />
      {/* Cover the baked-in "Preview Client Portal" button at the bottom of the image */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-[60px] pointer-events-none"
        style={{ 
          background: "linear-gradient(to top, #c87a2d 0%, #c87a2d 40%, transparent 100%)"
        }}
      />
    </div>
  );
}
