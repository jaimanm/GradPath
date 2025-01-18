// App.jsx
import { useState, useEffect } from 'react';
import {CourseGraph} from './components/CourseGraph';
import 'reactflow/dist/style.css';

const App = () => {

  const [courses, setCourses] = useState([]);

  useEffect(() => {
    // Fetch courses from an API or other source
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    // Replace with your actual data fetching logic
    const response = await fetch('http://127.0.0.1:5000/api/courses')
    const data =(await response.json()).courses
    const coursesWithPosition = data.map((course, index) => ({
      ...course,
      semesterIndex: getSemesterIndex(course, data)
    }))
    setCourses(coursesWithPosition)
    console.log(coursesWithPosition)
  };

  // Calculate vertical position within semester
  const getSemesterIndex = (course, allCourses) => {
    const sameSemesterCourses = allCourses.filter(
      c => c.semester === course.semester
    );
    return sameSemesterCourses.indexOf(course);
  };

  return (
    <div className="app">
      <h1 style={{ textAlign: 'center', marginBottom: '20px' }}>
        Course Prerequisite Diagram
      </h1>
      <CourseGraph courses={courses} />
    </div>
  );
};

export default App;
