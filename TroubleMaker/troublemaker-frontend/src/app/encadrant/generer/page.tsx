// TroubleMaker/troublemaker-frontend/src/app/encadrant/generer/page.tsx

"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Loader2, Pen, Settings, Eye, EyeOff, Save, AlertTriangle, ArrowLeft } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSearchParams, useRouter } from 'next/navigation';

// Interface for data returned by generate-affirmations
interface GeneratedApiAffirmation {
  affirmation: string;
  explication: string;
  is_correct_vf: boolean;
}

// Interface for data returned by make-harder
interface MakeHarderApiResponse {
    affirmation: string; // The harder affirmation text
    explanation: string; // The updated explanation
    is_correct?: boolean; // Should still be false
}

// Interface for frontend state (includes temporary ID and inferred format)
interface GeneratedAffirmation {
  id: number; // Temporary frontend ID
  text: string;
  explanation: string;
  nbr_reponses: 2; // Inferred: generate-affirmations provides Vrai/Faux
  is_correct_vf: boolean; // Should always be false from generate/make-harder
}

// Define interface for saved state
interface SavedState {
  isSaving: boolean;
  isSaved: boolean;
  error: string | null;
}

export default function GenerateAffirmationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activityCode = searchParams.get('activity_code');

  const [question, setQuestion] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [reloadingId, setReloadingId] = useState<number | null>(null);
  const [generatedAffirmations, setGeneratedAffirmations] = useState<GeneratedAffirmation[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [editExplanation, setEditExplanation] = useState("");
  const [saveStatus, setSaveStatus] = useState<Map<number, SavedState>>(new Map());
  const [visibleExplanations, setVisibleExplanations] = useState<Set<number>>(new Set());
  const [pageError, setPageError] = useState<string | null>(null);

  useEffect(() => {
    if (!activityCode) {
      setPageError("Code d'activité manquant dans l'URL. Impossible de générer des affirmations.");
    } else {
        setPageError(null);
    }
  }, [activityCode, router]);

  const updateSaveStatus = (id: number, status: Partial<SavedState>) => {
    setSaveStatus((prev) => {
      const newMap = new Map(prev);
      const currentStatus = newMap.get(id) || { isSaving: false, isSaved: false, error: null };
      newMap.set(id, { ...currentStatus, ...status });
      return newMap;
    });
  };

  const toggleExplanationVisibility = (id: number) => {
    setVisibleExplanations((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const handleGenerate = async () => {
    if (!activityCode || !question.trim()) return;

    setIsGenerating(true);
    setReloadingId(null);
    setVisibleExplanations(new Set());
    setSaveStatus(new Map());
    setGeneratedAffirmations([]);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/gemini/generate-affirmations/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ question }),
        }
      );

      if (!response.ok) {
        let errorData = { error: `Erreur API: ${response.status}` };
        try {
            const textResponse = await response.text();
            console.error("API Error Response Text:", textResponse);
            try { errorData = JSON.parse(textResponse); } catch (e) { errorData.error = textResponse; }
        } catch (e) { /* ignore */ }
        throw new Error(errorData.error || `Erreur API: ${response.status}`);
      }

      const data = await response.json();
      if (!data.affirmations || !Array.isArray(data.affirmations)) {
        console.error("Unexpected API response format:", data);
        throw new Error("Format de réponse API inattendu.");
      }

      const newAffirmations: GeneratedAffirmation[] = data.affirmations.map((item: GeneratedApiAffirmation, idx: number) => ({
        id: Date.now() + idx,
        text: item.affirmation,
        explanation: item.explication,
        nbr_reponses: 2,
        is_correct_vf: false,
      }));
      setGeneratedAffirmations(newAffirmations);

    } catch (error: any) {
      console.error('Error generating affirmations:', error);
      alert(`Erreur lors de la génération des affirmations:
${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // --- CORRECTED handleReload --- 
  const handleReload = async (affirmationId: number) => {
    const currentAffirmation = generatedAffirmations.find(aff => aff.id === affirmationId);
    if (!currentAffirmation) return;

    setReloadingId(affirmationId);
    setIsGenerating(true);
    setVisibleExplanations(prev => { const ns = new Set(prev); ns.delete(affirmationId); return ns; });
    updateSaveStatus(affirmationId, { isSaved: false, error: null });

    try {
        // Call the endpoint that returns { affirmation: "...", explanation: "..." }
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/gemini/make-harder/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            // Pass the *current* affirmation and explanation to the backend
            body: JSON.stringify({
              affirmation: currentAffirmation.text,
              explanation: currentAffirmation.explanation
            }),
            credentials: 'include',
         });

         if (!response.ok) {
             let errorData = { error: `Erreur API: ${response.status}` };
             try { errorData = await response.json(); } catch (e) { /* ignore */ }
             throw new Error(errorData.error || `Erreur API: ${response.status}`);
         }

         // Expecting { affirmation: "new text", explanation: "new explanation" }
         const data: MakeHarderApiResponse = await response.json();

         setGeneratedAffirmations((prev) =>
            prev.map((aff) =>
              aff.id === affirmationId
                ? {
                    ...aff, // Keep original id, nbr_reponses, is_correct_vf
                    // --- Use correct fields from API response --- 
                    text: data.affirmation || aff.text, // Use new text from response
                    explanation: data.explanation || aff.explanation, // Use new explanation from response
                  }
                : aff
            )
         );

    } catch (error: any) {
      console.error("Error reloading/making affirmation harder:", error);
      alert(`Erreur lors du rechargement/renforcement: ${error.message}`);
    } finally {
      setReloadingId(null);
      setIsGenerating(false);
    }
  };

  const handleDelete = (affirmationId: number) => {
    setGeneratedAffirmations((prev) => prev.filter((aff) => aff.id !== affirmationId));
    setVisibleExplanations((prev) => { const ns = new Set(prev); ns.delete(affirmationId); return ns; });
    setSaveStatus((prev) => { const nm = new Map(prev); nm.delete(affirmationId); return nm; });
  };

  const handleSaveToDb = async (affirmation: GeneratedAffirmation) => {
    if (!activityCode) {
        alert("Code d'activité manquant. Impossible de sauvegarder.");
        return;
    }

    const currentStatus = saveStatus.get(affirmation.id) || { isSaving: false, isSaved: false, error: null };
    if (currentStatus.isSaving || currentStatus.isSaved) return;

    updateSaveStatus(affirmation.id, { isSaving: true, error: null });

    try {
      const payload: any = {
        affirmation: affirmation.text,
        explication: affirmation.explanation || '',
        nbr_reponses: affirmation.nbr_reponses,
        is_correct_vf: affirmation.is_correct_vf,
        activity_code: activityCode,
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/affirmations/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(payload),
        }
      );

      const responseData = await response.json();
      if (!response.ok) {
        let errorMsg = responseData.warning || responseData.error || responseData.detail || `Erreur ${response.status}`;
        if (typeof responseData === 'object' && responseData !== null) {
            const fieldErrors = Object.entries(responseData)
                .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
                .join('; ');
             if (fieldErrors) { errorMsg = `Erreur validation: ${fieldErrors}`; }
        }
        throw new Error(errorMsg);
      }

      updateSaveStatus(affirmation.id, { isSaving: false, isSaved: true });
      if (responseData.warning) {
           alert(`Affirmation sauvegardée, mais avec un avertissement:
${responseData.warning}`);
      }

    } catch (error: any) {
      console.error('Error saving to database:', error);
      updateSaveStatus(affirmation.id, { isSaving: false, isSaved: false, error: error.message });
    }
  };

  const handleStartEdit = (affirmation: GeneratedAffirmation) => {
    setEditingId(affirmation.id);
    setEditText(affirmation.text);
    setEditExplanation(affirmation.explanation || "");
    setVisibleExplanations((prev) => new Set(prev).add(affirmation.id));
    updateSaveStatus(affirmation.id, { isSaved: false, error: null });
  };

  const handleSaveEdit = (id: number) => {
    setGeneratedAffirmations((prev) =>
      prev.map((aff) =>
        aff.id === id
          ? { ...aff, text: editText, explanation: editExplanation }
          : aff
      )
    );
    setEditingId(null);
  };

  const renderAffirmation = (affirmation: GeneratedAffirmation) => {
    const isExplanationVisible = visibleExplanations.has(affirmation.id);
    const currentSaveStatus = saveStatus.get(affirmation.id) || { isSaving: false, isSaved: false, error: null };
    // const formatDisplay = "Vrai/Faux"; // Removed this line

    return (
      <div key={affirmation.id}>
        <Card className={`p-4 text-lg mb-4 overflow-hidden ${currentSaveStatus.error ? 'border-red-500 border-2' : ''}`}>
          <div className="flex justify-between gap-4">
            <div className="flex-1 min-w-0">
              {editingId === affirmation.id ? (
                // EDITING VIEW
                <div className="space-y-4">
                   {/* <div>
                    <Label className="text-sm font-medium text-gray-500">Format: {formatDisplay} (Généré)</Label>
                   </div> */}
                   <div>
                    <Label htmlFor={`edit-text-${affirmation.id}`} className="text-xl">
                      Affirmation (Doit rester Fausse)
                    </Label>
                    <Textarea id={`edit-text-${affirmation.id}`} value={editText} onChange={(e) => setEditText(e.target.value)} className="mt-2 text-lg" rows={4}/>
                  </div>
                  <div>
                    <Label htmlFor={`edit-explanation-${affirmation.id}`} className="text-xl">Explication (Pourquoi c'est faux)</Label>
                    <Textarea id={`edit-explanation-${affirmation.id}`} value={editExplanation} onChange={(e) => setEditExplanation(e.target.value)} className="mt-2 text-lg" rows={4}/>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" className="text-lg" onClick={() => setEditingId(null)}>Annuler</Button>
                    <Button onClick={() => handleSaveEdit(affirmation.id)} className="bg-blue-500 hover:bg-blue-600 text-white text-lg">Enregistrer Modifs</Button>
                  </div>
                </div>
              ) : (
                // DISPLAY VIEW
                <>
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <p className="font-medium text-xl">Affirmation {generatedAffirmations.findIndex(a => a.id === affirmation.id) + 1}</p>
                        {/* --- REMOVED FORMAT DISPLAY SPAN --- */}
                        {/* <span className="text-sm font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{formatDisplay}</span> */}
                      </div>
                      <p className="text-gray-800 mt-1 text-lg whitespace-pre-wrap break-words">{affirmation.text}</p>
                      {affirmation.explanation && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <Button variant="link" onClick={() => toggleExplanationVisibility(affirmation.id)} className="p-0 h-auto text-sm text-blue-600 hover:text-blue-800 mb-2">
                            {isExplanationVisible ? (<><EyeOff className="inline h-4 w-4 mr-1"/> Masquer</>) : (<><Eye className="inline h-4 w-4 mr-1"/> Voir</>)} Explication
                          </Button>
                          {isExplanationVisible && (<p className="text-gray-700 mt-1 text-base whitespace-pre-wrap break-words bg-gray-50 p-3 rounded">{affirmation.explanation}</p>)}
                        </div>
                      )}
                      {currentSaveStatus.error && (<p className="text-red-600 text-sm mt-2">Erreur sauvegarde: {currentSaveStatus.error}</p>)}
                    </div>
                    {/* Action Buttons Column */}
                    <div className="flex flex-col gap-2 items-end flex-shrink-0">
                      <Button variant={currentSaveStatus.isSaved ? "default" : "secondary"} size="sm" onClick={() => handleSaveToDb(affirmation)} disabled={currentSaveStatus.isSaving || currentSaveStatus.isSaved || isGenerating || editingId === affirmation.id} className={`w-full justify-start text-left ${currentSaveStatus.isSaved ? "text-green-700" : ""}`}>
                        {currentSaveStatus.isSaving ? (<Loader2 className="h-4 w-4 mr-2 animate-spin" />) : currentSaveStatus.isSaved ? (<Save className="h-4 w-4 mr-2 text-green-700" />) : (<Save className="h-4 w-4 mr-2" />)}
                        {currentSaveStatus.isSaving ? "Sauvegarde..." : currentSaveStatus.isSaved ? "Sauvegardé" : "Sauvegarder"}
                      </Button>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleStartEdit(affirmation)} className="h-9 w-9 text-lg text-gray-600 hover:text-gray-900" title="Modifier" disabled={isGenerating || currentSaveStatus.isSaving}>
                          <Pen className="h-5 w-5" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9 text-lg text-gray-600 hover:text-gray-900" title="Options" disabled={isGenerating || currentSaveStatus.isSaving}>
                              <Settings className="h-5 w-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleDelete(affirmation.id)} className="text-lg text-red-600 focus:text-red-700 focus:bg-red-50"> Supprimer (Localement) </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <Button variant="link" onClick={() => handleReload(affirmation.id)} className="text-blue-600 hover:text-blue-800 hover:underline text-base p-0 h-auto mt-1" disabled={isGenerating || currentSaveStatus.isSaving || editingId === affirmation.id}>
                        {reloadingId === affirmation.id ? (<Loader2 className="h-4 w-4 animate-spin" />) : ("Renforcer")}
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </Card>
      </div>
    );
  };

  if (pageError) {
    return (
        <div className="min-h-screen bg-red-50 flex items-center justify-center p-8">
            <Card className="p-6 max-w-md text-center border-red-500">
                 <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                 <h1 className="text-2xl font-bold text-red-700 mb-2">Erreur</h1>
                 <p className="text-red-600 mb-4">{pageError}</p>
                 <Button onClick={() => router.back()} variant="destructive">
                     <ArrowLeft className="mr-2 h-4 w-4"/> Retour
                 </Button>
            </Card>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8 text-lg">
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-xl p-6 md:p-8">
        <div className="mb-8">
          <Button onClick={() => router.back()} variant="outline" size="sm" className="mb-4">
             <ArrowLeft className="mr-2 h-4 w-4"/> Retour à l'activité
          </Button>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800">Générer des affirmations</h1>
          <p className="text-gray-600 mt-2 text-base md:text-lg">
            Générer des affirmations pour l'activité <code className="font-mono bg-gray-200 px-1 rounded">{activityCode}</code>.
          </p>
        </div>

        {/* Generation Input Section */}
        <div className="space-y-6">
          <div className="flex flex-col gap-4">
            <div className="flex-1">
              <Label htmlFor="question" className="text-xl font-medium mb-2 block">
                Question / Sujet pour la génération
              </Label>
              <Input id="question" placeholder="Ex: Effets secondaires des statines..." value={question} onChange={(e) => setQuestion(e.target.value)} className="w-full text-base md:text-lg p-3 md:p-4"/>
            </div>
            <div className="flex items-center justify-end gap-4">
              <Button onClick={handleGenerate} className="bg-blue-600 hover:bg-blue-700 text-white text-base md:text-lg px-6 py-3 w-full sm:w-auto" disabled={isGenerating || !question.trim() || !activityCode}>
                {isGenerating && !reloadingId ? (<><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Génération...</>) : ("Générer")}
              </Button>
            </div>
          </div>

          {/* Generated Affirmations List */}
          {generatedAffirmations.length > 0 && (
            <div className="mt-8 border-t pt-6">
              <h2 className="text-2xl font-semibold mb-4">Affirmations générées ({generatedAffirmations.length})</h2>
              <div className="space-y-4">
                {generatedAffirmations.map(renderAffirmation)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
