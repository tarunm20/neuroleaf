export function VimeoVideo() {
  return (
    <div 
      className="dark:border-primary/10 rounded-2xl border border-gray-200 overflow-hidden shadow-2xl"
      style={{ width: '100%', maxWidth: '1200px' }}
    >
      <div className="w-full aspect-video">
        <iframe 
          src="https://player.vimeo.com/video/1109734790?title=0&byline=0&portrait=0&badge=0&autopause=0&player_id=0&app_id=58479" 
          frameBorder="0" 
          allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share" 
          referrerPolicy="strict-origin-when-cross-origin" 
          className="w-full h-full"
          title="Neuroleaf"
        />
      </div>
      <script async src="https://player.vimeo.com/api/player.js"></script>
    </div>
  );
}