"use client"; // Directive pour Next.js

import React, { useState } from "react";
import Account from "@/components/ui/Account";
import { Trash, Edit, Plus } from "lucide-react";

const App = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [affirmations, setAffirmations] = useState([
    { id: 1, text: "La Terre est ronde." },
    { id: 2, text: "Le soleil est une étoile." },
    { id: 3, text: "L'eau gèle à 0°C." },
    { id: 4, text: "La vitesse de la lumière est de 299 792 458 m/s." },
    { id: 5, text: "Les humains ont 32 dents adultes." },
  ]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value.toLowerCase());
  };

  const filteredAffirmations = affirmations.filter((affirmation) =>
    affirmation.text.toLowerCase().includes(searchQuery)
  );

  const handleDeleteAffirmation = (id: number) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette affirmation ?")) {
      setAffirmations((prev) => prev.filter((affirmation) => affirmation.id !== id));
    }
  };

  const handleEditAffirmation = (id: number) => {
    alert(`Éditez l'affirmation avec l'ID : ${id}`);
  };

  const handleLogout = () => {
    alert("Vous avez été déconnecté !");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-8">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg p-6">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Liste des affirmations</h1>
          </div>
          <Account
            name="Jean Dupont"
            email="jean.dupont@example.com"
            onLogout={handleLogout}
          />
        </header>

        {/* Centre le champ de recherche */}
        <div className="mb-8 flex justify-center items-center space-x-4">
          <input
            type="text"
            placeholder="Recherche affirmation"
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
              {/* Section de la poubelle à gauche */}
              <div className="flex items-center">
                <button
                  onClick={() => handleDeleteAffirmation(affirmation.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash className="w-6 h-6" />
                </button>
              </div>

              {/* Section du contenu */}
              <div className="flex-1">
                <p className="text-gray-800">{affirmation.text}</p>
              </div>

              {/* Section du stylo à droite */}
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
