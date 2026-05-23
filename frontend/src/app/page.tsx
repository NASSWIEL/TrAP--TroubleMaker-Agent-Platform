"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { CSSProperties } from "react";

const RoleSelection = () => {
  const router = useRouter();

  const handleRoleSelection = (role: 'etudiant' | 'encadrant') => {
    if (role === 'etudiant') {
      router.push('/etudiant/login');
    } else {
      router.push('/encadrant/login');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.selectionContainer}>
        <Image
          src="/logo_LEMANS_UNIVERSITE-WEB.svg"
          alt="Logo Le Mans Université"
          width={200}
          height={53}
          style={styles.logo}
        />
        <h1 style={styles.title}>Bienvenue sur TroubleMaker</h1>
        <p style={styles.subtitle}>Veuillez sélectionner votre rôle :</p>
        <div style={styles.buttonContainer}>
          <button
            onClick={() => handleRoleSelection('etudiant')}
            style={styles.button}
          >
            Étudiant
          </button>
          <button
            onClick={() => handleRoleSelection('encadrant')}
            style={styles.button}
          >
            Encadrant
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Styles ---
const styles: { [key: string]: CSSProperties } = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    backgroundColor: "#f8f8f8",
    flexDirection: "column",
  },
  selectionContainer: {
    padding: "40px 75px",
    border: "1px solid #ccc", // Lighter border
    borderRadius: "8px",
    backgroundColor: "#fff",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "column",
    textAlign: "center",
  },
  logo: {
    marginBottom: "30px",
  },
  title: {
    fontSize: "24px",
    fontWeight: "bold",
    color: "#333",
    marginBottom: "10px",
  },
  subtitle: {
    fontSize: "16px",
    color: "#666",
    marginBottom: "30px",
  },
  buttonContainer: {
    display: "flex",
    gap: "20px", // Space between buttons
  },
  button: {
    padding: "12px 25px",
    backgroundColor: "#2B2B2B", // Dark button
    color: "#fff",
    fontWeight: 600,
    border: "none", // No border for dark button
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "16px",
    transition: "background-color 0.3s ease",
  },
  'button:hover': { // Example hover effect (won't work directly in inline styles)
    backgroundColor: "#444",
  }
};


export default RoleSelection;