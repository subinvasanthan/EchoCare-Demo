import React from 'react';
import { Phone, CheckCircle, MessageSquare, Heart } from 'lucide-react';

const steps = [
  {
    icon: Phone,
    title: 'Speak',
    description: 'Elderly person receives a friendly EchoCare call',
    color: 'bg-blue-100 dark:bg-blue-900/50 text-blue-600'
  },
  {
    icon: CheckCircle,
    title: 'Confirm',
    description: 'Respond using simple keypad input',
    color: 'bg-green-100 dark:bg-green-900/50 text-green-600'
  },
  {
    icon: MessageSquare,
    title: 'Alert',
    description: 'Caregiver receives real-time WhatsApp update',
    color: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-600'
  },
  {
    icon: Heart,
    title: 'Relax',
    description: 'Everyone stays informed and reassured',
    color: 'bg-pink-100 dark:bg-pink-900/50 text-pink-600'
  }
];

export default function HowItWorks() {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            How EchoCare Works
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Four simple steps to complete peace of mind
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              {/* Connection line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-full w-full h-0.5 bg-gray-200 dark:bg-gray-700 z-0"></div>
              )}
              
              <div className="relative z-10 text-center">
                <div className={`w-24 h-24 ${step.color} rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg`}>
                  <step.icon className="w-12 h-12" />
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    Step {index + 1} – {step.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}