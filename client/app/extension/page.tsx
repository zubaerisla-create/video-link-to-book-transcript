"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Download,
  Copy,
  Check,
  ExternalLink,
  HelpCircle,
  ShieldCheck,
  Sparkles,
  Smartphone,
  ChevronDown,
  ArrowRight,
  BookOpen,
} from "lucide-react";

export default function ExtensionGuidePage() {
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(text);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const steps = [
    {
      step: 1,
      title: "জিপ (ZIP) ফাইলটি ডাউনলোড ও আনজিপ (Extract) করুন",
      titleEn: "Step 1: Download & Extract Extension ZIP",
      desc: "প্রথমে নিচের ডাউনলোড বাটনে ক্লিক করে এক্সটেনশন জিপ ফাইলটি কম্পিউটারে নামিয়ে নিন। এরপর ফাইলের উপর রাইট-ক্লিক করে 'Extract All...' দিয়ে যেকোনো সাধারণ ফোল্ডারে আনজিপ করুন।",
      image: "/images/extension/step1-download-unzip.svg",
      tip: "আনজিপ করার পর ফোল্ডারের ভেতর manifest.json, popup.html এবং content.js ফাইলগুলো দেখতে পাবেন।",
    },
    {
      step: 2,
      title: "ক্রোম ব্রাউজারে Extensions পেজ ওপেন করুন",
      titleEn: "Step 2: Open chrome://extensions",
      desc: "গুগল ক্রোম (Google Chrome) ব্রাউজারে একটি নতুন ট্যাব খুলুন এবং অ্যাড্রেস বারে chrome://extensions লিখে কিবোর্ডের Enter চাপুন।",
      image: "/images/extension/step2-chrome-extensions.svg",
      copyText: "chrome://extensions",
      tip: "Brave ব্রাউজার ব্যবহার করলে brave://extensions এবং Edge ব্যবহার করলে edge://extensions লিখবেন।",
    },
    {
      step: 3,
      title: 'উপরে ডান কোণায় "Developer mode" সুইচটি চালু (ON) করুন',
      titleEn: "Step 3: Enable Developer Mode Toggle",
      desc: 'ক্রোম Extensions পেজের একদম উপরে ডানদিকে একটি সুইচ দেখতে পাবেন যার নাম "Developer mode"। এটিতে ক্লিক করে চালু (ON / Blue) করে দিন।',
      image: "/images/extension/step3-developer-mode.svg",
      tip: "এটি গুগল ক্রোমের একটি অফিশিয়াল ও নিরাপদ ফিচার, যা কাস্টম এক্সটেনশন লোড করার অনুমতি দেয়।",
    },
    {
      step: 4,
      title: '"Load unpacked" বাটনে ক্লিক করে ফোল্ডারটি সিলেক্ট করুন',
      titleEn: "Step 4: Click 'Load unpacked' & Select Folder",
      desc: 'Developer mode চালু করতেই বাম পাশে "Load unpacked" নামের একটি বাটন চলে আসবে। এতে ক্লিক করুন এবং ধাপ ১-এ আনজিপ করা ফোল্ডারটি সিলেক্ট করে দিন।',
      image: "/images/extension/step4-load-unpacked.svg",
      tip: "ফোল্ডারটি সিলেক্ট করার সাথে সাথেই Transcriptly এক্সটেনশন আপনার ব্রাউজারে যুক্ত হয়ে যাবে!",
    },
    {
      step: 5,
      title: "ব্রাউজারের উপরে পিন (Pin) করে রাখুন",
      titleEn: "Step 5: Pin Extension to Chrome Toolbar",
      desc: "ব্রাউজারের উপরে সার্চ বারের পাশে থাকা পাজল আইকনে (🧩) ক্লিক করুন। এরপর Transcriptly-এর পাশে থাকা পিন (📌) আইকনে ক্লিক করুন যাতে এটি সবসময় সামনে থাকে।",
      image: "/images/extension/step5-pin-extension.svg",
      tip: "পিন করে রাখলে ইউটিউবে যেকোনো ভিডিও দেখার সময় সহজে ১-ক্লিকেই ক্যাপশন দেখা যাবে।",
    },
    {
      step: 6,
      title: "যেকোনো YouTube ভিডিওতে গিয়ে প্রিভিউ দেখুন",
      titleEn: "Step 6: Open Any YouTube Video & Preview Transcript",
      desc: 'যেকোনো YouTube ভিডিও ওপেন করে উপরে থাকা Transcriptly আইকনে ক্লিক করুন। যদি ট্রান্সক্রিপ্ট বন্ধ থাকে তবে "Try Open YouTube Transcript" বাটনে ক্লিক করুন। সাথে সাথে নির্ভুল প্রিভিউ দেখতে পাবেন।',
      image: "/images/extension/step6-youtube-scan.svg",
      tip: "এখানে মোট শব্দ সংখ্যা, ক্যাপশন সংখ্যা এবং ৪ লাইনের স্নিপেট প্রিভিউ দেখা যাবে।",
    },
    {
      step: 7,
      title: "Import করুন এবং বই আকারে পড়ুন বা PDF সেভ করুন",
      titleEn: "Step 7: Import to Transcriptly & Read / Export",
      desc: 'পপআপের "Import to Transcriptly" বাটনে ক্লিক করলেই habd.tech-এ সম্পূর্ণ ট্রান্সক্রিপ্টটি ডিজিটাল বই আকারে খুলে যাবে। সেখান থেকে ফন্ট সাইজ বা থিম পরিবর্তন করে পড়া যাবে এবং PDF বা TXT ডাউনলোড করা যাবে।',
      image: "/images/extension/step7-import-reader.svg",
      tip: "বাংলা ও ইংরেজি উভয় ভাষার লেখাই মোবাইল এবং কম্পিউটারে চমৎকারভাবে পড়া যায়।",
    },
  ];

  const faqs = [
    {
      q: "ইউটিউবে 'Transcript Panel Not Open' দেখালে কি করব?",
      a: "এক্সটেনশন পপআপের বেগুনি রঙের 'Try Open YouTube Transcript' বাটনে ক্লিক করুন। এটি স্বয়ংক্রিয়ভাবে ইউটিউবের ট্রান্সক্রিপ্ট সাইডবার ওপেন করে নেবে। অথবা ভিডিওর ডেসক্রিপশনে থাকা '...more'-এ ক্লিক করে নিচে 'Show transcript' বাটনে ক্লিক করুন।",
    },
    {
      q: "এক্সটেনশনটি কি সম্পূর্ণ ফ্রি?",
      a: "হ্যাঁ, Transcriptly Chrome Extension সম্পূর্ণ ফ্রি এবং ওপেন সোর্স। এর জন্য কোনো সাবস্ক্রিপশন ফি বা হিডেন চার্জ নেই।",
    },
    {
      q: "ব্রাউজার বন্ধ করলে বা কম্পিউটার রিস্টার্ট দিলে এক্সটেনশন মুছে যাবে?",
      a: "না, একবার 'Load unpacked' দিয়ে ইনস্টল করলে এটি সবসময় আপনার ব্রাউজারে থাকবে। আনইনস্টল করতে চাইলে chrome://extensions পেজে গিয়ে Remove বাটনে ক্লিক করলেই হবে।",
    },
    {
      q: "মোবাইলে অ্যান্ড্রয়েড ফোনে এটি ব্যবহার করা যায়?",
      a: "হ্যাঁ! অ্যান্ড্রয়েড ফোনে Kiwi Browser বা Yandex Browser ইনস্টল করে একইভাবে chrome://extensions-এ গিয়ে এই এক্সটেনশনটি লোড করে মোবাইল থেকেও সরাসরি ইউটিউব ট্রান্সক্রিপ্ট বই আকারে পড়া যায়।",
    },
    {
      q: "ইউটিউব কি আমার অ্যাকাউন্ট বা আইপি ব্লক করবে?",
      a: "একেবারেই না। এই এক্সটেনশন কোনো ব্যাকএন্ড স্ক্রিপ্ট বা বট ব্যবহার করে না; এটি ব্রাউজারে ইউটিউব প্লেয়ারের স্বাভাবিকভাবে রেন্ডার হওয়া টেক্সট সংগ্রহ করে। এটি ১০০% প্রাইভেট এবং নিরাপদ।",
    },
  ];

  return (
    <div className="min-h-screen bg-[#FFFDF8] text-[#292522]">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-[#F0E8E2] bg-linear-to-b from-[#FFF1B8]/20 via-[#FFFDF8] to-[#FFFDF8] py-12 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-[#E9A9C3] bg-[#F8DDE8]/50 px-4 py-1.5 text-xs font-semibold text-[#292522] mb-6">
            <Sparkles className="h-3.5 w-3.5 text-[#292522]" />
            <span>সহজ নির্দেশিকা • ছবি ও টেক্সটসহ স্টেপ-বাই-স্টেপ গাইড</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#292522] leading-tight">
            Transcriptly Chrome Extension
            <span className="block text-2xl sm:text-3xl font-medium text-[#77716D] mt-2">
              ব্যবহার করার সহজ নিয়ম (১ মিনিটে ইনস্টল)
            </span>
          </h1>

          <p className="mt-4 text-sm sm:text-base text-[#433422] max-w-2xl mx-auto leading-relaxed">
            যে কেউ খুব সহজে এই এক্সটেনশনটি দিয়ে যেকোনো YouTube ভিডিওর কথাগুলো ১-ক্লিকে বইয়ের মতো সাজিয়ে পড়তে, সংরক্ষণ করতে এবং PDF আকারে ডাউনলোড করতে পারবেন। কোনো টেকনিক্যাল অভিজ্ঞতার প্রয়োজন নেই!
          </p>

          {/* Primary Action Button (Direct ZIP Download) */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/transcriptly-extension.zip"
              download
              className="inline-flex items-center justify-center gap-2.5 rounded-2xl bg-[#292522] px-8 py-4 text-base font-bold text-white shadow-md hover:bg-[#1f1b19] hover:shadow-lg transition-all w-full sm:w-auto"
            >
              <Download className="h-5 w-5 text-[#FFF1B8]" />
              <span>এক্সটেনশন ডাউনলোড করুন (.ZIP)</span>
              <span className="rounded-md bg-white/20 px-2 py-0.5 text-xs font-normal">২৮ KB</span>
            </a>

            <a
              href="#steps-section"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#E8DACB] bg-white px-6 py-4 text-sm font-semibold text-[#292522] hover:bg-[#FAF4EC] transition-colors w-full sm:w-auto"
            >
              <span>কীভাবে কাজ করে দেখুন</span>
              <ChevronDown className="h-4 w-4" />
            </a>
          </div>


        </div>
      </section>

      {/* Main Step-by-Step Walkthrough */}
      <section id="steps-section" className="mx-auto max-w-4xl px-4 py-12 sm:py-16 sm:px-6">
        <div className="text-center mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-[#77716D] bg-[#FFF1B8] px-3 py-1 rounded-full border border-[#F0E8E2]">
            ধাপে ধাপে নিয়ম
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#292522] mt-3">
            সহজ ৭টি ধাপে এক্সটেনশন ইনস্টল ও ব্যবহার
          </h2>
          <p className="text-sm text-[#77716D] mt-1">
            নিচের ধাপগুলো এবং ছবিগুলো দেখে দেখে খুব সহজেই আপনি এটি সেটআপ করে নিতে পারবেন:
          </p>
        </div>

        {/* Steps List */}
        <div className="space-y-12 sm:space-y-16">
          {steps.map((item) => (
            <div
              key={item.step}
              className="rounded-3xl border border-[#F0E8E2] bg-white p-6 sm:p-8 shadow-xs hover:border-[#E9A9C3]/60 transition-colors"
            >
              {/* Step Title Header */}
              <div className="flex items-start gap-4 mb-4">
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-2xl bg-[#292522] text-white font-bold text-base sm:text-lg">
                  {item.step}
                </div>
                <div>
                  <h3 className="text-base sm:text-xl font-bold text-[#292522] leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#77716D] font-medium mt-0.5">{item.titleEn}</p>
                </div>
              </div>

              {/* Step Description */}
              <p className="text-sm sm:text-base text-[#433422] leading-relaxed mb-4 pl-0 sm:pl-16">
                {item.desc}
              </p>

              {/* Optional Copy Shortcut (e.g. chrome://extensions) */}
              {item.copyText && (
                <div className="mb-4 pl-0 sm:pl-16">
                  <div className="inline-flex items-center gap-2 rounded-xl border border-[#E8DACB] bg-[#FAF4EC] px-3.5 py-2 text-xs font-mono font-bold text-[#292522]">
                    <span>{item.copyText}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(item.copyText)}
                      className="ml-2 flex items-center gap-1 rounded-lg bg-[#292522] px-2.5 py-1 text-[11px] font-sans font-semibold text-white hover:bg-[#1f1b19] transition-colors"
                    >
                      {copiedUrl === item.copyText ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-400" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Step Illustration Image */}
              <div className="pl-0 sm:pl-16 my-4">
                <div className="overflow-hidden rounded-2xl border border-[#F0E8E2] bg-[#FFFDF8] shadow-xs">
                  <Image
                    src={item.image}
                    alt={item.title}
                    width={760}
                    height={380}
                    className="w-full h-auto object-contain"
                    priority={item.step <= 2}
                  />
                </div>
              </div>

              {/* Step Pro-Tip Box */}
              <div className="pl-0 sm:pl-16 mt-4">
                <div className="flex items-start gap-2.5 rounded-xl bg-[#FFF1B8]/40 border border-[#F0E8E2] p-3 text-xs text-[#433422]">
                  <span className="text-base">💡</span>
                  <p className="leading-relaxed">
                    <strong className="text-[#292522]">টিপস: </strong>
                    {item.tip}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="border-t border-[#F0E8E2] bg-white py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="text-center mb-8">
            <HelpCircle className="mx-auto h-8 w-8 text-[#E9A9C3] mb-2" />
            <h2 className="text-2xl sm:text-3xl font-bold text-[#292522]">
              সাধারণ জিজ্ঞাসা (FAQ)
            </h2>
            <p className="text-xs sm:text-sm text-[#77716D] mt-1">
              ব্যবহারকারীদের সচরাচর করা কিছু প্রশ্ন ও সমাধান
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-[#F0E8E2] bg-[#FFFDF8] overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="flex w-full items-center justify-between p-4 sm:p-5 text-left text-sm sm:text-base font-bold text-[#292522] hover:bg-[#FAF4EC]/50 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-[#77716D] transition-transform duration-200 ${
                      openFaq === idx ? "rotate-180 text-[#292522]" : ""
                    }`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="px-4 pb-5 sm:px-5 text-xs sm:text-sm text-[#433422] leading-relaxed border-t border-[#F0E8E2]/60 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA Card */}
      <section className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
        <div className="rounded-3xl border border-[#F0E8E2] bg-linear-to-br from-[#FFF1B8]/40 via-[#F8DDE8]/30 to-[#FFFDF8] p-8 sm:p-12 text-center shadow-xs">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#292522]">
            এখনই আপনার ব্রাউজারে এক্সটেনশনটি যোগ করুন
          </h2>
          <p className="mt-2 text-sm text-[#77716D] max-w-lg mx-auto">
            যেকোনো পছন্দের ভিডিও থেকে সম্পূর্ণ লেকচার বা আলোচনা ঝটপট বই আকারে সেভ করে পড়ার আনন্দ উপভোগ করুন।
          </p>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="/transcriptly-extension.zip"
              download
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#292522] px-7 py-3.5 text-sm font-bold text-white hover:bg-[#1a1715] transition-all shadow-xs"
            >
              <Download className="h-4 w-4 text-[#FFF1B8]" />
              <span>ডাউনলোড করুন (transcriptly-extension.zip)</span>
            </a>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#E8DACB] bg-white px-6 py-3.5 text-sm font-semibold text-[#292522] hover:bg-[#FAF4EC] transition-colors"
            >
              <span>ওয়েব এক্সট্রাক্টর হোমপেজে যান</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
