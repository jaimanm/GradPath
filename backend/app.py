from flask import Flask, jsonify
from util.create_plan import plan
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/api/courses')
def get_courses():
    courses_data = [{
        'courseId': course.course_id,
        'name': course.name,
        'semester': course.semester,
        'completed': course.completed,
        'prerequisites': [p.course_id for p in course.prerequisites],
    } for course in plan.courses]
    # courses_data = [{
    #     "course_id": "CMSC131",
    #     "name": "Introduction to Programming I",
    #     "semester": 1,
    #     "completed": True,
    #     "prerequisites": []
    # }]
    
    return jsonify({'courses': courses_data})

if __name__ == '__main__':
    app.run(debug=True)