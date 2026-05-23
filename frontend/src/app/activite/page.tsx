// src/app/creer-affirmation/page.tsx
"use client";

import { useState } from 'react';
import Image from 'next/image';
import { v4 as uuidv4 } from 'uuid';

const CreerAffirmation: React.FC = () => {
  const [question, setQuestion] = useState('');
  const [affirmations, setAffirmations] = useState<{ id: string; text: string; selected: boolean }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleGenerateAffirmations = async () => {
    if (!question.trim()) {
      setError('Please enter a question.');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      // Mock API call (replace with actual API call later)
      const mockAffirmations = [
        `Mock affirmation 1 related to ${question}`,
        `Mock affirmation 2 related to ${question}`,
        `Mock affirmation 3 related to ${question}`,
      ];

      await new Promise(resolve => setTimeout(resolve, 500));

      const newAffirmations = mockAffirmations.map(text => ({
        id: uuidv4(),
        text,
        selected: false,
      }));

      setAffirmations(newAffirmations);

    } catch (error) {
      console.error("Error generating affirmations:", error);
      setError('Error generating affirmations. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAffirmationChange = (id: string) => {
    setAffirmations(prevAffirmations =>
      prevAffirmations.map(affirmation =>
        affirmation.id === id ? { ...affirmation, selected: !affirmation.selected } : affirmation
      )
    );
  };

  const handleSave = async () => {
    if (!affirmations.length) {
      setError('Generate affirmations first');
      return;
    }

    const selectedAffirmationsText = affirmations.filter(a => a.selected).map(a => a.text);
    if (!selectedAffirmationsText.length) {
      setError('Select at least one affirmation.');
      return;
    }


    setError('');
    setSuccessMessage('');

    try {
      // Replace with your actual API call
      console.log('Saving:', { question, selectedAffirmations: selectedAffirmationsText });

      setSuccessMessage('Affirmations saved successfully!');

      setQuestion('');
      setAffirmations([]);


    } catch (error) {
      console.error('Error saving:', error);
      setError('Failed to save. Please try again.');
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className="w-64 bg-white p-4 border-r border-gray-200">
        <Image src="/logo_LEMANS_UNIVERSITE-WEB.svg" alt="Logo" width={150} height={50} />
        <ul className="mt-4 space-y-2">
          <li>CRÉER UNE AFFIRMATION</li>
          <li>GÉRER LES ACTIVITÉS</li>
          <li>DÉBRIEFER</li>
        </ul>
      </aside>

      <main className="flex-1 p-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4 text-center text-gray-800">Créer des Affirmations</h2>

          {error && <div className="text-red-500 mb-4">{error}</div>}
          {successMessage && <div className="text-green-500 mb-4">{successMessage}</div>}

          <div className="mb-4">
            <label htmlFor="question" className="block text-sm font-medium text-gray-700 mb-1">
              La question :
            </label>
            <input
              type="text"
              id="question"
              value={question}
              onChange={(e) => {
                setQuestion(e.target.value);
                setAffirmations([]);
                setError('');
                setSuccessMessage('');
              }}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          {/* Generate Affirmations Button */}
          <button
            onClick={handleGenerateAffirmations}
            className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            disabled={isLoading}
            type="button"
          >
            {isLoading ? "Chargement..." : "Générer des affirmations"}
          </button>

          {/* Display Affirmations (Conditional) */}
          {affirmations.length > 0 ? (
            <div className="mb-4">
              <h3 className="text-lg font-medium mb-2">Affirmations:</h3>
              <ul className="rounded-md border border-gray-200">
                {affirmations.map((affirmation) => (
                  <li key={affirmation.id} className="flex items-center p-3 border-b border-gray-200 hover:bg-gray-50">
                    <input
                      type="checkbox"
                      id={affirmation.id}
                      checked={affirmation.selected}
                      onChange={() => handleAffirmationChange(affirmation.id)}
                      className="mr-2"
                    />
                    <label htmlFor={affirmation.id} className="text-gray-700">
                      {affirmation.text}
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            // Placeholder if no affirmations and a question exists
            question && !isLoading && !error && !successMessage && ( // Only show placeholder when a question exists and there are no other messages.
              <p className="text-gray-500">Cliquez sur "Générer des affirmations" pour créer des affirmations.</p>
            )
          )}

          {/* Save Button */}
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            disabled={!affirmations.length || isLoading}
          >
            Enregistrer
          </button>
        </div>
      </main>
    </div>
  );
};

export default CreerAffirmation;