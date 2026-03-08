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
    q: "How do I fill out my Basic Information?",
    a: "Go to the Basic Information page from the sidebar. It has 3 tabs: Personal Information, Parents, and Education. Fill in each section and click Save.",
  },
  {
    q: "How do I upload a requirement?",
    a: "Go to the Requirements page and click the upload button on any requirement card. You can upload PDF, PNG, JPG/JPEG, or DOCX files (max 10MB).",
  },
  {
    q: "Can I replace an uploaded document?",
    a: "Yes! Go to the requirement and click the upload button again. The new file will replace the previous one.",
  },
  {
    q: "How do I view my Profile?",
    a: "Click Profile in the sidebar. It shows a read-only view of all your information organized under Personal Information, Parents, and Education tabs.",
  },
  {
    q: "How do I update my personal information?",
    a: "Go to the Basic Information page to edit your details. Changes made there will also be reflected on your Profile page.",
  },
  {
    q: "How long does document review take?",
    a: "Documents are typically reviewed within 3-5 business days. Check the Requirements page for status updates on each document.",
  },
  {
    q: "What if I miss a deadline?",
    a: "Contact the scholarship office immediately. Extensions may be granted on a case-by-case basis.",
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
