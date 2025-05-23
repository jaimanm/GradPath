import { Prerequisite, CourseJson } from "./types";

// Utility to load prerequisites from the parsed_prerequisites_cleaned.json file
export async function getCoursePrerequisites(
  courseId: string
): Promise<Prerequisite | null> {
  try {
    const res = await fetch("parsed_prerequisites_cleaned.json");
    if (!res.ok) return null;
    const data = await res.json();
    return data[courseId] || null;
  } catch (e) {
    return null;
  }
}

// Utility to load all courses from the courses.json file
export async function getAllCourses(): Promise<any | null> {
  try {
    const res = await fetch("courses.json");
    if (!res.ok) return null;
    const data = await res.json();
    return data || null;
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
export function getAllPrerequisitePaths(prereq: Prerequisite): string[][] {
  console.log(prereq);

  if (prereq.type === "course" && prereq.course) {
    // Base case: single course
    return [[prereq.course]];
  } else if (prereq.type === "or" && prereq.children) {
    // Branching: flatten all possible paths from each child
    return prereq.children.flatMap((child) => getAllPrerequisitePaths(child));
  } else if (prereq.type === "and" && prereq.children) {
    // Cartesian product: combine all paths from each child
    // Start with [[]] so we can build up the product
    return prereq.children.reduce<string[][]>(
      (acc, child) => {
        const childPaths = getAllPrerequisitePaths(child);
        // For each path so far, append each child path
        const newAcc: string[][] = [];
        for (const path of acc) {
          for (const childPath of childPaths) {
            newAcc.push([...path, ...childPath]);
          }
        }
        return newAcc;
      },
      [[]]
    );
  }
  // If the node is malformed, return empty array
  return [];
}

/**
 * Recursively expands a prerequisite tree so that all leaf nodes are courses with no further prerequisites.
 * This makes it easier to enumerate all minimal prerequisite paths.
 * Prevents cycles using a visited set.
 * Annotates each node with prerequisites and parents as it is expanded.
 */
export async function expandPrereqTree(
  prereq: Prerequisite,
  visited: Set<string> = new Set(),
  parentCourses: string[] = []
): Promise<Prerequisite> {
  // Annotate parents for this node
  prereq.parents = parentCourses;

  if (prereq.type === "course" && prereq.course) {
    if (visited.has(prereq.course)) {
      prereq.prerequisites = [];
      return prereq;
    }
    visited.add(prereq.course);
    const subTree = await getCoursePrerequisites(prereq.course);
    if (subTree) {
      // Recursively expand the subtree, passing this course as parent
      const expandedSubTree = await expandPrereqTree(subTree, new Set(visited), [prereq.course]);
      // The prerequisites for this course are the direct child course IDs in the expanded subtree
      let prereqCourses: string[] = [];
      if (expandedSubTree.type === "course" && expandedSubTree.course) {
        prereqCourses = [expandedSubTree.course];
      } else if (expandedSubTree.children) {
        prereqCourses = expandedSubTree.children
          .filter((child) => child.type === "course" && child.course)
          .map((child) => child.course!);
      }
      return {
        type: "and",
        children: [expandedSubTree, { type: "course", course: prereq.course, parents: parentCourses, prerequisites: prereqCourses }],
        parents: parentCourses,
        prerequisites: prereqCourses,
      };
    } else {
      // This is a true leaf
      prereq.prerequisites = [];
      return prereq;
    }
  } else if (prereq.children) {
    // Recursively expand all children, passing this node's course (if any) as parent
    prereq.children = await Promise.all(
      prereq.children.map((child) => expandPrereqTree(child, new Set(visited), parentCourses))
    );
    // Gather direct child course IDs
    const childCourseIds: string[] = prereq.children
      .filter((child) => child.type === "course" && child.course)
      .map((child) => child.course!);
    prereq.prerequisites = childCourseIds;
    return prereq;
  }
  // Fallback for malformed node
  prereq.prerequisites = [];
  return prereq;
}

/**
 * Given a fully expanded prerequisite tree (all leaves are base courses),
 * return all possible ordered lists of prerequisites (each list is a valid path).
 * For example, for an 'or' node, return all possible branches; for 'and', combine all children.
 * Each path contains only unique course IDs.
 */
export function getAllPathsFromExpandedTree(prereq: Prerequisite): string[][] {
  if (prereq.type === "course" && prereq.course) {
    return [[prereq.course]];
  } else if (prereq.type === "or" && prereq.children) {
    return prereq.children.flatMap(getAllPathsFromExpandedTree);
  } else if (prereq.type === "and" && prereq.children) {
    return prereq.children.reduce<string[][]>(
      (acc, child) => {
        const childPaths = getAllPathsFromExpandedTree(child);
        const newAcc: string[][] = [];
        for (const path of acc) {
          for (const childPath of childPaths) {
            // Merge and deduplicate
            newAcc.push(Array.from(new Set([...path, ...childPath])));
          }
        }
        return newAcc;
      },
      [[]]
    );
  }
  return [];
}

/**
 * Returns a string visualization of a prerequisite tree, with indentation and branch characters.
 * Example:
 * and
 * ├─ and
 * │  ├─ course: CMSC131
 * │  └─ ...
 * └─ course: CMSC132
 */
export function visualizePrereqTree(
  prereq: Prerequisite,
  indent: string = "",
  isLast: boolean = true
): string {
  let line = indent;
  if (indent) {
    line += isLast ? "└─ " : "├─ ";
  }
  if (prereq.type === "course" && prereq.course) {
    line += `course: ${prereq.course}`;
    if (prereq.prerequisites && prereq.prerequisites.length > 0) {
      line += ` | prerequisites: [${prereq.prerequisites.join(", ")}]`;
    }
    if (prereq.parents && prereq.parents.length > 0) {
      line += ` | parents: [${prereq.parents.join(", ")}]`;
    }
  } else {
    line += prereq.type;
    if (prereq.prerequisites && prereq.prerequisites.length > 0) {
      line += ` | prerequisites: [${prereq.prerequisites.join(", ")}]`;
    }
    if (prereq.parents && prereq.parents.length > 0) {
      line += ` | parents: [${prereq.parents.join(", ")}]`;
    }
  }
  let result = line + "\n";
  if (prereq.children && prereq.children.length > 0) {
    const nextIndent = indent + (isLast ? "   " : "│  ");
    prereq.children.forEach((child, idx) => {
      result += visualizePrereqTree(
        child,
        nextIndent,
        idx === prereq.children!.length - 1
      );
    });
  }
  return result;
}
