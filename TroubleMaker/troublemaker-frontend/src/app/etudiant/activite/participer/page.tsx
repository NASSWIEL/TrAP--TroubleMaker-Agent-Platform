"use client";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";

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
    activite: string;
    affirmation: number;
    reponse_vf: boolean | null;
    reponse_choisie_qcm: number | null;
    justification: string | null;
}

type LocalResponse = {
    reponseSelection: string; 
    pourquoi: string;
};

const qcmLabels: { [key: string]: string } = {
    "1": "Toujours vrai",
    "2": "Généralement vrai",
    "3": "Généralement faux",
    "4": "Toujours faux"
};

const API_BASE_URL = "http://localhost:8000";

export default function Participer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activityCode = searchParams.get('code');

  const [activite, setActivite] = useState<ActiviteApiData | null>(null);
  const [currentAffirmationIndex, setCurrentAffirmationIndex] = useState(0);
  const [localResponses, setLocalResponses] = useState<Record<number, LocalResponse>>({});
  const [submittedResponses, setSubmittedResponses] = useState<Record<number, ReponseApiData>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const vraiFauxOptions = ["Vrai", "Faux", "Je ne sais pas"];
  const qcmValues = ["1", "2", "3", "4", "Je ne sais pas"];

  const mapLocalToApiResponse = useCallback((localResp: LocalResponse, affirmation: AffirmationApi): Partial<ReponseApiData> => {
      const apiPayload: Partial<ReponseApiData> = {
          justification: localResp.pourquoi || null,
          reponse_vf: null,
          reponse_choisie_qcm: null
      };
      const selection = localResp.reponseSelection;

      if (affirmation.nbr_reponses === 2) {
          if (selection === "Vrai") apiPayload.reponse_vf = true;
          else if (selection === "Faux") apiPayload.reponse_vf = false;
      } else if (affirmation.nbr_reponses === 4) {
          const qcmValue = parseInt(selection, 10);
          if (!isNaN(qcmValue) && qcmValue >= 1 && qcmValue <= 4) {
              apiPayload.reponse_choisie_qcm = qcmValue;
          }
      }
      return apiPayload;
  }, []);

  const mapApiToLocalResponse = (apiResp: ReponseApiData | undefined, affirmation: AffirmationApi): LocalResponse => {
      let reponseSelection = "Je ne sais pas";
      if (apiResp) {
           if (affirmation.nbr_reponses === 2) {
              if (apiResp.reponse_vf === true) reponseSelection = "Vrai";
              else if (apiResp.reponse_vf === false) reponseSelection = "Faux";
           } else if (affirmation.nbr_reponses === 4) {
               if (apiResp.reponse_choisie_qcm !== null && apiResp.reponse_choisie_qcm >= 1 && apiResp.reponse_choisie_qcm <= 4) {
                   reponseSelection = String(apiResp.reponse_choisie_qcm);
               }
           }
      }
      return {
          reponseSelection: reponseSelection,
          pourquoi: apiResp?.justification || ""
      };
  }

  useEffect(() => {
    if (!activityCode) {
      setError("Code d'activité manquant dans l'URL.");
      setLoading(false);
      return;
    }
    const fetchInitialData = async () => {
      setLoading(true);
      setError(null);
      try {
        const activityResponse = await axios.get(`${API_BASE_URL}/api/activites/${activityCode}/`, { withCredentials: true });
        if (activityResponse.status !== 200 || !activityResponse.data) throw new Error("Impossible de charger l'activité.");
        const fetchedActivite: ActiviteApiData = activityResponse.data;
        setActivite(fetchedActivite);

        const responsesResponse = await axios.get(`${API_BASE_URL}/api/reponses/?activity_code=${activityCode}`, { withCredentials: true });
        const fetchedResponses: ReponseApiData[] = responsesResponse.data || [];

        const initialLocalResponses: Record<number, LocalResponse> = {};
        const initialSubmittedResponses: Record<number, ReponseApiData> = {};

        fetchedActivite.affirmations_associes.forEach((affirmation, index) => {
             const submitted: ReponseApiData | undefined = fetchedResponses.find(r => r.affirmation === affirmation.id);
             initialSubmittedResponses[index] = submitted || {
                  activite: activityCode || "",
                  affirmation: affirmation.id,
                  reponse_vf: null,
                  reponse_choisie_qcm: null,
                  justification: null,
             };
             initialLocalResponses[index] = mapApiToLocalResponse(submitted, affirmation);
        });
        setSubmittedResponses(initialSubmittedResponses);
        setLocalResponses(initialLocalResponses);
      } catch (err: unknown) {
        console.error("Error fetching initial data:", err);
         if (axios.isAxiosError(err) && err.response) {
           if (err.response.status === 404) setError(`L'activité ou les réponses pour "${activityCode}" n'ont pas été trouvées.`);
           else if (err.response.status === 403) {
               // Check if it's specifically about unpublished activity
               const errorMessage = err.response.data?.error || "";
               if (errorMessage.includes("pas encore publiée")) {
                   setError("Cette activité n'est pas encore publiée. Veuillez contacter votre encadrant.");
               } else {
                   setError("Accès refusé à cette activité/réponses.");
               }
           } else setError(err.response.data?.error || err.response.data?.detail || "Erreur lors du chargement des données.");
        } else {
          setError("Erreur réseau ou serveur inaccessible.");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [activityCode]);

  const handleLocalResponseChange = (
    affirmationIndex: number,
    field: keyof LocalResponse,
    value: string
  ) => {
    setLocalResponses((prev) => ({
      ...prev,
      [affirmationIndex]: {
        ...(prev[affirmationIndex] || { reponseSelection: '', pourquoi: '' }),
        [field]: value,
      },
    }));
    if (error) setError(null);
  };

  const submitCurrentResponse = useCallback(async (indexToSubmit: number): Promise<{ success: boolean; data: ReponseApiData | null }> => {
      if (!activite || !activityCode || !activite.affirmations_associes[indexToSubmit]) return { success: false, data: null };

      const affirmation = activite.affirmations_associes[indexToSubmit];
      const localResponse = localResponses[indexToSubmit];
      const effectiveLocalResponse = localResponse || { reponseSelection: 'Je ne sais pas', pourquoi: '' };
      const submitted = submittedResponses[indexToSubmit];
      const apiPayload = mapLocalToApiResponse(effectiveLocalResponse, affirmation);
      const currentExistingId = submitted?.id;

      let needsApiCall = false;
      if (currentExistingId) {
          needsApiCall = apiPayload.reponse_vf !== submitted.reponse_vf ||
                         apiPayload.reponse_choisie_qcm !== submitted.reponse_choisie_qcm ||
                         apiPayload.justification !== submitted.justification;
      } else {
          needsApiCall = apiPayload.reponse_vf !== null ||
                         apiPayload.reponse_choisie_qcm !== null ||
                         (apiPayload.justification !== null && apiPayload.justification !== "");
      }

      if (!needsApiCall) {
          return { success: true, data: submittedResponses[indexToSubmit] || null };
      }

      setIsSubmitting(true);
      setError(null);
      try {
          const payload = {
              activite: activityCode,
              affirmation: affirmation.id,
              reponse_vf: apiPayload.reponse_vf,
              reponse_choisie_qcm: apiPayload.reponse_choisie_qcm,
              justification: apiPayload.justification,
          };
          const response = await axios.post<ReponseApiData>(`${API_BASE_URL}/api/reponses/`, payload, { withCredentials: true });
          if (response.status === 201 || response.status === 200) {
              const savedData = response.data;
              setSubmittedResponses(prev => ({ ...prev, [indexToSubmit]: savedData }));
              if (!localResponse || !localResponse.reponseSelection || localResponse.reponseSelection === 'Je ne sais pas') {
                  setLocalResponses(prev => ({
                      ...prev,
                      [indexToSubmit]: mapApiToLocalResponse(savedData, affirmation)
                  }));
              }
              return { success: true, data: savedData };
          } else {
              throw new Error(`Statut inattendu: ${response.status}`);
          }
      } catch (err: unknown) {
          console.error(`Error submitting index ${indexToSubmit}:`, err);
           if (axios.isAxiosError(err) && err.response) {
                let errorMsg = "Erreur inconnue.";
                if (err.response.status === 409) errorMsg = "Conflit détecté lors de la sauvegarde.";
                else if (err.response.status === 400) errorMsg = "Erreur de validation: " + JSON.stringify(err.response.data);
                else if (err.response.status === 403) errorMsg = "Permission refusée.";
                else if (err.response.status === 404) errorMsg = "Ressource non trouvée (API endpoint issue?).";
                else errorMsg = err.response.data?.error || err.response.data?.detail || `Erreur serveur (${err.response.status}).`;
                setError(errorMsg);
           } else {
               setError("Erreur réseau ou serveur inaccessible.");
           }
          return { success: false, data: null };
      } finally {
          setIsSubmitting(false);
      }
  }, [activite, activityCode, localResponses, submittedResponses, mapLocalToApiResponse]);

  const handleScroll = async (direction: "prev" | "next") => {
    if (isSubmitting || !activite) return;
    const submissionResult = await submitCurrentResponse(currentAffirmationIndex);
    if (!submissionResult.success) return;

    const affirmationsCount = activite.affirmations_associes.length;
    if (direction === "next" && currentAffirmationIndex < affirmationsCount - 1) {
      setCurrentAffirmationIndex(currentAffirmationIndex + 1);
    } else if (direction === "prev" && currentAffirmationIndex > 0) {
      setCurrentAffirmationIndex(currentAffirmationIndex - 1);
    }
    setError(null);
  };

 const handleFinalSubmit = async () => {
    if (!activite || !activityCode || isSubmitting) return;
    setIsSubmitting(true);
    setError(null);

    const finalIndex = currentAffirmationIndex;
    const lastSubmissionResult = await submitCurrentResponse(finalIndex);

    if (!lastSubmissionResult.success) {
         setIsSubmitting(false);
         return;
    }

    let firstMissingIndex = -1;
    const currentSubmittedStateSnapshot = { ...submittedResponses, [finalIndex]: lastSubmissionResult.data };

    const allSubmitted = activite.affirmations_associes.every((affirmation, index) => {
        const responseData = currentSubmittedStateSnapshot[index];
        const submittedSuccessfully = responseData && responseData.id;
        if (!submittedSuccessfully && firstMissingIndex === -1) {
            firstMissingIndex = index;
        }
        return submittedSuccessfully;
    });

    if (!allSubmitted) {
        alert(`Veuillez répondre à toutes les affirmations avant de terminer. Problème détecté autour de l'affirmation ${firstMissingIndex + 1}. Assurez-vous que chaque réponse a été enregistrée.`);
        if(firstMissingIndex !== -1 && firstMissingIndex !== currentAffirmationIndex) {
            setCurrentAffirmationIndex(firstMissingIndex);
        }
        setIsSubmitting(false);
        return;
   }

    if(activityCode) {
        router.push(`/etudiant/activite/participer/confirmer?code=${encodeURIComponent(activityCode)}`);
    } else {
        setError("Code activité perdu, impossible de confirmer.");
        setIsSubmitting(false);
    }
};

  if (loading) return <div className="flex justify-center items-center min-h-screen"><p className="text-xl">Chargement de l'activité...</p></div>;
  if (error && !activite) return <div className="flex justify-center items-center min-h-screen"><p className="text-red-600 text-xl p-4">{error}</p></div>;
  if (!activite) return <div className="flex justify-center items-center min-h-screen"><p className="text-yellow-600 text-xl">Aucune donnée d'activité disponible.</p></div>;
  
  // Handle case where activity has no affirmations
  if (!activite.affirmations_associes || activite.affirmations_associes.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8">
          <div className="text-center">
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">{activite.titre}</h2>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <div className="flex items-center justify-center mb-4">
                  <svg className="h-12 w-12 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-yellow-800 mb-2">
                  Activité en cours de préparation
                </h3>
                <p className="text-yellow-700 text-lg">
                  Cette activité ne contient aucune affirmation pour le moment. 
                  Veuillez contacter votre encadrant pour plus d'informations.
                </p>
              </div>
              <button 
                onClick={() => router.back()}
                className="mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Retour
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (currentAffirmationIndex >= activite.affirmations_associes.length || currentAffirmationIndex < 0) {
       return <div className="flex justify-center items-center min-h-screen"><p className="text-red-600 text-xl">Erreur: Index d'affirmation invalide.</p></div>;
  }

  const currentAffirmationData = activite.affirmations_associes[currentAffirmationIndex];
  const currentResponseOptions = currentAffirmationData.nbr_reponses === 2 ? vraiFauxOptions : qcmValues;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-4 text-xl">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="font-medium text-gray-500 uppercase tracking-wider">
               {/* Intentionally blank or Activity: {activite.code_activite} */}
            </span>
            {activite.code_activite && <div className="hidden sm:block h-4 w-[2px] bg-gray-300"></div>}
            <h2 className="text-3xl text-gray-900 font-bold">
              {activite.titre}
            </h2>
          </div>
        </div>
        {error && <p className="text-red-600 text-base mb-4 text-center">{error}</p>}

        <div className="space-y-6">
          <div className="bg-gray-50 p-6 rounded-lg">
            <p className="text-xl font-medium text-gray-800 mb-6 text-justify leading-relaxed">
              {currentAffirmationData.affirmation}
            </p>

            <RadioGroup
              value={localResponses[currentAffirmationIndex]?.reponseSelection || ""}
              onValueChange={(value) => handleLocalResponseChange(currentAffirmationIndex, "reponseSelection", value)}
              className="flex flex-col gap-6"
            >
              <div className={`text-xl font-medium grid grid-cols-1 ${currentAffirmationData.nbr_reponses === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-4'} gap-3`}>
                {currentResponseOptions.slice(0, currentAffirmationData.nbr_reponses).map((optionValue) => (
                  <div
                    key={optionValue}
                    className="text-xl font-medium flex items-center justify-center sm:justify-start space-x-2 p-2 rounded-lg hover:bg-gray-100 border border-gray-200"
                  >
                    <RadioGroupItem value={optionValue} id={`${optionValue}-${currentAffirmationIndex}`} />
                    <Label
                      htmlFor={`${optionValue}-${currentAffirmationIndex}`}
                      className="whitespace-nowrap text-lg font-medium cursor-pointer"
                    >
                      {currentAffirmationData.nbr_reponses === 4 ? qcmLabels[optionValue] : optionValue}
                    </Label>
                  </div>
                ))}
              </div>
              <div className="flex justify-center items-center border-t pt-4 mt-2">
                <div className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 border border-gray-200">
                  <RadioGroupItem value="Je ne sais pas" id={`unknown-${currentAffirmationIndex}`}/>
                  <Label
                    htmlFor={`unknown-${currentAffirmationIndex}`}
                    className="whitespace-nowrap text-lg font-medium cursor-pointer"
                  >
                    Je ne sais pas
                  </Label>
                </div>
              </div>
            </RadioGroup>

            <Textarea
              id={`explication-${currentAffirmationIndex}`}
              placeholder="Expliquez votre réponse ..."
              value={localResponses[currentAffirmationIndex]?.pourquoi || ""}
              onChange={(e) => handleLocalResponseChange(currentAffirmationIndex, "pourquoi", e.target.value)}
              style={{ fontSize: '25px' }} 
              className="mt-6 w-full min-h-[120px] p-3 border border-gray-300 rounded-md"
              disabled={isSubmitting}
            />
          </div>

          <div className="text-center mb-4">
            <span className="text-lg font-medium text-gray-500">
              Affirmation {currentAffirmationIndex + 1} sur {activite.affirmations_associes.length}
            </span>
             <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mt-2 max-w-md mx-auto">
                <div
                    className="bg-blue-600 h-2.5 rounded-full"
                    style={{ width: `${((currentAffirmationIndex + 1) / activite.affirmations_associes.length) * 100}%` }}
                ></div>
            </div>
          </div>

          <div className="flex justify-between items-center mt-8">
            <Button
              variant="outline"
              onClick={() => handleScroll("prev")}
              disabled={currentAffirmationIndex === 0 || isSubmitting}
              className="px-6 py-2"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Précédent
            </Button>

            {currentAffirmationIndex === activite.affirmations_associes.length - 1 ? (
              <Button
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                {isSubmitting ? "Enregistrement..." : "Terminer l'activité"}
              </Button>
            ) : (
               <Button
                variant="outline"
                onClick={() => handleScroll("next")}
                disabled={isSubmitting}
                className="px-6 py-2"
              >
                {isSubmitting ? "Enregistrement..." : "Suivant"}
                <ChevronRight className="h-4 w-4 ml-2" />
               </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
