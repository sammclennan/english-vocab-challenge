import csv
import json
import string
import sys

from pathlib import Path

from effective_audio_duration import get_effective_duration

MIN_COLS = 7
LIST_DIVIDER = ';'
EMPTY_PLACEHOLDER = '_'

def format_filename(text):
    text = text.strip()
    translation_table = str.maketrans(' ', '_', string.punctuation)
    return text.translate(translation_table).lower()


def format_jp_text(oyamoji, furigana):
    oyamoji_list = [x.strip() for x in oyamoji.split(LIST_DIVIDER)]
    furigana_list = [x.strip() for x in furigana.split(LIST_DIVIDER)]

    formatted_text = []

    if furigana:
        for i in range(len(oyamoji_list)):
            if furigana_list[i] == EMPTY_PLACEHOLDER:
                formatted_text.append(oyamoji_list[i])
            else:
                formatted_text.append(f'<span class="ruby-wrapper">{oyamoji_list[i]}<span class="furigana">{furigana_list[i]}</span></span>')
    else:
        formatted_text.append(oyamoji)
    
    return ''.join(formatted_text)


def main():
    if len(sys.argv) != 3:
        print("""\
Usage: python csv_to_json.py <input_filename.csv> <audio directory>
  <input_filename.csv> : Path to csv file to convert
  <audio directory> : Path to directory containing audio files\
""")
        sys.exit(1)

    csv_input_path = Path(sys.argv[1])
    if not csv_input_path.exists():
        print(f'Error: file {csv_input_path} does not exist.')
        sys.exit(1)
    
    suffix = csv_input_path.suffix
    if suffix != '.csv':
        print(f'Error: invalid file suffix: {suffix}. Please provide a .csv file.')
        sys.exit(1)

    audio_directory = Path(sys.argv[2])
    if not audio_directory.exists():
        print(f'Error: directory {audio_directory} does not exist.')
        sys.exit(1)

    with open(csv_input_path, 'r', encoding='utf-8-sig') as infile:
        reader = csv.reader(infile)
        next(reader, None)
        entries = []

        for row_number, row in enumerate(reader, start=1):

            if len(row) < MIN_COLS:
                print(f'Row {row_number} skipped. Expected {MIN_COLS} or more columns.')
                continue

            eng_text = row[0]
            jp_text, oyamoji, furigana = row[1], row[2], row[3]
            base_filename = row[4]
            category, entry_type = row[5], row[6]
            image_attribute = row[7] if len(row) > 7 else ''

            jp_text_formatted = format_jp_text(oyamoji, furigana)

            formatted_filename = format_filename(base_filename)
            audio_filename  = f'{formatted_filename}.mp3'
            image_filename  = f'{formatted_filename}.jpg'

            audio_filepath = audio_directory / audio_filename
            if not audio_filepath.exists():
                print(f'Warning: audio filepath {audio_filepath} missing.')
                effective_audio_duration = None
            else:
                effective_audio_duration = get_effective_duration(audio_filepath)
        
            entry = {
                'eng': eng_text,
                'jp': jp_text,
                'jpFormatted': jp_text_formatted,
                'hasFurigana': bool(furigana),
                'category': category,
                'type': entry_type,
                'audio': audio_filename,
                'image': image_filename,
                'attr': image_attribute,
                'effectiveAudioDuration': effective_audio_duration if effective_audio_duration is not None else ''
            }

            entries.append(entry)

    json_output_path = csv_input_path.with_suffix('.json')

    with open(json_output_path, 'w', encoding='utf-8') as outfile:
        json.dump(entries, outfile, ensure_ascii=False, indent=2)

    print(f'Successfully written to {json_output_path}')


if __name__ == '__main__':
    main()

 
