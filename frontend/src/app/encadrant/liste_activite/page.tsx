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
      <div className="min-h-screen flex items-center justify-center">
        {t('listeActivite.loading')}
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        {t('listeActivite.errorLabel')} {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-8">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg p-6">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800">{t('listeActivite.title')}</h1>
            {lastRefresh && (
              <p className="text-sm text-gray-500 mt-1">
                {t('listeActivite.lastRefresh')} {lastRefresh.toLocaleTimeString(undefined, {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                })}
              </p>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-700">{userEmail}</span>
              <span className="text-xs text-gray-500">{t('listeActivite.supervisor')}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors duration-200"
              title={t('listeActivite.logout')}
            >
              <LogOut className="h-4 w-4" />
              <span className="text-sm font-medium">{t('listeActivite.loggingOut')}</span>
            </button>
          </div>
        </header>

        <div className="mb-8 flex justify-center items-center space-x-4">
          <input
            type="text"
            placeholder={t('listeActivite.search')}
            value={searchQuery}
            onChange={handleSearch}
            className="w-full max-w-md px-4 py-3 text-xl border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={fetchActivities}
            disabled={loading}
            className="bg-green-500 text-white px-4 py-3 rounded-md hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
            title={t('listeActivite.refresh')}
          >
            <RefreshCw size={32} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={() => router.push('/encadrant/creer_activite')}
            className="bg-blue-500 text-white px-4 py-3 rounded-md hover:bg-blue-600"
            title={t('listeActivite.newActivity')}
          >
            <Plus size={32} />
          </button>
        </div>

        <div className="space-y-8">
          {error && <p className="text-center text-xl text-red-500">{t('listeActivite.errorLabel')} {error}</p>}
          {!loading && !error && filteredActivities.length === 0 && (
            <p className="text-center text-xl text-gray-500">
              {searchQuery ? t('listeActivite.noResults') : t('listeActivite.noActivities')}
            </p>
          )}
          {!loading && !error && filteredActivities.map((activity, index) => (
            <div
              key={activity.code_activite}
              className="bg-gray-50 p-8 rounded-lg shadow-sm flex items-start space-x-6"
            >
              <div className="flex flex-col items-center space-y-4 mt-2">
                <span className={`text-xl font-semibold space-y-4 ${activity.is_published ? "text-green-600" : "text-red-600"}`}>
                  {activity.is_published ? t('common.published') : t('common.draft')}
                </span>
                <div className="relative group">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-600">
                      {activity.type_affirmation_requise === 2 ? 'V/F' : '4CH'}
                    </span>
                  </div>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden w-max px-6 py-3 bg-gray-800 text-white text-l rounded-lg shadow-lg group-hover:block">
                    {activity.type_affirmation_requise_display}
                  </div>
                </div>
              </div>

              <div className="flex-1">
                <h2 className="font-bold text-3xl text-gray-800 mb-4">{activity.titre}</h2>
                <div className="font-semibold text-blue-600 mb-6 text-xl">
                  {t('listeActivite.code')} {activity.code_activite}
                  {activity.destine_a && (
                    <span className="text-gray-500"> ({activity.destine_a.nom})</span>
                  )}
                  {!activity.destine_a && (
                    <span className="text-gray-500"> ({t('common.noCategory')})</span>
                  )}
                </div>

                <p className="text-gray-600 mb-6 text-xl">
                  {expandedDescriptions[index]
                    ? activity.description
                    : activity.description.slice(0, 100) + (activity.description.length > 100 ? "..." : "")}
                </p>
                {activity.description.length > 100 && (
                  <button
                    onClick={() => toggleDescription(index)}
                    className="text-blue-500 hover:text-blue-700 text-xl"
                  >
                    {expandedDescriptions[index] ? t('common.showLess') : t('common.showMore')}
                  </button>
                )}
                <p className="text-gray-500 mt-4 text-xl">
                  {t('listeActivite.affirmationCount')} <span className="font-bold">{activity.nbr_affirmations_associe}</span>
                  <br />
                  {t('listeActivite.authorizedStudents')} <span className="font-bold">{activity.etudiants_autorises.length}</span>
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <div className="relative group">
                  <button
                    onClick={() => router.push(`/encadrant/debrief?activity_code=${encodeURIComponent(activity.code_activite)}`)}
                    className="flex items-center justify-center h-12 w-12 bg-transparent rounded-full hover:bg-blue-100">
                    <MessageSquare className="h-7 w-7 text-blue-600" />
                  </button>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden w-max px-3 py-1 bg-gray-800 text-white text-base rounded shadow group-hover:block">
                    {t('listeActivite.debrief')}
                  </div>
                </div>
                <div className="relative group">
                  <button
                    onClick={() => router.push(`/encadrant/parametres_activite?code=${encodeURIComponent(activity.code_activite)}`)}
                    className="flex items-center justify-center h-12 w-12 bg-transparent rounded-full hover:bg-gray-200">
                    <Settings className="h-7 w-7 text-gray-700" />
                  </button>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden w-max px-3 py-1 bg-gray-800 text-white text-base rounded shadow group-hover:block">
                    {t('listeActivite.settings')}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default App;
