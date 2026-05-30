"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { CSSProperties } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const RoleSelection = () => {
  const router = useRouter();
  const { t } = useLanguage();

  const handleRoleSelection = (role: 'etudiant' | 'encadrant') => {
    if (role === 'etudiant') {
      router.push('/etudiant/login');
    } else {
      router.push('/encadrant/login');
    }
  };

  return (
    <div style={styles.container}>
      <LanguageSwitcher style={styles.langSwitcher} />
      <div style={styles.selectionContainer}>
        <Image
          src="/logo_LEMANS_UNIVERSITE-WEB.svg"
          alt="Logo Le Mans Université"
          width={200}
          height={53}
          style={styles.logo}
        />
        <h1 style={styles.title}>{t('landing.title')}</h1>
        <p style={styles.subtitle}>{t('landing.subtitle')}</p>
        <div style={styles.buttonContainer}>
          <button
            onClick={() => handleRoleSelection('etudiant')}
            style={styles.button}
          >
            {t('landing.student')}
          </button>
          <button
            onClick={() => handleRoleSelection('encadrant')}
            style={styles.button}
          >
            {t('landing.supervisor')}
          </button>
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: CSSProperties } = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    backgroundColor: "#f8f8f8",
    flexDirection: "column",
    position: "relative",
  },
  langSwitcher: {
    position: "fixed",
    top: "16px",
    right: "16px",
  },
  selectionContainer: {
    padding: "40px 75px",
    border: "1px solid #ccc",
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
    gap: "20px",
  },
  button: {
    padding: "12px 25px",
    backgroundColor: "#2B2B2B",
    color: "#fff",
    fontWeight: 600,
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "16px",
    transition: "background-color 0.3s ease",
  },
};

export default RoleSelection;
