import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const faqs = [
  {
    question: "How does EchoCare actually call my loved one?",
    answer: "Think of EchoCare as a caring digital assistant that never forgets. It uses smartphone technology to automatically dial your elderly family member at exactly the right times. When they pick up, they'll hear a warm, clear voice asking simple questions like \"Did you take your morning medication?\" All they need to do is press 1 for yes or 2 for no - it's that simple!"
  },
  {
    question: "Will my elderly parent find this confusing to use?",
    answer: "Not at all! We designed EchoCare specifically with seniors in mind. If your loved one can answer a phone and press buttons on a keypad, they can use EchoCare. No apps to download, no passwords to remember, no complicated technology - just their regular phone working exactly as it always has."
  },
  {
    question: "Can my whole family stay in the loop?",
    answer: "Absolutely! Whether you're the primary caregiver, a sibling living across the country, or a concerned grandchild, everyone can receive instant WhatsApp updates. You'll know immediately if Mom took her pills or if Dad missed his check-in call, so the whole care team stays connected."
  },
  {
    question: "Do I need to buy my parent a special phone?",
    answer: "Nope! EchoCare works with whatever phone your loved one already has and feels comfortable using - whether that's an old landline, a basic mobile phone, or their smartphone. No upgrades, no new gadgets, no learning curve."
  },
  {
    question: "How often will it call? I don't want to overwhelm them.",
    answer: "You're in complete control! Set it up for just Sunday evening check-ins, daily medication reminders, or anything in between. It adapts to your family's changing needs."
  },
  {
    question: "Can I personalize it for my parent's preferences?",
    answer: "Definitely! EchoCare supports multiple languages and allows you to customize call messages to match your loved one's preferences and cultural background. The system learns to speak your family's language - literally and figuratively."
  },
  {
    question: "What if they don't answer or miss the call?",
    answer: "Life happens! If your loved one doesn't pick up, EchoCare will try again based on your preferences. Meanwhile, you'll get an instant WhatsApp notification so you can follow up with a personal call or quick visit. Think of it as an early warning system that helps you stay proactive, not reactive."
  },
  {
    question: "Can the caregiver change call times or preferences remotely?",
    answer: "Absolutely! Caregivers can log into their dashboard or use WhatsApp commands to adjust call times, add new reminders, or modify preferences without needing to visit in person."
  },
  {
    question: "How secure does EchoCare collect the data?",
    answer: "EchoCare follows strict healthcare data protection standards. All information is encrypted, stored securely, and never shared with third parties. We comply with all relevant privacy regulations."
  },
  {
    question: "Can this system be integrated with a doctor's clinic or hospital?",
    answer: "Yes! EchoCare can integrate with healthcare providers to automatically schedule follow-up calls, medication reminders based on prescriptions, and share health status updates with medical teams."
  }
];

export default function FAQ() {
  const [openItems, setOpenItems] = useState<number[]>([]);

  const toggleItem = (index: number) => {
    setOpenItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Everything you need to know about EchoCare
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
              <button
                onClick={() => toggleItem(index)}
                className="w-full px-8 py-6 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[44px]"
                aria-expanded={openItems.includes(index)}
              >
                <span className="text-lg font-semibold text-gray-900 dark:text-white pr-4">
                  {faq.question}
                </span>
                {openItems.includes(index) ? (
                  <ChevronUp className="w-6 h-6 text-teal-500 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-6 h-6 text-teal-500 flex-shrink-0" />
                )}
              </button>
              
              {openItems.includes(index) && (
                <div className="px-8 pb-6">
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-lg">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}