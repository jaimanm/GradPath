"use client";

import { useState } from "react";
import type { Course } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { assignSemesters } from "@/lib/course-layout";
import { getAllPrerequisitesRecursive } from "@/lib/course-layout";
import {
  getCoursePrerequisites,
  // getAllPrerequisitePathsRecursive,
  expandPrereqTree,
  getAllPathsFromExpandedTree,
  visualizePrereqTree,
  annotatePrereqTree,
} from "@/lib/prereq-utils";

interface CourseSelectorProps {
  availableCourses: Course[];
  selectedCourses: Course[];
  onCoursesChange: (courses: Course[]) => void;
}

export function CourseSelector({
  availableCourses,
  selectedCourses,
  onCoursesChange,
}: CourseSelectorProps) {
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");

  // Filter out courses that are already selected
  const availableOptions = availableCourses.filter(
    (course) => !selectedCourses.some((c) => c.id === course.id)
  );

  const handleCourseSelect = (courseId: string) => {
    setSelectedCourseId(courseId);
  };

  const handleAddCourse = async () => {
    if (!selectedCourseId) return;

    const courseToAdd = availableCourses.find((c) => c.id === selectedCourseId);
    if (!courseToAdd) return;

    // Get all prerequisites recursively
    const allPrereqs = getAllPrerequisitesRecursive(
      selectedCourseId,
      availableCourses
    );
    console.log("All prerequisites:", allPrereqs);

    // // --- Print advanced prerequisite paths and dict ---
    // const prereqsTree = await getCoursePrerequisites(selectedCourseId);
    // if (prereqsTree) {
    //   console.log(`Prerequisite tree for ${selectedCourseId}`, prereqsTree);
    //   const { paths, prereqDict } = await getAllPrerequisitePathsRecursive(
    //     prereqsTree
    //   );
    //   console.log("All advanced prerequisite paths:", paths);
    //   console.log("All prerequisite objects encountered:", prereqDict);
    // }
    // // ---

    // New prerequisite stuff -------
    const coursePrereqs = await getCoursePrerequisites(selectedCourseId);
    if (coursePrereqs) {
      console.log(
        `Prerequisite tree for ${selectedCourseId}`,
        visualizePrereqTree(coursePrereqs)
      );
      const expandedTree = await expandPrereqTree(coursePrereqs);
      // Annotate the expanded tree with prerequisites and parents
      annotatePrereqTree(expandedTree);
      console.log(
        "Expanded prerequisite tree (with prerequisites/parents):",
        expandedTree
      );
      const paths: string[][] = getAllPathsFromExpandedTree(expandedTree);
      console.log("All prerequisite paths:", paths);
    }
    // -----------------------------

    // Create a new array with existing courses, prerequisites, and the selected course
    const newCourses = [...selectedCourses];

    // Add selected course and prerequisites if not already present
    [courseToAdd, ...allPrereqs].forEach((prereq) => {
      if (!newCourses.some((c) => c.id === prereq.id)) {
        newCourses.push(prereq);
      }
    });

    // Assign semesters based on prerequisites
    const coursesWithSemesters = assignSemesters(newCourses);

    // Update courses
    onCoursesChange(coursesWithSemesters);
    setSelectedCourseId("");
  };

  const handleClearSelection = () => {
    onCoursesChange([]);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <Select value={selectedCourseId} onValueChange={handleCourseSelect}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Choose a course" />
          </SelectTrigger>
          <SelectContent>
            {availableOptions.length === 0 ? (
              <SelectItem value="none" disabled>
                All courses chosen
              </SelectItem>
            ) : (
              availableOptions.map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  {course.id}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>

        <Button onClick={handleAddCourse} disabled={!selectedCourseId}>
          Add Course
        </Button>

        <Button
          variant="outline"
          onClick={handleClearSelection}
          disabled={selectedCourses.length === 0}
        >
          Clear All
        </Button>
      </div>

      {selectedCourses.length > 0 && (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {selectedCourses.length} course
          {selectedCourses.length !== 1 ? "s" : ""} selected
        </div>
      )}
    </div>
  );
}
