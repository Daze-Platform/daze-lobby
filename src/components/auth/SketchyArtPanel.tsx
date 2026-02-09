import authArtwork from "@/assets/auth-artwork.png";

export function SketchyArtPanel() {
  return (
    <div className="h-full w-full">
      <img 
        src={authArtwork} 
        alt="A brighter day awaits - Daze" 
        className="h-full w-full object-cover"
      />
    </div>
  );
}
