from flask import Flask, jsonify
from flask_cors import CORS
from util.create_plan import plan

app = Flask(__name__)
CORS(app)

@app.route('/api/courses', methods=['GET'])
def get_courses():
    # Convert your Python Course objects to dictionaries
    courses_data = [{
        'courseId': course.course_id,
        'credits': course.credits,
        'semester': course.semester,
        'prerequisites': [prereq.course_id for prereq in course.prerequisites],
        'completed': course.completed
    } for course in plan.courses]
    
    return jsonify({'courses': courses_data})

if __name__ == '__main__':
    app.run(debug=True)
