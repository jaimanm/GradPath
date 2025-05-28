"use client";

import { useEffect, useRef, useState } from "react";
import CytoscapeComponent from "react-cytoscapejs";
import cytoscape from "cytoscape";
import dagre from "cytoscape-dagre";
import type { Core } from "cytoscape";
import type { Course } from "@/lib/types";
import {
  minimizeCrossings,
  getAllPrerequisitesRecursive,
} from "@/lib/course-layout";

// Register the dagre layout extension
if (!cytoscape.prototype.hasInitialised) {
  cytoscape.use(dagre);
  cytoscape.prototype.hasInitialised = true;
}

interface CourseGraphProps {
  courses: Course[];
  onCourseUpdate?: (updatedCourse: Course) => void;
}

export function CourseGraph({ courses, onCourseUpdate }: CourseGraphProps) {
  const cyRef = useRef<Core | null>(null);
  const [selectedNode, setSelectedNode] = useState<Course | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    let darkMode = document.documentElement.classList.contains("dark");

    if (!cyRef.current || courses.length === 0) return;

    // Apply the crossing minimization algorithm
    const coursesWithLayout = minimizeCrossings(courses);

    // Group courses by semester
    const semesterGroups: Record<number, Course[]> = {};
    coursesWithLayout.forEach((course) => {
      if (!semesterGroups[course.semester]) {
        semesterGroups[course.semester] = [];
      }
      semesterGroups[course.semester].push(course);
    });

    // Get min and max semester for layout
    const semesterNumbers = Object.keys(semesterGroups).map(Number);
    const maxSemester = Math.max(...semesterNumbers);
    const minSemester = Math.min(...semesterNumbers);

    // Create a continuous sequence of semesters with no gaps
    const availableSemesters = new Set(semesterNumbers);

    // Create elements for Cytoscape
    const elements: cytoscape.ElementDefinition[] = [];

    // Add semester divider nodes - only show semesters that actually have courses
    // Convert the Set to an array and sort it for consistent ordering
    const sortedSemesters = Array.from(availableSemesters).sort(
      (a, b) => a - b
    );

    // Calculate total columns needed based on semester course counts
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
          completed: false,
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

    // Add course nodes with column wrapping
    coursesWithLayout.forEach((course) => {
      const semesterCourses = semesterGroups[course.semester] || [];
      const courseIndex = semesterCourses.findIndex((c) => c.id === course.id);

      // Calculate which column and row this course should be in
      const coursesPerColumn = 5;
      const columnIndex = Math.floor(courseIndex / coursesPerColumn);
      const rowInColumn = courseIndex % coursesPerColumn;

      // Get the effective semester (completed courses go to first semester)
      const firstSemester = sortedSemesters[0];
      const effectiveSemester = course.completed
        ? firstSemester
        : course.semester || firstSemester;

      // Get semester column info
      const semesterInfo = semesterColumnInfo[effectiveSemester];
      const absoluteColumnIndex = semesterInfo.startColumn + columnIndex;

      // Calculate position
      const x = (absoluteColumnIndex + 1) * 200; // +1 to start from position 200, not 0

      // Calculate vertical position within the column
      const graphHeight = 600;
      const verticalSpacing = 100;
      const maxRowsInColumn = coursesPerColumn;
      const columnHeight = (maxRowsInColumn - 1) * verticalSpacing;
      const startY = (graphHeight - columnHeight) / 2 + 50; // Center vertically with some top offset
      const y = startY + rowInColumn * verticalSpacing;

      elements.push({
        data: {
          id: course.id,
          label: course.id,
          semester: effectiveSemester,
          completed: course.completed,
          credits: course.credits,
          description: course.description,
          prerequisites: course.prerequisites,
          type: "course",
        },
        position: { x, y },
        locked: true,
      });
    });

    // Add edges for prerequisites
    coursesWithLayout.forEach((course) => {
      course.prerequisites.forEach((prereqId) => {
        elements.push({
          data: {
            id: `${prereqId}-${course.id}`,
            source: prereqId,
            target: course.id,
            sourceSemester: courses.find((c) => c.id === prereqId)?.semester,
            type: "prerequisite", // Add an explicit type for prerequisites
          },
        });
      });
    });

    // Update the graph
    cyRef.current.elements().remove();
    cyRef.current.add(elements);

    // Apply styles
    cyRef.current.style([
      {
        selector: "node[type='course']",
        style: {
          // Removed background-color from here to let the completed state styles take precedence
          "background-opacity": 1,
          "border-width": 1,
          "border-color": "#666",
          width: 80,
          height: 80,
          "text-valign": "center",
          "text-halign": "center",
          color: () => {
            return darkMode ? "#fff" : "#000";
          },
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
          "background-color": "transparent", // Make background transparent
          "border-width": 0, // Remove border
          color: () => {
            return darkMode ? "#ddd" : "#444";
          },
          "font-weight": "bold",
          "font-size": "18px", // Slightly larger font
          "text-valign": "center",
          "text-halign": "center",
          label: "data(label)",
          "text-margin-y": 0,
          width: 1, // Minimal width since it's just text
          height: 1, // Minimal height since it's just text
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
          "background-color": () => {
            return darkMode ? "#ddd" : "#333";
          },
          "border-width": 0,
          opacity: 1, // Full opacity
        },
      },
      {
        selector: "node[type='course']",
        style: {
          "background-color": (ele) => {
            const isCompleted = ele.data("completed");
            if (isCompleted) {
              return darkMode ? "#4a5568" : "lightgray";
            } else {
              return darkMode ? "#2c5282" : "lightblue";
            }
          },
        },
      },
      {
        selector: "edge",
        style: {
          width: 2,
          "line-color": (ele) => {
            // Color based on source semester
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
          "target-arrow-color": (ele) => {
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
          // Add control points to curve around obstacles
          // "control-point-distances": [40, -40, 40],
          // "control-point-weights": [0.25, 0.5, 0.75],
          // Use intersection-line edge endpoint to better connect to nodes
          "source-endpoint": "outside-to-line",
          "target-endpoint": "outside-to-line",
          // Improve connector appearance
          "line-style": "solid",
          // Keep edge distances relative to nodes
          "edge-distances": "intersection",
          // Enhance visibility for accessibility while maintaining color scheme
          opacity: 0.9,
        },
      },
    ]);

    // Set up event handlers
    cyRef.current.on("mouseover", "node[type='course']", (event) => {
      const node = event.target;
      const courseId = node.id();
      const course = courses.find((c) => c.id === courseId);
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

    cyRef.current.on("mouseout", "node", () => {
      setSelectedNode(null);
    });

    // Add click handler to toggle course completion status
    cyRef.current.on("click", "node[type='course']", (event) => {
      const node = event.target;
      const courseId = node.id();
      const course = courses.find((c) => c.id === courseId);

      if (course && onCourseUpdate && cyRef.current) {
        const isNowCompleted = !course.completed;

        // If marking as completed, also mark all recursive prerequisites
        if (isNowCompleted) {
          const prereqs = getAllPrerequisitesRecursive(courseId, courses);
          prereqs.forEach((pr) => {
            onCourseUpdate({ ...pr, completed: true });
            cyRef.current!.getElementById(pr.id).data("completed", true);
          });
        }

        // Update clicked course
        const updated = { ...course, completed: isNowCompleted };
        onCourseUpdate(updated);
        node.data("completed", isNowCompleted);

        // Recalculate styles
        cyRef.current.style().update();
      }
    });

    // Fit the graph to the viewport
    cyRef.current.fit(undefined, 50);
    cyRef.current.center();
  }, [courses, onCourseUpdate]);

  const handleCytoscapeReady = (cy: Core) => {
    cyRef.current = cy;
  };

  return (
    <div className="relative w-full h-[600px] border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900">
      <CytoscapeComponent
        elements={[]} // We'll add elements in the useEffect
        style={{ width: "100%", height: "100%" }}
        cy={handleCytoscapeReady}
        // wheelSensitivity={0.2}
        boxSelectionEnabled={false}
      />

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
            {selectedNode.id}
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-300">
            Semester: {selectedNode.semester}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-300">
            Credits: {selectedNode.credits}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-300">
            Status: {selectedNode.completed ? "Completed" : "Not Completed"}
          </p>
          {selectedNode.prerequisites.length > 0 && (
            <p className="text-xs text-gray-600 dark:text-gray-300">
              Prerequisites: {selectedNode.prerequisites.join(", ")}
            </p>
          )}
          <p className="text-xs mt-1 dark:text-gray-300">
            {selectedNode.description}
          </p>
          <p className="text-xs mt-1 italic text-gray-500 dark:text-gray-400">
            Click to toggle completion status
          </p>
        </div>
      )}

      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 px-3 py-1 rounded-full shadow-md border border-gray-200 dark:border-gray-700 text-sm dark:text-gray-300 flex items-center space-x-4">
        <span>Drag to pan, scroll to zoom</span>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-gray-400 dark:bg-gray-500"></div>
          <span>Completed</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-blue-300 dark:bg-blue-700"></div>
          <span>Pending</span>
        </div>
      </div>
    </div>
  );
}
