"use client";

import { useState } from "react";
import Image from "next/image";
import axios from "axios";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const EncadrantLogin = () => {
  const router = useRouter();
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    if (!email || !password) { setError(t('common.fillAllFields')); return; }
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/encadrant/login`, { email, password }, { withCredentials: true });
      if (response.status === 200 && response.data) {
        router.push('/encadrant/liste_activite');
      } else {
        setError(t('common.serverInvalidResponse'));
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data?.error || t('encadrantLogin.wrongCredentials'));
      } else {
        setError(t('common.serverUnreachable'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden md:flex md:w-[38%] bg-navy-900 flex-col items-center justify-center px-10 py-12 text-white">
        <Image src="/logo_LEMANS_UNIVERSITE-WEB.svg" alt="Le Mans Université" width={180} height={48} className="mb-8 opacity-90" />
        <h1 className="font-lora text-4xl font-bold tracking-tight mb-3">TrAP</h1>
        <p className="text-navy-100 text-sm text-center leading-relaxed max-w-xs">
          TroubleMaker Agent Platform
        </p>
      </div>

      {/* Right panel */}
      <div className="flex-1 bg-stone-100 flex flex-col items-center justify-center px-6 py-12 relative">
        <LanguageSwitcher className="absolute top-5 right-5" />

        <div className="md:hidden mb-8 flex flex-col items-center">
          <Image src="/logo_LEMANS_UNIVERSITE-WEB.svg" alt="Le Mans Université" width={160} height={43} className="mb-4" />
          <h1 className="font-lora text-3xl font-bold text-navy-900">TrAP</h1>
        </div>

        <div className="w-full max-w-sm bg-white rounded-xl shadow-md p-8">
          <h2 className="font-lora text-xl font-semibold text-navy-900 mb-6 text-center">
            {t('encadrantLogin.title')}
          </h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {error && (
              <p className="text-red-600 text-sm text-center bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-stone-600 mb-1">
                {t('encadrantLogin.email')}
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent transition-colors disabled:opacity-50"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-stone-600 mb-1">
                {t('encadrantLogin.password')}
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent transition-colors disabled:opacity-50"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-navy-700 hover:bg-navy-900 text-white rounded-lg px-4 py-2.5 font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2 mt-1"
            >
              {loading ? t('encadrantLogin.signingIn') : t('encadrantLogin.signIn')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EncadrantLogin;
