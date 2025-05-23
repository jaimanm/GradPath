import { Prerequisite } from "./types";

// Utility to load prerequisites from the parsed_prerequisites_cleaned.json file
export async function getCoursePrerequisites(
  courseId: string
): Promise<any | null> {
  try {
    const res = await fetch("parsed_prerequisites_cleaned.json");
    if (!res.ok) return null;
    const data = await res.json();
    return data[courseId] || null;
  } catch (e) {
    return null;
  }
}

/**
 * Given a prerequisite tree (from parsed_prerequisites_cleaned.json),
 * return all possible ordered lists of prerequisites (each list is a valid path).
 * For example, for an 'or' node, return all possible branches; for 'and', combine all children.
 * This version recursively expands prerequisites of prerequisites.
 */
export async function getAllPrerequisitePaths(
  prereq: Prerequisite
): Promise<string[][]> {
  if (prereq.type === "course" && prereq.course) {
    const courseId = prereq.course;
    const prerequisite = await getCoursePrerequisites(courseId);
    if (!prerequisite) {
      return [[courseId]];
    }
    const subPaths = await getAllPrerequisitePaths(prerequisite);
    return subPaths.map((path) => [
      courseId,
      ...path.filter((c): c is string => typeof c === "string"),
    ]);
  }

  if (prereq.type === "and" && prereq.children) {
    // For 'and', combine all children (cartesian product)
    let paths: string[][] = [[]];
    for (const child of prereq.children) {
      const childPaths = await getAllPrerequisitePaths(child);
      const newPaths: string[][] = [];
      for (const path of paths) {
        for (const childPath of childPaths) {
          newPaths.push([...path, ...childPath]);
        }
      }
      paths = newPaths;
    }
    return paths;
  }

  if (prereq.type === "or" && prereq.children) {
    // For 'or', return all possible branches
    let paths: string[][] = [];
    for (const child of prereq.children) {
      const childPaths = await getAllPrerequisitePaths(child);
      paths = paths.concat(childPaths);
    }
    return paths;
  }

  return [];
}

function getRecursivePrerequisites() {
  // get prerequisites recursively
}
