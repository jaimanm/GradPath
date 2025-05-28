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
import { getAllCourseIds } from "@/lib/prereq-utils";
import { Prerequisite } from "@/lib/types";
import { useEffect, useState } from "react";

export default function PrereqExplorerPage() {
  const [courseIds, setCourseIds] = useState<string[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [prereqTree, setPrereqTree] = useState<Prerequisite | null>(null);

  const handleCourseSelect = (courseId: string) => {
    setSelectedCourseId(courseId);
    setLoading(true);
    setPrereqTree(null);

    // fetch prerequisites for the selected course
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
          <CardTitle>Interactive GradPlan Builder </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Select value={selectedCourseId} onValueChange={handleCourseSelect}>
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder="Select a course">
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
    </div>
  );
}
