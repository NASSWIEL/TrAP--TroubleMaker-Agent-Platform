"use client";
import { Suspense, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { Skeleton } from "@/components/ui/skeleton";
import { API_BASE_URL } from "@/lib/api";
import { MessageSquare, CheckCircle, Clock } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface AffirmationApi {
    id: number;
    affirmation: string;
    nbr_reponses: 2 | 4;
}

interface ActiviteApiData {
    code_activite: string;
    titre: string;
    type_affirmation_requise: number;
    affirmations_associes: AffirmationApi[];
}

interface ReponseApiData {
    id: number;
    affirmation: { id: number } | number;
    reponse_vf: boolean | null;
    reponse_choisie_qcm: number | null;
    justification: string | null;
}

interface DebriefApiData {
    id: number;
    feedback: string;
    reponse: {
        id: number;
        affirmation: { id: number; affirmation: string };
    };
}

function FeedbackEtudiant() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const activityCode = searchParams.get('code');
    const { t } = useLanguage();

    const [activite, setActivite] = useState<ActiviteApiData | null>(null);
    const [reponses, setReponses] = useState<Record<number, ReponseApiData>>({});
    const [debriefs, setDebriefs] = useState<Record<number, DebriefApiData>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const qcmNumberToText: { [key: number]: string } = {
        1: t('common.alwaysTrue'),
        2: t('common.generallyTrue'),
        3: t('common.generallyFalse'),
        4: t('common.alwaysFalse'),
    };

    useEffect(() => {
        if (!activityCode) {
            setError(t('feedback.missingCode'));
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const [activityRes, reponsesRes, debriefsRes] = await Promise.all([
                    axios.get(`${API_BASE_URL}/api/activites/${activityCode}`, { withCredentials: true }),
                    axios.get(`${API_BASE_URL}/api/reponses/?activity_code=${activityCode}`, { withCredentials: true }),
                    axios.get(`${API_BASE_URL}/api/debriefs/?activity_code=${activityCode}`, { withCredentials: true }),
                ]);

                setActivite(activityRes.data);

                const reponsesRecord: Record<number, ReponseApiData> = {};
                (reponsesRes.data || []).forEach((r: ReponseApiData) => {
                    const affId = typeof r.affirmation === 'object' ? r.affirmation.id : r.affirmation;
                    if (affId) reponsesRecord[affId] = r;
                });
                setReponses(reponsesRecord);

                const debriefsRecord: Record<number, DebriefApiData> = {};
                (debriefsRes.data || []).forEach((d: DebriefApiData) => {
                    const affId = d.reponse?.affirmation?.id;
                    if (affId) debriefsRecord[affId] = d;
                });
                setDebriefs(debriefsRecord);

            } catch (err: unknown) {
                console.error("Error fetching feedback data:", err);
                if (axios.isAxiosError(err) && err.response) {
                    if (err.response.status === 403) {
                        setError(t('feedback.expired'));
                    } else {
                        setError(err.response.data?.error || t('feedback.loadError'));
                    }
                } else {
                    setError(t('common.networkError'));
                }
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [activityCode]);

    const getDisplayAnswer = (affirmation: AffirmationApi, response: ReponseApiData | undefined): string => {
        if (!response) return t('common.notAnswered');
        if (affirmation.nbr_reponses === 2) {
            if (response.reponse_vf === true) return t('common.true');
            if (response.reponse_vf === false) return t('common.false');
        } else if (affirmation.nbr_reponses === 4) {
            if (response.reponse_choisie_qcm !== null && qcmNumberToText[response.reponse_choisie_qcm]) {
                return qcmNumberToText[response.reponse_choisie_qcm];
            }
        }
        return t('common.notAnswered');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-8">
                <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-6">
                    <Skeleton className="h-8 w-3/4 mb-2" />
                    <Skeleton className="h-6 w-1/2 mb-8" />
                    <div className="space-y-6">
                        <Skeleton className="h-48 w-full rounded-lg" />
                        <Skeleton className="h-48 w-full rounded-lg" />
                        <Skeleton className="h-48 w-full rounded-lg" />
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
                    {t('feedback.backToActivity')}
                </Button>
            </div>
        );
    }

    if (!activite) return null;

    const affirmationsWithReponses = activite.affirmations_associes.filter(a => reponses[a.id]);
    const nbDebriefs = affirmationsWithReponses.filter(a => debriefs[a.id]).length;
    const nbReponses = affirmationsWithReponses.length;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-8">
            <div className="max-w-3xl mx-auto">
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <MessageSquare className="h-7 w-7 text-blue-600" />
                        <h1 className="text-2xl font-bold text-gray-800">{t('feedback.title')}</h1>
                    </div>
                    <h2 className="text-lg text-gray-600 font-medium mb-1">{activite.titre} — {activite.code_activite}</h2>
                    <p className="text-sm text-gray-500">
                        {t('feedback.count', { n: nbDebriefs, m: nbReponses })}
                    </p>
                </div>

                <div className="space-y-4">
                    {affirmationsWithReponses.map((affirmation, index) => {
                        const response = reponses[affirmation.id];
                        const debrief = debriefs[affirmation.id];
                        const displayAnswer = getDisplayAnswer(affirmation, response);

                        return (
                            <div key={affirmation.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <div className="flex items-start justify-between mb-3">
                                    <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                                        {t('common.affirmation')} {index + 1}
                                    </span>
                                    {debrief ? (
                                        <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                            <CheckCircle className="h-3 w-3" />
                                            {t('feedback.feedbackReceived')}
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                                            <Clock className="h-3 w-3" />
                                            {t('feedback.pending')}
                                        </span>
                                    )}
                                </div>

                                <p className="text-gray-800 font-medium mb-4">{affirmation.affirmation}</p>

                                <div className="bg-gray-50 rounded-lg p-4 mb-3">
                                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">{t('feedback.yourAnswer')}</p>
                                    <p className="text-blue-700 font-semibold">{displayAnswer}</p>
                                    {response?.justification && (
                                        <p className="text-sm text-gray-600 mt-2 italic">&quot;{response.justification}&quot;</p>
                                    )}
                                </div>

                                {debrief ? (
                                    <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4">
                                        <p className="text-xs text-blue-600 uppercase font-semibold mb-1">{t('feedback.supervisorFeedback')}</p>
                                        <p className="text-gray-800 whitespace-pre-wrap">{debrief.feedback}</p>
                                    </div>
                                ) : (
                                    <div className="bg-amber-50 border-l-4 border-amber-300 rounded-lg p-4">
                                        <p className="text-sm text-amber-700">{t('feedback.noFeedbackYet')}</p>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {affirmationsWithReponses.length === 0 && (
                        <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-500">
                            {t('feedback.noResponses')}
                        </div>
                    )}
                </div>

                <div className="mt-6 flex justify-center">
                    <Button
                        onClick={() => router.push(`/etudiant/activite?code=${encodeURIComponent(activityCode || '')}`)}
                        variant="outline"
                        className="px-6"
                    >
                        {t('feedback.backToActivity')}
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default function FeedbackEtudiantWrapper() {
  return <Suspense><FeedbackEtudiant /></Suspense>;
}
