from pathlib import Path
import librosa

# Load audio
def get_effective_duration(filepath_str):
    path = Path(filepath_str)
    filename = path.name
    extension = path.suffix

    if not path.exists():
        print(f'Filepath does not exist: {filepath_str}')
        return

    if extension.lower() not in ('.mp3', '.wav', '.flac', '.ogg'):
        print(f'Unsupported file format: {filepath_str}')
        return

    y, sr = librosa.load(path, sr=None)

    # Detect non-silent intervals
    audible_portion = librosa.effects.split(y, top_db=20)

    if audible_portion.size == 0:
        return 0.0

    # Get silence at start and end
    start_silence = audible_portion[0][0] / sr
    end_silence = (len(y) - audible_portion[-1][1]) / sr

    # Get track duration
    duration = librosa.get_duration(y=y, sr=sr)

    # Get effective duration
    effective_duration =  round(duration - start_silence - end_silence, 4)

    print(f'Effective duration of {filename}: {effective_duration}s')
    return effective_duration
