"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Account from "@/components/ui/Account";
import { Trash, Edit, Plus } from "lucide-react";
import { api } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";

interface Affirmation {
  id: number;
  affirmation: string;
}

const App = () => {
  const router = useRouter();
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [affirmations, setAffirmations] = useState<Affirmation[]>([]);

  useEffect(() => {
    api.get("/api/affirmations")
      .then((res) => setAffirmations(res.data))
      .catch(console.error);
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value.toLowerCase());
  };

  const filteredAffirmations = affirmations.filter((affirmation) =>
    affirmation.affirmation.toLowerCase().includes(searchQuery)
  );

  const handleDeleteAffirmation = (id: number) => {
    if (window.confirm(t('listeAffirmations.deleteConfirm'))) {
      api.delete(`/api/affirmations/${id}`)
        .then(() => setAffirmations((prev) => prev.filter((a) => a.id !== id)))
        .catch(console.error);
    }
  };

  const handleEditAffirmation = (_id: number) => {};

  const handleLogout = () => {
    api.post("/api/logout")
      .then(() => router.push("/"))
      .catch(() => router.push("/"));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-8">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg p-6">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{t('listeAffirmations.title')}</h1>
          </div>
          <Account
            name="Jean Dupont"
            email="jean.dupont@example.com"
            onLogout={handleLogout}
          />
        </header>

        <div className="mb-8 flex justify-center items-center space-x-4">
          <input
            type="text"
            placeholder={t('listeAffirmations.search')}
            value={searchQuery}
            onChange={handleSearch}
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">
            <Plus size={24} />
          </button>
        </div>

        <div className="space-y-6">
          {filteredAffirmations.map((affirmation) => (
            <div
              key={affirmation.id}
              className="bg-gray-50 p-6 rounded-lg shadow-sm flex items-start space-x-4"
            >
              <div className="flex items-center">
                <button
                  onClick={() => handleDeleteAffirmation(affirmation.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1">
                <p className="text-gray-800">{affirmation.affirmation}</p>
              </div>

              <div className="flex items-center">
                <button
                  onClick={() => handleEditAffirmation(affirmation.id)}
                  className="text-blue-500 hover:text-blue-700"
                >
                  <Edit className="w-6 h-6" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default App;
