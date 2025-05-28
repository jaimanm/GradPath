"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getAllCourseIds,
  getCoursePrerequisites,
  visualizePrereqTree,
} from "@/lib/prereq-utils";
import { Prerequisite, Course } from "@/lib/types";
import { useEffect, useState } from "react";
import {
  InteractiveCourse,
  InteractiveCourseGraph,
} from "@/components/interactive-course-graph";

export default function InteractiveBuilderPage() {
  const [courseIds, setCourseIds] = useState<string[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [addedCourses, setAddedCourses] = useState<InteractiveCourse[]>([]);

  const handleCourseSelect = async (courseId: string) => {
    setSelectedCourseId(courseId);
    setOpen(false); // Close dropdown after selection
  };

  const handleCourseAdded = (course: InteractiveCourse) => {
    setAddedCourses((prev) => [...prev, course]);
  };

  const handleGraphCleared = () => {
    setSelectedCourseId(""); // Reset selected course when graph is cleared
    setAddedCourses([]); // Clear added courses list
  };

  // Only reset search when dropdown is closed
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) setSearch("");
  };

  useEffect(() => {
    getAllCourseIds().then((ids) => {
      if (ids) setCourseIds(ids);
    });
  }, []);

  // Filtered course ids based on search
  const filteredCourseIds =
    search.length >= 2
      ? courseIds.filter((id) =>
          id.toLowerCase().includes(search.toLowerCase())
        )
      : [];

  return (
    <div className="max-w-6xl mx-auto py-8 flex flex-col gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Interactive GradPlan Builder</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Select
            value={selectedCourseId}
            onValueChange={handleCourseSelect}
            open={open}
            onOpenChange={handleOpenChange}
          >
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder="Select a course to add">
                {selectedCourseId || null}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <Command shouldFilter={false} className="w-full">
                <CommandInput
                  placeholder="Type to search for a course..."
                  value={search}
                  onValueChange={setSearch}
                  autoFocus
                />
                <CommandList>
                  {search.length < 2 ? (
                    <CommandEmpty>start typing to select...</CommandEmpty>
                  ) : filteredCourseIds.length === 0 ? (
                    <CommandEmpty>No courses found.</CommandEmpty>
                  ) : (
                    filteredCourseIds.map((id) => (
                      <CommandItem
                        key={id}
                        value={id}
                        onSelect={() => {
                          handleCourseSelect(id);
                        }}
                      >
                        {id}
                      </CommandItem>
                    ))
                  )}
                </CommandList>
              </Command>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Course Graph</CardTitle>
        </CardHeader>
        <CardContent>
          <InteractiveCourseGraph
            selectedCourseId={selectedCourseId}
            onCourseAdded={handleCourseAdded}
            onGraphCleared={handleGraphCleared}
          />
        </CardContent>
      </Card>
    </div>
  );
}
