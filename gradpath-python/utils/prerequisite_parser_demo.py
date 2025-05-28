import json
import random
import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

def get_random_prereq():
    with open("data/prerequisites.json") as f:
        prereq_dict = json.load(f)
    # Filter out empty or None prerequisites
    nonempty = [(k, v) for k, v in prereq_dict.items() if v and v.strip()]
    if not nonempty:
        print("No non-empty prerequisite strings found.")
        return None, None
    course, prereq = random.choice(nonempty)
    return course, prereq

def parse_prerequisite_llm(expr: str):
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise RuntimeError("OPENROUTER_API_KEY environment variable not set.")
    client = OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=api_key,
    )
    prompt = (
        "Extract the course prerequisites from the following string and represent them as a JSON expression tree using 'and', 'or', and 'course' nodes. "
        "Ignore grade requirements, permissions, and non-course requirements. "
        "Return only the JSON object.\n\n"
        "Template for the output structure (use this format):\n"
        "{\n  'type': 'and' | 'or' | 'course' | 'none',\n  'children': [ ... ] // for 'and' or 'or'\n  'course': 'COURSE_CODE' // for 'course'\n}\n\n"
        f"String: \"{expr}\""
    )
    print("\n--- PROMPT TO LLM ---\n" + prompt + "\n--- END PROMPT ---\n")
    completion = client.chat.completions.create(
        extra_headers={
            "HTTP-Referer": "https://openrouter.ai/",  # Optional
            "X-Title": "GradPath Prerequisite Parser",  # Optional
        },
        extra_body={},
        model="deepseek/deepseek-r1:free",
        messages=[
            {"role": "user", "content": prompt}
        ]
    )
    response = completion.choices[0].message.content
    # Extract JSON from response
    json_start = response.find('{')
    json_end = response.rfind('}') + 1
    if json_start == -1 or json_end == -1 or json_end <= json_start:
        raise ValueError("No JSON object found in LLM response.")
    json_str = response[json_start:json_end]
    return json.loads(json_str)

def main():
    course, prereq = get_random_prereq()
    if not prereq:
        return
    print(f"Random course: {course}")
    print(f"Prerequisite string: {prereq}")
    print("\nParsed prerequisite tree (via LLM):")
    parsed = parse_prerequisite_llm(prereq)
    print(json.dumps(parsed, indent=2))

if __name__ == "__main__":
    main()
