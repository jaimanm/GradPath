export const CourseDetails = ({ course, onClose }) => {
  return (
    <div className="course-details-modal">
      <div className="modal-content">
        <h2>{course.courseId}</h2>
        <div className="course-info">
          <p>Credits: {course.credits}</p>
          <p>Prerequisites: {course.prerequisites.join(', ')}</p>
          <p>Status: {course.completed ? 'Completed' : 'Planned'}</p>
        </div>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};
