import authArtwork from "@/assets/auth-artwork.png";

export function SketchyArtPanel() {
  return (
    <div className="relative h-full w-full flex items-center justify-center">
      <img 
        src={authArtwork} 
        alt="A brighter day awaits - Daze" 
        className="h-full w-full object-contain"
      />
    </div>
  );
}
