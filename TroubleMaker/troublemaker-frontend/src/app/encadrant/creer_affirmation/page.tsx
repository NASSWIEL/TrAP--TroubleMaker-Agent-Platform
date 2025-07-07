"use client";

import React, { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import axios from "axios"; // Import axios

// API Base URL (adjust if necessary)
const API_BASE_URL = "http://localhost:8000"; 


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

const GererActivites = () => {
  const router = useRouter(); // Initialize router
  const [activityTitle, setActivityTitle] = useState(""); // Titre de l'activité
  const [activityCode, setActivityCode] = useState("");
  const [publicPresentation, setPublicPresentation] = useState("");
  const [description, setDescription] = useState("");
  const [responseCount, setResponseCount] = useState(2); // 2 réponses par défaut
  const [isDebriefAuto, setIsDebriefAuto] = useState(false); // Débrief manuel sélectionné par défaut
  const [emailList, setEmailList] = useState("");
  const [isReady, setIsReady] = useState(false);
  const [learnerType, setLearnerType] = useState("interne"); // interne or externe
  const [training, setTraining] = useState(""); // formation concernée
  const [error, setError] = useState<string | null>(null); // State for error messages
  const [loading, setLoading] = useState(false); // State for loading indicator
  const [isSubmitting, setIsSubmitting] = useState(false); // State to prevent double submission

  // State for affirmations fetched from the database
  const [dbAffirmations, setDbAffirmations] = useState<Affirmation[]>([]);
  const [loadingAffirmations, setLoadingAffirmations] = useState(true);

  // State for affirmations selected by the user
  const [selectedAffirmations, setSelectedAffirmations] = useState<Affirmation[]>([]);

  // State for search query
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch affirmations from API on component mount
  useEffect(() => {
    const fetchAffirmations = async () => {
      setLoadingAffirmations(true);
      setError(null);
      try {
        const response = await axios.get<Affirmation[]>(`${API_BASE_URL}/api/affirmations/`, {
          withCredentials: true, // Important for authentication
        });
        if (response.status === 200 && Array.isArray(response.data)) {
          setDbAffirmations(response.data);
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
  }, []); // Empty dependency array ensures this runs only once on mount

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

    const activityData = {
      titre: activityTitle,
      code_activite: activityCode.toUpperCase(), // Ensure code is uppercase like in the backend
      presentation_publique: publicPresentation,
      description: description,
      degre_veracite: responseCount, // Assuming backend expects number
      feedback_automatique: isDebriefAuto, // Assuming backend expects boolean
      est_pret: isReady, // Assuming backend field name
      type_apprenant: learnerType, // Assuming backend field name
      // Include associated affirmations IDs for backend
      affirmations_associes_ids: selectedAffirmations.map(a => a.id),
    };

    console.log("Submitting Activity Data:", activityData);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/activites/`, activityData, {
        withCredentials: true, // Important for authentication
      });

      if (response.status === 201) { // Check for successful creation status
        console.log("Activity Submitted Successfully:", response.data);
        alert("Activité enregistrée avec succès !");
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
          // Extract specific field errors if available
          const fieldErrors = Object.entries(backendError)
            .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
            .join('; ');
          if (fieldErrors) {
            errorMessage = `Erreur de validation: ${fieldErrors}`;
          } else if (backendError.detail) {
            errorMessage = backendError.detail;
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

  const handleDragStart = (event, affirmation: Affirmation, source: 'database' | 'selected') => {
    event.dataTransfer.setData(
      "text/plain",
      JSON.stringify({ affirmation, source })
    );
  };

  const handleDrop = (event, destination: 'database' | 'selected') => {
    event.preventDefault();
    const { affirmation, source } = JSON.parse(event.dataTransfer.getData("text/plain")) as { affirmation: Affirmation, source: 'database' | 'selected' };

    if (source === destination) return;

    if (destination === "selected") {
      // Move from database list to selected list
      setDbAffirmations((prev) => prev.filter((item) => item.id !== affirmation.id));
      setSelectedAffirmations((prev) => [...prev, affirmation]);
    } else if (destination === "database") {
      // Move from selected list back to database list
      setSelectedAffirmations((prev) => prev.filter((item) => item.id !== affirmation.id));
      setDbAffirmations((prev) => [...prev, affirmation]); // Add it back to the available list
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  // Filter the affirmations available in the database list based on the affirmation text
  const filteredDbAffirmations = dbAffirmations.filter((affirmation) =>
    affirmation.affirmation.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-4 md:p-8">
      {/* Titre de la page */}
      <header className="bg-white shadow-md p-4 mb-6 flex justify-center">
        <h1 className="text-4xl font-bold text-gray-800">Créer une Activité</h1>
      </header>

      <div className="space-y-6">
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
                      onChange={(e) => setLearnerType(e.target.value)}
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
                      onChange={(e) => setLearnerType(e.target.value)}
                      className="w-4 h-4"
                    />
                    <span>Externe</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2 text-lg">Formation concernée :</label>
                <input
                  type="text"
                  placeholder="Entrez la formation concernée"
                  className="w-full px-4 py-2 text-base md:text-lg border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={training}
                  onChange={(e) => setTraining(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2 text-lg">Titre de l'activité :</label>
                <input
                  type="text"
                  placeholder="Entrez le titre de l'activité"
                  className="w-full px-4 py-2 text-lg border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={activityTitle}
                  onChange={(e) => setActivityTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2 text-lg">Code de l'activité :</label>
                <input
                  type="text"
                  placeholder="Entrez le code de l'activité"
                  className="w-full px-4 py-2 text-lg border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={activityCode}
                  onChange={(e) => setActivityCode(e.target.value)}
                />
              </div>
            </div>

            {/* Second Column - Activity Configuration */}
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2 text-lg">Degré de véracité :</label>
                <div className="flex flex-col space-y-2">
                  <label className="flex items-center space-x-2 text-lg">
                    <input
                      type="radio"
                      name="responseCount"
                      value={2}
                      checked={responseCount === 2}
                      onChange={() => setResponseCount(2)}
                      className="w-4 h-4"
                    />
                    <span>Binaire (Vrai / Faux)</span>
                  </label>
                  <label className="flex items-center space-x-2 text-lg">
                    <input
                      type="radio"
                      name="responseCount"
                      value={4}
                      checked={responseCount === 4}
                      onChange={() => setResponseCount(4)}
                      className="w-4 h-4"
                    />
                    <span>Gradué (Toujours faux / Géneralement faux / Géneralement vrai / Toujours vrai)</span>
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
                      onChange={() => setIsDebriefAuto(false)}
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
                      onChange={() => setIsDebriefAuto(true)}
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
                  onChange={(e) => setEmailList(e.target.value)}
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
                  onChange={(e) => setPublicPresentation(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2 text-lg">Description (encadrant) :</label>
                <textarea
                  placeholder="Entrez la description interne visible par l'encadrant"
                  className="w-full px-4 py-2 text-lg border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
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
                  className={`p-4 rounded shadow-sm cursor-move text-xl flex justify-between items-center
                    ${affirmation.is_correct_vf ? 'bg-green-50' : 'bg-red-50'}`}
                  draggable
                  onDragStart={(event) => handleDragStart(event, affirmation, "selected")}
                >
                  <span className="flex-1 min-w-[200px] mr-4">{affirmation.affirmation}</span>
                  {affirmation.explication && (
                    <div className="relative group ml-6 flex-shrink-0">
                      <img
                        src="/auto.svg"
                        alt="Auto Feedback"
                        className="w-10 h-10 text-blue-500"
                      />
                      <div className="absolute bottom-full right-0 mb-3 hidden w-max px-6 py-3 bg-gray-800 text-white text-xl rounded-lg shadow-lg group-hover:block">
                        Feedback automatique
                      </div>
                    </div>
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
              <button className="bg-blue-500 text-white px-6 py-3 rounded-md hover:bg-blue-600"
                onClick={() => router.push("/encadrant/generer")}
              >
                <Plus size={24} />
              </button>

            </div>

            <div className="mb-4">
              <input
                type="text"
                className="w-full p-4 border rounded text-base md:text-xl"
                placeholder="Rechercher une affirmation"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
                  {filteredDbAffirmations.map((affirmation) => (
                    <li
                      key={`db-${affirmation.id}`}
                      className={`p-4 rounded shadow-sm cursor-move text-base md:text-xl flex justify-between items-center
                        ${affirmation.is_correct_vf ? 'bg-green-50' : 'bg-red-50'}`}
                      draggable
                      onDragStart={(event) => handleDragStart(event, affirmation, "database")}
                    >
                      <span className="flex-1 min-w-[200px] mr-4">{affirmation.affirmation}</span>
                      {affirmation.explication && (
                        <div className="relative group ml-6 flex-shrink-0">
                          <img
                            src="/auto.svg"
                            alt="Auto Feedback"
                            className="w-10 h-10 text-blue-500"
                          />
                          <div className="absolute bottom-full right-0 mb-3 hidden w-max px-6 py-3 bg-gray-800 text-white text-xl rounded-lg shadow-lg group-hover:block">
                            Feedback automatique
                          </div>
                        </div>
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
            className="px-6 py-3 text-lg bg-red-500 text-white rounded-md hover:bg-red-600 w-full md:w-auto"
            onClick={handleDeleteActivity} // Assuming this just clears the form
            disabled={loading} // Disable while loading
          >
            Annuler
          </button>
          {/* <button
            type="button"
            className="px-6 py-3 text-lg bg-green-500 text-white rounded-md hover:bg-green-600 w-full md:w-auto"
            // onClick={handleLaunchActivity} // Launch might not be applicable on creation
            disabled={loading} // Disable while loading
          >
            Lancer l'activité
          </button> */}
          <button
            type="button"
            className="px-6 py-3 text-lg bg-blue-500 text-white rounded-md hover:bg-blue-600 w-full md:w-auto disabled:opacity-50"
            onClick={handleSubmit}
            disabled={isSubmitting} // Disable button while submitting
          >
            {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GererActivites;