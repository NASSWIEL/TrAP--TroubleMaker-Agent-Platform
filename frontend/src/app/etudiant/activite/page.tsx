"use client";
import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { API_BASE_URL } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";

interface ActiviteData {
    code_activite: string;
    titre: string;
    presentation_publique: string | null;
    description: string | null;
    affirmations_associes?: any[];
    is_published?: boolean;
}

function ActivitePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activityCode = searchParams.get('code');
  const { t } = useLanguage();

  const [activite, setActivite] = useState<ActiviteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activityCode) {
      setError(t('activite.missingCode'));
      setLoading(false);
      return;
    }

    const fetchActiviteData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`${API_BASE_URL}/api/activites/${activityCode}`, {
          withCredentials: true,
        });
        if (response.status === 200 && response.data) {
          setActivite(response.data);
        } else {
           setError(t('activite.loadError'));
        }
      } catch (err: unknown) {
        console.error("Error fetching activity data:", err);
        if (axios.isAxiosError(err) && err.response) {
           if (err.response.status === 404) {
               setError(t('activite.notFoundCode', { code: activityCode }));
           } else if (err.response.status === 403) {
                const errorMessage = err.response.data?.error || "";
                if (errorMessage.includes("pas encore publiée")) {
                    setError(t('activite.notPublishedError'));
                } else {
                    setError(t('activite.accessDenied'));
                }
           } else {
               setError(err.response.data?.error || t('activite.fetchError'));
           }
        } else {
          setError(t('common.networkError'));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchActiviteData();
  }, [activityCode, router]);

  const handleStartActivity = () => {
      if (!activityCode) {
          setError(t('activite.cannotStartNoCode'));
          return;
      }
      if (activite && 'affirmations_associes' in activite && Array.isArray(activite.affirmations_associes) && activite.affirmations_associes.length === 0) {
          setError(t('activite.noAffirmationsError'));
          return;
      }
      if (activite && activite.is_published === false) {
          setError(t('activite.notPublishedError'));
          return;
      }
      router.push(`/etudiant/activite/participer?code=${encodeURIComponent(activityCode)}`);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center">
        <p className="text-sm text-stone-500">{t('activite.loading')}</p>
      </div>
    );
  }

  if (error || !activite) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center">
        <p className="text-sm text-red-600">{error || t('activite.cannotLoad')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col items-center justify-center px-4 py-12">
      <h1 className="font-lora text-2xl font-bold text-navy-900 mb-2 text-center">
        {activite.titre || t('activite.presentation')}
      </h1>
      <p className="text-stone-500 text-sm text-center mb-6 max-w-xl">
        {activite.presentation_publique || t('activite.defaultDescription')}
      </p>

      <div className="bg-white rounded-xl shadow-md p-6 mb-6 w-full max-w-2xl">
        <h3 className="text-lg font-bold text-stone-800 mb-3 border-b border-stone-100 pb-3">
          {activite.titre}
        </h3>
        <p className="text-stone-600 text-sm leading-relaxed">
          {activite.presentation_publique || t('activite.defaultCardDescription')}
        </p>

        {activite.is_published === false && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-amber-700 text-sm font-semibold m-0">
              {t('activite.draftWarning')}
            </p>
          </div>
        )}

        {activite.affirmations_associes && activite.affirmations_associes.length === 0 && (
          <div className="mt-4 p-3 bg-stone-50 border border-stone-200 rounded-lg">
            <p className="text-stone-600 text-sm font-semibold m-0">
              {t('activite.noAffirmationsWarning')}
            </p>
          </div>
        )}
      </div>

      <button
        className="bg-navy-700 hover:bg-navy-900 text-white rounded-lg px-6 py-3 font-medium text-sm transition-colors cursor-pointer"
        onClick={handleStartActivity}
      >
        {t('activite.start')}
      </button>
    </div>
  );
}

export default function ActivitePageWrapper() {
  return <Suspense><ActivitePage /></Suspense>;
}
