import React, { useMemo } from 'react';

type CareImagesCarouselProps = {
  images?: string[];
  speedMs?: number; // higher is slower
};

export default function CareImagesCarousel({
  images,
  speedMs = 22000,
}: CareImagesCarouselProps) {
  // Default to repeating the existing poster until more images are added
  const sourceImages = useMemo(() => {
    const base = images && images.length > 0 ? images : [
      '/images/echocare-poster.png',
      '/images/echocare-poster.png',
      '/images/echocare-poster.png',
      '/images/echocare-poster.png',
      '/images/echocare-poster.png',
    ];
    // Duplicate for seamless loop
    return [...base, ...base];
  }, [images]);

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* Gradient border frame */}
      <div className="absolute -inset-4 bg-gradient-to-br from-teal-400/25 via-blue-400/25 to-purple-400/25 rounded-3xl blur-xl" aria-hidden />

      <div className="relative rounded-2xl bg-white/90 dark:bg-gray-900/60 backdrop-blur-sm shadow-2xl p-3">
        <div
          className="group cursor-default"
          role="region"
          aria-label="Caring moments gallery"
        >
          <div
            className="flex gap-4 will-change-transform"
            style={{
              animation: images?.length === 9 
                ? `carousel-scroll-9 ${speedMs}ms linear infinite`
                : `carousel-scroll ${speedMs}ms linear infinite`,
            }}
          >
            {sourceImages.map((src, idx) => (
              <div key={idx} className="shrink-0 w-72 sm:w-80 md:w-96 lg:w-80 xl:w-96 rounded-xl overflow-hidden shadow-md bg-gray-100 dark:bg-gray-800">
                <img
                  src={src}
                  alt={`Caring for seniors and caregivers - Image ${idx + 1}`}
                  className="w-full h-64 sm:h-72 md:h-80 object-cover"
                  loading={idx < 3 ? "eager" : "lazy"}
                  onError={(e) => {
                    console.error(`Failed to load image: ${src}`);
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


