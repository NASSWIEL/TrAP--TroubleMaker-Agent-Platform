"use client";

import React, { useState } from "react";
import { Edit2, Trash2, Check, X } from "lucide-react";

interface Affirmation {
  id: number;
  text?: string;
  affirmation?: string;
  explication?: string;
  is_correct_vf?: boolean;
  reponse_correcte_qcm?: number;
  nbr_reponses?: number;
  hasAutoFeedback?: boolean;
}

interface AffirmationCardProps {
  affirmation: Affirmation;
  isEditing: boolean;
  editText: string;
  editExplication: string;
  onStartEdit: (affirmation: Affirmation) => void;
  onCancelEdit: () => void;
  onSaveEdit: (affirmationId: number) => void;
  onDeleteAffirmation: (affirmationId: number) => void;
  onToggleTruth: (affirmationId: number, currentStatus: boolean | undefined) => void;
  onEditTextChange: (text: string) => void;
  onEditExplicationChange: (text: string) => void;
  onDragStart?: (event: React.DragEvent, affirmation: Affirmation, source: string) => void;
  source?: string;
  className?: string;
}

const AffirmationCard: React.FC<AffirmationCardProps> = ({
  affirmation,
  isEditing,
  editText,
  editExplication,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDeleteAffirmation,
  onToggleTruth,
  onEditTextChange,
  onEditExplicationChange,
  onDragStart,
  source = "default",
  className = "",
}) => {
  const affirmationText = affirmation.text || affirmation.affirmation || "";
  const baseClassName = `p-3 rounded shadow-sm text-base flex flex-col gap-2 ${className}`;
  const colorClassName = affirmation.is_correct_vf === undefined 
    ? 'bg-gray-50' 
    : affirmation.is_correct_vf 
      ? 'bg-green-50' 
      : 'bg-red-50';

  return (
    <li className={`${baseClassName} ${colorClassName}`}>
      {isEditing ? (
        // Mode édition
        <div className="space-y-2">
          <textarea
            className="w-full p-2 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500"
            value={editText}
            onChange={(e) => onEditTextChange(e.target.value)}
            rows={3}
            placeholder="Texte de l'affirmation..."
          />
          <textarea
            className="w-full p-2 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500"
            value={editExplication}
            onChange={(e) => onEditExplicationChange(e.target.value)}
            rows={2}
            placeholder="Explication (optionnelle)..."
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => onSaveEdit(affirmation.id)}
              className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center gap-1"
            >
              <Check size={16} /> Sauvegarder
            </button>
            <button
              onClick={onCancelEdit}
              className="px-3 py-1 bg-gray-500 text-white rounded-md hover:bg-gray-600 flex items-center gap-1"
            >
              <X size={16} /> Annuler
            </button>
          </div>
        </div>
      ) : (
        // Mode affichage normal
        <>
          <div className="flex justify-between items-start gap-3">
            <div className="flex-1">
              <span 
                className="cursor-move block"
                draggable={!!onDragStart}
                onDragStart={onDragStart ? (event) => onDragStart(event as any, affirmation, source) : undefined}
              >
                {affirmationText}
              </span>
              {affirmation.explication && (
                <p className="text-sm text-gray-600 mt-1 italic">
                  Explication: {affirmation.explication}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {affirmation.hasAutoFeedback && (
                <div className="relative group">
                  <img src="/auto.svg" alt="Auto Feedback" className="w-6 h-6 text-blue-500"/>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden w-max px-2 py-1 bg-gray-800 text-white text-xs rounded-md shadow-lg group-hover:block z-10">
                    Feedback automatique
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-1 mt-2">
            <button
              onClick={() => onStartEdit(affirmation)}
              className="px-2 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center gap-1 text-sm"
              title="Modifier l'affirmation"
            >
              <Edit2 size={14} /> Modifier
            </button>
            <button
              onClick={() => onToggleTruth(affirmation.id, affirmation.is_correct_vf)}
              className={`px-2 py-1 rounded-md flex items-center gap-1 text-sm text-white
                ${affirmation.is_correct_vf ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
              title={affirmation.is_correct_vf ? "Marquer comme fausse" : "Marquer comme vraie"}
            >
              <Check size={14} /> 
              {affirmation.is_correct_vf ? "Fausse" : "Vraie"}
            </button>
            <button
              onClick={() => onDeleteAffirmation(affirmation.id)}
              className="px-2 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 flex items-center gap-1 text-sm"
              title="Supprimer l'affirmation"
            >
              <Trash2 size={14} /> Suppr.
            </button>
          </div>
        </>
      )}
    </li>
  );
};

export default AffirmationCard;
