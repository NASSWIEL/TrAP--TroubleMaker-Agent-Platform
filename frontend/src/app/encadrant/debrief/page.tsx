"use client";

import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  ColumnDef, ColumnFiltersState, SortingState,
  flexRender, getCoreRowModel, getFilteredRowModel,
  getPaginationRowModel, getSortedRowModel, useReactTable,
} from "@tanstack/react-table";
import { ChevronDown, ChevronUp, MessageSquare } from "lucide-react";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { useSearchParams } from "next/navigation";
import React from "react";
import axios from "axios";
import { API_BASE_URL } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";

interface Activity {
  code_activite: string;
  titre: string;
  presentation_publique: string;
  description: string;
  encadrant: number;
  type_affirmation_requise: number;
  affirmations_associes: Affirmation[];
}

interface Affirmation {
  id: number;
  affirmation: string;
  is_correct_vf?: boolean;
  explication?: string;
  nbr_reponses?: number;
  reponse_correcte_qcm?: number;
}

interface StudentResponse {
  id: number;
  activite: string;
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
  reponse: { id: number; [key: string]: unknown };
  encadrant: { id: number; [key: string]: unknown };
}

type StudentResponseGroup = {
  email: string;
  student_name: string;
  student_id: number;
  responses: StudentResponse[];
};

function DebriefPage() {
  const searchParams = useSearchParams();
  const activityCode = searchParams.get('activity_code');
  const { t } = useLanguage();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [expandedTexts, setExpandedTexts] = useState<Set<string>>(new Set());

  const [activity, setActivity] = useState<Activity | null>(null);
  const [groupedResponses, setGroupedResponses] = useState<StudentResponseGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debriefs, setDebriefs] = useState<Map<number, Debrief>>(new Map());
  const [debriefInputs, setDebriefInputs] = useState<Record<number, string>>({});

  useEffect(() => {
    const fetchData = async () => {
      if (!activityCode) {
        setError(t('debrief.missingCode'));
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const activityResponse = await axios.get<Activity>(
          `${API_BASE_URL}/api/activites/${activityCode}`,
          { withCredentials: true }
        );
        setActivity(activityResponse.data);

        const responsesResponse = await axios.get<StudentResponse[]>(
          `${API_BASE_URL}/api/reponses/?activity_code=${activityCode}`,
          { withCredentials: true }
        );

        const grouped = groupResponsesByStudent(responsesResponse.data);
        setGroupedResponses(grouped);

        const debriefResponse = await axios.get<Debrief[]>(
          `${API_BASE_URL}/api/debriefs`,
          { withCredentials: true }
        );

        const debriefMap = new Map<number, Debrief>();
        debriefResponse.data.forEach(debrief => {
          debriefMap.set(debrief.reponse.id, debrief);
        });
        setDebriefs(debriefMap);

      } catch (err) {
        console.error('Error fetching data:', err);
        if (axios.isAxiosError(err)) {
          if (err.response?.status === 403) {
            setError(t('debrief.unauthorized'));
          } else if (err.response?.status === 404) {
            setError(t('debrief.notFound'));
          } else {
            setError(t('debrief.loadError'));
          }
        } else {
          setError(t('debrief.connectionError'));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activityCode]);

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

  const formatResponseText = (response: StudentResponse): string => {
    if (!activity) return t('debrief.activityNotFound');

    if (response.affirmation.nbr_reponses === 2) {
      if (activity.type_affirmation_requise === 2) {
        return response.reponse_vf ? t('common.true') : t('common.false');
      } else if (activity.type_affirmation_requise === 4) {
        return response.reponse_vf ? t('common.alwaysTrue') : t('common.alwaysFalse');
      }
    } else if (response.affirmation.nbr_reponses === 4) {
      const qcmMapping: { [key: number]: string } = {
        1: t('common.alwaysTrue'),
        2: t('common.generallyTrue'),
        3: t('common.generallyFalse'),
        4: t('common.alwaysFalse'),
      };
      if (activity.type_affirmation_requise === 4) {
        return qcmMapping[response.reponse_choisie_qcm!] || t('common.notAnswered');
      } else if (activity.type_affirmation_requise === 2) {
        if (response.reponse_choisie_qcm === 1 || response.reponse_choisie_qcm === 2) return t('common.true');
        else if (response.reponse_choisie_qcm === 3 || response.reponse_choisie_qcm === 4) return t('common.false');
      }
    }

    return t('debrief.unknownFormat');
  };

  const handleCreateDebrief = async (responseId: number, feedback: string) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/debriefs`,
        { reponse_id: responseId, feedback: feedback },
        { withCredentials: true }
      );
      setDebriefs(prev => new Map(prev.set(responseId, response.data)));
      alert(t('debrief.created'));
    } catch (err) {
      console.error('Error creating debrief:', err);
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        alert(`${t('common.error')}: ${err.response.data.error}`);
      } else {
        alert(t('debrief.createError'));
      }
    }
  };

  const columns: ColumnDef<StudentResponseGroup>[] = [
    {
      accessorKey: "email",
      header: t('debrief.studentEmail'),
    },
    {
      accessorKey: "student_name",
      header: t('debrief.studentName'),
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
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const table = useReactTable({
    data: groupedResponses,
    columns,
    state: { sorting, columnFilters },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-100">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-sm text-stone-500">{t('debrief.loading')}</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-stone-100">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-xl text-red-600">{t('common.error')}: {error}</div>
          </div>
        </div>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="min-h-screen bg-stone-100">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-xl text-gray-600">{t('debrief.activityNotFound')}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="font-lora text-2xl font-bold text-navy-900">{t('debrief.title')}</h1>
          <p className="text-base text-stone-600 mt-1">{activity.titre}</p>
          <p className="text-xs text-stone-400 mt-0.5 font-mono">Code: {activity.code_activite}</p>
        </div>

        <div className="mb-8">
          <Input
            placeholder={t('debrief.filterByEmail')}
            value={(table.getColumn("email")?.getFilterValue() as string) ?? ""}
            onChange={(e) => table.getColumn("email")?.setFilterValue(e.target.value)}
            className="max-w-sm text-sm"
          />
        </div>

        <div className="rounded-xl border border-stone-200 overflow-hidden shadow-sm">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="bg-navy-900 hover:bg-navy-900">
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="text-white text-sm font-medium">
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <React.Fragment key={row.original.email}>
                  <TableRow className="hover:bg-navy-50 transition-colors">
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="text-sm">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                  {expandedRows.has(row.original.email) && (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="bg-navy-50 border-t border-navy-200 p-0">
                        <div className="p-5 space-y-6">
                          {row.original.responses.map((response, index) => {
                            const expansionKey = `${row.original.email}-${response.id}`;
                            const isTextExpanded = expandedTexts.has(expansionKey);
                            const shouldTruncate = response.justification && response.justification.length > 150;
                            const existingDebrief = debriefs.get(response.id);

                            return (
                              <div key={index} className="space-y-3 pb-6 border-b last:border-b-0 last:pb-0">
                                <div className="flex gap-2 items-baseline">
                                  <span className="font-medium whitespace-nowrap text-xl">{t('common.affirmation')} {response.affirmation.id}:</span>
                                  <span className="font-lora text-base text-stone-700">{response.affirmation.affirmation}</span>
                                </div>
                                <div className="flex gap-2 items-baseline">
                                  <span className="font-medium whitespace-nowrap text-xl">{t('debrief.response')}</span>
                                  <span className="text-gray-600 text-xl">{formatResponseText(response)}</span>
                                </div>
                                {response.justification && (
                                  <div className="flex gap-2 items-baseline">
                                    <span className="font-medium whitespace-nowrap text-xl">{t('debrief.justification')}</span>
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
                                          {isTextExpanded ? t('common.showLess') : t('common.showMore')}
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                )}

                                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                                  {existingDebrief ? (
                                    <div>
                                      <span className="font-medium text-xl text-blue-800">{t('debrief.existingDebrief')}</span>
                                      <p className="text-blue-700 mt-2">{existingDebrief.feedback}</p>
                                    </div>
                                  ) : (
                                    <div>
                                      <span className="font-medium text-xl text-gray-700">{t('debrief.addDebrief')}</span>
                                      <textarea
                                        value={debriefInputs[response.id] ?? ""}
                                        onChange={(e) => setDebriefInputs(prev => ({ ...prev, [response.id]: e.target.value }))}
                                        placeholder={t('debrief.placeholder')}
                                        className="w-full mt-2 rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent transition-colors resize-none"
                                        rows={3}
                                      />
                                      <Button
                                        onClick={() => {
                                          const feedback = (debriefInputs[response.id] ?? "").trim();
                                          if (feedback) {
                                            handleCreateDebrief(response.id, feedback);
                                          } else {
                                            alert(t('debrief.emptyFeedback'));
                                          }
                                        }}
                                        className="mt-2 bg-blue-600 hover:bg-blue-700"
                                      >
                                        <MessageSquare className="h-4 w-4 mr-2" />
                                        {t('debrief.save')}
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
              ? t('debrief.noResponses')
              : `${groupedResponses.length} ${t('debrief.studentsCount')}`}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="text-xl px-6 py-3"
            >
              {t('common.previous')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="text-xl px-6 py-3"
            >
              {t('common.next')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DebriefPageWrapper() {
  return <Suspense><DebriefPage /></Suspense>;
}
