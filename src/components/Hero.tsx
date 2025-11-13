import { Heart } from "lucide-react";
import CareImagesCarousel from "./CareImagesCarousel";

export default function Hero() {
  const handleJoinWaitlist = () => {
    window.open(
      'https://docs.google.com/forms/d/1CUdKv4XTTcbFLEIDq8vc_O7Ib9GlwxwITuSelKcsMiY/viewform',
      '_blank'
    );
  };

  return (
    <section className="relative isolate overflow-hidden py-12 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-teal-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      {/* Decorative gradient blobs */}
      <div className="hidden sm:block pointer-events-none select-none absolute -top-24 -right-24 w-80 h-80 bg-teal-200/60 dark:bg-teal-900/30 rounded-full blur-3xl animate-float -z-10"></div>
      <div className="hidden sm:block pointer-events-none select-none absolute -bottom-24 -left-24 w-96 h-96 bg-blue-200/60 dark:bg-blue-900/30 rounded-full blur-3xl animate-float-reverse -z-10"></div>
      <div className="hidden sm:block pointer-events-none select-none absolute top-1/3 -left-12 w-52 h-52 bg-purple-200/60 dark:bg-purple-900/30 rounded-full blur-3xl animate-float-slow -z-10"></div>

      {/* Subtle gradient grid overlay */}
      <div className="hidden sm:block pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(20,184,166,0.08),rgba(59,130,246,0)_45%)] -z-10"></div>

      <div className="max-w-7xl mx-auto relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center relative z-10">
          {/* Left Content */}
          <div className="relative z-20 text-center lg:text-left order-1 lg:order-none">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl leading-tight mb-4 space-y-2">
              <span className="block sm:hidden">
                <span className="font-extrabold text-4xl leading-tight bg-clip-text text-transparent text-fill-transparent bg-gradient-to-r from-teal-500 via-sky-500 to-violet-500 drop-shadow-md">
                  Empowering Caregivers. Supporting Loved Ones.
                </span>
              </span>
              <span className="hidden sm:block font-extrabold animated-gradient-text text-fill-transparent drop-shadow-sm">
                Empowering Caregivers. Supporting Loved Ones.
              </span>
              {/*<span className="block text-lg font-semibold text-slate-700 dark:text-slate-200 sm:hidden">
                Thoughtfully designed for seniors and their caregivers.
              </span>
              <span className="hidden sm:block text-lg sm:text-xl font-semibold bg-clip-text text-transparent text-fill-transparent bg-gradient-to-r from-teal-600 via-blue-600 to-purple-600 dark:from-teal-400 dark:via-blue-400 dark:to-purple-400">
                Thoughtfully designed for seniors and their caregivers.
              </span>*/}
            </h1>

            <p className="text-xl sm:text-2xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
              EchoCare helps caregivers coordinate medical routines, track wellness updates, and access AI-powered assistance — all through one secure and compassionate platform.
            </p>

            <div className="flex flex-col items-center lg:items-start">
              <button
                onClick={handleJoinWaitlist}
                className="inline-flex items-center gap-2 px-8 py-4 text-xl font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-teal-500 focus:ring-opacity-50 min-h-[44px] animate-pulse-glow"
              >
                <Heart className="w-6 h-6 text-red-600 animate-heartbeat" fill="currentColor" stroke="none" aria-hidden="true" />
                <span>Join Waitlist</span>
              </button>
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                No spam. Early access only.
              </p>
            </div>
          </div>

          {/* Right Section - Auto-scrolling image carousel */}
          <div className="relative z-10 hidden md:block">
            {/* Glow backdrop */}
            <div className="absolute -inset-6 bg-gradient-to-br from-teal-400/20 via-blue-400/20 to-purple-400/20 rounded-3xl blur-2xl animate-pulse-glow" />

            <CareImagesCarousel
              images={[
                '/images/heroimage-1.png',
                '/images/heroimage-2.png',
                '/images/heroimage-3.png',
                '/images/heroimage-4.jpg',
                '/images/heroimage-5.jpg',
                '/images/heroimage-6.jpg',
                '/images/heroimage-7.jpg',
                '/images/heroimage-8.jpg',
                '/images/heroimage-9.jpg',
              ]}
              speedMs={45000}
            />

            {/* Rising badges overlay */}
            <div className="pointer-events-none absolute inset-0 z-10">
              <div
                className="absolute bottom-0 left-6 bg-white/95 dark:bg-gray-800/95 border border-teal-200/80 dark:border-teal-800/70 text-teal-700 dark:text-teal-300 text-xs sm:text-sm px-3 py-2 rounded-full shadow-md animate-rise-loop"
                style={{ animationDelay: '0s' }}
              >
                Gentle Reminders
              </div>
              <div
                className="absolute bottom-0 left-1/2 -translate-x-1/2 bg-white/95 dark:bg-gray-800/95 border border-blue-200/80 dark:border-blue-800/70 text-blue-700 dark:text-blue-300 text-xs sm:text-sm px-3 py-2 rounded-full shadow-md animate-rise-loop-slow"
                style={{ animationDelay: '3s' }}
              >
                Caregiver Updates
              </div>
              <div
                className="absolute bottom-0 right-6 bg-white/95 dark:bg-gray-800/95 border border-purple-200/80 dark:border-purple-800/70 text-purple-700 dark:text-purple-300 text-xs sm:text-sm px-3 py-2 rounded-full shadow-md animate-rise-loop-fast"
                style={{ animationDelay: '6s' }}
              >
                Health Insights
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
