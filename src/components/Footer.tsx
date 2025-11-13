import React from 'react';
import { Heart, Mail, Shield, FileText } from 'lucide-react';

export default function Footer() {
  const handleGetStarted = () => {
    window.open('https://docs.google.com/forms/d/1CUdKv4XTTcbFLEIDq8vc_O7Ib9GlwxwITuSelKcsMiY/viewform', '_blank');
  };

  return (
    <footer className="bg-gray-900 text-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* CTA Section */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">Start Helping Your Loved Ones Today</h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join the EchoCare family and give yourself the peace of mind you deserve.
          </p>
          <button
            onClick={handleGetStarted}
            className="inline-flex items-center px-8 py-4 text-xl font-semibold text-white bg-teal-500 hover:bg-teal-600 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-teal-500 focus:ring-opacity-50 min-h-[44px]"
          >
            Get Started – It's Free
          </button>
        </div>

        {/* Footer Content */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Logo and Description */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-3 mb-6">
              <div className="relative">
                <Heart className="w-10 h-10 text-teal-500 fill-current" />
                <div className="absolute -top-1 -left-1 w-3 h-3 bg-orange-400 rounded-full" />
              </div>
              <span className="text-2xl font-bold font-nunito">EchoCare</span>
            </div>
            <p className="text-lg text-gray-300 leading-relaxed mb-6">
              EchoCare brings families closer through technology, ensuring your loved ones are safe, healthy, and connected.
            </p>
            <div className="flex items-center space-x-2 text-gray-300">
              <Mail className="w-5 h-5" />
              <span className="text-lg">contact@echocare.com</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xl font-semibold mb-6">Support</h3>
            <ul className="space-y-4">
              <li>
                <a href="#" className="text-lg text-gray-300 hover:text-white transition-colors focus:outline-none focus:underline">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="text-lg text-gray-300 hover:text-white transition-colors focus:outline-none focus:underline">
                  Contact Support
                </a>
              </li>
              <li>
                <a href="#" className="text-lg text-gray-300 hover:text-white transition-colors focus:outline-none focus:underline">
                  System Status
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-xl font-semibold mb-6">Legal</h3>
            <ul className="space-y-4">
              <li>
                <a
                  href="https://ksonsqkovdefpycfwtxb.supabase.co/storage/v1/object/public/legal-documents/echocare_privacy_policy.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-lg text-gray-300 hover:text-white transition-colors focus:outline-none focus:underline"
                >
                  <Shield className="w-5 h-5" />
                  <span>Privacy Policy</span>
                </a>
              </li>
              <li>
                <a
                  href="https://ksonsqkovdefpycfwtxb.supabase.co/storage/v1/object/public/legal-documents/echocare_terms_and_conditions.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-lg text-gray-300 hover:text-white transition-colors focus:outline-none focus:underline"
                >
                  <FileText className="w-5 h-5" />
                  <span>Terms & Conditions</span>
                </a>
              </li>
            </ul>
          </div>
        </div> {/* ← close the grid wrapper */}

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 pt-8 text-center space-y-3">
          <p className="text-lg text-gray-400">© 2025 EchoCare. Made with ❤️ for families everywhere.</p>
          <button
            onClick={() => {
              window.history.pushState({}, '', '/signup');
              window.dispatchEvent(new PopStateEvent('popstate'));
            }}
            className="text-sm text-gray-500 hover:text-gray-300 transition-colors focus:outline-none focus:underline"
          >
            Sign-up
          </button>
        </div>
      </div>
    </footer>
  );
}
