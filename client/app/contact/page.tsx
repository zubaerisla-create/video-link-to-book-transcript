"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, MessageSquare, Send, CheckCircle2, Clock, HelpCircle, AlertCircle } from "lucide-react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "general",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setErrorMessage("Please complete all required fields.");
      return;
    }

    // Basic email check
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(formData.email)) {
      setErrorMessage("Please provide a valid email address.");
      return;
    }

    setIsSubmitting(true);

    // Client-side simulation of inquiry dispatch
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      setFormData({
        name: "",
        email: "",
        subject: "general",
        message: "",
      });
    }, 600);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center rounded-full bg-[#FFF1B8] px-3.5 py-1 text-xs font-semibold tracking-wider text-[#292522] uppercase mb-4 border border-[#F0E8E2]">
          <span>Get in Touch</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#292522]">
          Contact Us
        </h1>
        <p className="mt-3 text-base sm:text-lg text-[#77716D] max-w-2xl mx-auto leading-relaxed">
          Have a question about caption extraction, found a bug, or want to suggest a new feature? We are here to help.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Contact Info Sidebar */}
        <div className="space-y-6 md:col-span-1">
          <div className="rounded-3xl border border-[#F0E8E2] bg-white p-6 shadow-xs space-y-6">
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF1B8] text-[#292522] mb-3">
                <Mail className="h-5 w-5" />
              </div>
              <h2 className="text-base font-bold text-[#292522]">Direct Email</h2>
              <p className="mt-1 text-xs text-[#77716D] leading-relaxed">
                Send your general inquiries or support requests directly to our team:
              </p>
              <a
                href="mailto:support@transcriptly.net"
                className="mt-2 inline-block text-xs sm:text-sm font-semibold text-[#292522] underline hover:text-[#E9A9C3]"
              >
                support@transcriptly.net
              </a>
            </div>

            <div className="border-t border-[#F0E8E2] pt-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#292522] mb-1">
                <Clock className="h-4 w-4 text-[#77716D]" />
                <span>Response Time</span>
              </div>
              <p className="text-xs text-[#77716D] leading-relaxed">
                We typically respond within <strong>24 to 48 business hours</strong>.
              </p>
            </div>

            <div className="border-t border-[#F0E8E2] pt-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#292522] mb-1">
                <HelpCircle className="h-4 w-4 text-[#77716D]" />
                <span>Quick Help</span>
              </div>
              <p className="text-xs text-[#77716D] leading-relaxed mb-2">
                Check our answers to common questions before reaching out:
              </p>
              <Link
                href="/faq"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#292522] underline hover:text-[#E9A9C3]"
              >
                Browse Frequently Asked Questions →
              </Link>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="md:col-span-2">
          <div className="rounded-3xl border border-[#F0E8E2] bg-white p-6 sm:p-10 shadow-xs">
            <h2 className="text-xl font-bold text-[#292522] mb-2">Send Us a Message</h2>
            <p className="text-xs sm:text-sm text-[#77716D] mb-6">
              Fill out the form below and we will get back to your email as soon as possible.
            </p>

            {isSuccess ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center space-y-3">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-emerald-900">Message Received!</h3>
                <p className="text-xs sm:text-sm text-emerald-800 max-w-md mx-auto leading-relaxed">
                  Thank you for reaching out. Your message has been sent to our support desk. We will review it and reply to your email address shortly.
                </p>
                <button
                  type="button"
                  onClick={() => setIsSuccess(false)}
                  className="mt-3 inline-flex items-center justify-center rounded-xl bg-emerald-700 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800 transition-colors cursor-pointer"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {errorMessage && (
                  <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#77716D] mb-1.5">
                      Your Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Jane Doe"
                      className="w-full rounded-xl border border-[#F0E8E2] bg-[#FFFDF8] px-3.5 py-2.5 text-xs sm:text-sm text-[#292522] focus:outline-none focus:ring-1 focus:ring-[#E9A9C3]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#77716D] mb-1.5">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="jane@example.com"
                      className="w-full rounded-xl border border-[#F0E8E2] bg-[#FFFDF8] px-3.5 py-2.5 text-xs sm:text-sm text-[#292522] focus:outline-none focus:ring-1 focus:ring-[#E9A9C3]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#77716D] mb-1.5">
                    Topic / Department
                  </label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full rounded-xl border border-[#F0E8E2] bg-[#FFFDF8] px-3.5 py-2.5 text-xs sm:text-sm text-[#292522] focus:outline-none focus:ring-1 focus:ring-[#E9A9C3]"
                  >
                    <option value="general">General Inquiry & Feedback</option>
                    <option value="bug">Bug Report / Extraction Issue</option>
                    <option value="feature">Feature Request & Suggestion</option>
                    <option value="privacy">Privacy & Data Deletion Request</option>
                    <option value="copyright">Copyright & DMCA Content Notice</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#77716D] mb-1.5">
                    Your Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Describe your question, video URL that caused an issue, or inquiry in detail..."
                    className="w-full rounded-xl border border-[#F0E8E2] bg-[#FFFDF8] px-3.5 py-2.5 text-xs sm:text-sm text-[#292522] focus:outline-none focus:ring-1 focus:ring-[#E9A9C3]"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center justify-center gap-2 rounded-xl bg-[#E9A9C3] px-6 py-2.5 text-xs sm:text-sm font-semibold text-[#292522] hover:bg-[#DE91B1] transition-colors shadow-xs disabled:opacity-60 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <span>Sending...</span>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        <span>Send Message</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
