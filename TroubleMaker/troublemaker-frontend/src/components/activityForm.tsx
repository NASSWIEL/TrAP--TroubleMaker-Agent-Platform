// src/app/components/ActivityForm.tsx
import React, { useState } from "react";
import { StudentSelector } from "@/components/studentSelector";

interface Student {
  id: number;
  name: string;
}

interface ActivityFormProps {
  onActivityCreated: (newActivity: {
    name: string;
    title: string;
    students: Student[];
  }) => void;
}

const ActivityForm: React.FC<ActivityFormProps> = ({ onActivityCreated }) => {
  const [activityName, setActivityName] = useState("");
  const [activityTitle, setActivityTitle] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [searchStudent, setSearchStudent] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  const handleSave = async () => {
    try {
      onActivityCreated({ name: activityName, title: activityTitle, students });
      setActivityName("");
      setActivityTitle("");
      setStudents([]);
      setSearchStudent("");
    } catch (error) {
      console.error("Error saving activity:", error);
      // Handle the error, e.g., display an error message.
    }
  };

  const addStudent = (student: Student) => {
    if (!students.find((s) => s.id === student.id)) {
      setStudents([...students, student]);
      setSearchStudent("");
    }
  };

  const removeStudent = (id: number) => {
    setStudents(students.filter((student) => student.id !== id));
  };

  const handleStudentClick = (student: string) => {
    setSelectedStudents([...selectedStudents, student]);
    setSearchValue("");
  };

  const handleDeleteStudent = (studentToDelete: string) => {
    setSelectedStudents(
      selectedStudents.filter((student) => student !== studentToDelete)
    );
  };

  const onValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.name === "studentSearch") {
      setSearchValue(e.target.value);
    }
    // ... rest of your existing onValueChange logic
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      {/* Activity Name Input */}
      <div className="mb-4">
        <label
          htmlFor="activityName"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Nom activité :
        </label>
        <input
          id="activityName"
          type="text"
          value={activityName}
          onChange={(e) => setActivityName(e.target.value)}
          className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Enter activity name"
          required
        />
      </div>

      {/* Activity Title Input */}
      <div className="mb-4">
        <label
          htmlFor="activityTitle"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Titre activité :
        </label>
        <input
          id="activityTitle"
          type="text"
          value={activityTitle}
          onChange={(e) => setActivityTitle(e.target.value)}
          className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Enter activity title"
          required
        />
      </div>

      {/* Student Selection with Command Component */}
      <StudentSelector />

      {/* Selected Students */}
      {students.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-1">
            Étudiants sélectionnés :
          </h4>
          <ul>
            {students.map((student) => (
              <li
                key={student.id}
                className="flex items-center justify-between text-gray-700"
              >
                {student.name}
                <button
                  onClick={() => removeStudent(student.id)}
                  className="ml-4 text-red-500 hover:text-red-700"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Save Button */}
      <button
        onClick={handleSave}
        className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        Enregistrer
      </button>
    </div>
  );
};

export default ActivityForm;
