// CourseModal.jsx
export const CourseModal = ({ course, onClose }) => {
  if (!course) return null;

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>{course.courseId}</h2>
        <p>Credits: {course.credits}</p>
        <p>Semester: {course.semester}</p>
        <p>Prerequisites: {course.prerequisites.join(', ')}</p>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};
