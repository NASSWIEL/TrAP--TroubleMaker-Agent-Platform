"use client";
import { CSSProperties, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";

interface ActiviteData {
    code_activite: string;
    titre: string;
    presentation_publique: string | null;
    description: string | null;
    affirmations_associes?: any[]; // Add this to check for empty affirmations
    is_published?: boolean; // Add this to check publication status
}

const API_BASE_URL = "http://localhost:8000";

export default function ActivitePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activityCode = searchParams.get('code');

  const [activite, setActivite] = useState<ActiviteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activityCode) {
      setError("Code d'activité manquant dans l'URL.");
      setLoading(false);
      return;
    }

    const fetchActiviteData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`${API_BASE_URL}/api/activites/${activityCode}/`, {
          withCredentials: true,
        });
        if (response.status === 200 && response.data) {
          setActivite(response.data);
        } else {
           setError("Impossible de récupérer les détails de l'activité.");
        }
      } catch (err: unknown) {
        console.error("Error fetching activity data:", err);
        if (axios.isAxiosError(err) && err.response) {
           if (err.response.status === 404) {
               setError(`L'activité avec le code "${activityCode}" n'a pas été trouvée ou vous n'y avez pas accès.`);
           } else if (err.response.status === 403) {
                // Check if it's specifically about unpublished activity
                const errorMessage = err.response.data?.error || "";
                if (errorMessage.includes("pas encore publiée")) {
                    setError("Cette activité n'est pas encore publiée. Veuillez contacter votre encadrant.");
                } else {
                    setError("Vous n'êtes pas autorisé à accéder à cette activité (Session invalide?).");
                }
           } else {
               setError(err.response.data?.error || "Erreur lors de la récupération de l'activité.");
           }
        } else {
          setError("Erreur réseau ou serveur inaccessible.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchActiviteData();
  }, [activityCode, router]);

  const handleStartActivity = () => {
      if (!activityCode) {
          setError("Impossible de démarrer l'activité sans code.");
          return;
      }
      
      // Check if activity has affirmations before allowing participation
      if (activite && 'affirmations_associes' in activite && Array.isArray(activite.affirmations_associes) && activite.affirmations_associes.length === 0) {
          setError("Cette activité ne contient aucune affirmation pour le moment. Veuillez contacter votre encadrant.");
          return;
      }
      
      // Check if activity is published
      if (activite && activite.is_published === false) {
          setError("Cette activité n'est pas encore publiée. Veuillez contacter votre encadrant.");
          return;
      }
      
      router.push(`/etudiant/activite/participer?code=${encodeURIComponent(activityCode)}`);
  }

  const styles: { [key: string]: CSSProperties } = {
    container: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "100vh",
      background: "linear-gradient(135deg, #f0f9ff 0%, #e6f3ff 100%)",
      flexDirection: "column",
      padding: "2rem",
    },
    formContainer: {
      padding: "40px",
      border: "none",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      flexDirection: "column",
      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
      backgroundColor: "white",
      borderRadius: "16px",
      maxWidth: "1000px",
      width: "100%",
      transition: "transform 0.2s ease",
    },
    pageTitle: {
      fontSize: "3.5rem",
      fontWeight: "700",
      color: "#1a1a1a",
      marginBottom: "1.5rem",
      textAlign: "center",
    },
    pageDescription: {
      fontSize: "1.5rem",
      color: "#666",
      lineHeight: "1.6",
      marginBottom: "2rem",
      textAlign: "center",
      maxWidth: "600px",
    },
    card: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      background: "#fff",
      border: "1px solid #ddd",
      borderRadius: "10px",
      minHeight: "100px",
      padding: "15px 20px",
      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
      transition: "box-shadow 0.2s ease, transform 0.2s ease",
      width: "100%",
      maxWidth: "900px",
      marginTop: "20px",
    },
    cardContent: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      width: "100%",
    },
    contentLeft: {
      flex: 1,
    },
    cardTitle: {
      fontSize: "2rem", 
      fontWeight: "700",
      color: "#2B2B2B",
      marginBottom: "1.2rem",
      borderBottom: "2px solid #f0f0f0",
      paddingBottom: "0.8rem",
    },
    cardDescription: {
      color: "#555",
      marginBottom: "1.5rem",
      lineHeight: "1.6",
      fontSize: "1.5rem",
    },
    participateButton: {
      marginTop: "2rem",
      padding: "12px 24px",
      backgroundColor: "#2B2B2B",
      color: "white",
      border: "none",
      borderRadius: "8px",
      fontSize: "1.4rem",
      fontWeight: "600",
      cursor: "pointer",
      transition: "all 0.2s ease",
    },
    errorText: {
      color: 'red',
      marginTop: '20px',
      fontSize: '1.2rem',
      textAlign: 'center'
    },
    loadingText: {
        fontSize: '1.5rem',
        color: '#555',
        marginTop: '20px',
        textAlign: 'center'
    },
    warningBox: {
      padding: "12px",
      backgroundColor: "#fff3cd",
      border: "1px solid #ffeaa7",
      borderRadius: "8px",
      marginTop: "16px"
    },
    warningText: {
      color: "#856404",
      fontSize: "1.2rem",
      margin: "0",
      fontWeight: "600"
    },
    unpublishedBox: {
      padding: "12px",
      backgroundColor: "#f8d7da",
      border: "1px solid #f5c6cb",
      borderRadius: "8px",
      marginTop: "16px"
    },
    unpublishedText: {
      color: "#721c24",
      fontSize: "1.2rem",
      margin: "0",
      fontWeight: "600"
    }
  };

  if (loading) {
      return <div style={styles.container}><p style={styles.loadingText}>Chargement de l'activité...</p></div>;
  }

  if (error || !activite) {
      return <div style={styles.container}><p style={styles.errorText}>{error || "Impossible de charger l'activité."}</p></div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.formContainer}>
        <h1 style={styles.pageTitle}>{activite.titre || "Présentation de l'activité"}</h1>
        <p style={styles.pageDescription}>
          {activite.presentation_publique || 
           "Dans cette activité, vous allez être confrontés à une série d'affirmations sur les états de choc en réanimation. Il vous est demandé pour chacune d'entre-elles de (1) déterminer si elle est vraie ou fausse puis (2) d'expliquer succinctement votre raisonnement."}
        </p>
        <div style={styles.card}>
          <div style={styles.cardContent}>
            <div style={styles.contentLeft}>
              <h3 style={styles.cardTitle}>{activite.titre || "États de choc"}</h3>
              <p style={styles.cardDescription}>
                {activite.presentation_publique || 
                "Dans cette activité, vous allez travailler sur des affirmations portant sur le diagnostic et la prise en charge des états de choc en réanimation. L'objectif est de vous faire réfléchir, de confronter vos connaissances, et de mieux comprendre les éléments clés pour gérer ces situations critiques."}
              </p>
              {activite.is_published === false && (
                <div style={styles.unpublishedBox}>
                  <p style={styles.unpublishedText}>
                    📝 Cette activité est en brouillon et n'est pas encore publiée.
                  </p>
                </div>
              )}
              {activite.affirmations_associes && activite.affirmations_associes.length === 0 && (
                <div style={styles.warningBox}>
                  <p style={styles.warningText}>
                    ⚠️ Cette activité ne contient aucune affirmation pour le moment.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
        <button 
          style={styles.participateButton}
          onClick={handleStartActivity}
        >
          Commencer l'activité
        </button>
      </div>
    </div>
  );
}
