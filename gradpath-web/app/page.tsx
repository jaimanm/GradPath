"use client"

import { useState } from "react"
import type { Course } from "@/lib/types"
import { sampleCourses } from "@/data/sample-courses"
import { CourseSelector } from "@/components/course-selector"
import { CourseGraph } from "@/components/course-graph"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { assignSemesters } from "@/lib/course-layout"

export default function Home() {
  const [selectedCourses, setSelectedCourses] = useState<Course[]>([])

  const handleLoadSamplePlan = () => {
    // Create a sample plan with some courses marked as completed
    const samplePlan = sampleCourses.map((course) => ({
      ...course,
      completed: ["MATH140", "CMSC131", "CMSC132"].includes(course.id),
    }))

    // Assign semesters based on prerequisites
    const coursesWithSemesters = assignSemesters(samplePlan)
    setSelectedCourses(coursesWithSemesters)
  }

  // Handle course updates (including completion status changes)
  const handleCourseUpdate = (updatedCourse: Course) => {
    setSelectedCourses(prevCourses => 
      prevCourses.map(course => 
        course.id === updatedCourse.id ? updatedCourse : course
      )
    )
  }

  return (
    <main className="container mx-auto py-8 px-4">
      <div className="flex flex-col items-center mb-8">
        <h1 className="text-3xl font-bold mb-2">GradPath</h1>
        <p className="text-gray-600 dark:text-gray-300 text-center max-w-2xl">
          Plan your academic journey with our interactive course prerequisite visualization tool. Map out your
          graduation plan and see course dependencies at a glance.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Course Selection Panel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Course Selection</CardTitle>
            <CardDescription>
              Select courses to add to your graduation plan. Prerequisites will be automatically included.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-6">
              <CourseSelector
                availableCourses={sampleCourses}
                selectedCourses={selectedCourses}
                onCoursesChange={setSelectedCourses}
              />

              <div className="flex justify-center">
                <Button variant="outline" onClick={handleLoadSamplePlan}>
                  Load Sample Plan
                </Button>
              </div>

              {selectedCourses.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-medium mb-2">Selected Courses:</h3>
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
              Visualize your courses and their prerequisites. Hover for details and click on a course to mark it as completed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedCourses.length > 0 ? (
              <CourseGraph courses={selectedCourses} onCourseUpdate={handleCourseUpdate} />
            ) : (
              <div className="flex flex-col items-center justify-center h-[600px] border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                <p className="text-gray-500 dark:text-gray-400">No courses selected</p>
                <Button className="mt-4" onClick={handleLoadSamplePlan}>
                  Load Sample Plan
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
