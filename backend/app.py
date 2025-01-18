from flask import Flask, jsonify
from flask_cors import CORS
from util.create_plan import plan
import json

app = Flask(__name__)
CORS(app)

@app.route('/api/courses', methods=['GET'])
def get_courses():
    # Convert your Python Course objects to dictionaries
    return str(plan.courses)

if __name__ == '__main__':
    app.run(debug=True)
