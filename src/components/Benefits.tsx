import React from 'react';
import { Clock, Smartphone, Stethoscope, Mic } from 'lucide-react';

const benefits = [
  {
    icon: Clock,
    title: 'Smart IVR Reminders',
    description: 'Automated calls with simple keypad responses'
  },
  {
    icon: Smartphone,
    title: 'Real-time WhatsApp Alerts',
    description: 'Instant updates to caregivers on all activities'
  },
  {
    icon: Stethoscope,
    title: 'One-Tap Doctor Call Scheduling',
    description: 'Direct connection to healthcare professionals'
  },
  {
    icon: Mic,
    title: 'Voice-Powered Simplicity',
    description: 'Easy voice interactions designed for elderly users'
  }
];

export default function Benefits() {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800/50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Why Families Choose EchoCare
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Simple technology that brings peace of mind to families everywhere
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit, index) => (
            <div 
              key={index}
              className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 text-center group"
            >
              <div className="w-16 h-16 bg-teal-100 dark:bg-teal-900/50 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <benefit.icon className="w-8 h-8 text-teal-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                {benefit.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}