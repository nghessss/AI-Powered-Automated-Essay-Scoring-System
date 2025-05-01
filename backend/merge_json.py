import json

# Hàm thay ngoặc cong thành ngoặc thẳng
def normalize_quotes(text):
    replacements = {
        '“': '"', '”': '"',
        '‘': "'", '’': "'"
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
    return text


# Hàm loại bỏ ```json ... ```
def strip_json_fence(text):
    lines = text.strip().splitlines()
    lines = [line for line in lines if not line.strip().startswith("```")]
    return "\n".join(lines)

# Đọc JSON từ .txt và xử lý
def read_json_from_txt(filepath):
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
            cleaned = normalize_quotes(strip_json_fence(content))
            parsed = json.loads(cleaned)
            return {
                "valid_json": True,
                "top_keys": list(parsed.keys()),
                "parsed": parsed
            }
    except FileNotFoundError:
        return {"valid_json": False, "error": f"File '{filepath}' not found."}
    except json.JSONDecodeError as e:
        return {"valid_json": False, "error": str(e)}

# Hàm đọc id_score.txt
def read_id_score(filepath="id_score.txt"):
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            lines = f.read().strip().splitlines()
            if len(lines) >= 2:
                user_id = lines[0].strip()
                overall_score = float(lines[1].strip())
                return {"user_id": user_id, "overall_score": overall_score}
            else:
                return {"error": "File must contain at least 2 lines (user_id and score)"}
    except FileNotFoundError:
        return {"error": f"File '{filepath}' not found."}
    except ValueError:
        return {"error": "Invalid score format in id_score.txt"}

# Gộp cả 3 file lại
def merge_all_feedback():
    id_score = read_id_score()
    eval_result = read_json_from_txt("evaluation_feedback.txt")
    const_result = read_json_from_txt("constructive_feedback.txt")

    if "error" in id_score:
        return {"error": id_score["error"]}
    if not eval_result["valid_json"]:
        return {"error": eval_result["error"]}
    if not const_result["valid_json"]:
        return {"error": const_result["error"]}

    merged = {
        "user_id": id_score["user_id"],
        "overall_score": id_score["overall_score"],
        "evaluation_feedback": eval_result["parsed"],
        "constructive_feedback": const_result["parsed"]
    }

    return merged

merged_result = merge_all_feedback()

# Lưu merged_result vào file .txt hoặc .json
output_filepath = "feedback_result.json"
try:
    with open(output_filepath, "w", encoding="utf-8") as f:
        json.dump(merged_result, f, indent=2, ensure_ascii=False)
    print(f"Merged result has been saved to {output_filepath}")
except Exception as e:
    print(f"An error occurred while saving the file: {e}")


# eval_result = read_json_from_txt("evaluation_feedback.txt")
# # const_result = read_json_from_txt("constructive_fb.txt")

# # In kết quả nếu hợp lệ
# if eval_result["valid_json"]:
#     print("📄 eval_jb.txt - criteria:")
#     print(json.dumps(eval_result["parsed"]["criteria"], indent=2, ensure_ascii=False))
# else:
#     print("❌ eval_jb.txt:", eval_result["error"])