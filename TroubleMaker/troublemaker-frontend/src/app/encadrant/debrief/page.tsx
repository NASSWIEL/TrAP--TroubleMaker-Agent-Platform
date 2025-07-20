"use client";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronDown, ChevronUp, MessageSquare } from "lucide-react";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { useSearchParams } from "next/navigation";
import React from "react";
import axios from "axios";

// API Base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Interface definitions based on backend models
interface Activity {
  code_activite: string;
  titre: string;
  presentation_publique: string;
  description: string;
  encadrant: number;
  type_affirmation_requise: number; // Ajouté pour la logique de mapping
  affirmations_associes: Affirmation[];
}

interface Affirmation {
  id: number;
  affirmation: string;
  is_correct_vf?: boolean;
  explication?: string;
  nbr_reponses?: number;
  option_1?: string;
  option_2?: string;
  option_3?: string;
  option_4?: string;
  reponse_correcte_qcm?: number;
}

interface StudentResponse {
  id: number;
  activite: string; // Activity code
  affirmation: Affirmation;
  etudiant: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
  };
  reponse_vf?: boolean;
  reponse_choisie_qcm?: number;
  justification?: string;
  timestamp: string;
}

interface Debrief {
  id: number;
  feedback: string;
  reponse: number; // Response ID
  encadrant: number;
}

// Type for grouped responses by student
type StudentResponseGroup = {
  email: string;
  student_name: string;
  student_id: number;
  responses: StudentResponse[];
};

export default function DebriefPage() {
  const searchParams = useSearchParams();
  const activityCode = searchParams.get('activity_code');
  
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [expandedTexts, setExpandedTexts] = useState<Set<string>>(new Set());
  
  // State for backend data
  const [activity, setActivity] = useState<Activity | null>(null);
  const [studentResponses, setStudentResponses] = useState<StudentResponse[]>([]);
  const [groupedResponses, setGroupedResponses] = useState<StudentResponseGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debriefs, setDebriefs] = useState<Map<number, Debrief>>(new Map());

  // Fetch activity and responses data
  useEffect(() => {
    const fetchData = async () => {
      if (!activityCode) {
        setError("Code d'activité manquant dans l'URL");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch activity details
        const activityResponse = await axios.get<Activity>(
          `${API_BASE_URL}/api/activites/${activityCode}/`,
          { withCredentials: true }
        );
        setActivity(activityResponse.data);

        // Fetch student responses for this activity
        const responsesResponse = await axios.get<StudentResponse[]>(
          `${API_BASE_URL}/api/reponses/?activity_code=${activityCode}`,
          { withCredentials: true }
        );
        setStudentResponses(responsesResponse.data);

        // Group responses by student
        const grouped = groupResponsesByStudent(responsesResponse.data);
        setGroupedResponses(grouped);

        // Fetch existing debriefs
        const debriefResponse = await axios.get<Debrief[]>(
          `${API_BASE_URL}/api/debriefs/`,
          { withCredentials: true }
        );
        
        // Create a map of response_id -> debrief
        const debriefMap = new Map<number, Debrief>();
        debriefResponse.data.forEach(debrief => {
          debriefMap.set(debrief.reponse, debrief);
        });
        setDebriefs(debriefMap);

      } catch (err) {
        console.error('Error fetching data:', err);
        if (axios.isAxiosError(err)) {
          if (err.response?.status === 403) {
            setError("Accès non autorisé. Vérifiez que vous êtes connecté en tant qu'encadrant.");
          } else if (err.response?.status === 404) {
            setError("Activité introuvable.");
          } else {
            setError("Erreur lors du chargement des données.");
          }
        } else {
          setError("Erreur de connexion.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activityCode]);

  // Helper function to group responses by student
  const groupResponsesByStudent = (responses: StudentResponse[]): StudentResponseGroup[] => {
    const grouped = new Map<number, StudentResponseGroup>();
    
    responses.forEach(response => {
      const studentId = response.etudiant.id;
      if (!grouped.has(studentId)) {
        grouped.set(studentId, {
          email: response.etudiant.email,
          student_name: `${response.etudiant.first_name} ${response.etudiant.last_name}`.trim(),
          student_id: studentId,
          responses: []
        });
      }
      grouped.get(studentId)!.responses.push(response);
    });
    
    return Array.from(grouped.values());
  };

  // Helper function to format response text
  const formatResponseText = (response: StudentResponse): string => {
    if (!activity) {
      return "Activité non trouvée";
    }

    // Logique de conversion complexe similaire à la page de confirmation
    if (response.affirmation.nbr_reponses === 2) {
      // Données stockées en Vrai/Faux
      if (activity.type_affirmation_requise === 2) {
        // Interface était Vrai/Faux → affichage direct
        return response.reponse_vf ? "Vrai" : "Faux";
      } else if (activity.type_affirmation_requise === 4) {
        // Interface était 4 niveaux mais stocké en Vrai/Faux → reconvertir
        return response.reponse_vf ? "Toujours vrai" : "Toujours faux";
      }
    } else if (response.affirmation.nbr_reponses === 4) {
      // Données stockées en QCM
      const qcmMapping: { [key: number]: string } = {
        1: "Toujours vrai",
        2: "Généralement vrai",
        3: "Généralement faux",
        4: "Toujours faux"
      };
      
      if (activity.type_affirmation_requise === 4) {
        // Interface était 4 niveaux → affichage direct avec mapping
        return qcmMapping[response.reponse_choisie_qcm!] || "Non répondu";
      } else if (activity.type_affirmation_requise === 2) {
        // Interface était Vrai/Faux mais stocké en QCM → reconvertir
        if (response.reponse_choisie_qcm === 1 || response.reponse_choisie_qcm === 2) return "Vrai";
        else if (response.reponse_choisie_qcm === 3 || response.reponse_choisie_qcm === 4) return "Faux";
      }
    }
    
    return "Format inconnu";
  };

  // Function to create/update debrief
  const handleCreateDebrief = async (responseId: number, feedback: string) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/debriefs/`,
        {
          reponse_id: responseId,
          feedback: feedback
        },
        { withCredentials: true }
      );
      
      // Update debriefs map
      setDebriefs(prev => new Map(prev.set(responseId, response.data)));
      
      alert('Débrief créé avec succès!');
    } catch (err) {
      console.error('Error creating debrief:', err);
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        alert(`Erreur: ${err.response.data.error}`);
      } else {
        alert('Erreur lors de la création du débrief');
      }
    }
  };

  const columns: ColumnDef<StudentResponseGroup>[] = [
    {
      accessorKey: "email",
      header: "Email de l'étudiant",
    },
    {
      accessorKey: "student_name",
      header: "Nom de l'étudiant",
    },
    {
      id: "expand",
      header: "Actions",
      cell: ({ row }) => {
        const isExpanded = expandedRows.has(row.original.email);
        return (
          <Button
            variant="ghost"
            onClick={() => {
              const newExpandedRows = new Set(expandedRows);
              if (isExpanded) {
                newExpandedRows.delete(row.original.email);
              } else {
                newExpandedRows.add(row.original.email);
              }
              setExpandedRows(newExpandedRows);
            }}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        );
      },
    },
  ];

  const toggleTextExpansion = (email: string, responseId: number) => {
    const key = `${email}-${responseId}`;
    setExpandedTexts(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const table = useReactTable({
    data: groupedResponses,
    columns,
    state: {
      sorting,
      columnFilters,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-8">
        <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-center items-center h-64">
            <div className="text-xl text-gray-600">Chargement des données...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-8">
        <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-center items-center h-64">
            <div className="text-xl text-red-600">Erreur: {error}</div>
          </div>
        </div>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-8">
        <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-center items-center h-64">
            <div className="text-xl text-gray-600">Activité introuvable</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-8">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800">Débriefing de l'activité</h1>
            <h2 className="text-xl text-gray-600 mt-2">{activity.titre}</h2>
            <p className="text-sm text-gray-500 mt-1">Code: {activity.code_activite}</p>
          </div>
        </div>

        <div className="mb-8">
          <Input
            placeholder="Filtrer par email..."
            value={(table.getColumn("email")?.getFilterValue() as string) ?? ""}
            onChange={(e) => table.getColumn("email")?.setFilterValue(e.target.value)}
            className="max-w-sm px-4 py-3 text-xl"
          />
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <React.Fragment key={row.original.email}>
                  <TableRow>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="text-xl">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                  {expandedRows.has(row.original.email) && (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="bg-gray-50">
                        <div className="p-4 space-y-6">
                          {row.original.responses.map((response, index) => {
                            const expansionKey = `${row.original.email}-${response.id}`;
                            const isTextExpanded = expandedTexts.has(expansionKey);
                            const shouldTruncate = response.justification && response.justification.length > 150;
                            const existingDebrief = debriefs.get(response.id);

                            return (
                              <div key={index} className="space-y-3 pb-6 border-b last:border-b-0 last:pb-0">
                                <div className="flex gap-2 items-baseline">
                                  <span className="font-medium whitespace-nowrap text-xl">Affirmation {response.affirmation.id}:</span>
                                  <span className="text-gray-600 text-xl">{response.affirmation.affirmation}</span>
                                </div>
                                <div className="flex gap-2 items-baseline">
                                  <span className="font-medium whitespace-nowrap text-xl">Réponse:</span>
                                  <span className="text-gray-600 text-xl">{formatResponseText(response)}</span>
                                </div>
                                {response.justification && (
                                  <div className="flex gap-2 items-baseline">
                                    <span className="font-medium whitespace-nowrap text-xl">Justification:</span>
                                    <div className="text-gray-600">
                                      <p className="text-xl">
                                        {shouldTruncate && !isTextExpanded
                                          ? response.justification.slice(0, 150) + "..."
                                          : response.justification}
                                      </p>
                                      {shouldTruncate && (
                                        <button
                                          onClick={() => toggleTextExpansion(row.original.email, response.id)}
                                          className="text-blue-500 hover:text-blue-700 text-xl mt-2"
                                        >
                                          {isTextExpanded ? "Voir moins" : "Voir plus"}
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                )}
                                
                                {/* Debrief section */}
                                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                                  {existingDebrief ? (
                                    <div>
                                      <span className="font-medium text-xl text-blue-800">Débrief existant:</span>
                                      <p className="text-blue-700 mt-2">{existingDebrief.feedback}</p>
                                    </div>
                                  ) : (
                                    <div>
                                      <span className="font-medium text-xl text-gray-700">Ajouter un débrief:</span>
                                      <textarea
                                        id={`debrief-${response.id}`}
                                        placeholder="Entrez votre feedback pour cette réponse..."
                                        className="w-full mt-2 p-3 border border-gray-300 rounded-md text-lg"
                                        rows={3}
                                      />
                                      <Button
                                        onClick={() => {
                                          const textarea = document.getElementById(`debrief-${response.id}`) as HTMLTextAreaElement;
                                          const feedback = textarea?.value?.trim();
                                          if (feedback) {
                                            handleCreateDebrief(response.id, feedback);
                                          } else {
                                            alert('Veuillez entrer un feedback avant de sauvegarder.');
                                          }
                                        }}
                                        className="mt-2 bg-blue-600 hover:bg-blue-700"
                                      >
                                        <MessageSquare className="h-4 w-4 mr-2" />
                                        Sauvegarder le débrief
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between py-4">
          <div className="text-sm text-gray-700">
            {groupedResponses.length === 0 
              ? "Aucune réponse d'étudiant trouvée" 
              : `${groupedResponses.length} étudiant(s) avec des réponses`}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="text-xl px-6 py-3"
            >
              Précédent
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="text-xl px-6 py-3"
            >
              Suivant
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
