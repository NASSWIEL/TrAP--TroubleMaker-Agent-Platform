"use client";

import { useState } from "react";
import Image from "next/image";
import axios from "axios";
import { useRouter } from "next/navigation";
import { CSSProperties } from "react";

// Configuration de l'URL de base de l'API Django
const API_BASE_URL = "http://localhost:8000"; 

const EtudiantLogin = () => {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");

        if (!email || !code) {
            setError("Veuillez remplir tous les champs.");
            return;
        }

        setLoading(true);

        try {
            const response = await axios.post(`${API_BASE_URL}/api/login/activite/`, {
                email: email,
                code_activite: code,
            }, {
                withCredentials: true
            });

            if (response.status === 200 && response.data) {
                console.log("Login successful:", response.data);
                router.push(`/etudiant/activite/participer?code=${encodeURIComponent(code)}`);
            } else {
                setError("Réponse invalide du serveur.");
            }

        } catch (err: unknown) {
            console.error("Login error:", err);
            if (axios.isAxiosError(err) && err.response) {
                const backendError = err.response.data?.error || "Une erreur inconnue s'est produite.";
                setError(backendError);
            } else {
                setError("Impossible de contacter le serveur. Vérifiez votre connexion.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.formContainer}>
                <Image
                    src="/logo_LEMANS_UNIVERSITE-WEB.svg"
                    alt="Logo Le Mans Université"
                    width={200}
                    height={53}
                    style={styles.logo}
                />
                <h1 style={styles.title}>Connexion Étudiant</h1>
                <form onSubmit={handleSubmit}>
                    {error && <p style={styles.error}>{error}</p>}
                    <div style={styles.formGroup}>
                        <label htmlFor="email" style={styles.label}>
                            Email :
                        </label>
                        <br />
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={styles.input}
                            required
                            disabled={loading}
                        />
                    </div>
                    <div style={styles.formGroup}>
                        <label htmlFor="code" style={styles.label}>
                            Code Activité :
                        </label>
                        <br />
                        <input
                            type="text"
                            id="code"
                            value={code}
                            onChange={(e) => setCode(e.target.value.toUpperCase())}
                            style={styles.input}
                            required
                            disabled={loading}
                        />
                    </div>

                    <div
                        style={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                        }}
                    >
                        <button type="submit" style={loading ? { ...styles.button, ...styles['button:disabled'] } : styles.button} disabled={loading}>
                            {loading ? "Connexion..." : "Participer"}
                        </button>
                    </div>
                </form>
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
    formContainer: {
        padding: "25px 75px",
        border: "1px solid #2B2B2B",
        borderRadius: "8px",
        backgroundColor: "#fff",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
    },
    logo: {
        marginBottom: "20px",
    },
    title: {
        fontSize: "20px",
        fontWeight: "bold",
        color: "#333",
        marginBottom: "20px",
    },
    formGroup: {
        marginBottom: "15px",
        textAlign: "left",
    },
    label: {
        fontWeight: 700,
        fontSize: "14px",
        lineHeight: "150%",
        color: "#333",
    },
    input: {
        width: "300px", // Reduced width
        padding: "8px 12px",
        margin: "5px 0",
        border: "1px solid #ccc",
        borderRadius: "4px",
        fontSize: "14px",
    },
    button: {
        width: "auto",
        padding: "10px 25px",
        backgroundColor: "#2B2B2B",
        color: "#fff",
        fontWeight: 600,
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
        fontSize: "16px",
        marginTop: "10px",
        transition: "background-color 0.3s ease",
    },
    'button:disabled': {
        cursor: 'not-allowed',
        opacity: 0.6
    },
    error: {
        textAlign: "center",
        marginBottom: "15px", // Added margin bottom
        color: "red",
        fontSize: "14px",
    },
};

export default EtudiantLogin;