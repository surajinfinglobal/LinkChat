export default function SharedMedia({ media }) {
  if (!media || media.length === 0) {
    return <p className="text-xs text-base-400 px-1">No shared media yet</p>;
  }
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {media.map((src, i) => (
        <button key={i} className="aspect-square rounded-lg overflow-hidden group relative">
          <img src={src} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
        </button>
      ))}
    </div>
  );
}
