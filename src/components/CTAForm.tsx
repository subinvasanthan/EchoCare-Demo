import React, { useState } from 'react';
import { CheckCircle } from 'lucide-react';

export default function CTAForm() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate form submission
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 5000);
  };

  const handleGoogleFormOpen = () => {
    window.open('https://docs.google.com/forms/d/1CUdKv4XTTcbFLEIDq8vc_O7Ib9GlwxwITuSelKcsMiY/viewform', '_blank');
  };

  if (submitted) {
    return (
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-teal-50 dark:bg-teal-900/20">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-12">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Thank You!
            </h3>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Thank you for your interest in EchoCare! We'll be in touch shortly.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-teal-50 dark:bg-teal-900/20">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Start Your EchoCare Journey
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Join thousands of families who trust EchoCare with their loved ones
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 sm:p-12">
          <div className="text-center mb-8">
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
              Click below to fill out our simple form and get started with EchoCare today.
            </p>
            
            <button
              onClick={handleGoogleFormOpen}
              className="inline-flex items-center px-8 py-4 text-xl font-semibold text-white bg-teal-500 hover:bg-teal-600 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-teal-500 focus:ring-opacity-50 min-h-[44px]"
            >
              Open Registration Form
            </button>
          </div>

          {/* Alternative inline form for demonstration */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
            <p className="text-center text-gray-500 dark:text-gray-400 mb-6">
              Or fill out the quick form below:
            </p>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="fullName" className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    required
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent min-h-[44px]"
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    required
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent min-h-[44px]"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="phone" className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent min-h-[44px]"
                  />
                </div>
                
                <div>
                  <label htmlFor="userType" className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Who are you?
                  </label>
                  <select
                    id="userType"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent min-h-[44px]"
                  >
                    <option value="">Select...</option>
                    <option value="elderly">Elderly User</option>
                    <option value="caregiver">Caregiver</option>
                    <option value="family">Family Member</option>
                    <option value="health">Health Professional</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="contactTime" className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Preferred Contact Time
                  </label>
                  <select
                    id="contactTime"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent min-h-[44px]"
                  >
                    <option value="">Select...</option>
                    <option value="morning">Morning</option>
                    <option value="afternoon">Afternoon</option>
                    <option value="evening">Evening</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="city" className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                    City or Region
                  </label>
                  <input
                    type="text"
                    id="city"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent min-h-[44px]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="notes" className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Additional Notes
                </label>
                <textarea
                  id="notes"
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                  placeholder="Tell us more about your needs..."
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full px-8 py-4 text-xl font-semibold text-white bg-teal-500 hover:bg-teal-600 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-teal-500 focus:ring-opacity-50 min-h-[44px]"
              >
                Submit Information
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}