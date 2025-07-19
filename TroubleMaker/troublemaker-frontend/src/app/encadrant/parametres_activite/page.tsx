"use client";

import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Check, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

interface Student { // Assuming a structure for student objects
  id: number;
  email: string;
  nom_complet?: string; // Or other fields your EtudiantListSerializer might provide
}

interface Categorie {
  id: number;
  nom: string;
}

interface Affirmation {
  id: number;
  text: string; 
  explication?: string;
  is_correct_vf?: boolean;
  reponse_correcte_qcm?: number;
  nbr_reponses?: number;
  hasAutoFeedback?: boolean;
}

interface Activity {
  code_activite: string;
  titre: string;
  presentation_publique: string;
  description: string;
  type_affirmation_requise: number;
  is_published: boolean;
  destine_a?: Categorie; // Catégorie liée à l'activité
  destine_a_id?: number; // ID de la catégorie pour les mises à jour
  
  etudiants_autorises?: Student[]; // Expecting array of student objects from backend
  etudiants_autorises_ids?: number[]; // For writing
  etudiants_autorises_emails?: string[]; // This was a frontend convenience, better to derive from etudiants_autorises

  affirmations_associes?: Affirmation[]; // Expecting array of full affirmation objects
  affirmations_associes_ids?: number[]; // For writing
}

const GererActivites = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activityCodeParam = searchParams.get("code");

  const [activityTitle, setActivityTitle] = useState("");
  const [currentActivityCode, setCurrentActivityCode] = useState(activityCodeParam || "");
  const [publicPresentation, setPublicPresentation] = useState("");
  const [description, setDescription] = useState("");
  const [typeAffirmationRequise, setTypeAffirmationRequise] = useState(2);
  const [isPublished, setIsPublished] = useState(false);
  const [etudiantsAutorisesEmails, setEtudiantsAutorisesEmails] = useState(""); // For the textarea display

  // États pour les catégories
  const [allCategories, setAllCategories] = useState<Categorie[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");

  // États supprimés car pas dans le modèle Django
  // const [learnerType, setLearnerType] = useState("interne");
  // const [training, setTraining] = useState(""); // For "Formation concernée"  
  // const [typeFeedback, setTypeFeedback] = useState("manuel");

  const [allAffirmations, setAllAffirmations] = useState<Affirmation[]>([]); // Affirmations available in DB (not selected)
  const [selectedAffirmations, setSelectedAffirmations] = useState<Affirmation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // États pour l'édition d'affirmations
  const [editingAffirmation, setEditingAffirmation] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [editExplication, setEditExplication] = useState("");

  const API_BASE_URL = 'http://localhost:8000/api';

  // Primary useEffect to fetch THE activity being edited
  useEffect(() => {
    if (activityCodeParam) {
      console.log(`Fetching activity for code: ${activityCodeParam}`);
      setCurrentActivityCode(activityCodeParam.toUpperCase());
      fetch(`${API_BASE_URL}/activites/${activityCodeParam.toUpperCase()}/`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      })
      .then(async (res) => {
        if (res.status === 302 || res.redirected) {
          console.error("Request was redirected. URL:", res.url);
          throw new Error(`Request redirected (status ${res.status}), check auth/CORS. URL: ${res.url}`);
        }
        if (!res.ok) {
          const errorText = await res.text().catch(() => "Could not get error text");
          console.error(`Failed to fetch activity, status: ${res.status}, body: ${errorText}`);
          throw new Error(`Failed to fetch activity: ${res.status} - ${errorText}`);
        }
        return res.json();
      })
      .then((data: Activity) => {
        console.log("Fetched activity data (MAIN useEffect):", JSON.stringify(data, null, 2));
        setActivityTitle(data.titre || "");
        setPublicPresentation(data.presentation_publique || "");
        setDescription(data.description || "");
        setTypeAffirmationRequise(data.type_affirmation_requise || 2);
        setIsPublished(data.is_published || false);
        
        // Charger la catégorie sélectionnée (Formation concernée)
        if (data.destine_a) {
          setSelectedCategoryId(data.destine_a.id);
        } else {
          setSelectedCategoryId(null);
        }

        // Handle emails from etudiants_autorises (array of student objects)
        if (data.etudiants_autorises && Array.isArray(data.etudiants_autorises)) {
          const emails = data.etudiants_autorises.map(student => student.email).filter(Boolean);
          setEtudiantsAutorisesEmails(emails.join(", "));
        } else {
          console.warn("data.etudiants_autorises not found or not an array. Emails not set.");
          setEtudiantsAutorisesEmails("");
        }

        // Directly set selected affirmations if backend sends full objects
        if (data.affirmations_associes && Array.isArray(data.affirmations_associes)) {
          // Validate and map these affirmations
           const validSelectedAffirmations = data.affirmations_associes.filter(
             aff => aff && (typeof aff.text === 'string' || typeof (aff as any).affirmation === 'string') && typeof aff.id === 'number'
           ).map(aff => ({
             id: aff.id,
             text: aff.text || (aff as any).affirmation, // Map 'affirmation' to 'text'
             explication: aff.explication,
             is_correct_vf: aff.is_correct_vf,
             reponse_correcte_qcm: aff.reponse_correcte_qcm,
             nbr_reponses: aff.nbr_reponses,
             hasAutoFeedback: aff.hasAutoFeedback
           })) as Affirmation[];
          setSelectedAffirmations(validSelectedAffirmations);
          console.log("Directly set selected affirmations:", validSelectedAffirmations.length);
        } else {
            console.warn("data.affirmations_associes not found or not an array. Selected affirmations might be empty or rely on IDs via second useEffect.");
            setSelectedAffirmations([]); // Reset if not provided directly
        }
      })
      .catch((error) => console.error("Error fetching activity data (MAIN useEffect):", error.message));
    }
  }, [activityCodeParam]); // Only activityCodeParam as it's the trigger

  // useEffect pour charger les catégories disponibles
  useEffect(() => {
    console.log("Fetching categories...");
    fetch(`${API_BASE_URL}/categories/`, { credentials: 'include' })
      .then((res) => {
        if (!res.ok) {
          console.error(`Failed to fetch categories, status: ${res.status}`);
          throw new Error(`Failed to fetch categories, status ${res.status}`);
        }
        return res.json();
      })
      .then((categories: Categorie[]) => {
        console.log("Fetched categories:", categories);
        setAllCategories(categories);
      })
      .catch((error) => console.error("Error fetching categories:", error.message));
  }, []);

  // Secondary useEffect to fetch ALL affirmations for the database list
  useEffect(() => {
    console.log("Fetching all affirmations...");
    fetch(`${API_BASE_URL}/affirmations/`, { credentials: 'include' })
      .then((res) => {
        if (!res.ok) {
          console.error(`Failed to fetch affirmations, status: ${res.status}`);
          throw new Error(`Failed to fetch ALL affirmations, status ${res.status}`);
        }
        return res.json();
      })
      .then((fetchedAffirmationsApi: any[]) => {
        console.log("Raw affirmations data from API:", fetchedAffirmationsApi);
        const validFetchedAffirmations: Affirmation[] = [];
        
        if (Array.isArray(fetchedAffirmationsApi)) {
            fetchedAffirmationsApi.forEach(aff => {
                // Map backend field 'affirmation' to frontend field 'text'
                if (aff && (typeof aff.text === 'string' || typeof (aff as any).affirmation === 'string') && typeof aff.id === 'number') {
                    const mappedAffirmation: Affirmation = {
                        id: aff.id,
                        text: aff.text || (aff as any).affirmation, // Use 'text' if available, otherwise map 'affirmation' to 'text'
                        explication: aff.explication,
                        is_correct_vf: aff.is_correct_vf,
                        reponse_correcte_qcm: aff.reponse_correcte_qcm,
                        nbr_reponses: aff.nbr_reponses,
                        hasAutoFeedback: aff.hasAutoFeedback
                    };
                    validFetchedAffirmations.push(mappedAffirmation);
                } else {
                    console.warn("Malformed affirmation object received from ALL affirmations API, discarding:", aff);
                }
            });
        } else {
            console.error("Fetched ALL affirmations is not an array:", fetchedAffirmationsApi);
        }

        console.log("Valid affirmations processed:", validFetchedAffirmations.length);
        setAllAffirmations(validFetchedAffirmations);
      })
      .catch((error) => {
        console.error("Error fetching ALL affirmations list:", error.message);
        setAllAffirmations([]); // Reset on error
      });
  }, []); // Only run once on mount

  // Fonctions utilitaires pour l'affichage des boutons d'affirmation
  const getAffirmationButtonColor = (affirmation: Affirmation) => {
    // Toutes les affirmations utilisent le système Vrai/Faux
    return affirmation.is_correct_vf ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600';
  };

  const getAffirmationButtonTitle = (affirmation: Affirmation) => {
    // Toutes les affirmations utilisent le système Vrai/Faux
    return affirmation.is_correct_vf ? "Marquer comme fausse" : "Marquer comme vraie";
  };

  const getAffirmationButtonText = (affirmation: Affirmation) => {
    // Toutes les affirmations utilisent le système Vrai/Faux
    return affirmation.is_correct_vf ? "Fausse" : "Vraie";
  };

  // Fonction pour démarrer l'édition d'une affirmation
  const startEditingAffirmation = (affirmation: Affirmation) => {
    setEditingAffirmation(affirmation.id);
    setEditText(affirmation.text);
    setEditExplication(affirmation.explication || "");
  };

  // Fonction pour annuler l'édition
  const cancelEditingAffirmation = () => {
    setEditingAffirmation(null);
    setEditText("");
    setEditExplication("");
  };

  // Fonction pour sauvegarder les modifications d'une affirmation
  const saveAffirmationChanges = async (affirmationId: number) => {
    if (!editText.trim()) {
      alert("Le texte de l'affirmation ne peut pas être vide.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/affirmations/${affirmationId}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          affirmation: editText.trim(),
          explication: editExplication.trim() || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: `Erreur ${response.status}` }));
        throw new Error(`Échec de la modification: ${response.status} - ${errorData.detail || JSON.stringify(errorData)}`);
      }

      const updatedAffirmation = await response.json();
      
      // Mettre à jour les listes d'affirmations
      setAllAffirmations(prev => prev.map(aff => 
        aff.id === affirmationId 
          ? { ...aff, text: updatedAffirmation.affirmation || updatedAffirmation.text, explication: updatedAffirmation.explication }
          : aff
      ));
      
      setSelectedAffirmations(prev => prev.map(aff => 
        aff.id === affirmationId 
          ? { ...aff, text: updatedAffirmation.affirmation || updatedAffirmation.text, explication: updatedAffirmation.explication }
          : aff
      ));

      cancelEditingAffirmation();
      alert("Affirmation modifiée avec succès !");
    } catch (error) {
      console.error("Erreur lors de la modification de l'affirmation:", error);
      alert(`Erreur lors de la modification: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  };

  // Fonction pour supprimer une affirmation
  const deleteAffirmation = async (affirmationId: number) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette affirmation ? Cette action est irréversible.")) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/affirmations/${affirmationId}/`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: `Erreur ${response.status}` }));
        throw new Error(`Échec de la suppression: ${response.status} - ${errorData.detail || JSON.stringify(errorData)}`);
      }

      // Retirer l'affirmation des listes
      setAllAffirmations(prev => prev.filter(aff => aff.id !== affirmationId));
      setSelectedAffirmations(prev => prev.filter(aff => aff.id !== affirmationId));

      alert("Affirmation supprimée avec succès !");
    } catch (error) {
      console.error("Erreur lors de la suppression de l'affirmation:", error);
      alert(`Erreur lors de la suppression: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  };

  // Fonction pour basculer le statut vrai/faux d'une affirmation
  const toggleAffirmationTruth = async (affirmationId: number, affirmation: Affirmation) => {
    // Toutes les affirmations utilisent le système Vrai/Faux
    const newStatus = !affirmation.is_correct_vf;
    const statusText = newStatus ? "vraie" : "fausse";
    
    if (!window.confirm(`Êtes-vous sûr de vouloir marquer cette affirmation comme ${statusText} ?`)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/affirmations/${affirmationId}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          is_correct_vf: newStatus,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: `Erreur ${response.status}` }));
        throw new Error(`Échec de la modification: ${response.status} - ${errorData.detail || JSON.stringify(errorData)}`);
      }

      const updatedAffirmation = await response.json();
      
      // Mettre à jour les listes d'affirmations
      setAllAffirmations(prev => prev.map(aff => 
        aff.id === affirmationId 
          ? { ...aff, is_correct_vf: updatedAffirmation.is_correct_vf }
          : aff
      ));
      
      setSelectedAffirmations(prev => prev.map(aff => 
        aff.id === affirmationId 
          ? { ...aff, is_correct_vf: updatedAffirmation.is_correct_vf }
          : aff
      ));

      alert(`Affirmation marquée comme ${statusText} avec succès !`);
    } catch (error) {
      console.error("Erreur lors de la modification du statut de l'affirmation:", error);
      alert(`Erreur lors de la modification: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  };


  const handleDeleteActivity = () => {
    if (!currentActivityCode) {
        alert("Aucun code d'activité spécifié pour la suppression.");
        return;
    }
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette activité ?")) {
      fetch(`${API_BASE_URL}/activites/${currentActivityCode}/`, { 
          method: "DELETE", 
          credentials: 'include'
      })
        .then(res => {
          if (!res.ok) {
            if(res.status === 404) throw new Error("Activité non trouvée.");
            if(res.status === 403) throw new Error("Permission refusée.");
            throw new Error(`Échec de la suppression: ${res.status}`);
          }
          alert("Activité supprimée avec succès !");
          router.push("/encadrant/liste_activite"); 
        })
        .catch(error => {
            console.error("Error deleting activity:", error.message);
            alert(`Erreur lors de la suppression: ${error.message}`);
        });
    }
  };

  const getStudentIdsFromEmails = async (emailString: string): Promise<number[]> => {
    if (!emailString.trim()) return [];
    
    try {
      const emails = emailString.split(",").map(email => email.trim()).filter(Boolean);
      if (emails.length === 0) return [];
      
      const response = await fetch(`${API_BASE_URL}/users/get_ids_by_email/`, { 
        method: 'POST', 
        body: JSON.stringify({emails}), 
        credentials: 'include', 
        headers: {'Content-Type': 'application/json'} 
      });
      
      if (!response.ok) {
        console.warn(`Failed to resolve student emails to IDs: ${response.status}`);
        return [];
      }
      
      const data = await response.json(); 
      return data.ids || []; // Assuming backend returns {ids: [1,2,3]}
    } catch (error) {
      console.error("Error resolving student emails to IDs:", error);
      return [];
    }
  };

  const handleSaveOrLaunch = async (launchIntent = false) => {
    if (!activityCodeParam && !currentActivityCode.trim() && !activityTitle.trim()) {
        alert("Le code et le titre de l'activité sont requis pour la création.");
        return;
    }
     if (!activityTitle.trim()) {
        alert("Le titre de l'activité est requis.");
        return;
    }

    // Validate category input - either select existing or create new
    if (!selectedCategoryId && !newCategoryName.trim()) {
      alert("Veuillez soit sélectionner une formation existante, soit en créer une nouvelle.");
      return;
    }

    // The UI should prevent both being set, but just in case, prioritize new category creation
    let categoryIdToUse = selectedCategoryId;

    // Create new category if newCategoryName is provided
    if (newCategoryName.trim()) {
      try {
        const categoryResponse = await fetch(`${API_BASE_URL}/categories/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ nom: newCategoryName.trim() })
        });
        
        if (categoryResponse.status === 201) {
          const newCategory = await categoryResponse.json();
          categoryIdToUse = newCategory.id;
          console.log("New category created:", newCategory);
          
          // Update the categories list to include the new category
          setAllCategories(prev => [...prev, newCategory].sort((a, b) => a.nom.localeCompare(b.nom)));
          setNewCategoryName(""); // Clear the input after successful creation
        } else {
          const errorData = await categoryResponse.json().catch(() => ({ detail: `Erreur ${categoryResponse.status}` }));
          throw new Error(`Échec de la création de catégorie: ${categoryResponse.status} - ${errorData.detail || JSON.stringify(errorData)}`);
        }
      } catch (err: unknown) {
        console.error("Error creating category:", err);
        let errorMessage = "Erreur lors de la création de la nouvelle formation.";
        if (err instanceof Error) {
          errorMessage = err.message;
        }
        alert(errorMessage);
        return;
      }
    }

    const studentIds = await getStudentIdsFromEmails(etudiantsAutorisesEmails);
    const newIsPublishedState = launchIntent ? !isPublished : isPublished;
 
    const activityDataToSave: Partial<Activity> = {
      titre: activityTitle,
      presentation_publique: publicPresentation,
      description: description,
      type_affirmation_requise: typeAffirmationRequise,
      is_published: newIsPublishedState,
      destine_a_id: categoryIdToUse || undefined, // Use the category ID (either existing or newly created)
      // Send IDs for write operations
      etudiants_autorises_ids: studentIds, 
      affirmations_associes_ids: selectedAffirmations.map(aff => aff.id),
    };

    let method = "PATCH";
    let url = `${API_BASE_URL}/activites/${currentActivityCode}/`;

    if (!activityCodeParam) { 
        method = "POST";
        url = `${API_BASE_URL}/activites/`;
        if (currentActivityCode.trim()) { 
             activityDataToSave.code_activite = currentActivityCode.trim().toUpperCase();
        } else {
            alert("Le code de l'activité est requis pour la création.");
            return;
        }
    }
    
    fetch(url, {
      method: method,
      headers: { "Content-Type": "application/json" },
      credentials: 'include',
      body: JSON.stringify(activityDataToSave),
    })
      .then(async (res) => {
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ detail: `Erreur ${res.status}`}));
          throw new Error(`Échec: ${res.status} - ${errorData.detail || JSON.stringify(errorData)}`);
        }
        return res.json();
      })
      .then((savedActivity: Activity) => {
        const actionVerb = launchIntent 
            ? (savedActivity.is_published ? 'lancée' : 'retirée de publication') 
            : (method === 'POST' ? 'créée' : 'enregistrée');
        alert(`Activité ${actionVerb} avec succès ! Code: ${savedActivity.code_activite}`);
        setIsPublished(savedActivity.is_published); 
        setCurrentActivityCode(savedActivity.code_activite);
        // If it was a new creation, update URL to reflect the new code for editing mode
        if (!activityCodeParam && method === 'POST') {
            router.replace(`/encadrant/parametres_activite?code=${savedActivity.code_activite}`);
        } else {
            // Re-fetch all affirmations to update the DB list correctly after save
            console.log("Re-fetching affirmations after save...");
            fetch(`${API_BASE_URL}/affirmations/`, { credentials: 'include' })
              .then(response => {
                if (response.ok) {
                  return response.json();
                }
                throw new Error(`Failed to re-fetch affirmations: ${response.status}`);
              })
              .then((allFetchedAffs: Affirmation[]) => {
                console.log("Re-fetched affirmations:", allFetchedAffs.length);
                const validFetchedAffs = allFetchedAffs.filter(a => a && typeof a.text === 'string' && typeof a.id === 'number');
                setAllAffirmations(validFetchedAffs);
                console.log("Updated allAffirmations after save:", validFetchedAffs.length);
              })
              .catch(error => {
                console.error("Error re-fetching affirmations after save:", error);
              });
        }
      })
      .catch(error => {
        console.error("Error saving/launching activity:", error.message);
        alert(`Erreur: ${error.message}`);
      });
  };

  const handleSubmit = () => handleSaveOrLaunch(false); 
  const handleLaunchActivity = () => handleSaveOrLaunch(true); 
  
  const handleDragStart = (event: React.DragEvent<HTMLLIElement>, affirmation: Affirmation, source: 'database' | 'selected') => {
    event.dataTransfer.setData("application/json", JSON.stringify({ affirmation, source }));
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>, destination: 'database' | 'selected') => {
    event.preventDefault();
    try {
      const { affirmation, source } = JSON.parse(event.dataTransfer.getData("application/json")) as { affirmation: Affirmation, source: 'database' | 'selected' };
      if (source === destination) return;
      
      if (destination === "selected") {
        // Remove from selected list and add to selected
        setSelectedAffirmations((prev) => [...prev, affirmation].sort((a,b) => a.id - b.id));
      } else if (destination === "database") { 
        // Remove from selected list
        setSelectedAffirmations((prev) => prev.filter((item) => item.id !== affirmation.id));
      }
    } catch (e) { 
      console.error("Error parsing dragged data:", e); 
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => event.preventDefault();

  // Filter affirmations from database (exclude already selected ones)
  const availableAffirmations = allAffirmations.filter(aff => {
    const selectedIds = selectedAffirmations.map(sa => sa.id);
    return !selectedIds.includes(aff.id);
  });

  const filteredAffirmationsFromDB = availableAffirmations.filter((affirmation) =>
    affirmation && typeof affirmation.text === 'string' && 
    affirmation.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Debug logging to understand what's happening
  console.log("Debug - All affirmations:", allAffirmations.length);
  console.log("Debug - Selected affirmations:", selectedAffirmations.length);
  console.log("Debug - Available affirmations:", availableAffirmations.length);
  console.log("Debug - Filtered affirmations:", filteredAffirmationsFromDB.length);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-4 md:p-8">
      <header className="bg-white shadow-md p-4 mb-6 flex justify-center">
        <h1 className="text-4xl font-bold text-gray-800">
          {activityCodeParam ? "Paramètres de l'Activité" : "Créer une Activité"}
        </h1>
      </header>

      <div className="space-y-6">
        <div className="bg-white shadow-md p-4 md:p-6 rounded-lg">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Détails de l'activité</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2 text-lg">Type d'apprenant :</label>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2 text-lg">
                    <input type="radio" name="learnerType" value="interne" defaultChecked className="w-4 h-4"/>
                    <span>Interne</span>
                  </label>
                  <label className="flex items-center space-x-2 text-lg">
                    <input type="radio" name="learnerType" value="externe" className="w-4 h-4"/>
                    <span>Externe</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2 text-lg">Formation concernée :</label>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Créer une nouvelle formation :</label>
                    <input
                      type="text"
                      placeholder="Nom de la nouvelle formation"
                      className="w-full px-4 py-2 text-lg border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={newCategoryName}
                      onChange={(e) => {
                        setNewCategoryName(e.target.value);
                        if (e.target.value.trim()) setSelectedCategoryId(null);
                      }}
                    />
                  </div>
                  {allCategories.length > 0 && (
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Ou sélectionner une formation existante :</label>
                      <select 
                        className="w-full px-4 py-2 text-lg border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                        value={selectedCategoryId || ""} 
                        onChange={(e) => {
                          setSelectedCategoryId(e.target.value ? parseInt(e.target.value) : null);
                          if (e.target.value) setNewCategoryName("");
                        }}
                      >
                        <option value="">Sélectionner une formation...</option>
                        {allCategories.map(category => (
                          <option key={category.id} value={category.id}>
                            {category.nom}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2 text-lg">Titre de l'activité :</label>
                <input type="text" placeholder="formation generale" className="w-full px-4 py-2 text-lg border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" value={activityTitle} onChange={(e) => setActivityTitle(e.target.value)} autoComplete="off"/>
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2 text-lg">Code de l'activité :</label>
                <input type="text" placeholder="SECU1" className={`w-full px-4 py-2 text-lg border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${activityCodeParam ? 'bg-gray-100' : ''}`} value={currentActivityCode} onChange={(e) => setCurrentActivityCode(e.target.value.toUpperCase())} readOnly={!!activityCodeParam} autoComplete="off"/>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2 text-lg">Degré de véracité :</label>
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-3">
                  <p className="text-sm text-blue-700">
                    <strong>Note :</strong> Ce paramètre détermine comment les étudiants répondront, mais les affirmations restent toujours soit vraies soit fausses.
                  </p>
                </div>
                <div className="flex flex-col space-y-2">
                  <label className="flex items-center space-x-2 text-lg">
                    <input type="radio" name="typeAffirmationRequise" value={2} checked={typeAffirmationRequise === 2} onChange={() => setTypeAffirmationRequise(2)} className="w-4 h-4"/>
                    <span>Binaire (Vrai / Faux) - Les étudiants répondent par Vrai ou Faux</span>
                  </label>
                  <label className="flex items-center space-x-2 text-lg">
                    <input type="radio" name="typeAffirmationRequise" value={4} checked={typeAffirmationRequise === 4} onChange={() => setTypeAffirmationRequise(4)} className="w-4 h-4"/>
                    <span>Gradué (4 niveaux) - Les étudiants choisissent leur degré de certitude</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2 text-lg">Liste d'emails autorisés :</label>
                <textarea placeholder="amine@gmail.com" className="w-full px-4 py-2 text-lg border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" rows={5} value={etudiantsAutorisesEmails} onChange={(e) => setEtudiantsAutorisesEmails(e.target.value)} autoComplete="off"/>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2 text-lg">Présentation publique :</label>
                <textarea placeholder="une presentation" className="w-full px-4 py-2 text-lg border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" rows={5} value={publicPresentation} onChange={(e) => setPublicPresentation(e.target.value)} autoComplete="off"/>
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2 text-lg">Description (encadrant) :</label>
                <textarea placeholder="une presentation" className="w-full px-4 py-2 text-lg border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" rows={5} value={description} onChange={(e) => setDescription(e.target.value)} autoComplete="off"/>
              </div>
               <div>
                  <label className="block text-gray-700 font-semibold mb-2 text-lg">Statut de l'activité :</label>
                  <p className={`px-4 py-2 text-lg rounded-md font-medium ${isPublished ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {isPublished ? "Publiée (Lancée)" : "Non publiée (Brouillon)"}
                  </p>
               </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div
            className="bg-white shadow-md p-4 md:p-6 rounded-lg min-h-[300px]"
            onDragOver={handleDragOver}
            onDrop={(event) => handleDrop(event, "selected")}
          >
            <h2 className="text-2xl font-bold mb-4 text-center">Affirmations sélectionnées ({selectedAffirmations.length})</h2>
            {selectedAffirmations.length === 0 && <p className="text-gray-500 text-center py-4">Glissez des affirmations ici.</p>}
            <ul className="space-y-3">
              {selectedAffirmations.map((affirmation) => (
                <li
                  key={`selected-${affirmation.id}`}
                  className={`p-3 rounded shadow-sm text-base flex flex-col gap-2
                  ${affirmation.is_correct_vf === undefined ? 'bg-gray-50' : affirmation.is_correct_vf ? 'bg-green-50' : 'bg-red-50'}`}
                >
                  {editingAffirmation === affirmation.id ? (
                    // Mode édition
                    <div className="space-y-2">
                      <textarea
                        className="w-full p-2 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        rows={3}
                        placeholder="Texte de l'affirmation..."
                      />
                      <textarea
                        className="w-full p-2 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500"
                        value={editExplication}
                        onChange={(e) => setEditExplication(e.target.value)}
                        rows={2}
                        placeholder="Explication (optionnelle)..."
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => saveAffirmationChanges(affirmation.id)}
                          className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center gap-1"
                        >
                          <Check size={16} /> Sauvegarder
                        </button>
                        <button
                          onClick={cancelEditingAffirmation}
                          className="px-3 py-1 bg-gray-500 text-white rounded-md hover:bg-gray-600 flex items-center gap-1"
                        >
                          <X size={16} /> Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Mode affichage normal
                    <>
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-1">
                          <span 
                            className="cursor-move block"
                            draggable
                            onDragStart={(event) => handleDragStart(event as any, affirmation, "selected")}
                          >
                            {affirmation.text}
                          </span>
                          {affirmation.explication && (
                            <p className="text-sm text-gray-600 mt-1 italic">
                              Explication: {affirmation.explication}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {affirmation.hasAutoFeedback && (
                            <div className="relative group">
                              <img src="/auto.svg" alt="Auto Feedback" className="w-6 h-6 text-blue-500"/>
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden w-max px-2 py-1 bg-gray-800 text-white text-xs rounded-md shadow-lg group-hover:block z-10">
                                Feedback automatique
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-end gap-1 mt-2">
                        <button
                          onClick={() => startEditingAffirmation(affirmation)}
                          className="px-2 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center gap-1 text-sm"
                          title="Modifier l'affirmation"
                        >
                          <Edit2 size={14} /> Modifier
                        </button>
                        <button
                          onClick={() => toggleAffirmationTruth(affirmation.id, affirmation)}
                          className={`px-2 py-1 rounded-md flex items-center gap-1 text-sm text-white
                            ${getAffirmationButtonColor(affirmation)}`}
                          title={getAffirmationButtonTitle(affirmation)}
                        >
                          <Check size={14} /> 
                          {getAffirmationButtonText(affirmation)}
                        </button>
                        <button
                          onClick={() => deleteAffirmation(affirmation.id)}
                          className="px-2 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 flex items-center gap-1 text-sm"
                          title="Supprimer l'affirmation"
                        >
                          <Trash2 size={14} /> Suppr.
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div
            className="bg-white shadow-md p-4 md:p-6 rounded-lg min-h-[300px]"
            onDragOver={handleDragOver}
            onDrop={(event) => handleDrop(event, "database")}
          >
            <div className="flex flex-col md:flex-row justify-between items-center mb-4 space-y-3 md:space-y-0">
              <h2 className="text-2xl font-bold">Base de données ({allAffirmations.length} total, {availableAffirmations.length} disponibles)</h2>
              <button 
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 flex items-center text-sm"
                onClick={() => {
                  if (currentActivityCode) {
                    router.push(`/encadrant/generer?activity_code=${encodeURIComponent(currentActivityCode)}`);
                  } else {
                    alert("Code d'activité manquant. Impossible de générer des affirmations.");
                  }
                }}
              >
                <Plus size={18} className="mr-1.5" /> Générer
              </button>
            </div>
            <div className="mb-3">
              <input
                type="text"
                className="w-full p-3 border border-gray-300 rounded-md text-base focus:ring-2 focus:ring-blue-500"
                placeholder="Rechercher une affirmation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoComplete="off" 
              />
            </div>
            <div className="h-[350px] overflow-y-auto border border-gray-200 rounded-md p-2 bg-gray-50/50">
             {allAffirmations.length === 0 && searchQuery === "" && (
               <div className="text-center py-4">
                 <p className="text-gray-500">Aucune affirmation disponible.</p>
                 <p className="text-sm text-gray-400 mt-2">Vérifiez votre connexion ou créez des affirmations.</p>
               </div>
             )}
             {filteredAffirmationsFromDB.length === 0 && searchQuery !== "" && (
               <p className="text-gray-500 text-center py-4">Aucune affirmation ne correspond à "{searchQuery}".</p>
             )}
             {allAffirmations.length > 0 && availableAffirmations.length === 0 && searchQuery === "" && (
               <p className="text-blue-500 text-center py-4">Toutes les affirmations sont déjà sélectionnées!</p>
             )}
              <ul className="space-y-3">
                {filteredAffirmationsFromDB.map((affirmation) => (
                  <li
                    key={`db-${affirmation.id}`}
                    className={`p-3 rounded shadow-sm text-base flex flex-col gap-2
                    ${affirmation.is_correct_vf === undefined ? 'bg-white' : affirmation.is_correct_vf ? 'bg-green-50' : 'bg-red-50'}`}
                  >
                    {editingAffirmation === affirmation.id ? (
                      // Mode édition
                      <div className="space-y-2">
                        <textarea
                          className="w-full p-2 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          rows={3}
                          placeholder="Texte de l'affirmation..."
                        />
                        <textarea
                          className="w-full p-2 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500"
                          value={editExplication}
                          onChange={(e) => setEditExplication(e.target.value)}
                          rows={2}
                          placeholder="Explication (optionnelle)..."
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => saveAffirmationChanges(affirmation.id)}
                            className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center gap-1"
                          >
                            <Check size={16} /> Sauvegarder
                          </button>
                          <button
                            onClick={cancelEditingAffirmation}
                            className="px-3 py-1 bg-gray-500 text-white rounded-md hover:bg-gray-600 flex items-center gap-1"
                          >
                            <X size={16} /> Annuler
                          </button>
                        </div>
                      </div>
                    ) : (
                      // Mode affichage normal
                      <>
                        <div className="flex justify-between items-start gap-3">
                          <div className="flex-1">
                            <span 
                              className="cursor-move block"
                              draggable
                              onDragStart={(event) => handleDragStart(event as any, affirmation, "database")}
                            >
                              {affirmation.text}
                            </span>
                            {affirmation.explication && (
                              <p className="text-sm text-gray-600 mt-1 italic">
                                Explication: {affirmation.explication}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {affirmation.hasAutoFeedback && (
                              <div className="relative group">
                                <img src="/auto.svg" alt="Auto Feedback" className="w-6 h-6 text-blue-500"/>
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden w-max px-2 py-1 bg-gray-800 text-white text-xs rounded-md shadow-lg group-hover:block z-10">
                                  Feedback automatique
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-end gap-1 mt-2">
                          <button
                            onClick={() => startEditingAffirmation(affirmation)}
                            className="px-2 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center gap-1 text-sm"
                            title="Modifier l'affirmation"
                          >
                            <Edit2 size={14} /> Modifier
                          </button>
                          <button
                            onClick={() => toggleAffirmationTruth(affirmation.id, affirmation)}
                            className={`px-2 py-1 rounded-md flex items-center gap-1 text-sm text-white
                              ${getAffirmationButtonColor(affirmation)}`}
                            title={getAffirmationButtonTitle(affirmation)}
                          >
                            <Check size={14} /> 
                            {getAffirmationButtonText(affirmation)}
                          </button>
                          <button
                            onClick={() => deleteAffirmation(affirmation.id)}
                            className="px-2 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 flex items-center gap-1 text-sm"
                            title="Supprimer l'affirmation"
                          >
                            <Trash2 size={14} /> Suppr.
                          </button>
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-end space-y-3 md:space-y-0 md:space-x-4 pt-6">
          <button
            type="button"
            className="px-6 py-3 text-lg bg-red-500 text-white rounded-md hover:bg-red-600 w-full md:w-auto disabled:opacity-60"
            onClick={handleDeleteActivity}
            disabled={!activityCodeParam}
          >
            Supprimer
          </button>
          <button
            type="button"
            className={`px-6 py-3 text-lg text-white rounded-md w-full md:w-auto disabled:opacity-60
                        ${isPublished ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-500 hover:bg-green-600'}`}
            onClick={handleLaunchActivity}
            disabled={!currentActivityCode.trim()}
          >
            {isPublished ? "Retirer la publication" : "Lancer l'activité"} 
          </button>
          <button
            type="button"
            className="px-6 py-3 text-lg bg-blue-500 text-white rounded-md hover:bg-blue-600 w-full md:w-auto disabled:opacity-60"
            onClick={handleSubmit}
            disabled={!activityTitle.trim() || (!activityCodeParam && !currentActivityCode.trim())}
          >
            {activityCodeParam ? "Enregistrer les modifications" : "Créer et Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GererActivites;
