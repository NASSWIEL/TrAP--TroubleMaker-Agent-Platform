"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const RoleSelection = () => {
  const router = useRouter();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex">
      {/* Left panel — navy brand strip */}
      <div className="hidden md:flex md:w-[38%] bg-navy-900 flex-col items-center justify-center px-10 py-12 text-white">
        <Image
          src="/logo_LEMANS_UNIVERSITE-WEB.svg"
          alt="Le Mans Université"
          width={180}
          height={48}
          className="mb-8 opacity-90"
        />
        <h1 className="font-lora text-4xl font-bold tracking-tight mb-3">TrAP</h1>
        <p className="text-navy-100 text-sm text-center leading-relaxed max-w-xs">
          TroubleMaker Agent Platform — train critical thinking in medical education
        </p>
      </div>

      {/* Right panel — role selection */}
      <div className="flex-1 bg-stone-100 flex flex-col items-center justify-center px-6 py-12 relative">
        <LanguageSwitcher className="absolute top-5 right-5" />

        {/* Mobile logo */}
        <div className="md:hidden mb-8 flex flex-col items-center">
          <Image
            src="/logo_LEMANS_UNIVERSITE-WEB.svg"
            alt="Le Mans Université"
            width={160}
            height={43}
            className="mb-4"
          />
          <h1 className="font-lora text-3xl font-bold text-navy-900">TrAP</h1>
        </div>

        <div className="w-full max-w-sm bg-white rounded-xl shadow-md p-8">
          <h2 className="font-lora text-xl font-semibold text-navy-900 mb-1 text-center">
            {t('landing.title')}
          </h2>
          <p className="text-sm text-stone-500 text-center mb-8">
            {t('landing.subtitle')}
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => router.push('/etudiant/login')}
              className="w-full bg-navy-700 hover:bg-navy-900 text-white rounded-lg px-4 py-3 font-medium text-sm transition-colors focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2"
            >
              {t('landing.student')}
            </button>
            <button
              onClick={() => router.push('/encadrant/login')}
              className="w-full bg-white border border-stone-300 hover:bg-stone-50 text-stone-700 rounded-lg px-4 py-3 font-medium text-sm transition-colors"
            >
              {t('landing.supervisor')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;
