import json

# Đọc danh sách từ đã có trong JSON
with open(r"e:\hsk4\assets\meta\hsk4_wordlist.json", encoding="utf-8") as f:
    data = json.load(f)
have_words = set()
for entry in data:
    td = entry.get("translation-data", {})
    word = td.get("simplified")
    if word:
        have_words.add(word.strip())

# Đọc danh sách chuẩn HSK4 (lấy dòng đầu tiên của mỗi mục)
with open(r"e:\hsk4\assets\meta\hsk4_full.txt", encoding="utf-8") as f:
    lines = f.readlines()
full_words = set()
for line in lines:
    line = line.strip()
    if line and not line.startswith(";") and "\t" not in line:
        full_words.add(line)

# So sánh và lưu các từ còn thiếu vào file
missing = sorted(full_words - have_words)
with open(r"e:\hsk4\assets\meta\missing_words.txt", "w", encoding="utf-8") as f:
    f.write(f"Số từ thiếu: {len(missing)}\n")
    f.write("Các từ thiếu:\n")
    for word in missing:
        f.write(f"{word}\n")

# Thêm pinyin và nghĩa tiếng Anh vào danh sách từ
for word in missing:
    pinyin = input(f"Nhập pinyin cho từ '{word}': ")
    english = input(f"Nhập nghĩa tiếng Anh cho từ '{word}': ")
    new_entry = {
        "translation-data": {
            "simplified": word,
            "pinyin": pinyin,
            "english": english
        }
    }
    data.append(new_entry)

# Lưu lại danh sách từ đã cập nhật
with open(r"e:\hsk4\assets\meta\hsk4_wordlist.json", "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=4)