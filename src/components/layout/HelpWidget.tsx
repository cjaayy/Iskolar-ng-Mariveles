/* ================================================================
   HELP WIDGET
   Floating FAQ button with expandable panel
   ================================================================ */

"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HelpCircle,
  X,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  ExternalLink,
} from "lucide-react";

const faqs = [
  {
    q: "How do I upload a document?",
    a: "Go to the Requirements page and click the 'Upload' button next to any requirement. You can also drag and drop files directly into the upload zone.",
  },
  {
    q: "What file formats are accepted?",
    a: "We accept PDF, PNG, JPG/JPEG, and DOCX files. Maximum file size is 10MB per document.",
  },
  {
    q: "How long does document review take?",
    a: "Documents are typically reviewed within 3-5 business days. You'll receive a notification once your document has been reviewed.",
  },
  {
    q: "Can I replace an uploaded document?",
    a: "Yes! Simply go to the requirement and click 'Upload' again. The new document will replace the previous one.",
  },
  {
    q: "What if I miss a deadline?",
    a: "Contact the scholarship office immediately. Extensions may be granted on a case-by-case basis. Keep an eye on your deadline reminders!",
  },
  {
    q: "How do I update my personal information?",
    a: "Go to your Profile page and click 'Edit Profile'. You can update your contact information, address, and other details.",
  },
];

export function HelpWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="absolute bottom-16 right-0 w-80 sm:w-96 bg-card-bg border border-card-border rounded-2xl shadow-soft-lg overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-ocean-400 to-ocean-500 p-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  <h3 className="font-heading text-base font-semibold">
                    Help & FAQ
                  </h3>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-lg hover:bg-white/20 transition-colors"
                  aria-label="Close help"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-white/80 mt-1 font-body">
                Find answers to common questions
              </p>
            </div>

            {/* FAQ List */}
            <div className="max-h-80 overflow-y-auto p-2">
              {faqs.map((faq, i) => (
                <div
                  key={i}
                  className="border-b border-card-border last:border-0"
                >
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                    className="w-full text-left p-3 flex items-start justify-between gap-2 hover:bg-muted/50 rounded-xl transition-colors"
                    aria-expanded={expandedFaq === i}
                  >
                    <span className="font-body text-sm font-medium text-foreground">
                      {faq.q}
                    </span>
                    {expandedFaq === i ? (
                      <ChevronUp className="w-4 h-4 text-muted-fg flex-shrink-0 mt-0.5" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-fg flex-shrink-0 mt-0.5" />
                    )}
                  </button>
                  <AnimatePresence>
                    {expandedFaq === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <p className="px-3 pb-3 font-body text-sm text-muted-fg leading-relaxed">
                          {faq.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-card-border bg-muted/30">
              <a
                href="#"
                className="flex items-center justify-center gap-2 text-sm font-body text-ocean-400 hover:text-ocean-500 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Visit Full Help Center
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`
          w-14 h-14 rounded-full shadow-soft-lg flex items-center justify-center
          transition-colors duration-200
          ${
            isOpen
              ? "bg-ocean-500 text-white"
              : "bg-ocean-400 text-white hover:bg-ocean-500"
          }
        `}
        aria-label={isOpen ? "Close help" : "Open help"}
        aria-expanded={isOpen}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div
              key="help"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <HelpCircle className="w-6 h-6" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
