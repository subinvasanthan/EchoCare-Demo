import React from 'react';
import VideoLightboxDrive from './VideoLightboxDrive';

export default function VideoSection() {
  const videoUrl = 'https://ksonsqkovdefpycfwtxb.supabase.co/storage/v1/object/public/videos/EchoCare%20.mp4';

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-teal-50 to-blue-50 dark:from-teal-900/20 dark:to-blue-900/20">
      <div className="max-w-5xl mx-auto text-center mb-10">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3">
          See EchoCare in Action
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Watch a quick preview of how reminders and updates keep families connected.
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        <VideoLightboxDrive
          mp4Url={videoUrl}
          title="EchoCare Demo"
          subtitle="Doctor Calls • Medication Reminders • Health Updates"
        />
      </div>
    </section>
  );
}


