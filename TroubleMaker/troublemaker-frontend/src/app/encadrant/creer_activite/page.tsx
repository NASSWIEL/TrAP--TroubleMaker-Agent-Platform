"use client";

import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import axios from "axios"; // Import axios

// API Base URL (adjust if necessary)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// 🔹 Define interface for Affirmation data from API
interface Affirmation {
  id: number;
  affirmation: string; // Le texte de l'affirmation renvoyé par l'API
  is_correct_vf?: boolean; // L'API renvoie is_correct_vf, pas isCorrect
  explication?: string; // L'API renvoie explication pour le feedback
  // Autres propriétés de l'API
  nbr_reponses?: number;
  option_1?: string;
  option_2?: string;
  option_3?: string;
  option_4?: string;
  reponse_correcte_qcm?: number;
}

// 🔹 Define interface for Category data from API
interface Categorie {
  id: number;
  nom: string;
}

// Define form state interface for persistence
interface FormState {
  activityTitle: string;
  activityCode: string;
  publicPresentation: string;
  description: string;
  responseCount: number;
  isDebriefAuto: boolean;
  emailList: string;
  isReady: boolean;
  learnerType: string;
  training: string;
  selectedCategoryId: number | null;
  newCategoryName: string;
  formationInput: string;
  selectedAffirmations: Affirmation[];
  searchQuery: string;
}

const FORM_STORAGE_KEY = 'activity-form-data';

// Custom hook for form persistence
const usePersistedFormState = () => {
  const [formState, setFormState] = useState<FormState>({
    activityTitle: "",
    activityCode: "",
    publicPresentation: "",
    description: "",
    responseCount: 2,
    isDebriefAuto: false,
    emailList: "",
    isReady: false,
    learnerType: "interne",
    training: "",
    selectedCategoryId: null,
    newCategoryName: "",
    formationInput: "",
    selectedAffirmations: [],
    searchQuery: "",
  });

  // Load form state from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedData = localStorage.getItem(FORM_STORAGE_KEY);
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          setFormState(prevState => ({ ...prevState, ...parsedData }));
        }
      } catch (error) {
        console.error('Error loading form data from localStorage:', error);
      }
    }
  }, []);

  // Save form state to localStorage whenever it changes
  const saveFormState = (newState: Partial<FormState>) => {
    if (typeof window !== 'undefined') {
      try {
        const updatedState = { ...formState, ...newState };
        setFormState(updatedState);
        localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(updatedState));
      } catch (error) {
        console.error('Error saving form data to localStorage:', error);
      }
    }
  };

  // Clear form state from localStorage
  const clearFormState = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(FORM_STORAGE_KEY);
      setFormState({
        activityTitle: "",
        activityCode: "",
        publicPresentation: "",
        description: "",
        responseCount: 2,
        isDebriefAuto: false,
        emailList: "",
        isReady: false,
        learnerType: "interne",
        training: "",
        selectedCategoryId: null,
        newCategoryName: "",
        formationInput: "",
        selectedAffirmations: [],
        searchQuery: "",
      });
    }
  };

  return { formState, saveFormState, clearFormState };
};

const GererActivites = () => {
  const router = useRouter(); // Initialize router
  const { formState, saveFormState, clearFormState } = usePersistedFormState();
  
  // Individual state variables for easier component logic
  const [activityTitle, setActivityTitle] = useState(formState.activityTitle);
  const [activityCode, setActivityCode] = useState(formState.activityCode);
  const [publicPresentation, setPublicPresentation] = useState(formState.publicPresentation);
  const [description, setDescription] = useState(formState.description);
  const [responseCount, setResponseCount] = useState(formState.responseCount);
  const [isDebriefAuto, setIsDebriefAuto] = useState(formState.isDebriefAuto);
  const [emailList, setEmailList] = useState(formState.emailList);
  const [isReady, setIsReady] = useState(formState.isReady);
  const [learnerType, setLearnerType] = useState(formState.learnerType);
  const [training, setTraining] = useState(formState.training);
  const [selectedAffirmations, setSelectedAffirmations] = useState<Affirmation[]>(formState.selectedAffirmations);
  const [searchQuery, setSearchQuery] = useState(formState.searchQuery);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(formState.selectedCategoryId);
  const [newCategoryName, setNewCategoryName] = useState(formState.newCategoryName);

  // Update individual states when formState changes (for initial load)
  useEffect(() => {
    setActivityTitle(formState.activityTitle);
    setActivityCode(formState.activityCode);
    setPublicPresentation(formState.publicPresentation);
    setDescription(formState.description);
    setResponseCount(formState.responseCount);
    setIsDebriefAuto(formState.isDebriefAuto);
    setEmailList(formState.emailList);
    setIsReady(formState.isReady);
    setLearnerType(formState.learnerType);
    setTraining(formState.training);
    setSelectedAffirmations(formState.selectedAffirmations);
    setSearchQuery(formState.searchQuery);
    setSelectedCategoryId(formState.selectedCategoryId);
    setNewCategoryName(formState.newCategoryName);
    setFormationInput(formState.formationInput);
  }, [formState]);

  // Wrapper functions to update state and persist to localStorage
  const updateActivityTitle = (value: string) => {
    setActivityTitle(value);
    saveFormState({ activityTitle: value });
  };

  const updateActivityCode = (value: string) => {
    // Only allow alphanumeric characters, limit to 8 characters and convert to uppercase
    const sanitizedValue = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 8);
    setActivityCode(sanitizedValue);
    saveFormState({ activityCode: sanitizedValue });
  };

  const updatePublicPresentation = (value: string) => {
    setPublicPresentation(value);
    saveFormState({ publicPresentation: value });
  };

  const updateDescription = (value: string) => {
    setDescription(value);
    saveFormState({ description: value });
  };

  const updateResponseCount = (value: number) => {
    setResponseCount(value);
    saveFormState({ responseCount: value });
  };

  const updateIsDebriefAuto = (value: boolean) => {
    setIsDebriefAuto(value);
    saveFormState({ isDebriefAuto: value });
  };

  const updateEmailList = (value: string) => {
    setEmailList(value);
    saveFormState({ emailList: value });
  };

  const updateLearnerType = (value: string) => {
    setLearnerType(value);
    saveFormState({ learnerType: value });
  };

  const updateTraining = (value: string) => {
    setTraining(value);
    saveFormState({ training: value });
  };

  const updateSearchQuery = (value: string) => {
    setSearchQuery(value);
    saveFormState({ searchQuery: value });
  };

  const updateSelectedCategoryId = (value: number | null) => {
    setSelectedCategoryId(value);
    saveFormState({ selectedCategoryId: value });
  };

  const updateNewCategoryName = (value: string) => {
    setNewCategoryName(value);
    saveFormState({ newCategoryName: value });
  };

  // State for the searchable formation input
  const [formationInput, setFormationInput] = useState(formState.formationInput);
  const [showFormationDropdown, setShowFormationDropdown] = useState(false);
  const [filteredCategories, setFilteredCategories] = useState<Categorie[]>([]);

  // Update formation input and filter categories
  const updateFormationInput = (value: string) => {
    setFormationInput(value);
    
    // Filter existing categories based on input
    const filtered = categories.filter(cat => 
      cat.nom.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredCategories(filtered);
    
    // Show dropdown if there's input and matches
    setShowFormationDropdown(value.length > 0);
    
    // Check if input exactly matches an existing category
    const exactMatch = categories.find(cat => 
      cat.nom.toLowerCase() === value.toLowerCase()
    );
    
    if (exactMatch) {
      setSelectedCategoryId(exactMatch.id);
      setNewCategoryName('');
    } else {
      setSelectedCategoryId(null);
      setNewCategoryName(value);
    }
    
    saveFormState({ 
      formationInput: value,
      selectedCategoryId: exactMatch ? exactMatch.id : null,
      newCategoryName: exactMatch ? '' : value
    });
  };

  // Handle category selection from dropdown
  const selectCategory = (category: Categorie) => {
    setFormationInput(category.nom);
    setSelectedCategoryId(category.id);
    setNewCategoryName('');
    setShowFormationDropdown(false);
    saveFormState({ 
      formationInput: category.nom,
      selectedCategoryId: category.id,
      newCategoryName: ''
    });
  };

  const [error, setError] = useState<string | null>(null); // State for error messages
  
  // États pour l'édition d'affirmations
  const [editingAffirmation, setEditingAffirmation] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [editExplication, setEditExplication] = useState("");
  const [loading, setLoading] = useState(false); // State for loading indicator
  const [isSubmitting, setIsSubmitting] = useState(false); // State to prevent double submission
  const [showRestoredMessage, setShowRestoredMessage] = useState(false); // Show data restored message

  // Check if we restored data from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedData = localStorage.getItem(FORM_STORAGE_KEY);
      if (savedData && (activityTitle || activityCode || publicPresentation || description || emailList || training || selectedAffirmations.length > 0)) {
        setShowRestoredMessage(true);
        // Hide the message after 5 seconds
        const timer = setTimeout(() => setShowRestoredMessage(false), 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [activityTitle, activityCode, publicPresentation, description, emailList, training, selectedAffirmations]);

  // State for affirmations fetched from the database
  const [dbAffirmations, setDbAffirmations] = useState<Affirmation[]>([]);
  const [loadingAffirmations, setLoadingAffirmations] = useState(true);

  // State for categories fetched from the database
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Fetch affirmations from API on component mount and sort them
  useEffect(() => {
    const fetchAffirmations = async () => {
      setLoadingAffirmations(true);
      setError(null);
      try {
        const response = await axios.get<Affirmation[]>(`${API_BASE_URL}/api/affirmations/`, {
          withCredentials: true, // Important for authentication
        });
        if (response.status === 200 && Array.isArray(response.data)) {
          // --- SORTING ADDED HERE --- 
          // Sort by ID descending (newest first)
          const sortedData = [...response.data].sort((a, b) => b.id - a.id);
          
          // Filter out affirmations that are already selected
          const selectedIds = selectedAffirmations.map(aff => aff.id);
          const filteredData = sortedData.filter(aff => !selectedIds.includes(aff.id));
          
          setDbAffirmations(filteredData);
        } else {
          setError("Erreur lors de la récupération des affirmations.");
          setDbAffirmations([]);
        }
      } catch (err: unknown) {
        console.error("Error fetching affirmations:", err);
        if (axios.isAxiosError(err) && err.response?.status === 403) {
          setError("Accès non autorisé pour récupérer les affirmations.");
        } else {
          setError("Impossible de charger les affirmations depuis la base de données.");
        }
        setDbAffirmations([]);
      } finally {
        setLoadingAffirmations(false);
      }
    };

    fetchAffirmations();
  }, [selectedAffirmations]); // Re-run when selectedAffirmations change

  // Fetch categories from API on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true);
      try {
        const response = await axios.get<Categorie[]>(`${API_BASE_URL}/api/categories/`, {
          withCredentials: true,
        });
        if (response.status === 200 && Array.isArray(response.data)) {
          setCategories(response.data);
        } else {
          console.error("Erreur lors de la récupération des catégories.");
          setCategories([]);
        }
      } catch (err: unknown) {
        console.error("Error fetching categories:", err);
        setCategories([]);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  // Initialize formation input from persisted state
  useEffect(() => {
    if (selectedCategoryId && categories.length > 0) {
      const category = categories.find(cat => cat.id === selectedCategoryId);
      if (category) {
        setFormationInput(category.nom);
      }
    } else if (newCategoryName) {
      setFormationInput(newCategoryName);
    }
  }, [categories, selectedCategoryId, newCategoryName]);

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
    setEditText(affirmation.affirmation);
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
      const response = await fetch(`${API_BASE_URL}/api/affirmations/${affirmationId}/`, {
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
      setDbAffirmations(prev => prev.map(aff => 
        aff.id === affirmationId 
          ? { ...aff, affirmation: updatedAffirmation.affirmation, explication: updatedAffirmation.explication }
          : aff
      ));
      
      setSelectedAffirmations(prev => prev.map(aff => 
        aff.id === affirmationId 
          ? { ...aff, affirmation: updatedAffirmation.affirmation, explication: updatedAffirmation.explication }
          : aff
      ));

      // Mettre à jour le formulaire persisté
      const updatedSelected = selectedAffirmations.map(aff => 
        aff.id === affirmationId 
          ? { ...aff, affirmation: updatedAffirmation.affirmation, explication: updatedAffirmation.explication }
          : aff
      );
      saveFormState({ selectedAffirmations: updatedSelected });

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
      const response = await fetch(`${API_BASE_URL}/api/affirmations/${affirmationId}/`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: `Erreur ${response.status}` }));
        throw new Error(`Échec de la suppression: ${response.status} - ${errorData.detail || JSON.stringify(errorData)}`);
      }

      // Retirer l'affirmation des listes
      setDbAffirmations(prev => prev.filter(aff => aff.id !== affirmationId));
      setSelectedAffirmations(prev => {
        const updated = prev.filter(aff => aff.id !== affirmationId);
        saveFormState({ selectedAffirmations: updated });
        return updated;
      });

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
      const response = await fetch(`${API_BASE_URL}/api/affirmations/${affirmationId}/`, {
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
      setDbAffirmations(prev => prev.map(aff => 
        aff.id === affirmationId 
          ? { ...aff, is_correct_vf: updatedAffirmation.is_correct_vf }
          : aff
      ));
      
      setSelectedAffirmations(prev => {
        const updated = prev.map(aff => 
          aff.id === affirmationId 
            ? { ...aff, is_correct_vf: updatedAffirmation.is_correct_vf }
            : aff
        );
        saveFormState({ selectedAffirmations: updated });
        return updated;
      });

      alert(`Affirmation marquée comme ${statusText} avec succès !`);
    } catch (error) {
      console.error("Erreur lors de la modification du statut de l'affirmation:", error);
      alert(`Erreur lors de la modification: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  };

  const handleDeleteActivity = () => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette activité ?")) {
      setActivityTitle("");
      setActivityCode("");
      setPublicPresentation("");
      setDescription("");
      setResponseCount(2);
      setIsDebriefAuto(false);
      setEmailList("");
      setIsReady(false);
      setLearnerType("interne");
      setTraining("");
      setSelectedCategoryId(null);
      setNewCategoryName("");
      setSelectedAffirmations([]);
      setSearchQuery("");
      // Clear persisted data
      clearFormState();
    }
  };

  const handleSubmit = async () => { // Make the function async
    if (isSubmitting) return; // Prevent double clicks
    setIsSubmitting(true);
    setError(null); // Reset error before new submission

    // Basic validation (can be expanded)
    if (!activityTitle || !activityCode) {
      setError("Le titre et le code de l'activité sont obligatoires.");
      setIsSubmitting(false);
      return;
    }

    if (activityCode.length > 8) {
      setError("Le code de l'activité ne peut pas dépasser 8 caractères.");
      setIsSubmitting(false);
      return;
    }

    if (!/^[A-Z0-9]+$/.test(activityCode)) {
      setError("Le code de l'activité ne peut contenir que des lettres majuscules et des chiffres.");
      setIsSubmitting(false);
      return;
    }

    // Validate category input - require formation input
    if (!formationInput.trim()) {
      setError("Veuillez saisir une formation.");
      setIsSubmitting(false);
      return;
    }

    let categoryIdToUse = selectedCategoryId;

    // Create new category if newCategoryName is provided
    if (newCategoryName.trim()) {
      try {
        const categoryResponse = await axios.post(`${API_BASE_URL}/api/categories/`, 
          { nom: newCategoryName.trim() }, 
          { withCredentials: true }
        );
        if (categoryResponse.status === 201) {
          categoryIdToUse = categoryResponse.data.id;
          console.log("New category created:", categoryResponse.data);
        } else {
          throw new Error(`Échec de la création de catégorie: ${categoryResponse.status}`);
        }
      } catch (err: unknown) {
        console.error("Error creating category:", err);
        let errorMessage = "Erreur lors de la création de la nouvelle formation.";
        if (axios.isAxiosError(err) && err.response) {
          const backendError = err.response.data;
          if (backendError.nom && Array.isArray(backendError.nom)) {
            errorMessage = `Formation: ${backendError.nom.join(', ')}`;
          } else if (backendError.detail) {
            errorMessage = backendError.detail;
          }
        }
        setError(errorMessage);
        setIsSubmitting(false);
        return;
      }
    }

    const activityData = {
      titre: activityTitle,
      code_activite: activityCode.toUpperCase(), // Ensure code is uppercase like in the backend
      presentation_publique: publicPresentation,
      description: description,
      type_affirmation_requise: responseCount, // Send the response type instead of degre_veracite
      type_apprenant: learnerType, // Send the learner type
      // Include associated affirmations IDs for backend
      affirmations_associes_ids: selectedAffirmations.map(a => a.id),
      // Send the email list to backend for student user creation
      etudiants_emails: emailList.trim(),
      // Send the category ID (either existing or newly created)
      destine_a_id: categoryIdToUse,
    };

    console.log("Submitting Activity Data:", activityData);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/activites/`, activityData, {
        withCredentials: true, // Important for authentication
      });

      if (response.status === 201) { // Check for successful creation status
        console.log("Activity Submitted Successfully:", response.data);
        alert("Activité enregistrée avec succès !");
        // Clear the form data from localStorage after successful submission
        clearFormState();
        router.push('/encadrant/liste_activite'); // Redirect to the list page
      } else {
        // Handle unexpected success status codes if necessary
        console.error("Unexpected success status:", response.status, response.data);
        setError(`Erreur inattendue lors de l'enregistrement (${response.status}).`);
      }
    } catch (err: unknown) {
      console.error("Error submitting activity:", err);
      let errorMessage = "Erreur lors de l'enregistrement de l'activité.";
      if (axios.isAxiosError(err) && err.response) {
        // Try to get specific error details from backend response
        const backendError = err.response.data;
        if (typeof backendError === 'object' && backendError !== null) {
          // Handle specific field errors
          if (backendError.code_activite) {
            const codeErrors = Array.isArray(backendError.code_activite) 
              ? backendError.code_activite.join(', ') 
              : backendError.code_activite;
            errorMessage = `Code d'activité: ${codeErrors}`;
          } else {
            // Extract other field errors if available
            const fieldErrors = Object.entries(backendError)
              .map(([key, value]) => {
                const fieldName = key === 'titre' ? 'Titre' : 
                                 key === 'description' ? 'Description' :
                                 key === 'presentation_publique' ? 'Présentation publique' :
                                 key;
                return `${fieldName}: ${Array.isArray(value) ? value.join(', ') : value}`;
              })
              .join('; ');
            if (fieldErrors) {
              errorMessage = fieldErrors;
            } else if (backendError.detail) {
              errorMessage = backendError.detail;
            }
          }
        } else if (typeof backendError === 'string') {
          errorMessage = backendError;
        }
      }
      setError(errorMessage);
    } finally {
      setIsSubmitting(false); // Re-enable button after request finishes
    }
  };

  const handleLaunchActivity = () => {
    alert("Activité lancée !");
  };

  const handleDragStart = (event: React.DragEvent, affirmation: Affirmation, source: 'database' | 'selected') => {
    event.dataTransfer.setData(
      "text/plain",
      JSON.stringify({ affirmation, source })
    );
  };

  const handleDrop = (event: React.DragEvent, destination: 'database' | 'selected') => {
    event.preventDefault();
    const { affirmation, source } = JSON.parse(event.dataTransfer.getData("text/plain")) as { affirmation: Affirmation, source: 'database' | 'selected' };

    if (source === destination) return;

    if (destination === "selected") {
      // Move from database list to selected list
      setDbAffirmations((prev) => prev.filter((item) => item.id !== affirmation.id));
      const newSelectedAffirmations = [...selectedAffirmations, affirmation];
      setSelectedAffirmations(newSelectedAffirmations);
      // Save to localStorage
      saveFormState({ selectedAffirmations: newSelectedAffirmations });
    } else if (destination === "database") {
      // Move from selected list back to database list
      const newSelectedAffirmations = selectedAffirmations.filter((item) => item.id !== affirmation.id);
      setSelectedAffirmations(newSelectedAffirmations);
      // Add it back to the available list, preserving the sort order (newest first)
      setDbAffirmations((prev) => [...prev, affirmation].sort((a, b) => b.id - a.id));
      // Save to localStorage
      saveFormState({ selectedAffirmations: newSelectedAffirmations });
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  // Filter the affirmations available in the database list based on the affirmation text
  // Note: This filter is applied *after* the initial sort
  const filteredDbAffirmations = dbAffirmations.filter((affirmation) =>
    affirmation.affirmation.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Function to navigate to the generate page with activity code
  const navigateToGeneratePage = () => {
    const code = activityCode.trim().toUpperCase();
    if (!code) {
      alert("Veuillez entrer un code d'activité avant de générer des affirmations.");
      return;
    }
    const url = `/encadrant/generer?activity_code=${encodeURIComponent(code)}`;
    router.push(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-4 md:p-8">
      {/* Titre de la page */}
      <header className="bg-white shadow-md p-4 mb-6 flex justify-between items-center">
        {/* Bouton retour au menu principal */}
        <button
          onClick={() => router.push('/encadrant/liste_activite')}
          className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-md transition-colors duration-200 flex items-center space-x-2"
        >
          <span>←</span>
          <span>Menu Principal</span>
        </button>
        
        <h1 className="text-4xl font-bold text-gray-800">Créer une Activité</h1>
        
        {/* Form auto-save indicator */}
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm text-gray-600">Sauvegarde automatique</span>
        </div>
      </header>

      <div className="space-y-6">
        {/* Display success message for restored data */}
        {showRestoredMessage && (
          <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded relative mb-4" role="alert">
            <strong className="font-bold">Données restaurées !</strong>
            <span className="block sm:inline"> Vos données précédentes ont été restaurées automatiquement.</span>
            <button
              className="absolute top-0 bottom-0 right-0 px-4 py-3"
              onClick={() => setShowRestoredMessage(false)}
            >
              <span className="sr-only">Fermer</span>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
              </svg>
            </button>
          </div>
        )}

        {/* Display error message if any */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <strong className="font-bold">Erreur !</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        )}

        {/* First Row - Activity Details */}
        <div className="bg-white shadow-md p-4 md:p-6 rounded-lg">
          <header className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800 flex justify-center">Détails de l'activité</h2>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* First Column - Basic Information */}
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2 text-lg">Type d'apprenant :</label>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2 text-lg">
                    <input
                      type="radio"
                      name="learnerType"
                      value="interne"
                      checked={learnerType === "interne"}
                      onChange={(e) => updateLearnerType(e.target.value)}
                      className="w-4 h-4"
                    />
                    <span>Interne</span>
                  </label>
                  <label className="flex items-center space-x-2 text-lg">
                    <input
                      type="radio"
                      name="learnerType"
                      value="externe"
                      checked={learnerType === "externe"}
                      onChange={(e) => updateLearnerType(e.target.value)}
                      className="w-4 h-4"
                    />
                    <span>Externe</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2 text-lg">Formation concernée :</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Tapez pour rechercher ou créer une formation..."
                    className="w-full px-4 py-2 text-base md:text-lg border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formationInput}
                    onChange={(e) => updateFormationInput(e.target.value)}
                    onFocus={() => setShowFormationDropdown(formationInput.length > 0)}
                    onBlur={() => {
                      // Delay hiding dropdown to allow clicks on dropdown items
                      setTimeout(() => setShowFormationDropdown(false), 200);
                    }}
                  />
                  
                  {/* Dropdown with filtered categories */}
                  {showFormationDropdown && filteredCategories.length > 0 && (
                    <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1 max-h-48 overflow-y-auto">
                      {filteredCategories.map((category) => (
                        <div
                          key={category.id}
                          className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-base"
                          onClick={() => selectCategory(category)}
                        >
                          {category.nom}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Status indicator */}
                  <div className="mt-1 text-sm">
                    {selectedCategoryId ? (
                      <span className="text-green-600">✓ Formation existante sélectionnée</span>
                    ) : formationInput.trim() ? (
                      <span className="text-blue-600">💡 Nouvelle formation sera créée</span>
                    ) : null}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2 text-lg">Titre de l'activité :</label>
                <input
                  type="text"
                  placeholder="Entrez le titre de l'activité"
                  className="w-full px-4 py-2 text-lg border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={activityTitle}
                  onChange={(e) => updateActivityTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2 text-lg">
                  Code de l'activité :
                  <span className="text-sm text-gray-500 font-normal ml-2">(max 8 caractères, A-Z et 0-9 seulement)</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Ex: MED01ABC"
                    className="w-full px-4 py-2 text-lg border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase tracking-wider"
                    value={activityCode}
                    onChange={(e) => updateActivityCode(e.target.value)}
                    maxLength={8}
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                    {activityCode.length}/8
                  </div>
                </div>
                {activityCode.length === 8 && (
                  <p className="text-sm text-orange-600 mt-1">✓ Limite de caractères atteinte</p>
                )}
                {activityCode.length > 0 && activityCode.length < 3 && (
                  <p className="text-sm text-blue-600 mt-1">💡 Conseil: Utilisez 3-5 caractères pour un code plus facilement mémorisable</p>
                )}
              </div>
            </div>

            {/* Second Column - Activity Configuration */}
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
                    <input
                      type="radio"
                      name="responseCount"
                      value={2}
                      checked={responseCount === 2}
                      onChange={() => updateResponseCount(2)}
                      className="w-4 h-4"
                    />
                    <span>Binaire (Vrai / Faux) - Les étudiants répondent par Vrai ou Faux</span>
                  </label>
                  <label className="flex items-center space-x-2 text-lg">
                    <input
                      type="radio"
                      name="responseCount"
                      value={4}
                      checked={responseCount === 4}
                      onChange={() => updateResponseCount(4)}
                      className="w-4 h-4"
                    />
                    <span>Gradué (4 niveaux) - Les étudiants choisissent leur degré de certitude</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2 text-lg">Type de feedback :</label>
                <div className="flex flex-col space-y-2">
                  <label className="flex items-center space-x-2 text-lg">
                    <input
                      type="radio"
                      name="debriefType"
                      value="false"
                      checked={!isDebriefAuto}
                      onChange={() => updateIsDebriefAuto(false)}
                      className="w-4 h-4"
                    />
                    <span>Manuel</span>
                  </label>
                  <label className="flex items-center space-x-2 text-lg">
                    <input
                      type="radio"
                      name="debriefType"
                      value="true"
                      checked={isDebriefAuto}
                      onChange={() => updateIsDebriefAuto(true)}
                      className="w-4 h-4"
                    />
                    <span>Automatique</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2 text-lg">Liste d'emails autorisés :</label>
                <textarea
                  placeholder="Entrez une liste d'emails séparés par des virgules"
                  className="w-full px-4 py-2 text-lg border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  value={emailList}
                  onChange={(e) => updateEmailList(e.target.value)}
                />
              </div>
            </div>

            {/* Third Column - Descriptions */}
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2 text-lg">Présentation publique :</label>
                <textarea
                  placeholder="Entrez la présentation publique visible par les étudiants"
                  className="w-full px-4 py-2 text-lg border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  value={publicPresentation}
                  onChange={(e) => updatePublicPresentation(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2 text-lg">Description (encadrant) :</label>
                <textarea
                  placeholder="Entrez la description interne visible par l'encadrant"
                  className="w-full px-4 py-2 text-lg border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  value={description}
                  onChange={(e) => updateDescription(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Second Row - Affirmations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Selected Affirmations */}
          <div
            className="bg-white shadow-md p-4 md:p-6 rounded-lg min-h-[400px] border-dashed border-2 border-gray-300"
            onDragOver={handleDragOver}
            onDrop={(event) => handleDrop(event, "selected")}
          >
            <h2 className="text-3xl font-bold mb-6 flex justify-center">Affirmations sélectionnées ({selectedAffirmations.length})</h2>
            {selectedAffirmations.length === 0 && (
              <p className="text-gray-500 text-center mt-10">Glissez des affirmations ici.</p>
            )}
            <ul className="space-y-2">
              {selectedAffirmations.map((affirmation) => (
                <li
                  key={`selected-${affirmation.id}`}
                  className={`p-4 rounded shadow-sm text-xl flex flex-col gap-3
                    ${affirmation.is_correct_vf ? 'bg-green-50' : 'bg-red-50'}`}
                >
                  {editingAffirmation === affirmation.id ? (
                    // Mode édition
                    <div className="space-y-3">
                      <textarea
                        className="w-full p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 text-xl"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        rows={3}
                        placeholder="Texte de l'affirmation..."
                      />
                      <textarea
                        className="w-full p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 text-lg"
                        value={editExplication}
                        onChange={(e) => setEditExplication(e.target.value)}
                        rows={2}
                        placeholder="Explication (optionnelle)..."
                      />
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => saveAffirmationChanges(affirmation.id)}
                          className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center gap-2 text-lg"
                        >
                          <Check size={18} /> Sauvegarder
                        </button>
                        <button
                          onClick={cancelEditingAffirmation}
                          className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 flex items-center gap-2 text-lg"
                        >
                          <X size={18} /> Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Mode affichage normal
                    <>
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <span 
                            className="cursor-move block"
                            draggable
                            onDragStart={(event) => handleDragStart(event, affirmation, "selected")}
                          >
                            {affirmation.affirmation}
                          </span>
                          {affirmation.explication && (
                            <p className="text-lg text-gray-600 mt-2 italic">
                              Explication: {affirmation.explication}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {affirmation.explication && (
                            <div className="relative group">
                              <img src="/auto.svg" alt="Auto Feedback" className="w-8 h-8 text-blue-500"/>
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden w-max px-3 py-2 bg-gray-800 text-white text-sm rounded-md shadow-lg group-hover:block z-10">
                                Feedback automatique
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 mt-3">
                        <button
                          onClick={() => startEditingAffirmation(affirmation)}
                          className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center gap-2 text-lg"
                          title="Modifier l'affirmation"
                        >
                          <Edit2 size={16} /> Modifier
                        </button>
                        <button
                          onClick={() => toggleAffirmationTruth(affirmation.id, affirmation)}
                          className={`px-3 py-2 rounded-md flex items-center gap-2 text-lg text-white
                            ${getAffirmationButtonColor(affirmation)}`}
                          title={getAffirmationButtonTitle(affirmation)}
                        >
                          <Check size={16} /> 
                          {getAffirmationButtonText(affirmation)}
                        </button>
                        <button
                          onClick={() => deleteAffirmation(affirmation.id)}
                          className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 flex items-center gap-2 text-lg"
                          title="Supprimer l'affirmation"
                        >
                          <Trash2 size={16} /> Suppr.
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Affirmations Database */}
          <div
            className="bg-white shadow-md p-4 md:p-6 rounded-lg border-dashed border-2 border-gray-300"
            onDragOver={handleDragOver}
            onDrop={(event) => handleDrop(event, "database")}
          >
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 space-y-4 md:space-y-0">
              <h2 className="text-3xl font-bold">Base de données d'affirmations</h2>
              <button
                className="bg-blue-500 text-white px-6 py-3 rounded-md hover:bg-blue-600 flex items-center gap-2"
                onClick={navigateToGeneratePage}
                title="Générer des affirmations pour le code activité saisi"
              >
                <Plus size={20} />
                <span>Générer</span>
              </button>
            </div>

            <div className="mb-4">
              <input
                type="text"
                className="w-full p-4 border rounded text-base md:text-xl"
                placeholder="Rechercher une affirmation"
                value={searchQuery}
                onChange={(e) => updateSearchQuery(e.target.value)}
              />
            </div>

            <div className="h-[400px] overflow-y-auto">
              {loadingAffirmations ? (
                <p className="text-gray-500 text-center">Chargement des affirmations...</p>
              ) : filteredDbAffirmations.length === 0 && !searchQuery ? (
                <p className="text-gray-500 text-center">Aucune affirmation disponible dans la base de données.</p>
              ) : filteredDbAffirmations.length === 0 && searchQuery ? (
                <p className="text-gray-500 text-center">Aucune affirmation ne correspond à votre recherche.</p>
              ) : (
                <ul className="space-y-2">
                  {/* Use filteredDbAffirmations which is already sorted and filtered */}
                  {filteredDbAffirmations.map((affirmation) => (
                    <li
                      key={`db-${affirmation.id}`}
                      className={`p-4 rounded shadow-sm text-base md:text-xl flex flex-col gap-3
                        ${affirmation.is_correct_vf ? 'bg-green-50' : 'bg-red-50'}`}
                    >
                      {editingAffirmation === affirmation.id ? (
                        // Mode édition
                        <div className="space-y-3">
                          <textarea
                            className="w-full p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 text-xl"
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            rows={3}
                            placeholder="Texte de l'affirmation..."
                          />
                          <textarea
                            className="w-full p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 text-lg"
                            value={editExplication}
                            onChange={(e) => setEditExplication(e.target.value)}
                            rows={2}
                            placeholder="Explication (optionnelle)..."
                          />
                          <div className="flex justify-end gap-3">
                            <button
                              onClick={() => saveAffirmationChanges(affirmation.id)}
                              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center gap-2 text-lg"
                            >
                              <Check size={18} /> Sauvegarder
                            </button>
                            <button
                              onClick={cancelEditingAffirmation}
                              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 flex items-center gap-2 text-lg"
                            >
                              <X size={18} /> Annuler
                            </button>
                          </div>
                        </div>
                      ) : (
                        // Mode affichage normal
                        <>
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex-1">
                              <span 
                                className="cursor-move block"
                                draggable
                                onDragStart={(event) => handleDragStart(event, affirmation, "database")}
                              >
                                {affirmation.affirmation}
                              </span>
                              {affirmation.explication && (
                                <p className="text-lg text-gray-600 mt-2 italic">
                                  Explication: {affirmation.explication}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {affirmation.explication && (
                                <div className="relative group">
                                  <img src="/auto.svg" alt="Auto Feedback" className="w-8 h-8 text-blue-500"/>
                                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden w-max px-3 py-2 bg-gray-800 text-white text-sm rounded-md shadow-lg group-hover:block z-10">
                                    Feedback automatique
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex justify-end gap-2 mt-3">
                            <button
                              onClick={() => startEditingAffirmation(affirmation)}
                              className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center gap-2 text-lg"
                              title="Modifier l'affirmation"
                            >
                              <Edit2 size={16} /> Modifier
                            </button>
                            <button
                              onClick={() => toggleAffirmationTruth(affirmation.id, affirmation)}
                              className={`px-3 py-2 rounded-md flex items-center gap-2 text-lg text-white
                                ${getAffirmationButtonColor(affirmation)}`}
                              title={getAffirmationButtonTitle(affirmation)}
                            >
                              <Check size={16} /> 
                              {getAffirmationButtonText(affirmation)}
                            </button>
                            <button
                              onClick={() => deleteAffirmation(affirmation.id)}
                              className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 flex items-center gap-2 text-lg"
                              title="Supprimer l'affirmation"
                            >
                              <Trash2 size={16} /> Suppr.
                            </button>
                          </div>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Display error message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <strong className="font-bold">Erreur !</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col md:flex-row justify-end space-y-4 md:space-y-0 md:space-x-4 mt-8">
          <button
            type="button"
            className="px-6 py-3 text-lg bg-gray-500 text-white rounded-md hover:bg-gray-600 w-full md:w-auto"
            onClick={handleDeleteActivity}
            disabled={loading}
          >
            Vider le formulaire
          </button>
          <button
            type="button"
            className="px-6 py-3 text-lg bg-red-500 text-white rounded-md hover:bg-red-600 w-full md:w-auto"
            onClick={() => router.push('/encadrant/liste_activite')}
            disabled={loading}
          >
            Annuler
          </button>
          <button
            type="button"
            className="px-6 py-3 text-lg bg-blue-500 text-white rounded-md hover:bg-blue-600 w-full md:w-auto disabled:opacity-50"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GererActivites;
