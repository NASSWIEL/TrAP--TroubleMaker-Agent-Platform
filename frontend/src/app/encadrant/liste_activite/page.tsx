'use client';

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { API_BASE_URL } from "@/lib/api";
import { RefreshCw, MessageSquare, Settings, Plus, User, LogOut } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface Activity {
  code_activite: string;
  titre: string;
  presentation_publique?: string;
  description: string;
  created_at: string;
  encadrant: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
  };
  destine_a?: {
    id: number;
    nom: string;
  };
  etudiants_autorises: Array<{
    id: number;
    email: string;
    nom_complet: string;
  }>;
  type_affirmation_requise: number;
  type_affirmation_requise_display: string;
  affirmations_associes: Array<{
    id: number;
    affirmation: string;
    is_correct_vf?: boolean;
    explication?: string;
  }>;
  nbr_affirmations_associe: number;
  is_published: boolean;
}

const App = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const { t } = useLanguage();

  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [userEmail, setUserEmail] = useState<string>("user@example.com");
  const [expandedDescriptions, setExpandedDescriptions] = useState<boolean[]>([]);

  const handleLogout = async () => {
    try {
      await axios.post(`${API_BASE_URL}/api/logout`, {}, { withCredentials: true });
      router.push('/');
    } catch (err) {
      console.error("Logout error:", err);
      router.push('/');
    }
  };

  const fetchActivities = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/activites`, { withCredentials: true });
      if (response.status === 200 && Array.isArray(response.data)) {
        setActivities(response.data);
        if (response.data.length > 0 && response.data[0].encadrant?.email) {
          setUserEmail(response.data[0].encadrant.email);
        }
        setExpandedDescriptions(Array(response.data.length).fill(false));
        setLastRefresh(new Date());
      } else {
        setError(t('listeActivite.fetchError'));
        setActivities([]);
        setExpandedDescriptions([]);
      }
    } catch (err: unknown) {
      console.error("Error fetching activities:", err);
      if (axios.isAxiosError(err) && err.response) {
        if (err.response.status === 403) {
          setError(t('listeActivite.unauthorized'));
        } else {
          setError(err.response.data?.detail || t('listeActivite.serverError'));
        }
      } else {
        setError(t('common.networkError'));
      }
      setActivities([]);
      setExpandedDescriptions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [router]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) fetchActivities();
    };
    const handleFocus = () => fetchActivities();
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value.toLowerCase());
  };

  const filteredActivities = activities.filter((activity) =>
    activity.titre.toLowerCase().includes(searchQuery)
  );

  const toggleDescription = (index: number) => {
    setExpandedDescriptions((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center">
        <p className="text-stone-500 text-sm">{t('listeActivite.loading')}</p>
      </div>
    );
  }

  if (error && activities.length === 0) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center">
        <p className="text-red-600 text-sm">{t('listeActivite.errorLabel')} {error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100">
      {/* Top navbar */}
      <nav className="bg-navy-900 text-white h-14 px-6 flex items-center justify-between sticky top-0 z-10 shadow-md">
        <span className="font-lora font-bold text-xl tracking-tight">TrAP</span>
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-navy-700 rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-white" />
          </div>
          <div className="hidden sm:flex flex-col items-start leading-tight">
            <span className="text-sm font-medium">{userEmail}</span>
            <span className="text-xs text-navy-100">{t('listeActivite.supervisor')}</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-navy-100 hover:text-white hover:bg-navy-700 rounded-lg px-3 py-1.5 text-sm transition-colors"
            title={t('listeActivite.logout')}
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">{t('listeActivite.loggingOut')}</span>
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="font-lora text-2xl font-bold text-navy-900">{t('listeActivite.title')}</h1>
          {lastRefresh && (
            <p className="text-xs text-stone-400 mt-1">
              {t('listeActivite.lastRefresh')} {lastRefresh.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
          )}
        </div>

        {/* Search + actions bar */}
        <div className="flex items-center gap-3 mb-6">
          <input
            type="text"
            placeholder={t('listeActivite.search')}
            value={searchQuery}
            onChange={handleSearch}
            className="flex-1 max-w-sm rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent transition-colors shadow-sm"
          />
          <button
            onClick={fetchActivities}
            disabled={loading}
            className="p-2 rounded-lg bg-white border border-stone-300 text-stone-600 hover:text-navy-700 hover:bg-stone-50 shadow-sm transition-colors disabled:opacity-50"
            title={t('listeActivite.refresh')}
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={() => router.push('/encadrant/creer_activite')}
            className="flex items-center gap-1.5 bg-navy-700 hover:bg-navy-900 text-white rounded-lg px-4 py-2 text-sm font-medium shadow-sm transition-colors"
            title={t('listeActivite.newActivity')}
          >
            <Plus size={16} />
            <span className="hidden sm:inline">{t('listeActivite.newActivity')}</span>
          </button>
        </div>

        {/* Error inline */}
        {error && (
          <p className="text-red-600 text-sm mb-4">{t('listeActivite.errorLabel')} {error}</p>
        )}

        {/* Empty state */}
        {!loading && !error && filteredActivities.length === 0 && (
          <div className="text-center py-20 text-stone-400">
            <p className="text-sm">{searchQuery ? t('listeActivite.noResults') : t('listeActivite.noActivities')}</p>
          </div>
        )}

        {/* Activity card grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredActivities.map((activity, index) => (
            <div
              key={activity.code_activite}
              className="bg-stone-50 rounded-xl border border-stone-200 shadow-sm flex flex-col"
            >
              {/* Card header */}
              <div className="px-5 pt-5 pb-3 flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h2 className="font-lora font-semibold text-navy-900 text-base leading-snug truncate">
                    {activity.titre}
                  </h2>
                  <p className="text-xs text-stone-400 mt-0.5">
                    {t('listeActivite.code')}: <span className="font-mono font-medium text-stone-600">{activity.code_activite}</span>
                    {activity.destine_a && (
                      <span className="ml-2 text-stone-400">· {activity.destine_a.nom}</span>
                    )}
                  </p>
                </div>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border flex-shrink-0 ${
                  activity.is_published
                    ? 'bg-green-100 text-green-800 border-green-200'
                    : 'bg-amber-100 text-amber-800 border-amber-200'
                }`}>
                  {activity.is_published ? t('common.published') : t('common.draft')}
                </span>
              </div>

              {/* Card meta */}
              <div className="px-5 py-2 flex items-center gap-4 text-xs text-stone-500">
                <span className="flex items-center gap-1">
                  <span className="w-5 h-5 bg-navy-100 rounded-full flex items-center justify-center text-navy-700 font-bold text-[10px]">
                    {activity.type_affirmation_requise === 2 ? 'V/F' : '4C'}
                  </span>
                  {activity.type_affirmation_requise === 2 ? 'Vrai/Faux' : '4 choix'}
                </span>
                <span>{activity.nbr_affirmations_associe ?? activity.affirmations_associes?.length ?? 0} statements</span>
                <span>{activity.etudiants_autorises?.length ?? 0} students</span>
              </div>

              {/* Description */}
              {activity.description && (
                <div className="px-5 py-2 flex-1">
                  <p className={`text-sm text-stone-600 leading-relaxed ${expandedDescriptions[index] ? '' : 'line-clamp-2'}`}>
                    {activity.description}
                  </p>
                  {activity.description.length > 120 && (
                    <button
                      onClick={() => toggleDescription(index)}
                      className="text-xs text-navy-500 hover:text-navy-700 mt-1 transition-colors"
                    >
                      {expandedDescriptions[index] ? t('common.showLess') : t('common.showMore')}
                    </button>
                  )}
                </div>
              )}

              {/* Card footer — actions */}
              <div className="px-5 py-3 mt-auto border-t border-stone-100 flex items-center justify-end gap-2">
                <button
                  onClick={() => router.push(`/encadrant/debrief?activity_code=${activity.code_activite}`)}
                  className="p-2 rounded-lg text-stone-500 hover:text-navy-700 hover:bg-navy-50 transition-colors"
                  title={t('listeActivite.debrief')}
                >
                  <MessageSquare size={16} />
                </button>
                <button
                  onClick={() => router.push(`/encadrant/parametres_activite?code=${activity.code_activite}`)}
                  className="p-2 rounded-lg text-stone-500 hover:text-navy-700 hover:bg-navy-50 transition-colors"
                  title={t('listeActivite.settings')}
                >
                  <Settings size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default App;
