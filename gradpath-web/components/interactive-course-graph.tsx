"use client";

import { useEffect, useRef, useState } from "react";
import CytoscapeComponent from "react-cytoscapejs";
import cytoscape from "cytoscape";
import dagre from "cytoscape-dagre";
import type { Core } from "cytoscape";
import {
  getCourseDetails,
  getCoursePrerequisites,
  visualizePrereqTree,
} from "@/lib/prereq-utils";
import { Prerequisite } from "@/lib/types";

// Simplified course interface for interactive graph
export interface InteractiveCourse {
  name: string;
  courseId: string;
  semester: number;
  description: string;
  credits: number;
  prereqString: string;
  prerequisites: string[];
  isActive: boolean; // New property to track if course is "activated" (opaque vs greyed out)
}

// Register the dagre layout extension
if (!cytoscape.prototype.hasInitialised) {
  cytoscape.use(dagre);
  cytoscape.prototype.hasInitialised = true;
}

interface InteractiveCourseGraphProps {
  selectedCourseId?: string;
  onCourseAdded?: (course: InteractiveCourse) => void;
  onGraphCleared?: () => void;
}

export function InteractiveCourseGraph({
  selectedCourseId,
  onCourseAdded,
  onGraphCleared,
}: InteractiveCourseGraphProps) {
  const cyRef = useRef<Core | null>(null);
  const [courses, setCourses] = useState<InteractiveCourse[]>([]);
  const [selectedNode, setSelectedNode] = useState<InteractiveCourse | null>(
    null
  );
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(false);
  const lastProcessedCourseId = useRef<string | null>(null); // Track the last course we processed
  const coursesRef = useRef<InteractiveCourse[]>([]); // Ref to track current courses state

  // Update courses ref whenever courses state changes
  useEffect(() => {
    coursesRef.current = courses;
  }, [courses]);

  // Extract all course IDs from a prerequisite tree
  const extractCourseIds = (prereq: Prerequisite): string[] => {
    if (prereq.type === "course") {
      return [prereq.course];
    } else if (prereq.type === "and" || prereq.type === "or") {
      return prereq.children.flatMap((child) => extractCourseIds(child));
    }
    return [];
  };

  // Shift all existing courses to higher semester numbers
  const shiftCoursesToLaterSemesters = () => {
    setCourses((prevCourses) =>
      prevCourses.map((course) => ({
        ...course,
        semester: course.semester + 1,
      }))
    );
  };

  // Add course to the graph when selectedCourseId changes
  useEffect(() => {
    const run = async () => {
      if (
        selectedCourseId && // selectedCourseId exists
        selectedCourseId !== lastProcessedCourseId.current // we did not just process the course
      ) {
        // Clear the graph first to ensure only one course and its prerequisites are shown
        setCourses([]);

        lastProcessedCourseId.current = selectedCourseId;

        // Fetch course prerequisites first
        const prereqs = await getCoursePrerequisites(selectedCourseId);

        let targetSemester = 1; // Default semester for the selected course
        let prerequisiteCourses: string[] = [];

        if (prereqs) {
          console.log(
            "Selected course prerequisites:",
            visualizePrereqTree(prereqs)
          );
          prerequisiteCourses = extractCourseIds(prereqs);

          if (prerequisiteCourses.length > 0) {
            // Since we cleared the graph, place prerequisites in semester 1
            // and the selected course in semester 2
            targetSemester = 2;
          }
        }

        // Add the selected course with its prerequisites tracked (selected course starts active)
        await addCourseToGraphWithPrereqs(
          selectedCourseId,
          targetSemester,
          prerequisiteCourses,
          true
        );

        // Now add prerequisites after the delay
        if (prereqs && prerequisiteCourses.length > 0) {
          // Add all prerequisites to semester 1 (before the selected course)
          const prerequisiteSemester = 1;

          for (const prereqCourseId of prerequisiteCourses) {
            await addCourseToGraph(prereqCourseId, prerequisiteSemester, false); // Prerequisites start inactive/greyed out
          }

          // Update the selected course to include all prerequisites in one update
          setCourses((prevCourses) => {
            return prevCourses.map((course) => {
              if (course.courseId === selectedCourseId) {
                const allPrereqs = prerequisiteCourses;

                return {
                  ...course,
                  prerequisites: allPrereqs,
                };
              }
              return course;
            });
          });

          // Wait another second, then activate all prerequisites
          await new Promise((resolve) => setTimeout(resolve, 1000));
          activatePrerequisites(prerequisiteCourses);

          // Now recursively add prerequisites of prerequisites
          await addPrerequisiteChain(prerequisiteCourses);
        }
      }
    };
    run();
  }, [selectedCourseId]); // Remove courses dependency to prevent re-add after clear

  const addCourseToGraph = async (
    courseId: string,
    semester: number = 1,
    isActive: boolean = false
  ) => {
    setLoading(true);
    try {
      const details = await getCourseDetails(courseId);
      if (details) {
        const newCourse: InteractiveCourse = {
          courseId: courseId,
          name: details.name || courseId,
          semester: semester,
          prereqString: details.relationships?.prereqs || "",
          prerequisites: [], // Will populate later if needed
          credits: details.credits || 0,
          description: details.description || "",
          isActive: isActive,
        };

        setCourses((prev) => [...prev, newCourse]);
        onCourseAdded?.(newCourse);
      }
    } catch (error) {
      // console.error("Error adding course:", error);
    } finally {
      setLoading(false);
    }
  };

  const addCourseToGraphWithPrereqs = async (
    courseId: string,
    semester: number,
    prerequisites: string[],
    isActive: boolean = true
  ) => {
    setLoading(true);
    try {
      const details = await getCourseDetails(courseId);
      if (details) {
        const newCourse: InteractiveCourse = {
          courseId: courseId,
          name: details.name || courseId,
          semester: semester,
          prereqString: details.relationships?.prereqs || "",
          prerequisites: prerequisites, // Track prerequisites for edge creation
          credits: details.credits || 0,
          description: details.description || "",
          isActive: isActive,
        };

        setCourses((prev) => [...prev, newCourse]);
        onCourseAdded?.(newCourse);
      }
    } catch (error) {
      // console.error("Error adding course:", error);
    } finally {
      setLoading(false);
    }
  };

  // Function to activate prerequisites (make them opaque)
  const activatePrerequisites = (prerequisiteIds: string[]) => {
    setCourses((prevCourses) =>
      prevCourses.map((course) =>
        prerequisiteIds.includes(course.courseId)
          ? { ...course, isActive: true }
          : course
      )
    );
  };

  // Reusable function to add a level of prerequisites with proper edge creation
  const addPrerequisiteLevel = async (
    parentCourseIds: string[],
    targetSemester: number,
    isActive: boolean = false
  ): Promise<string[]> => {
    const prerequisitesToAdd: { courseId: string; parentIds: string[] }[] = [];

    // Collect all prerequisites for the current level of courses
    for (const courseId of parentCourseIds) {
      try {
        const prereqs = await getCoursePrerequisites(courseId);
        if (prereqs) {
          const prereqCourses = extractCourseIds(prereqs);

          // Only add prerequisites that aren't already in the graph
          const newPrereqs = prereqCourses.filter(
            (prereqId) =>
              !coursesRef.current.find((c) => c.courseId === prereqId)
          );

          // Track which prerequisites belong to which parent course
          newPrereqs.forEach((prereqId) => {
            const existing = prerequisitesToAdd.find(
              (p) => p.courseId === prereqId
            );
            if (existing) {
              existing.parentIds.push(courseId);
            } else {
              prerequisitesToAdd.push({
                courseId: prereqId,
                parentIds: [courseId],
              });
            }
          });
        }    } catch (error) {
      // console.error(`Error fetching prerequisites for ${courseId}:`, error);
    }
    }

    if (prerequisitesToAdd.length === 0) {
      return []; // No prerequisites to add
    }

    const addedCourseIds: string[] = [];

    // Add all prerequisites for this level
    for (const { courseId, parentIds } of prerequisitesToAdd) {
      await addCourseToGraph(courseId, targetSemester, isActive);
      addedCourseIds.push(courseId);
    }

    // Update all parent courses to include their prerequisites in one batch update
    if (addedCourseIds.length > 0) {
      setCourses((prevCourses) => {
        return prevCourses.map((course) => {
          // Find all prerequisites that should be added to this course
          const prereqsToAdd = prerequisitesToAdd
            .filter(({ parentIds }) => parentIds.includes(course.courseId))
            .map(({ courseId }) => courseId);

          if (prereqsToAdd.length > 0) {
            const updatedPrereqs = [
              ...new Set([...course.prerequisites, ...prereqsToAdd]),
            ];

            // Calculate required semester based on all prerequisites
            const prereqSemesters = updatedPrereqs
              .map((prereqId) => {
                const prereqCourse = prevCourses.find(
                  (c) => c.courseId === prereqId
                );
                return prereqCourse ? prereqCourse.semester : 0;
              })
              .filter((sem) => sem > 0);

            const requiredSemester =
              prereqSemesters.length > 0
                ? Math.max(...prereqSemesters) + 1
                : course.semester;

            return {
              ...course,
              prerequisites: updatedPrereqs,
              semester: Math.max(course.semester, requiredSemester),
            };
          }
          return course;
        });
      });
    }

    return addedCourseIds;
  };

  // Recursively add prerequisites of prerequisites with animation delays
  const addPrerequisiteChain = async (courseIds: string[]): Promise<void> => {
    if (courseIds.length === 0) {
      return; // Base case: no more courses to process
    }

    // Since we start fresh each time, place new prerequisites in the earliest available semester
    // Find the earliest semester that would conflict and place prerequisites before it
    let targetSemester = 1;

    if (coursesRef.current.length > 0) {
      // Find the earliest semester that has courses
      const minSemester = Math.min(
        ...coursesRef.current.map((c) => c.semester)
      );

      // If prerequisites would conflict with existing courses, shift everything later
      if (minSemester === 1) {
        shiftCoursesToLaterSemesters();
        targetSemester = 1;
      } else {
        targetSemester = minSemester - 1;
      }
    }

    // Add the next level of prerequisites (they start inactive/greyed out)
    const addedCourseIds = await addPrerequisiteLevel(
      courseIds,
      targetSemester,
      false
    );

    if (addedCourseIds.length === 0) {
      return; // No more prerequisites to add
    }

    // Wait 1 second then activate this level of prerequisites
    await new Promise((resolve) => setTimeout(resolve, 1000));
    activatePrerequisites(addedCourseIds);

    // Recursively process the next level
    await addPrerequisiteChain(addedCourseIds);
  };

  useEffect(() => {
    if (!cyRef.current) return;

    const darkMode = document.documentElement.classList.contains("dark");

    // Create elements for Cytoscape
    const elements: cytoscape.ElementDefinition[] = [];

    // Group courses by semester
    const semesterGroups: Record<number, InteractiveCourse[]> = {};
    courses.forEach((course) => {
      if (!semesterGroups[course.semester]) {
        semesterGroups[course.semester] = [];
      }
      semesterGroups[course.semester].push(course);
    });

    // Get sorted semesters for consistent ordering
    const sortedSemesters = Object.keys(semesterGroups)
      .map(Number)
      .sort((a, b) => a - b);

    // Calculate column layout for each semester
    let totalColumns = 0;
    const semesterColumnInfo: Record<
      number,
      { startColumn: number; columnCount: number }
    > = {};

    sortedSemesters.forEach((semesterNum) => {
      const courseCount = semesterGroups[semesterNum]?.length || 0;
      const columnsNeeded = Math.ceil(courseCount / 5); // 5 courses per column
      semesterColumnInfo[semesterNum] = {
        startColumn: totalColumns,
        columnCount: columnsNeeded,
      };
      totalColumns += columnsNeeded;
    });

    // Add semester header nodes and dividers
    sortedSemesters.forEach((semesterNum, index) => {
      const semesterInfo = semesterColumnInfo[semesterNum];
      const centerColumnX =
        (semesterInfo.startColumn + (semesterInfo.columnCount - 1) / 2) * 200 +
        200;

      elements.push({
        data: {
          id: `semester-${semesterNum}`,
          label: `Semester ${semesterNum}`,
          type: "semester",
        },
        position: { x: centerColumnX, y: 30 }, // Positioned at top, centered over semester columns
        locked: true,
      });

      // Add vertical divider line between semesters (except for the first one)
      if (index > 0) {
        const prevSemesterInfo = semesterColumnInfo[sortedSemesters[index - 1]];
        const prevSemesterEnd =
          (prevSemesterInfo.startColumn + prevSemesterInfo.columnCount - 1) *
            200 +
          200;
        const currentSemesterStart = semesterInfo.startColumn * 200 + 200;
        const dividerX = (prevSemesterEnd + currentSemesterStart) / 2;

        elements.push({
          data: {
            id: `semester-divider-${semesterNum}`,
            type: "divider",
            height: 600,
            color: "#000000",
          },
          position: {
            x: dividerX,
            y: 350,
          },
          locked: true,
          classes: ["divider-node"],
        });
      }
    });

    // Add course nodes with proper column-based positioning
    courses.forEach((course) => {
      const semesterCourses = semesterGroups[course.semester] || [];
      const courseIndex = semesterCourses.findIndex(
        (c) => c.courseId === course.courseId
      );

      // Calculate which column and row this course should be in
      const coursesPerColumn = 5;
      const columnIndex = Math.floor(courseIndex / coursesPerColumn);
      const rowInColumn = courseIndex % coursesPerColumn;

      // Get semester column info
      const semesterInfo = semesterColumnInfo[course.semester];
      const absoluteColumnIndex = semesterInfo.startColumn + columnIndex;

      // Calculate position
      const x = (absoluteColumnIndex + 1) * 200; // +1 to start from position 200, not 0

      // Calculate vertical position within the column
      const graphHeight = 600;
      const verticalSpacing = 100;
      const maxRowsInColumn = coursesPerColumn;
      const columnHeight = (maxRowsInColumn - 1) * verticalSpacing;
      const startY = (graphHeight - columnHeight) / 2 + 100; // Center vertically with offset for header
      const y = startY + rowInColumn * verticalSpacing;

      elements.push({
        data: {
          id: course.courseId,
          label: course.courseId,
          name: course.name,
          semester: course.semester,
          credits: course.credits,
          description: course.description,
          prereqString: course.prereqString,
          prerequisites: course.prerequisites,
          isActive: course.isActive,
          type: "course",
        },
        position: { x, y },
        locked: true,
      });
    });

    // Add edges for prerequisite relationships
    courses.forEach((course) => {
      if (course.prerequisites && course.prerequisites.length > 0) {
        course.prerequisites.forEach((prereqId) => {
          // Only add edge if the prerequisite course exists in the graph
          const prereqCourse = courses.find((c) => c.courseId === prereqId);
          if (prereqCourse) {
            elements.push({
              data: {
                id: `${prereqId}-${course.courseId}`,
                source: prereqId,
                target: course.courseId,
                sourceSemester: prereqCourse.semester, // Add source semester for color coding
                sourceIsActive: prereqCourse.isActive, // Add source active state
                targetIsActive: course.isActive, // Add target active state
                type: "prerequisite", // Use same type as course-graph
              },
            });
          }
        });
      }
    });

    // Update the graph
    cyRef.current.elements().remove();
    cyRef.current.add(elements);

    // Apply styles
    cyRef.current.style([
      {
        selector: "node[type='course']",
        style: {
          "background-color": darkMode ? "#2c5282" : "lightblue",
          "background-opacity": (ele: any) => (ele.data("isActive") ? 1 : 0.3), // Greyed out if not active
          "border-width": 2,
          "border-color": "#666",
          width: 80,
          height: 80,
          "text-valign": "center",
          "text-halign": "center",
          color: darkMode ? "#fff" : "#000",
          "text-opacity": (ele: any) => (ele.data("isActive") ? 1 : 0.5), // Text also greyed out if not active
          "font-weight": "bold",
          "font-size": "12px",
          label: "data(label)",
          "text-wrap": "wrap",
          "text-max-width": "80px",
        },
      },
      {
        selector: "node[type='semester']",
        style: {
          "background-color": "transparent",
          "border-width": 0,
          color: darkMode ? "#ddd" : "#444",
          "font-weight": "bold",
          "font-size": "18px",
          "text-valign": "center",
          "text-halign": "center",
          label: "data(label)",
          width: 1,
          height: 1,
          opacity: 1,
          "text-opacity": 1,
        },
      },
      {
        selector: "node.divider-node[type='divider']",
        style: {
          width: 1, // Increased width for better visibility
          height: "data(height)",
          shape: "rectangle",
          "background-color": darkMode ? "#ddd" : "#333",
          "border-width": 0,
          opacity: 1, // Full opacity
        },
      },
      {
        selector: "edge[type='prerequisite']",
        style: {
          width: 2,
          "line-color": (ele: any) => {
            const sourceIsActive = ele.data("sourceIsActive");
            const targetIsActive = ele.data("targetIsActive");

            // If either source or target is inactive, use grey
            if (!sourceIsActive || !targetIsActive) {
              return darkMode ? "#4a5568" : "#a0a0a0"; // Grey for inactive
            }

            // Color based on source semester for active courses
            const sourceSemester = ele.data("sourceSemester") || 1;
            const colors = [
              "#e6194B",
              "#3cb44b",
              "#ffe119",
              "#4363d8",
              "#f58231",
              "#911eb4",
              "#42d4f4",
              "#f032e6",
            ];
            return colors[(sourceSemester - 1) % colors.length];
          },
          "target-arrow-color": (ele: any) => {
            const sourceIsActive = ele.data("sourceIsActive");
            const targetIsActive = ele.data("targetIsActive");

            // If either source or target is inactive, use grey
            if (!sourceIsActive || !targetIsActive) {
              return darkMode ? "#4a5568" : "#a0a0a0"; // Grey for inactive
            }

            // Color based on source semester for active courses
            const sourceSemester = ele.data("sourceSemester") || 1;
            const colors = [
              "#e6194B",
              "#3cb44b",
              "#ffe119",
              "#4363d8",
              "#f58231",
              "#911eb4",
              "#42d4f4",
              "#f032e6",
            ];
            return colors[(sourceSemester - 1) % colors.length];
          },
          "target-arrow-shape": "triangle",
          "arrow-scale": 1.5,
          "curve-style": "unbundled-bezier",
          // Use intersection-line edge endpoint to better connect to nodes
          "source-endpoint": "outside-to-line",
          "target-endpoint": "outside-to-line",
          // Improve connector appearance
          "line-style": "solid",
          // Keep edge distances relative to nodes
          "edge-distances": "intersection",
          // Lower opacity for inactive edges
          opacity: (ele: any) => {
            const sourceIsActive = ele.data("sourceIsActive");
            const targetIsActive = ele.data("targetIsActive");
            return !sourceIsActive || !targetIsActive ? 0.4 : 0.9;
          },
        },
      },
    ]);

    // Set up event handlers
    cyRef.current.on("mouseover", "node[type='course']", (event) => {
      const node = event.target;
      const courseId = node.id();
      const course = courses.find((c) => c.courseId === courseId);
      if (course) {
        setSelectedNode(course);
        const position = node.renderedPosition();
        const zoom = cyRef.current?.zoom() || 1;
        setTooltipPos({
          x: position.x + (80 * zoom) / 2,
          y: position.y - (80 * zoom) / 2,
        });
      }
    });

    cyRef.current.on("mouseout", "node[type='course']", () => {
      setSelectedNode(null);
    });

    // Fit the graph to the viewport
    if (courses.length > 0) {
      cyRef.current.fit(undefined, 50);
      cyRef.current.center();
    }
  }, [courses]);

  const handleCytoscapeReady = (cy: Core) => {
    cyRef.current = cy;
  };

  const clearGraph = () => {
    setCourses([]);
    lastProcessedCourseId.current = null; // Reset so the same course can be re-added
    onGraphCleared?.(); // Notify parent that graph was cleared
  };

  return (
    <div className="relative w-full h-[600px] border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900">
      <CytoscapeComponent
        elements={[]}
        style={{ width: "100%", height: "100%" }}
        cy={handleCytoscapeReady}
        boxSelectionEnabled={false}
      />

      {/* Loading indicator */}
      {loading && (
        <div className="absolute top-4 right-4 bg-blue-500 text-white px-3 py-1 rounded-md text-sm">
          Adding course...
        </div>
      )}

      {/* Course tooltip */}
      {selectedNode && (
        <div
          className="absolute z-10 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-w-xs"
          style={{
            left: tooltipPos.x,
            top: tooltipPos.y,
            transform: "translate(10px, 10px)",
            pointerEvents: "none",
          }}
        >
          <h3 className="font-bold text-sm dark:text-white">
            {selectedNode.name || selectedNode.courseId}
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-300">
            Course ID: {selectedNode.courseId}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-300">
            Semester: {selectedNode.semester}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-300">
            Credits: {selectedNode.credits}
          </p>
          {selectedNode.prereqString && (
            <p className="text-xs text-gray-600 dark:text-gray-300">
              Prerequisites: {selectedNode.prereqString}
            </p>
          )}
          <p className="text-xs mt-1 dark:text-gray-300">
            {selectedNode.description}
          </p>
        </div>
      )}

      {/* Controls */}
      <div className="absolute bottom-4 left-4 flex gap-2">
        <button
          onClick={clearGraph}
          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
          disabled={courses.length === 0}
        >
          Clear Graph
        </button>
        <span className="bg-white dark:bg-gray-800 px-3 py-1 rounded border text-sm dark:text-gray-300">
          {courses.length} course{courses.length !== 1 ? "s" : ""} added
        </span>
      </div>

      {/* Instructions */}
      {courses.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-500 dark:text-gray-400">
          <div className="text-center">
            <p className="text-lg font-medium">Empty Graph</p>
            <p className="text-sm">
              Select a course above to add it to the graph
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
