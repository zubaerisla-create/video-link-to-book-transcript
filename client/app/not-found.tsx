import Link from "next/link";
import { BookOpen, ArrowLeft, HelpCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[65vh] flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FFF1B8] border border-[#F0E8E2] text-[#292522] shadow-xs">
        <BookOpen className="h-8 w-8" />
      </div>
      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#292522]">
        404 - Page Not Found
      </h1>
      <p className="mt-3 text-xs sm:text-sm text-[#77716D] max-w-md leading-relaxed">
        The transcript, digital book, or page you are looking for does not exist, has been removed, or the link has expired.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#E9A9C3] px-4 py-2 text-xs font-semibold text-[#292522] hover:bg-[#DE91B1] transition-colors shadow-xs"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Return Home</span>
        </Link>
        <Link
          href="/guides"
          className="inline-flex items-center gap-1.5 rounded-xl border border-[#F0E8E2] bg-white px-4 py-2 text-xs font-medium text-[#292522] hover:bg-[#FFFDF8] hover:border-[#E9A9C3] transition-colors shadow-xs"
        >
          <span>Browse Tutorials</span>
        </Link>
        <Link
          href="/faq"
          className="inline-flex items-center gap-1.5 rounded-xl border border-[#F0E8E2] bg-white px-4 py-2 text-xs font-medium text-[#292522] hover:bg-[#FFFDF8] hover:border-[#E9A9C3] transition-colors shadow-xs"
        >
          <HelpCircle className="h-3.5 w-3.5 text-[#77716D]" />
          <span>Help & FAQ</span>
        </Link>
      </div>
    </div>
  );
}
