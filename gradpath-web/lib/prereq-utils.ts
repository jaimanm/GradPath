import { Prerequisite } from "./types";

export function getExamplePrerequisites(): Prerequisite {
  return {
    type: "and",
    children: [
      {
        type: "or",
        children: [
          { type: "course", course: "courseB" },
          { type: "course", course: "courseD" },
        ],
      },
      { type: "course", course: "courseC" },
    ],
  } as Prerequisite;
}

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
 * Recursively expands a prerequisite tree so that all leaf nodes are courses with no further prerequisites.
 * This makes it easier to enumerate all minimal prerequisite paths.
 * Prevents cycles using a visited set.
 */
export async function buildPrereqTree(
  prereq: Prerequisite, // The prerequisite tree to recursively expand
  visited: Set<string> = new Set(), // Set to track visited nodes, prevents cycles
  parentCourseId?: string // New: parent course id for labeling
): Promise<Prerequisite> {
  // for courses
  if (prereq.type === "course") {
    const courseId = prereq.course;
    if (visited.has(courseId)) {
      // cycle detected - return as a leaf node
      // to prevent infinitely deep tree
      // Add parent field if applicable
      return parentCourseId ? { ...prereq, parent: parentCourseId } : prereq;
    } else {
      visited.add(courseId); // mark as visited before proceeding
    }

    const coursePrereqs = await getCoursePrerequisites(courseId);
    if (coursePrereqs) {
      // not a leaf node - keep branching deeper
      return {
        type: "and",
        children: [
          await buildPrereqTree(coursePrereqs, new Set(visited), courseId),
          parentCourseId ? { ...prereq, parent: parentCourseId } : prereq,
        ],
      } as Prerequisite;
    } else {
      // leaf node - no more prerequisites
      return parentCourseId ? { ...prereq, parent: parentCourseId } : prereq;
    }
  }
  // for "and" and "or" nodes
  else {
    // expand all children into their own trees
    const expandedChildren = await Promise.all(
      prereq.children.map((child) =>
        buildPrereqTree(child, new Set(visited), parentCourseId)
      )
    );
    // If only one child, replace this node with the child
    if (expandedChildren.length === 1) {
      return expandedChildren[0];
    }
    return {
      type: prereq.type,
      children: expandedChildren,
    } as Prerequisite;
  }
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
  if (prereq.type === "course") {
    line += `course: ${prereq.course}`;
    if ((prereq as any).parent) {
      line += ` (parent: ${(prereq as any).parent})`;
    }
  } else {
    line += prereq.type;
  }
  let result = line + "\n";
  if (prereq.type != "course" && prereq.children.length > 0) {
    const nextIndent = indent + (isLast ? "   " : "│  ");
    prereq.children.forEach((child, idx) => {
      result += visualizePrereqTree(
        child,
        nextIndent,
        idx === prereq.children.length - 1
      );
    });
  }
  return result;
}
