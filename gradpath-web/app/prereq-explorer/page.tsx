"use client";

import { useRef, useEffect, useState } from "react";
import {
  getAllCourseIds,
  getCoursePrerequisites,
  expandPrereqTree,
  visualizePrereqTree,
  splitPrereqTree,
  assignSemesters,
} from "@/lib/prereq-utils";
import { Prerequisite } from "@/lib/types";
import { CourseGraph } from "@/components/course-graph";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandItem,
} from "@/components/ui/command";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function PrereqExplorerPage() {
  const [courseIds, setCourseIds] = useState<string[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [prereqTree, setPrereqTree] = useState<Prerequisite | null>(null);
  const [prereqTreeString, setPrereqTreeString] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  /**
   * EXAMPLE 1:
   * prerequisites for root course: courseC, courseB
   * prerequisites for courseB: courseD
   */
  const example1: Prerequisite = {
    type: "and",
    children: [
      {
        type: "and",
        children: [
          { type: "course", course: "courseD", parent: "courseB" },
          { type: "course", course: "courseB" },
        ],
      },
      { type: "course", course: "courseC" },
    ],
  };
  /**
   * EXAMPLE 2:
   * prerequisites for root course: courseC, (courseJ or courseK), courseB
   * prerequisites for courseB: (courseH or courseI), (courseD or courseE or courseF)
   * prerequisites for courseF: courseG
   */
  const example2: Prerequisite = {
    type: "and",
    children: [
      {
        type: "and",
        children: [
          {
            type: "or",
            children: [
              { type: "course", course: "courseD", parent: "courseB" },
              { type: "course", course: "courseE", parent: "courseB" },
              {
                type: "and",
                children: [
                  { type: "course", course: "courseG", parent: "courseF" },
                  { type: "course", course: "courseF", parent: "courseB" },
                ],
              },
            ],
          },
          {
            type: "or",
            children: [
              { type: "course", course: "courseH", parent: "courseB" },
              { type: "course", course: "courseI", parent: "courseB" },
            ],
          },
          { type: "course", course: "courseB" },
        ],
      },
      { type: "course", course: "courseC" },
      {
        type: "or",
        children: [
          { type: "course", course: "courseJ" },
          { type: "course", course: "courseK" },
        ],
      },
    ],
  };

  useEffect(() => {
    getAllCourseIds().then((ids) => {
      if (ids) setCourseIds(ids);
    });
  }, []);

  const handleCourseSelect = async (courseId: string) => {
    // set states
    setSelectedCourseId(courseId);
    setOpen(false); // Close dropdown after selection
    setLoading(true);
    setPrereqTree(null);
    setPrereqTreeString("");

    // fetch prerequisites for the selected course
    const prereq = await getCoursePrerequisites(courseId);
    if (prereq) {
      // expand the entire prerequisite tree
      const expanded = await expandPrereqTree(prereq);
      setPrereqTree(expanded);

      // visualize the prerequisite tree as a string
      setPrereqTreeString(visualizePrereqTree(expanded));

      // split the tree
      setPrereqTreeString((prev) => prev + "\n\nSplit Trees:");
      const splitTrees: Prerequisite[] = splitPrereqTree(expanded);
      // visualize each of the trees
      splitTrees.map((tree) => {
        setPrereqTreeString(
          (prev) => prev + "\n\n" + visualizePrereqTree(tree)
        );
      });
    }

    // handle no prerequisites for the course
    else {
      setPrereqTree(null);
      setPrereqTreeString("No prerequisites found.");
    }
    setLoading(false);
  };

  // Only reset search when dropdown is closed
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) setSearch("");
  };

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
          <CardTitle>Prerequisite Tree Explorer</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Select
            value={selectedCourseId}
            onValueChange={handleCourseSelect}
            open={open}
            onOpenChange={handleOpenChange}
          >
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
          {loading && <div>Loading prerequisite tree...</div>}
          {prereqTreeString && (
            <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded text-xs overflow-x-auto">
              {prereqTreeString}
            </pre>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Example Prerequisite Trees</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div>
            <div className="font-semibold mb-1">Example 1</div>
            <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded text-xs overflow-x-auto">
              {visualizePrereqTree(example1)}
            </pre>
            <div className="font-light mt-2 mb-1">
              Split example 1: {splitPrereqTree(example1).length} trees
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {splitPrereqTree(example1).map((tree, idx) => {
                assignSemesters(tree);
                return (
                  <pre
                    key={idx}
                    className="bg-gray-100 dark:bg-gray-800 p-4 rounded text-xs overflow-x-auto"
                  >
                    {visualizePrereqTree(tree)}
                  </pre>
                );
              })}
            </div>
          </div>
          <hr className="my-4" />
          <div>
            <div className="font-semibold mb-1">Example 2</div>
            <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded text-xs overflow-x-auto">
              {visualizePrereqTree(example2)}
            </pre>
            <div className="font-light mt-2 mb-1">
              {" "}
              Split example 2: {splitPrereqTree(example2).length} trees
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {splitPrereqTree(example2).map((tree, idx) => {
                assignSemesters(tree);
                return (
                  <pre
                    key={idx}
                    className="bg-gray-100 dark:bg-gray-800 p-4 rounded text-xs overflow-x-auto"
                  >
                    {visualizePrereqTree(tree)}
                  </pre>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Course Graph (Coming Soon)</CardTitle>
        </CardHeader>
        <CardContent>
          <CourseGraph courses={[]} />
        </CardContent>
      </Card>
    </div>
  );
}
