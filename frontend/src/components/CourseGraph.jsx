// CourseGraph.jsx
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap 
} from 'reactflow';
import 'reactflow/dist/style.css';

export const CourseGraph = ({ courses }) => {
  const courseIndexMap = {};
  courses.forEach(course => {
    courseIndexMap[course.courseId] = course.semesterIndex;
  });

  const nodes = courses.map(course => ({
    id: course.courseId + course.semesterIndex,
    data: { 
      label: course.courseId,
      ...course
    },
    position: {
      x: course.semester * 250,
      y: course.semesterIndex * 100
    },
    sourcePosition: 'right',
    targetPosition: 'left',
    style: {
      background: course.completed ? '#D3D3D3' : '#ADD8E6',
      padding: 10,
      borderRadius: '50%',
      width: 100,
      height: 100,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    }
  }));

  let edges = []
  courses.forEach(course => {
    if (course.prerequisites.length > 0) {
      course.prerequisites.forEach(prereqName => {
        let prereq = courses.find(c => c.courseId === prereqName);
        edges.push({
          id: `${prereq.courseId}-${course.courseId}`,
          source: prereq.courseId + courseIndexMap[prereq.courseId],
          target: course.courseId + course.semesterIndex,
          type: 'bezier',
          animated: false,
          style: { stroke: '#999' },
          markerEnd: {
            type: 'arrowclosed'
          }
        });
      });
    }
  });


  // Handle node click for course details
  const onNodeClick = (event, node) => {
    // Show modal with course details
    setSelectedCourse(node.data);
    setShowModal(true);
  };

  return (
    <div style={{ height: '100vh', width: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodeClick={onNodeClick}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
};
