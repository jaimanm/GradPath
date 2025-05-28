import { useEffect, useState } from "react";
import { Prerequisite } from "@/lib/types";
import {
  visualizePrereqTree,
  splitPrereqTree,
  assignSemesters,
  expandPrereqTree,
} from "@/lib/prereq-utils";

export function PrereqTreeSection({
  title,
  tree,
  isExample = false,
}: {
  title: string;
  tree: Prerequisite;
  isExample?: boolean;
}) {
  const [expandedTree, setExpandedTree] = useState<Prerequisite | null>(
    isExample ? tree : null
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isExample) {
      setLoading(true);
      expandPrereqTree(tree).then((result) => {
        setExpandedTree(result);
        setLoading(false);
      });
    }
  }, [tree, isExample]);

  if (!isExample && loading) {
    return <div>Loading prerequisites...</div>;
  }
  if (!isExample && !expandedTree) {
    return <div>No prerequisites</div>;
  }

  const displayTree = isExample ? tree : expandedTree;
  const split = splitPrereqTree(displayTree!);
  const useGrid = split.length > 4;
  return (
    <div>
      <div className="font-semibold mb-1">{title}</div>
      <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded text-xs overflow-x-auto">
        {visualizePrereqTree(displayTree!)}
      </pre>
      <div className="font-light mt-2 mb-1">
        Split {title.toLowerCase()}: {split.length} trees
      </div>
      <div
        className={
          useGrid
            ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
            : "flex flex-col gap-4"
        }
      >
        {split.map((subtree, idx) => {
          const maxSemester = assignSemesters(subtree);
          return (
            <pre
              key={idx}
              className="bg-gray-100 dark:bg-gray-800 p-4 rounded text-xs overflow-x-auto"
            >
              {visualizePrereqTree(subtree) + "\nMax Semester: " + maxSemester}
            </pre>
          );
        })}
      </div>
    </div>
  );
}
