import React, { useState } from "react";

type Props = {
  drivePreviewUrl?: string;               // optional: fullGoogle Drive /preview URL
  mp4Url?: string;                        // optional: direct mp4 URL (preferred for in-site playback)
  title?: string;
  subtitle?: string;
};

const VideoLightboxDrive: React.FC<Props> = ({
  drivePreviewUrl,
  mp4Url,
  title = "EchoCare Demo",
  subtitle = "Doctor Calls • Medication Reminders • Health Updates",
}) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Poster-like block with Play */}
      <button
        onClick={() => setOpen(true)}
        className="relative w-full max-w-4xl mx-auto rounded-2xl overflow-hidden shadow-lg focus:outline-none focus:ring-4 focus:ring-teal-300"
        aria-label={`Play video: ${title}`}
      >
        <div className="aspect-[16/9] bg-gradient-to-br from-teal-500 to-blue-700 flex flex-col items-center justify-center text-center px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">{title}</h2>
          <p className="text-lg text-teal-100 mb-6">{subtitle}</p>
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/95 shadow-xl">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                 className="w-10 h-10 text-teal-600" fill="currentColor">
              <path d="M8 5v14l11-7-11-7z" />
            </svg>
          </div>
        </div>
      </button>

      {/* Modal player: prefer HTML5 video when mp4Url is provided; fallback to external link */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-3xl bg-neutral-950 rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-br from-teal-600 to-sky-700 p-5 text-center">
              <h3 className="text-2xl font-bold text-white">{title}</h3>
              <p className="text-teal-50 mt-1">{subtitle}</p>
            </div>

            {mp4Url ? (
              <div className="bg-black">
                <video
                  src={mp4Url}
                  controls
                  autoPlay
                  playsInline
                  className="w-full h-auto"
                />
              </div>
            ) : (
              <div className="p-6 flex flex-col gap-3">
                <p className="text-neutral-300 text-center">
                  For the best experience, watch the EchoCare demo on Google Drive.
                </p>
                {drivePreviewUrl && (
                  <a
                    href={drivePreviewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center w-full px-4 py-3 rounded-lg bg-white text-black font-semibold hover:bg-neutral-200 transition"
                  >
                    Watch on Google Drive
                  </a>
                )}
              </div>
            )}

            <div className="p-4 flex justify-end bg-neutral-900">
              <button
                onClick={() => setOpen(false)}
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-neutral-800 text-neutral-200 font-medium hover:bg-neutral-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default VideoLightboxDrive;
