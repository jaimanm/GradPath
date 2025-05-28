"use client";

import { useRef, useEffect, useState } from "react";
import {
  getAllCourseIds,
  getCoursePrerequisites,
  expandPrereqTree,
  visualizePrereqTree,
  splitPrereqTree,
} from "@/lib/prereq-utils";
import { Prerequisite } from "@/lib/types";
import { CourseGraph } from "@/components/course-graph";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
} from "@/components/ui/select";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandItem,
} from "@/components/ui/command";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PrereqTreeSection } from "@/components/prereq-tree-section";

export default function PrereqExplorerPage() {
  const [courseIds, setCourseIds] = useState<string[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [prereqTree, setPrereqTree] = useState<Prerequisite | null>(null);
  const [prereqTreeString, setPrereqTreeString] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [example3Tree, setExample3Tree] = useState<Prerequisite | null>(null);
  const [example3Loading, setExample3Loading] = useState(true);
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
  // Example 3 will be loaded asynchronously

  useEffect(() => {
    getAllCourseIds().then((ids) => {
      if (ids) setCourseIds(ids);
    });
  }, []);

  // Load example 3 asynchronously
  useEffect(() => {
    const loadExample3 = async () => {
      try {
        const example3Input: Prerequisite = {
          type: "or",
          children: [
            {
              type: "course",
              course: "CMSC412",
            },
            {
              type: "course",
              course: "CMSC417",
            },
            {
              type: "course",
              course: "CMSC420",
            },
            {
              type: "course",
              course: "CMSC430",
            },
            {
              type: "course",
              course: "CMSC433",
            },
            {
              type: "course",
              course: "ENEE447",
            },
          ],
        };

        const expandedExample3 = await expandPrereqTree(example3Input);
        setExample3Tree(expandedExample3);
      } catch (error) {
        console.error("Error loading example 3:", error);
      } finally {
        setExample3Loading(false);
      }
    };

    loadExample3();
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
          {/* Show selected course's tree if available */}
          {prereqTree && (
            <PrereqTreeSection
              title={`Selected: ${selectedCourseId}`}
              tree={prereqTree}
            />
          )}
          {!prereqTree && selectedCourseId && !loading && (
            <div>No prerequisites found.</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Example Prerequisite Trees</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <PrereqTreeSection
            title="Example 1"
            tree={example1}
            isExample={true}
          />
          <hr className="my-4" />
          <PrereqTreeSection
            title="Example 2"
            tree={example2}
            isExample={true}
          />
          <hr className="my-4" />
          {example3Loading ? (
            <div>Loading Example 3...</div>
          ) : example3Tree ? (
            <PrereqTreeSection
              title="Example 3 (Expanded Real Courses)"
              tree={example3Tree}
              isExample={true}
            />
          ) : (
            <div>Failed to load Example 3</div>
          )}
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
