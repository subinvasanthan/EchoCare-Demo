import React from 'react';
import { Clock, Smartphone, Stethoscope, Mic } from 'lucide-react';

const benefits = [
  {
    icon: Clock,
    title: 'Smart Reminders',
    description: 'Get automated reminders for calls, WhatsApp, or SMS—fully customizable to your preference'
  },
  {
    icon: Smartphone,
    title: 'Intelligent Dashboard',
    description: 'View all your appointments, reminders, and medication plans in one easy-to-use dashboard'
  },
  {
    icon: Stethoscope,
    title: 'Medical Report Chat',
    description: 'Instantly chat and get insights from your medical reports'
  },
  {
    icon: Mic,
    title: 'Voice-Powered Assistance',
    description: 'Enjoy effortless voice interactions, specially designed for elderly users'
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