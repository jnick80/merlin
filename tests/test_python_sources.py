from pathlib import Path

import pytest


REPO_ROOT = Path(__file__).resolve().parents[1]
PYTHON_FILES = sorted((REPO_ROOT / "app").rglob("*.py"))


def test_python_app_contains_source_files() -> None:
    assert PYTHON_FILES


@pytest.mark.parametrize(
    "python_file",
    PYTHON_FILES,
    ids=lambda python_file: python_file.relative_to(REPO_ROOT).as_posix(),
)
def test_python_source_compiles(python_file: Path) -> None:
    source = python_file.read_text(encoding="utf-8")
    compile(source, str(python_file), "exec")
