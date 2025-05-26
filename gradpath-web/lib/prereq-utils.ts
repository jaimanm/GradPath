import { Prerequisite } from "./types";

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

// Utility to load all course ids from the courses.json file
export async function getAllCourseIds(): Promise<string[] | null> {
  try {
    const res = await fetch("courses.json");
    if (!res.ok) return null;
    const data = await res.json();
    // Try to get id, course_id, or fallback to string
    return data.map((course: any) => course.course_id).filter(Boolean);
  } catch (e) {
    return null;
  }
}

/**
 * Recursively expands a prerequisite tree so that all leaf nodes are courses with no further prerequisites.
 * This makes it easier to enumerate all minimal prerequisite paths.
 * Prevents cycles using a visited set.
 */
export async function expandPrereqTree(
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
          await expandPrereqTree(coursePrereqs, new Set(visited), courseId),
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
        expandPrereqTree(child, new Set(visited), parentCourseId)
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
      line += ` (p: ${(prereq as any).parent})`;
    }
    if ((prereq as any).semester) {
      line += ` [s: ${(prereq as any).semester}]`;
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

/**
 * Splits an expanded prerequisite tree at each "or" node.
 * Returns a list of trees, each of which have no "or" nodes.
 */
export function splitPrereqTree(node: Prerequisite): Prerequisite[] {
  function helper(n: Prerequisite): Prerequisite[] {
    if (n.type === "course") {
      return [{ ...n }];
    }
    if (n.type === "or") {
      // For each child, return the tree with the 'or' replaced by that child
      let result: Prerequisite[] = [];
      for (const child of n.children) {
        // For each split of the child, return it directly (replacing the 'or' node)
        const childSplits = helper(child);
        result.push(...childSplits);
      }
      return result;
    }
    if (n.type === "and") {
      // For each child, get all splits
      const childSplitsList = n.children.map(helper); // Array of arrays of Prerequisite
      // Cartesian product of all child splits
      function cartesianProduct<T>(arr: T[][]): T[][] {
        return arr.reduce<T[][]>(
          (a, b) =>
            a
              .map((x) => b.map((y) => x.concat([y])))
              .reduce((a, b) => a.concat(b), []),
          [[]]
        );
      }
      const combos = cartesianProduct(childSplitsList);
      // For each combination, reconstruct the 'and' node
      return combos.map(
        (combo) => ({ type: "and", children: combo } as Prerequisite)
      );
    }
    return [];
  }
  return helper(node);
}

/**
 * Assigns semesters to each course node based on prerequisite relationships.
 * Courses that are not a prerequisite for any other course (i.e., not a parent of any course) are assigned semester 1.
 * Then, their parents are assigned semester 2, and so on, until all courses are assigned.
 * Returns the max semester assigned.
 */
export function assignSemesters(node: Prerequisite): number {
  // Build: courseNodes (courseId -> node), parentMap (courseId -> parentId), childMap (parentId -> Set of childIds)
  const courseNodes: Record<string, any> = {};
  const parentMap: Record<string, string | undefined> = {};
  const childMap: Record<string, Set<string>> = {};

  function collect(n: Prerequisite, parent?: string) {
    if (n.type === "course") {
      courseNodes[n.course] = n;
      if ((n as any).parent) {
        parentMap[n.course] = (n as any).parent;
        if (!childMap[(n as any).parent])
          childMap[(n as any).parent] = new Set();
        childMap[(n as any).parent].add(n.course);
      }
    } else if (n.children) {
      n.children.forEach((child) => collect(child, parent));
    }
  }
  collect(node);

  // Find all courses that are NOT a parent of any other course (i.e., not in childMap keys)
  const allCourses = Object.keys(courseNodes);
  const isParent = new Set(Object.keys(childMap));
  let semesterMap: Record<string, number> = {};
  let queue: string[] = allCourses.filter((c) => !isParent.has(c));
  let semester = 1;
  let visited = new Set<string>();

  while (queue.length > 0) {
    let nextQueue: string[] = [];
    for (const course of queue) {
      if (visited.has(course)) continue;
      semesterMap[course] = semester;
      courseNodes[course].semester = semester;
      visited.add(course);
      // Assign parent for next round
      const parent = parentMap[course];
      if (parent && !visited.has(parent)) {
        // Only add parent if all its children have been assigned
        const allChildren = childMap[parent] || new Set();
        if (Array.from(allChildren).every((child) => visited.has(child))) {
          nextQueue.push(parent);
        }
      }
    }
    queue = nextQueue;
    semester++;
  }
  return Math.max(...Object.values(semesterMap));
}
