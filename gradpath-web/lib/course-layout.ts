import type { Course, CourseNode, CourseEdge } from "./types";

// Assign vertical positions to minimize edge crossings
export function minimizeCrossings(courses: Course[]): Course[] {
  const updatedCourses = JSON.parse(JSON.stringify(courses)) as Course[];

  // Group courses by semester
  const semesterGroups: Record<number, Course[]> = {};
  updatedCourses.forEach((course) => {
    if (!semesterGroups[course.semester]) {
      semesterGroups[course.semester] = [];
    }
    semesterGroups[course.semester].push(course);
  });

  // Start with semester 1 and assign arbitrary vertical positions
  if (semesterGroups[1]) {
    semesterGroups[1].forEach((course, i) => {
      course.verticalPosition = i;
    });
  }

  // Process remaining semesters in order
  const maxSemester = Math.max(...Object.keys(semesterGroups).map(Number));
  for (let semester = 2; semester <= maxSemester; semester++) {
    if (!semesterGroups[semester]) continue;

    const coursesInSemester = semesterGroups[semester];
    const coursePositions: Record<string, number> = {};

    coursesInSemester.forEach((course) => {
      // Find prerequisites in our course list
      const prereqPositions = course.prerequisites
        .map((prereqId) => {
          const prereqCourse = updatedCourses.find((c) => c.id === prereqId);
          return prereqCourse?.verticalPosition;
        })
        .filter((pos): pos is number => pos !== undefined);

      if (prereqPositions.length > 0) {
        // Average position of prerequisites
        coursePositions[course.id] =
          prereqPositions.reduce((a, b) => a + b, 0) / prereqPositions.length;
      } else {
        // For courses with no prerequisites, use a default position
        coursePositions[course.id] = Number.MAX_SAFE_INTEGER; // Place at bottom
      }
    });

    // Sort and assign new positions
    const sortedCourses = [...coursesInSemester].sort(
      (a, b) => (coursePositions[a.id] || 0) - (coursePositions[b.id] || 0)
    );

    sortedCourses.forEach((course, i) => {
      course.verticalPosition = i;
    });
  }

  return updatedCourses;
}

// Assign semesters to courses based on prerequisites
export function assignSemesters(courses: Course[]): Course[] {
  const updatedCourses = JSON.parse(JSON.stringify(courses)) as Course[];

  // Create a graph representation
  const graph: Record<string, string[]> = {};
  const inDegree: Record<string, number> = {};

  // Initialize graph and in-degree for all courses
  updatedCourses.forEach((course) => {
    graph[course.id] = [];
    inDegree[course.id] = 0;
  });

  // Build the prerequisite graph
  updatedCourses.forEach((course) => {
    course.prerequisites.forEach((prereqId) => {
      if (graph[prereqId]) {
        graph[prereqId].push(course.id);
        inDegree[course.id] = (inDegree[course.id] || 0) + 1;
      }
    });
  });

  // Initialize queue with courses that have no prerequisites
  let queue = updatedCourses
    .filter((course) => inDegree[course.id] === 0)
    .map((course) => course.id);

  let semester = 1;
  const semesterAssignments: Record<string, number> = {};

  while (queue.length > 0) {
    const currentSemesterCourses: string[] = [];

    for (let i = 0; i < queue.length; i++) {
      const courseId = queue[i];
      semesterAssignments[courseId] = semester;

      graph[courseId].forEach((neighborId) => {
        inDegree[neighborId]--;
        if (inDegree[neighborId] === 0) {
          currentSemesterCourses.push(neighborId);
        }
      });
    }

    queue = currentSemesterCourses;
    semester++;
  }

  // Assign semesters
  updatedCourses.forEach((course) => {
    if (!course.completed) {
      course.semester = semesterAssignments[course.id] || 1;
    } else {
      course.semester = 1; // Completed courses go in semester 1
    }
  });

  // Compress semester numbers to ensure no gaps between semesters
  const usedSemesters = new Set<number>();
  updatedCourses.forEach((course) => {
    usedSemesters.add(course.semester);
  });

  const sortedUsedSemesters = Array.from(usedSemesters).sort((a, b) => a - b);
  const semesterMap: Record<number, number> = {};

  sortedUsedSemesters.forEach((oldSem, index) => {
    semesterMap[oldSem] = index + 1; // New semester numbers start from 1
  });

  // Apply the new semester numbers
  updatedCourses.forEach((course) => {
    course.semester = semesterMap[course.semester];
  });

  return updatedCourses;
}

// Get all prerequisites recursively
export function getAllPrerequisitesRecursive(
  courseId: string,
  allCourses: Course[],
  visited: Set<string> = new Set()
): Course[] {
  if (visited.has(courseId)) {
    return [];
  }

  visited.add(courseId);
  const allPrereqs: Course[] = [];

  const course = allCourses.find((c) => c.id === courseId);
  if (!course) return [];

  for (const prereqId of course.prerequisites) {
    const prereqCourse = allCourses.find((c) => c.id === prereqId);
    if (prereqCourse) {
      allPrereqs.push(prereqCourse);
      const nestedPrereqs = getAllPrerequisitesRecursive(
        prereqId,
        allCourses,
        visited
      );
      allPrereqs.push(...nestedPrereqs);
    }
  }

  return allPrereqs;
}

export function createGraphData(courses: Course[]) {
  const nodes: CourseNode[] = courses.map((course) => ({
    id: course.id,
    semester: course.semester,
    completed: course.completed,
    x: course.semester * 200,
    y: (course.verticalPosition || 0) * 100 + 100,
    prerequisites: course.prerequisites,
    credits: course.credits,
    description: course.description,
  }));

  const edges: CourseEdge[] = [];
  courses.forEach((course) => {
    course.prerequisites.forEach((prereqId) => {
      const sourceNode = nodes.find((node) => node.id === prereqId);
      const targetNode = nodes.find((node) => node.id === course.id);

      if (sourceNode && targetNode) {
        edges.push({
          id: `${prereqId}-${course.id}`,
          source: prereqId,
          target: course.id,
          sourceX: sourceNode.x,
          sourceY: sourceNode.y,
          targetX: targetNode.x,
          targetY: targetNode.y,
        });
      }
    });
  });

  return { nodes, edges };
}
