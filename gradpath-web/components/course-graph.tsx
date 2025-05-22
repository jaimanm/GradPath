"use client";

import { useEffect, useRef, useState } from "react";
import CytoscapeComponent from "react-cytoscapejs";
import cytoscape from "cytoscape";
import dagre from "cytoscape-dagre";
import type { Core } from "cytoscape";
import type { Course } from "@/lib/types";
import { minimizeCrossings } from "@/lib/course-layout";

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

    // Log for debugging
    console.log("Semester groups:", Object.keys(semesterGroups));
    console.log("Min semester:", minSemester);
    console.log("Max semester:", maxSemester);

    // Create a continuous sequence of semesters with no gaps
    const availableSemesters = new Set(semesterNumbers);

    // Create elements for Cytoscape
    const elements: cytoscape.ElementDefinition[] = [];

    // Add semester divider nodes - only show semesters that actually have courses
    // Convert the Set to an array and sort it for consistent ordering
    const sortedSemesters = Array.from(availableSemesters).sort(
      (a, b) => a - b
    );

    sortedSemesters.forEach((semesterNum, index) => {
      const xPosition = (index + 1) * 200; // +1 because we want to start from position 1, not 0

      elements.push({
        data: {
          id: `semester-${semesterNum}`,
          label: `Semester ${semesterNum}`,
          type: "semester",
          completed: false,
        },
        position: { x: xPosition, y: 30 }, // Positioned at top
        locked: true,
      });

      // Add vertical divider line between semesters (except for the first one)
      if (index > 0) {
        // This divider goes between the previous and current semester
        const dividerX = xPosition - 100; // Halfway between columns

        // Calculate height based on number of courses in adjacent semesters
        const prevSemesterCourseCount =
          semesterGroups[sortedSemesters[index - 1]]?.length || 0;
        const currSemesterCourseCount =
          semesterGroups[semesterNum]?.length || 0;
        const maxCourseCount = Math.max(
          prevSemesterCourseCount,
          currSemesterCourseCount
        );

        // Calculate divider height - ensure it's at least 500px tall and extends based on course count
        const verticalSpacing = 100; // Same as course spacing

        // Create a proper divider using a straight edge that won't bend
        elements.push({
          data: {
            id: `semester-divider-${semesterNum}`,
            type: "divider",
            height: 600,
            color: "#000000", // Add explicit color data
          },
          position: {
            // Just add a single node with special styling rather than an edge
            x: dividerX,
            y: 350, // Adjusted to better center the divider in relation to courses
          },
          locked: true,
          classes: ["divider-node"], // Add a class for more specific styling
        });
      }
    });

    // Add course nodes
    coursesWithLayout.forEach((course) => {
      const semesterCourses = semesterGroups[course.semester] || [];
      const courseIndex = semesterCourses.findIndex((c) => c.id === course.id);
      const totalCourses = semesterCourses.length;

      // Calculate vertical position based on the course's position in the semester
      // and center the courses vertically
      // Calculate startY so that courses are vertically centered in the graph area
      const maxCoursesInSemester = Math.max(
        ...Object.values(semesterGroups).map((group) => group.length)
      );
      const graphHeight = 600; // Should match the container height
      const verticalSpacing = 100;
      const totalMaxHeight = (maxCoursesInSemester - 1) * verticalSpacing;
      const startY = graphHeight / 2 + totalMaxHeight / 2;
      const totalHeight = (totalCourses - 1) * verticalSpacing;
      const y = startY + courseIndex * verticalSpacing - totalHeight / 2;

      // Get position in the available semesters array
      // This ensures that courses are positioned with no gaps even if semesters aren't continuous
      const effectiveSemester = course.semester || 1;
      const semesterIndex =
        Array.from(availableSemesters).indexOf(effectiveSemester) + 1;

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
        position: { x: semesterIndex * 200, y },
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
          "background-color": "data(color)", // Use the color from the data
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
        selector: "edge:not([type='divider'])",
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

      if (course && onCourseUpdate) {
        // Toggle the completed status
        const updatedCourse = { ...course, completed: !course.completed };
        onCourseUpdate(updatedCourse);

        // Update the node data
        node.data("completed", updatedCourse.completed);

        // The background-color will update automatically since it's a function of the data
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
        wheelSensitivity={0.2}
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
