"use client";

import { useState } from "react";
import type { Course } from "@/lib/types";
import { sampleCourses } from "@/data/sample-courses";
import { CourseSelector } from "@/components/course-selector";
import { CourseGraph } from "@/components/course-graph";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  assignSemesters,
  getAllPrerequisitesRecursive,
} from "@/lib/course-layout";

export default function Home() {
  const [selectedCourses, setSelectedCourses] = useState<Course[]>([]);

  const handleLoadSamplePlan = () => {
    // Create a sample plan with some courses marked as completed
    const samplePlan = sampleCourses.map((course) => ({
      ...course,
      completed: ["MATH140", "CMSC131", "CMSC132"].includes(course.id),
    }));

    // Assign semesters based on prerequisites
    const coursesWithSemesters = assignSemesters(samplePlan);
    setSelectedCourses(coursesWithSemesters);
  };

  // Handle course completion toggles and mark prerequisites when completing
  const handleCourseUpdate = (updatedCourse: Course) => {
    setSelectedCourses((prevCourses) => {
      // Update the clicked course
      let newCourses = prevCourses.map((c) =>
        c.id === updatedCourse.id ? updatedCourse : c
      );
      // If marking as completed, also mark all recursive prerequisites
      if (updatedCourse.completed) {
        const prereqs = getAllPrerequisitesRecursive(
          updatedCourse.id,
          newCourses
        );
        newCourses = newCourses.map((c) =>
          prereqs.some((p) => p.id === c.id) ? { ...c, completed: true } : c
        );
      }
      // Reassign semesters to shift uncompleted courses based on updated prerequisites
      return assignSemesters(newCourses);
    });
  };

  return (
    <main className="container mx-auto py-8 px-4">
      <div className="flex flex-col items-center mb-8">
        <h1 className="text-3xl font-bold mb-2">GradPath</h1>
        <p className="text-gray-600 dark:text-gray-300 text-center max-w-2xl">
          Plan your academic journey with our interactive course prerequisite
          visualization tool. Map out your graduation plan and see course
          dependencies at a glance.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Course Selection Panel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Course Planning</CardTitle>
            <CardDescription>
              Use the multiple graduation path generator to explore different
              ways to complete your degree, or manually select courses one by
              one.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-6">
              {/* Multiple Graduation Plan Generator */}
              <div className="border-t pt-4">
                <h3 className="font-medium mb-3">Manual Course Selection</h3>
                <CourseSelector
                  availableCourses={sampleCourses}
                  selectedCourses={selectedCourses}
                  onCoursesChange={setSelectedCourses}
                />
              </div>

              <div className="flex justify-center">
                <Button variant="outline" onClick={handleLoadSamplePlan}>
                  Load Sample Plan
                </Button>
              </div>

              {selectedCourses.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-medium mb-2">Current Plan:</h3>
                  <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto">
                    {selectedCourses.map((course) => (
                      <div
                        key={course.id}
                        className={`p-2 rounded text-sm ${
                          course.completed
                            ? "bg-gray-200 dark:bg-gray-700 dark:text-gray-200"
                            : "bg-blue-100 dark:bg-blue-900 dark:text-blue-100"
                        }`}
                      >
                        {course.id} (Semester {course.semester})
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Visualization Panel */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Course Graph</CardTitle>
            <CardDescription>
              Visualize your courses and their prerequisites. Hover for details
              and click on a course to mark it as completed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedCourses.length > 0 ? (
              <CourseGraph
                key={selectedCourses
                  .map((c) => `${c.id}-${c.completed}`)
                  .join(",")}
                courses={selectedCourses}
                onCourseUpdate={handleCourseUpdate}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-[600px] border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                <p className="text-gray-500 dark:text-gray-400">
                  No courses selected
                </p>
                <Button className="mt-4" onClick={handleLoadSamplePlan}>
                  Load Sample Plan
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
