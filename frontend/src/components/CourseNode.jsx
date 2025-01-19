export const CourseNode = ({ data }) => {
  return (
    <div className={`course-node ${data.completed ? 'completed' : 'planned'}`}>
      <div className="course-id">{data.id}</div>
    </div>
  );
};
