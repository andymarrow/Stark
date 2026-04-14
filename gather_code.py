import os

# ==========================================
# ⚙️ CONFIGURATION
# ==========================================

# 1. Folders you want to copy completely
TARGET_FOLDERS = [
    'app/(HOME)/profile',
    'app/(HOME)/project',
    'app/(HOME)/blog',
    'app/(HOME)/[username]'
] 

# 2. Individual files you want to copy
TARGET_FILES = [] 

# 3. Name of the file that will be generated for you to copy
OUTPUT_FILE = 'ai_context.txt'

# Directories to ignore so you don't break the AI with huge junk files
IGNORE_DIRS = {'.git', 'node_modules', 'venv', '__pycache__', 'dist', 'build', '.next'}
# File extensions to ignore (images, zips, etc.)
IGNORE_EXTS = {'.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.zip', '.pdf', '.exe'}

# ==========================================

def write_file_to_output(filepath, out_f, processed):
    # Skip if we already processed this file (prevents duplicates)
    if filepath in processed:
        return
    
    # Skip the output file itself
    if os.path.abspath(filepath) == os.path.abspath(OUTPUT_FILE):
        return

    # Skip ignored extensions
    _, ext = os.path.splitext(filepath)
    if ext.lower() in IGNORE_EXTS:
        return

    try:
        # Try to read the file as text
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        # Write the formatted path and content to the output
        out_f.write(f"\n\n{'='*60}\n")
        out_f.write(f"📄 FILE PATH: {filepath}\n")
        out_f.write(f"{'='*60}\n\n")
        out_f.write(content)
        
        processed.add(filepath)
        print(f"✅ Added: {filepath}")

    except UnicodeDecodeError:
        # If it fails to decode, it's likely a binary file (like an image)
        print(f"⚠️ Skipped (Binary/Not Text): {filepath}")
    except Exception as e:
        print(f"❌ Error reading {filepath}: {e}")

def main():
    processed_files = set()
    
    # Open the output file in write mode (overwrites previous runs)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as out_f:
        out_f.write("This file contains context for the AI.\n")
        
        # 1. Process specific individual files
        for filepath in TARGET_FILES:
            if os.path.isfile(filepath):
                write_file_to_output(filepath, out_f, processed_files)
            else:
                print(f"⚠️ File not found: {filepath}")

        # 2. Process whole folders
        for folder in TARGET_FOLDERS:
            if not os.path.isdir(folder):
                print(f"⚠️ Folder not found: {folder}")
                continue
                
            # FIXED: Changed os.path.walk to os.walk
            for root, dirs, files in os.walk(folder):
                # Remove ignored directories from the walk
                dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
                
                for file in files:
                    filepath = os.path.join(root, file)
                    # Normalize slashes for Windows/Mac consistency
                    filepath = filepath.replace('\\', '/')
                    write_file_to_output(filepath, out_f, processed_files)

    print(f"\n🎉 DONE! All your code has been combined into: {OUTPUT_FILE}")

if __name__ == "__main__":
    main()