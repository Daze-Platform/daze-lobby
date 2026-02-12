import authArtwork from "@/assets/auth-artwork.png";

export function SketchyArtPanel() {
  return (
    <div className="h-full w-full bg-sky-300">
      <img 
        src={authArtwork} 
        alt="A brighter day awaits - Daze" 
        className="h-full w-full object-contain object-top"
      />
    </div>
  );
}
