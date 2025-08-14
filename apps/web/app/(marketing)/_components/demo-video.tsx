'use client';

export function DemoVideo() {
  return (
    <div 
      className="dark:border-primary/10 rounded-2xl border border-gray-200 overflow-hidden shadow-2xl"
      style={{ width: '100%', maxWidth: '1200px' }}
    >
      <video 
        className="w-full h-full aspect-video"
        autoPlay 
        muted 
        loop 
        playsInline
        controls
        poster="/images/video-poster.png"
      >
        <source src="/videos/neuroleaf-demo.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
}