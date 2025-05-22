from openai import OpenAI
from dotenv import load_dotenv
import os
import json
import time

load_dotenv()

BATCH_SIZE = 300  # Adjust as needed


def build_prompt(batch):
    prompt = (
        "For each prerequisite string below, extract the course prerequisites and represent them as a JSON expression tree using 'and', 'or', and 'course' nodes. "
        "Ignore grade requirements, permissions, and non-course requirements. "
        "Return a JSON object mapping course codes to their prerequisite trees.\n\n"
    )
    for course, prereq in batch.items():
        prompt += f"{course}: \"{prereq}\"\n"
    prompt += "\nExample output:\n{\n  \"COURSE123\": {\"type\": \"and\", \"courses\": [ ... ] }, ...\n}\n"
    return prompt


def call_openrouter_llm(prompt):
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise RuntimeError("OPENROUTER_API_KEY environment variable not set.")
    client = OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=api_key,
    )
    completion = client.chat.completions.create(
        extra_headers={
            "HTTP-Referer": "https://openrouter.ai/",  # Optional
            "X-Title": "GradPath Prerequisite Parser",  # Optional
        },
        extra_body={},
        model="deepseek/deepseek-r1:free",  # Free model
        messages=[
            {"role": "user", "content": prompt}
        ]
    )
    return completion.choices[0].message.content


def parse_prerequisite_expr(expr: str):
    """
    Dummy parser for demo: returns a simple structure for a single course code or 'none'.
    Replace with your real parser logic as needed.
    """
    expr = expr.strip()
    if not expr or expr.lower() == 'none':
        return {"type": "none"}
    # Very basic: just return the string as a course node
    return {"type": "course", "course": expr}


def main():
    with open("data/prerequisites.json") as f:
        prereq_dict = json.load(f)

    course_items = list(prereq_dict.items())
    results = {}

    for i in range(0, len(course_items), BATCH_SIZE):
        batch = dict(course_items[i:i+BATCH_SIZE])
        prompt = build_prompt(batch)
        print(f"Processing batch {i//BATCH_SIZE + 1}...")
        try:
            llm_response = call_openrouter_llm(prompt)
            # Save raw response for debugging
            with open(f"data/llm_raw_batch_{i//BATCH_SIZE + 1}.txt", "w") as rawf:
                rawf.write(llm_response if llm_response else "<EMPTY RESPONSE>")
            if not llm_response or llm_response.strip() == "":
                raise ValueError("LLM response was empty.")
            # Try to extract the JSON from the response
            json_start = llm_response.find('{')
            json_end = llm_response.rfind('}') + 1
            if json_start == -1 or json_end == -1 or json_end <= json_start:
                raise ValueError("No JSON object found in LLM response.")
            json_str = llm_response[json_start:json_end]
            try:
                batch_result = json.loads(json_str)
                results.update(batch_result)
            except Exception as je:
                print(f"JSON decode error in batch {i//BATCH_SIZE + 1}: {je}")
                with open(f"data/llm_json_error_batch_{i//BATCH_SIZE + 1}.txt", "w") as errf:
                    errf.write(json_str)
        except Exception as e:
            print(f"Error in batch {i//BATCH_SIZE + 1}: {e}")

    with open("data/prerequisites_parsed_llm.json", "w") as f:
        json.dump(results, f, indent=2)
    print("Done! Parsed prerequisites saved to data/prerequisites_parsed_llm.json")

if __name__ == "__main__":
    main()