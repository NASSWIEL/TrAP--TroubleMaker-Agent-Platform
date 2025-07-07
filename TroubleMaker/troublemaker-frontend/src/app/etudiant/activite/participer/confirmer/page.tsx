"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import axios from "axios";
import { Skeleton } from "@/components/ui/skeleton";

interface AffirmationApi {
    id: number;
    affirmation: string;
    nbr_reponses: 2 | 4;
    option_1?: string | null;
    option_2?: string | null;
    option_3?: string | null;
    option_4?: string | null;
}

interface ActiviteApiData {
    code_activite: string;
    titre: string;
    affirmations_associes: AffirmationApi[];
}

interface ReponseApiData {
    id?: number;
    activite: { code_activite: string; } | string;
    affirmation: { id: number; } | number;
    etudiant?: { id: number; username: string; };
    reponse_vf: boolean | null;
    reponse_choisie_qcm: number | null;
    justification: string | null;
    timestamp?: string;
}

const API_BASE_URL = "http://localhost:8000";

const qcmNumberToText: { [key: number]: string } = {
    1: "Toujours faux",
    2: "Généralement faux",
    3: "Généralement vrai",
    4: "Toujours vrai",
};

export default function Confirmer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activityCode = searchParams.get('code');

  const [activite, setActivite] = useState<ActiviteApiData | null>(null);
  const [reponses, setReponses] = useState<Record<number, ReponseApiData>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [expandedTexts, setExpandedTexts] = useState<{ [key: number]: boolean }>({});
  const affirmationsPerPage = 2;

  useEffect(() => {
    if (!activityCode) {
      setError("Code d'activité manquant.");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [activityResponse, responsesResponse] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/activites/${activityCode}/`, { withCredentials: true }),
          axios.get(`${API_BASE_URL}/api/reponses/?activity_code=${activityCode}`, { withCredentials: true })
        ]);

        if (activityResponse.status !== 200 || !activityResponse.data) {
          throw new Error("Impossible de charger l'activité.");
        }
        const fetchedActivite: ActiviteApiData = activityResponse.data;
        setActivite(fetchedActivite);

        const fetchedResponses: ReponseApiData[] = responsesResponse.data || [];
        const responsesRecord: Record<number, ReponseApiData> = {};
        fetchedResponses.forEach(response => {
            const affirmationId = typeof response.affirmation === 'object' && response.affirmation !== null
                                  ? response.affirmation.id
                                  : typeof response.affirmation === 'number'
                                  ? response.affirmation
                                  : null;
            if (affirmationId !== null) {
                responsesRecord[affirmationId] = response;
            } else {
                console.warn("Skipping response object with missing or invalid affirmation ID:", response);
            }
        });
        setReponses(responsesRecord);

      } catch (err: unknown) {
        console.error("Error fetching confirmation data:", err);
         if (axios.isAxiosError(err) && err.response) {
           if (err.response.status === 404) {
               setError(`L'activité ou les réponses pour "${activityCode}" n'ont pas été trouvées.`);
           } else if (err.response.status === 403) {
                setError("Vous n'êtes pas autorisé à voir ces données.");
           } else {
               setError(err.response.data?.error || err.response.data?.detail || "Erreur lors du chargement des données de confirmation.");
           }
        } else {
          setError("Erreur réseau ou serveur inaccessible.");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activityCode]);

  const totalPages = activite ? Math.ceil(activite.affirmations_associes.length / affirmationsPerPage) : 0;
  const startIndex = currentPage * affirmationsPerPage;
  const endIndex = startIndex + affirmationsPerPage;
  const currentAffirmations = activite ? activite.affirmations_associes.slice(startIndex, endIndex) : [];

  const handlePageChange = (direction: "prev" | "next") => {
    if (direction === "prev" && currentPage > 0) {
      setCurrentPage(currentPage - 1);
    } else if (direction === "next" && currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const toggleExpand = (affirmationId: number) => {
    setExpandedTexts(prev => ({
      ...prev,
      [affirmationId]: !prev[affirmationId]
    }));
  };

  if (loading) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-8">
            <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg p-6">
                <Skeleton className="h-8 w-3/4 mb-2" />
                <Skeleton className="h-6 w-1/2 mb-8" />
                <div className="space-y-6">
                    <Skeleton className="h-48 w-full rounded-lg" />
                    <Skeleton className="h-48 w-full rounded-lg" />
                </div>
                 <div className="flex justify-center items-center gap-4 mt-8">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-10 w-24" />
                 </div>
                 <div className="flex justify-center gap-4 mt-8 pt-4 border-t">
                    <Skeleton className="h-10 w-40" />
                    <Skeleton className="h-10 w-40" />
                 </div>
            </div>
        </div>
    );
  }

  if (error) {
     return (
         <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
             <p className="text-red-600 text-xl">{error}</p>
             <Button onClick={() => router.push(`/etudiant/activite?code=${encodeURIComponent(activityCode || '')}`)} className="mt-4">
                Retour à la présentation de l'activité
             </Button>
         </div>
     );
  }

  if (!activite) {
     return (
         <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
             <p className="text-yellow-600 text-xl">Aucune donnée d'activité trouvée.</p>
              <Button onClick={() => router.push(`/etudiant/activite?code=${encodeURIComponent(activityCode || '')}`)} className="mt-4">
                Retour à la présentation de l'activité
             </Button>
         </div>
     );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-8">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Confirmation des réponses</h1>
            <h2 className="text-xl text-gray-600 mt-2 font-bold">{activite.titre} ({activite.code_activite})</h2>
          </div>
        </div>

        <div className="space-y-6">
          {currentAffirmations.map((affirmation, idx) => {
              const globalIndex = startIndex + idx;
              const response = reponses[affirmation.id];
              const justification = response?.justification || "(Aucune explication fournie)";
              const isExpanded = expandedTexts[affirmation.id] || false;
              let displayAnswer = "Non répondu ou Je ne sais pas";

              if (response) {
                  if (affirmation.nbr_reponses === 2) {
                      if (response.reponse_vf === true) displayAnswer = "Vrai";
                      else if (response.reponse_vf === false) displayAnswer = "Faux";
                  } else if (affirmation.nbr_reponses === 4) {
                      if (response.reponse_choisie_qcm !== null && qcmNumberToText[response.reponse_choisie_qcm]) {
                           displayAnswer = qcmNumberToText[response.reponse_choisie_qcm];
                      }
                  }
              }

              return (
                  <div key={affirmation.id} className="bg-gray-50 p-6 rounded-lg">
                      <div className="flex items-center gap-2 mb-4">
                          <span className="font-semibold text-gray-600">
                              Affirmation {activite.affirmations_associes.findIndex(a => a.id === affirmation.id) + 1}
                          </span>
                      </div>
                      <p className="text-lg font-medium text-gray-800 mb-4">
                          {affirmation.affirmation}
                      </p>
                      <div className="bg-white p-4 rounded border mt-4">
                          <div className="mb-4">
                              <span className="font-semibold">Votre réponse: </span>
                              <span className="text-blue-600 font-medium">
                                  {displayAnswer}
                              </span>
                          </div>
                          <div>
                              <span className="font-semibold">Votre explication: </span>
                              <p className="mt-2 text-gray-600 whitespace-pre-wrap">
                                  {isExpanded
                                      ? justification
                                      : justification.length > 150 ? justification.slice(0, 150) + "..." : justification
                                  }
                              </p>
                              {justification.length > 150 && (
                                  <button
                                      onClick={() => toggleExpand(affirmation.id)}
                                      className="text-blue-500 hover:text-blue-700 text-sm mt-2"
                                  >
                                      {isExpanded ? "Voir moins" : "Voir plus"}
                                  </button>
                              )}
                          </div>
                      </div>
                  </div>
              );
          })}

          {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-8">
                  <Button
                      variant="outline"
                      onClick={() => handlePageChange("prev")}
                      disabled={currentPage === 0}
                      className="px-4 py-2"
                  >
                      <ChevronLeft className="h-4 w-4 mr-2" />
                      Précédent
                  </Button>
                  <span className="text-sm font-medium">
                      Page {currentPage + 1} sur {totalPages}
                  </span>
                  <Button
                      variant="outline"
                      onClick={() => handlePageChange("next")}
                      disabled={currentPage === totalPages - 1}
                      className="px-4 py-2"
                  >
                      Suivant
                      <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
              </div>
          )}

          <div className="flex justify-center gap-4 mt-8 pt-4 border-t">
             <Button
                variant="outline"
                onClick={() => router.back()} // Changed to router.back() to allow edits
                className="px-6 py-2"
             >
                Modifier les réponses
             </Button>
             <Button
                onClick={() => router.push(`/etudiant/activite?code=${encodeURIComponent(activityCode || '')}`)} // Kept this as the primary exit
                className="px-8 py-2 bg-blue-500 hover:bg-blue-600 text-white"
            >
                Retour à la présentation de l'activité
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
