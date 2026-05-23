import { Search, X, User } from "lucide-react"
import { useState } from "react"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"

export function StudentSelector() {
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])

  // Example student data - replace with your actual data
  const students = [
    "John Doe",
    "Jane Smith",
    "Mike Johnson",
    "Sarah Williams",
    "Tom Brown"
  ]

  const handleStudentSelect = (student: string) => {
    if (!selectedStudents.includes(student)) {
      setSelectedStudents([...selectedStudents, student])
    }
  }

  const handleStudentRemove = (student: string) => {
    setSelectedStudents(selectedStudents.filter(s => s !== student))
  }

  return (
    <div className="space-y-4">
      <Command className="rounded-lg border shadow-md">
        <CommandInput placeholder="Search students..." />
        <CommandList>
          <CommandEmpty>No students found.</CommandEmpty>
          <CommandGroup heading="Available Students">
            {students.map((student) => (
              <CommandItem
                key={student}
                onSelect={() => handleStudentSelect(student)}
              >
                <User className="mr-2 h-4 w-4" />
                <span>{student}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>

      {selectedStudents.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedStudents.map((student) => (
            <div
              key={student}
              className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm"
            >
              <span>{student}</span>
              <button
                onClick={() => handleStudentRemove(student)}
                className="text-slate-500 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}