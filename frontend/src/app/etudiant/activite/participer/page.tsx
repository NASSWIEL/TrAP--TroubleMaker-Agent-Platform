"use client";
import { Suspense, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { API_BASE_URL } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";

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
    type_affirmation_requise: number;
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

// Internal sentinel values kept in French to avoid logic breakage
const VF_TRUE = "Vrai";
const VF_FALSE = "Faux";
const DONT_KNOW = "Je ne sais pas";
const vraiFauxOptions = [VF_TRUE, VF_FALSE];
const qcmValues = ["1", "2", "3", "4"];

function Participer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activityCode = searchParams.get('code');
  const { t } = useLanguage();

  const [activite, setActivite] = useState<ActiviteApiData | null>(null);
  const [currentAffirmationIndex, setCurrentAffirmationIndex] = useState(0);
  const [localResponses, setLocalResponses] = useState<Record<number, LocalResponse>>({});
  const [submittedResponses, setSubmittedResponses] = useState<Record<number, ReponseApiData>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const qcmLabels: { [key: string]: string } = {
      "1": t('common.alwaysTrue'),
      "2": t('common.generallyTrue'),
      "3": t('common.generallyFalse'),
      "4": t('common.alwaysFalse'),
  };

  const mapLocalToApiResponse = useCallback((localResp: LocalResponse, affirmation: AffirmationApi, activiteData: ActiviteApiData): Partial<ReponseApiData> => {
      const apiPayload: Partial<ReponseApiData> = {
          justification: localResp.pourquoi || null,
          reponse_vf: null,
          reponse_choisie_qcm: null
      };
      const selection = localResp.reponseSelection;

      if (affirmation.nbr_reponses === 2) {
          if (activiteData.type_affirmation_requise === 2) {
              if (selection === VF_TRUE) apiPayload.reponse_vf = true;
              else if (selection === VF_FALSE) apiPayload.reponse_vf = false;
          } else if (activiteData.type_affirmation_requise === 4) {
              const qcmValue = parseInt(selection, 10);
              if (qcmValue === 1 || qcmValue === 2) apiPayload.reponse_vf = true;
              else if (qcmValue === 3 || qcmValue === 4) apiPayload.reponse_vf = false;
          }
      } else if (affirmation.nbr_reponses === 4) {
          if (activiteData.type_affirmation_requise === 4) {
              const qcmValue = parseInt(selection, 10);
              if (!isNaN(qcmValue) && qcmValue >= 1 && qcmValue <= 4) {
                  apiPayload.reponse_choisie_qcm = qcmValue;
              }
          } else if (activiteData.type_affirmation_requise === 2) {
              if (selection === VF_TRUE) apiPayload.reponse_choisie_qcm = 1;
              else if (selection === VF_FALSE) apiPayload.reponse_choisie_qcm = 4;
          }
      }
      return apiPayload;
  }, []);

  const mapApiToLocalResponse = (apiResp: ReponseApiData | undefined, affirmation: AffirmationApi, activiteData: ActiviteApiData): LocalResponse => {
      let reponseSelection = DONT_KNOW;
      if (apiResp) {
           if (affirmation.nbr_reponses === 2) {
               if (activiteData.type_affirmation_requise === 2) {
                   if (apiResp.reponse_vf === true) reponseSelection = VF_TRUE;
                   else if (apiResp.reponse_vf === false) reponseSelection = VF_FALSE;
               } else if (activiteData.type_affirmation_requise === 4) {
                   if (apiResp.reponse_vf === true) reponseSelection = "1";
                   else if (apiResp.reponse_vf === false) reponseSelection = "4";
               }
           } else if (affirmation.nbr_reponses === 4) {
               if (activiteData.type_affirmation_requise === 4) {
                   if (apiResp.reponse_choisie_qcm !== null && apiResp.reponse_choisie_qcm >= 1 && apiResp.reponse_choisie_qcm <= 4) {
                       reponseSelection = String(apiResp.reponse_choisie_qcm);
                   }
               } else if (activiteData.type_affirmation_requise === 2) {
                   if (apiResp.reponse_choisie_qcm === 1 || apiResp.reponse_choisie_qcm === 2) reponseSelection = VF_TRUE;
                   else if (apiResp.reponse_choisie_qcm === 3 || apiResp.reponse_choisie_qcm === 4) reponseSelection = VF_FALSE;
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
      setError(t('activite.missingCode'));
      setLoading(false);
      return;
    }
    const fetchInitialData = async () => {
      setLoading(true);
      setError(null);
      try {
        const activityResponse = await axios.get(`${API_BASE_URL}/api/activites/${activityCode}`, { withCredentials: true });
        if (activityResponse.status !== 200 || !activityResponse.data) throw new Error(t('activite.cannotLoad'));
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
             initialLocalResponses[index] = mapApiToLocalResponse(submitted, affirmation, fetchedActivite);
        });
        setSubmittedResponses(initialSubmittedResponses);
        setLocalResponses(initialLocalResponses);
      } catch (err: unknown) {
        console.error("Error fetching initial data:", err);
         if (axios.isAxiosError(err) && err.response) {
           if (err.response.status === 404) setError(t('confirmer.notFoundCode', { code: activityCode }));
           else if (err.response.status === 403) {
               const errorMessage = err.response.data?.error || "";
               if (errorMessage.includes("pas encore publiée")) {
                   setError(t('participer.notPublishedError'));
               } else {
                   setError(t('participer.accessDenied'));
               }
           } else setError(err.response.data?.error || err.response.data?.detail || t('common.networkError'));
        } else {
          setError(t('common.networkError'));
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
      const effectiveLocalResponse = localResponse || { reponseSelection: DONT_KNOW, pourquoi: '' };
      const submitted = submittedResponses[indexToSubmit];
      const apiPayload = mapLocalToApiResponse(effectiveLocalResponse, affirmation, activite);
      const currentExistingId = submitted?.id;

      let needsApiCall = false;
      if (currentExistingId) {
          needsApiCall = apiPayload.reponse_vf !== submitted.reponse_vf ||
                         apiPayload.reponse_choisie_qcm !== submitted.reponse_choisie_qcm ||
                         apiPayload.justification !== submitted.justification;
      } else {
          needsApiCall = true;
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
          const response = await axios.post<ReponseApiData>(`${API_BASE_URL}/api/reponses`, payload, { withCredentials: true });
          if (response.status === 201 || response.status === 200) {
              const savedData = response.data;
              setSubmittedResponses(prev => ({ ...prev, [indexToSubmit]: savedData }));
              if (!localResponse || !localResponse.reponseSelection || localResponse.reponseSelection === DONT_KNOW) {
                  setLocalResponses(prev => ({
                      ...prev,
                      [indexToSubmit]: mapApiToLocalResponse(savedData, affirmation, activite)
                  }));
              }
              return { success: true, data: savedData };
          } else {
              throw new Error(`Unexpected status: ${response.status}`);
          }
      } catch (err: unknown) {
          console.error(`Error submitting index ${indexToSubmit}:`, err);
           if (axios.isAxiosError(err) && err.response) {
                let errorMsg = t('common.networkError');
                if (err.response.status === 409) errorMsg = "Conflict detected during save.";
                else if (err.response.status === 400) errorMsg = "Validation error: " + JSON.stringify(err.response.data);
                else if (err.response.status === 403) errorMsg = t('participer.accessDenied');
                else errorMsg = err.response.data?.error || err.response.data?.detail || t('common.networkError');
                setError(errorMsg);
           } else {
               setError(t('common.networkError'));
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
    setError(null);

    const finalIndex = currentAffirmationIndex;
    const lastSubmissionResult = await submitCurrentResponse(finalIndex);

    if (!lastSubmissionResult.success) return;

    let firstMissingIndex = -1;
    const currentSubmittedStateSnapshot = { ...submittedResponses, [finalIndex]: lastSubmissionResult.data };

    const allSubmitted = activite.affirmations_associes.every((affirmation, index) => {
        const responseData = currentSubmittedStateSnapshot[index];
        const submittedSuccessfully = responseData && (responseData.id !== undefined && responseData.id !== null);
        if (!submittedSuccessfully && firstMissingIndex === -1) {
            firstMissingIndex = index;
        }
        return submittedSuccessfully;
    });

    if (!allSubmitted) {
        alert(t('participer.missingAnswersAlert', { n: firstMissingIndex + 1 }));
        if(firstMissingIndex !== -1 && firstMissingIndex !== currentAffirmationIndex) {
            setCurrentAffirmationIndex(firstMissingIndex);
        }
        setIsSubmitting(false);
        return;
   }

    if(activityCode) {
        router.push(`/etudiant/activite/participer/confirmer?code=${encodeURIComponent(activityCode)}`);
    } else {
        setError(t('participer.activityCodeLost'));
        setIsSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center min-h-screen"><p className="text-xl">{t('participer.loading')}</p></div>;
  if (error && !activite) return <div className="flex justify-center items-center min-h-screen"><p className="text-red-600 text-xl p-4">{error}</p></div>;
  if (!activite) return <div className="flex justify-center items-center min-h-screen"><p className="text-yellow-600 text-xl">{t('participer.noData')}</p></div>;

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
                  {t('participer.noAffirmationsTitle')}
                </h3>
                <p className="text-yellow-700 text-lg">
                  {t('participer.noAffirmationsDesc')}
                </p>
              </div>
              <button
                onClick={() => router.back()}
                className="mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                {t('common.back')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentAffirmationIndex >= activite.affirmations_associes.length || currentAffirmationIndex < 0) {
       return <div className="flex justify-center items-center min-h-screen"><p className="text-red-600 text-xl">{t('participer.invalidIndex')}</p></div>;
  }

  const currentAffirmationData = activite.affirmations_associes[currentAffirmationIndex];
  const currentResponseOptions = activite.type_affirmation_requise === 2 ? vraiFauxOptions : qcmValues;

  return (
    <div className="min-h-screen bg-stone-100 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="font-medium text-gray-500 uppercase tracking-wider"></span>
            {activite.code_activite && <div className="hidden sm:block h-4 w-[2px] bg-gray-300"></div>}
            <h2 className="text-3xl text-gray-900 font-bold">{activite.titre}</h2>
          </div>
        </div>
        {error && <p className="text-red-600 text-base mb-4 text-center">{error}</p>}

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 mb-4">
            <p className="font-lora text-lg text-stone-900 mb-6 leading-relaxed">
              {currentAffirmationData.affirmation}
            </p>

            <RadioGroup
              value={localResponses[currentAffirmationIndex]?.reponseSelection || ""}
              onValueChange={(value) => handleLocalResponseChange(currentAffirmationIndex, "reponseSelection", value)}
              className="flex flex-col gap-6"
            >
              <div className={`text-xl font-medium grid grid-cols-1 ${activite.type_affirmation_requise === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-4'} gap-3`}>
                {currentResponseOptions.slice(0, activite.type_affirmation_requise).map((optionValue) => (
                  <div
                    key={optionValue}
                    className="flex items-center gap-3 p-3 rounded-lg border border-stone-200 cursor-pointer hover:border-navy-500 hover:bg-navy-50 transition-colors has-[:checked]:border-navy-600 has-[:checked]:bg-navy-50"
                  >
                    <RadioGroupItem value={optionValue} id={`${optionValue}-${currentAffirmationIndex}`} />
                    <Label
                      htmlFor={`${optionValue}-${currentAffirmationIndex}`}
                      className="whitespace-nowrap text-sm font-medium cursor-pointer text-stone-700"
                    >
                      {activite.type_affirmation_requise === 4
                        ? qcmLabels[optionValue]
                        : optionValue === VF_TRUE ? t('common.true') : t('common.false')}
                    </Label>
                  </div>
                ))}
              </div>
              <div className="flex justify-center items-center border-t pt-4 mt-2">
                <div className="flex items-center gap-3 p-3 rounded-lg border border-stone-200 cursor-pointer hover:border-navy-500 hover:bg-navy-50 transition-colors has-[:checked]:border-navy-600 has-[:checked]:bg-navy-50">
                  <RadioGroupItem value={DONT_KNOW} id={`unknown-${currentAffirmationIndex}`}/>
                  <Label
                    htmlFor={`unknown-${currentAffirmationIndex}`}
                    className="whitespace-nowrap text-sm font-medium cursor-pointer text-stone-700"
                  >
                    {t('common.dontKnow')}
                  </Label>
                </div>
              </div>
            </RadioGroup>

            <Textarea
              id={`explication-${currentAffirmationIndex}`}
              placeholder={t('participer.explainPlaceholder')}
              value={localResponses[currentAffirmationIndex]?.pourquoi || ""}
              onChange={(e) => handleLocalResponseChange(currentAffirmationIndex, "pourquoi", e.target.value)}
              className="mt-4 w-full min-h-[100px] rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent transition-colors resize-none"
              disabled={isSubmitting}
            />
          </div>

          <div className="text-center mb-4">
            <span className="text-xs font-medium text-stone-500">
              {t('participer.statementN', { n: currentAffirmationIndex + 1, total: activite.affirmations_associes.length })}
            </span>
             <div className="w-full bg-stone-200 rounded-full h-1.5 mt-2 max-w-md mx-auto">
                <div
                    className="bg-navy-700 h-1.5 rounded-full transition-all duration-300"
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
              {t('common.previous')}
            </Button>

            {currentAffirmationIndex === activite.affirmations_associes.length - 1 ? (
              <Button
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                {isSubmitting ? t('participer.finishing') : t('participer.finish')}
              </Button>
            ) : (
               <Button
                variant="outline"
                onClick={() => handleScroll("next")}
                disabled={isSubmitting}
                className="px-6 py-2"
              >
                {isSubmitting ? t('participer.finishing') : t('common.next')}
                <ChevronRight className="h-4 w-4 ml-2" />
               </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ParticiperWrapper() {
  return <Suspense><Participer /></Suspense>;
}
