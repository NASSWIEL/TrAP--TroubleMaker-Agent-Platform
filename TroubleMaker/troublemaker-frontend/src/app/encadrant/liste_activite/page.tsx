'use client'; // Directive pour Next.js

import React, { useState, useEffect } from "react"; // 🔹 Import useEffect
import { useRouter } from "next/navigation"; // 🔹 Import de useRouter
import axios from "axios"; // 🔹 Import axios
import { Button } from "@/components/ui/button";
import Account from "@/components/ui/Account";
import { Settings, Plus, SpellCheck, RefreshCw, MessageSquare } from "lucide-react";

// 🔹 Define interface for Activity data from API
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

// 🔹 API Base URL (fix the environment variable name to match other pages)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const App = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter(); // 🔹 Initialisation du router

  // 🔹 State for activities, loading, and error
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // 🔹 State for expanded descriptions (adjust based on fetched data)
  const [expandedDescriptions, setExpandedDescriptions] = useState<boolean[]>([]);

  // 🔹 Fetch activities from API
  const fetchActivities = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/activites/`, {
        withCredentials: true, // Important for authentication
      });
      if (response.status === 200 && Array.isArray(response.data)) {
        setActivities(response.data);
        // Initialize expandedDescriptions based on fetched data
        setExpandedDescriptions(Array(response.data.length).fill(false));
        setLastRefresh(new Date()); // Set last refresh time
      } else {
        setError("Erreur lors de la récupération des activités.");
        setActivities([]); // Clear activities on error
        setExpandedDescriptions([]);
      }
    } catch (err: unknown) {
      console.error("Error fetching activities:", err);
      if (axios.isAxiosError(err) && err.response) {
        if (err.response.status === 403) {
          setError("Accès non autorisé. Veuillez vous reconnecter.");
          // Optionally redirect to login
          // router.push("/encadrant/login");
        } else {
          setError(err.response.data?.detail || "Erreur serveur lors de la récupération des activités.");
        }
      } else {
        setError("Erreur réseau ou serveur inaccessible.");
      }
      setActivities([]); // Clear activities on error
      setExpandedDescriptions([]);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Fetch activities on component mount and when page becomes visible
  useEffect(() => {
    fetchActivities();
  }, [router]); // Dependency array includes router if used for redirection

  // 🔹 Refresh data when page becomes visible (user returns to tab/window)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Page became visible, refresh the data
        fetchActivities();
      }
    };

    const handleFocus = () => {
      // Window/tab gained focus, refresh the data
      fetchActivities();
    };

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    // Cleanup event listeners on component unmount
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []); // Empty dependency array since we want this to run once

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value.toLowerCase());
  };

  const handleCreateClick = () => {
    router.push('/encadrant/creer_activite'); // 🔹 Redirection
  };

  const handleModifieClick = (activityCode: string) => {
    router.push(`/encadrant/parametres_activite?code=${encodeURIComponent(activityCode)}`); // 🔹 Redirection with code
  };

  const handleDebriefClick = (activityCode: string) => {
    router.push(`/encadrant/debrief?activity_code=${encodeURIComponent(activityCode)}`); // 🔹 Redirection to debrief page
  };

  const filteredActivities = activities.filter((activity) =>
    activity.titre.toLowerCase().includes(searchQuery)
  );

  const toggleDescription = (index: number) => { // Use index
    setExpandedDescriptions((prev) => {
      const newExpandedDescriptions = [...prev];
      newExpandedDescriptions[index] = !newExpandedDescriptions[index];
      return newExpandedDescriptions;
    });
  };

  // 🔹 Handle loading and error states
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Chargement des activités...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        Erreur: {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-8">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg p-6">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800">Liste des activités</h1>
            {lastRefresh && (
              <p className="text-sm text-gray-500 mt-1">
                Dernière actualisation: {lastRefresh.toLocaleTimeString('fr-FR', { 
                  hour: '2-digit', 
                  minute: '2-digit', 
                  second: '2-digit' 
                })}
              </p>
            )}
          </div>
        </header>

        {/* Centre le champ de recherche */}
        <div className="mb-8 flex justify-center items-center space-x-4">
          <input
            type="text"
            placeholder="Recherche activité"
            value={searchQuery}
            onChange={handleSearch}
            className="w-full max-w-md px-4 py-3 text-xl border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={fetchActivities}
            disabled={loading}
            className="bg-green-500 text-white px-4 py-3 rounded-md hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
            title="Actualiser la liste"
          >
            <RefreshCw size={32} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={handleCreateClick}
            className="bg-blue-500 text-white px-4 py-3 rounded-md hover:bg-blue-600"
          >
            <Plus size={32} />
          </button>
        </div>

        <div className="space-y-8">
          {/* 🔹 Handle loading state */}
          {loading && <p className="text-center text-xl text-gray-500">Chargement des activités...</p>}
          {/* 🔹 Handle error state */}
          {error && <p className="text-center text-xl text-red-500">Erreur: {error}</p>}
          {/* 🔹 Handle empty list */}
          {!loading && !error && filteredActivities.length === 0 && (
            <p className="text-center text-xl text-gray-500">
              {searchQuery ? "Aucune activité trouvée pour votre recherche." : "Vous n'avez pas encore créé d'activité."}
            </p>
          )}
          {/* 🔹 Map over filteredActivities */}
          {!loading && !error && filteredActivities.map((activity, index) => (
            <div
              key={activity.code_activite} // 🔹 Use unique code_activite as key
              className="bg-gray-50 p-8 rounded-lg shadow-sm flex items-start space-x-6"
            >
              {/* Section du statut */}
              <div className="flex flex-col items-center space-y-4 mt-2">
                <span
                  className={`text-xl font-semibold space-y-4 ${activity.is_published ? "text-green-600" : "text-red-600"
                    }`}
                >
                  {activity.is_published ? "Publié" : "Brouillon"}
                </span>

                {/* Show activity type indicator */}
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

              {/* Section du contenu */}
              <div className="flex-1">
                <h2 className="font-bold text-3xl text-gray-800 mb-4">
                  {activity.titre} {/* Use titre from API */}
                </h2>
                <div className="font-semibold text-blue-600 mb-6 text-xl">
                  Code : {activity.code_activite}
                  {activity.destine_a && (
                    <span className="text-gray-500"> ({activity.destine_a.nom})</span>
                  )}
                  {!activity.destine_a && (
                    <span className="text-gray-500"> (Aucune catégorie)</span>
                  )}
                </div>

                <p className="text-gray-600 mb-6 text-xl">
                  {expandedDescriptions[index]
                    ? activity.description
                    : activity.description.slice(0, 100) +
                    (activity.description.length > 100 ? "..." : "")}
                </p>
                {activity.description.length > 100 && (
                  <button
                    onClick={() => toggleDescription(index)} // Use index
                    className="text-blue-500 hover:text-blue-700 text-xl"
                  >
                    {expandedDescriptions[index] ? "Voir moins" : "Voir plus"}
                  </button>
                )}
                <p className="text-gray-500 mt-4 text-xl">
                  Nombre d'affirmations : <span className="font-bold">{activity.nbr_affirmations_associe}</span>
                  <br />
                  Étudiants autorisés : <span className="font-bold">{activity.etudiants_autorises.length}</span>
                </p>
              </div>

              {/* Section des boutons d'action à droite */}
              <div className="flex items-center space-x-2">
                <div className="relative group">
                  <button
                    onClick={() => handleDebriefClick(activity.code_activite)}
                    className="flex items-center justify-center h-12 w-12 bg-transparent rounded-full hover:bg-blue-100">
                    <MessageSquare className="h-7 w-7 text-blue-600" />
                  </button>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden w-max px-3 py-1 bg-gray-800 text-white text-base rounded shadow group-hover:block">
                    Débrief
                  </div>
                </div>
                <div className="relative group">
                  <button
                    onClick={() => handleModifieClick(activity.code_activite)} // Pass activity code
                    className="flex items-center justify-center h-12 w-12 bg-transparent rounded-full hover:bg-gray-200">
                    <Settings className="h-7 w-7 text-gray-700" />
                  </button>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden w-max px-3 py-1 bg-gray-800 text-white text-base rounded shadow group-hover:block">
                    Paramètres
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