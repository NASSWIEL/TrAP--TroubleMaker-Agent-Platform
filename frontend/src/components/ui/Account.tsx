"use client"; // Directive nécessaire pour utiliser des hooks React comme `useState`

import React, { useState } from "react";

// Définir les types des props
interface AccountProps {
  name?: string; // Le nom est facultatif
  email?: string; // L'email est facultatif
  onLogout: () => void; // Fonction obligatoire sans paramètres et sans retour
}

const Account: React.FC<AccountProps> = ({ name = "Utilisateur", email = "exemple@email.com", onLogout }) => {
  const [isDropdownOpen, setDropdownOpen] = useState(false);

  const toggleDropdown = () => {
    setDropdownOpen(!isDropdownOpen);
  };

  return (
    <div className="relative inline-block text-left">
      {/* User Info */}
      <div
        className="flex items-center p-2 space-x-3 cursor-pointer hover:bg-gray-100 rounded-lg"
        onClick={toggleDropdown}
      >
        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-white">
          {name?.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-medium">{name}</p>
          <p className="text-xs text-gray-500">{email}</p>
        </div>
      </div>

      {/* Dropdown Menu */}
      
      {isDropdownOpen && (
        <div className="absolute left-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg">
          <button
            onClick={onLogout}
            className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
          >
            Se déconnecter
          </button>
        </div>
      )}
    </div>
  );
};

export default Account;
