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
        className="absolute bottom-0 right-0 w-[260px] h-[52px]"
        style={{ backgroundColor: "#d97a2e" }}
      />
    </div>
  );
}
