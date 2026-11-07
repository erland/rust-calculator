#!/usr/bin/env python3
"""Verify downloaded release candidate artifacts and assemble a consistent release set."""
from __future__ import annotations

import hashlib
import pathlib
import shutil
import sys
import zipfile

PACKAGES = {
    "kalkylator-windows-x64-portable": "kalkylator-windows-x64-portable.zip",
    "kalkylator-macos-arm64-portable": "kalkylator-macos-arm64-portable.zip",
    "kalkylator-macos-x64-portable": "kalkylator-macos-x64-portable.zip",
    "kalkylator-pwa-portable": "kalkylator-pwa.zip",
}


def sha256(path: pathlib.Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def expected_checksum(checksum_file: pathlib.Path, filename: str) -> str:
    entries = []
    for line in checksum_file.read_text(encoding="utf-8").splitlines():
        parts = line.split(maxsplit=1)
        if len(parts) != 2 or len(parts[0]) != 64:
            raise ValueError(f"Invalid checksum manifest: {checksum_file}")
        if pathlib.PurePath(parts[1].lstrip("*").replace("\\", "/")).name == filename:
            entries.append(parts[0].lower())
    if len(entries) != 1:
        raise ValueError(f"Expected one SHA256 entry for {filename}")
    if not all(char in "0123456789abcdef" for char in entries[0]):
        raise ValueError("Invalid SHA256 checksum")
    return entries[0]


def validate_zip(path: pathlib.Path, artifact: str) -> None:
    with zipfile.ZipFile(path) as archive:
        if archive.testzip() is not None:
            raise ValueError(f"Damaged ZIP: {path}")
        names = [name.removeprefix("./") for name in archive.namelist()]
        if not names:
            raise ValueError(f"Empty ZIP: {path}")
        for name in names:
            parts = pathlib.PurePosixPath(name).parts
            if name.startswith("/") or ".." in parts or "\\" in name:
                raise ValueError(f"Unsafe ZIP member: {name}")
        files = set(names)
        if artifact.startswith("kalkylator-windows"):
            if not {"Kalkylator.exe", "LAS-MIG.md"}.issubset(files):
                raise ValueError("Missing Windows EXE or instructions")
        elif artifact.startswith("kalkylator-macos"):
            if "Kalkylator.app/Contents/Info.plist" not in files:
                raise ValueError("Missing macOS application")
            if not any(name.startswith("Kalkylator.app/Contents/MacOS/") and
                       not name.endswith("/") for name in files):
                raise ValueError("Missing macOS executable")
        else:
            if "index.html" not in files:
                raise ValueError("PWA is missing its entry point")
            if not any(name.endswith(".wasm") for name in files):
                raise ValueError("PWA is missing the Rust/WebAssembly engine")
            if not any(name.endswith(".webmanifest") for name in files):
                raise ValueError("PWA is missing its install manifest")
            if not any(name.endswith(".js") for name in files):
                raise ValueError("PWA is missing JavaScript")


def assemble(staging: pathlib.Path, destination: pathlib.Path) -> list[tuple[str, str]]:
    if destination.exists():
        raise ValueError(f"Destination must not exist yet: {destination}")
    validated = []
    for artifact, filename in PACKAGES.items():
        source = staging / artifact / filename
        manifest = staging / artifact / "SHA256SUMS.txt"
        if not source.is_file() or not manifest.is_file():
            raise ValueError(f"Missing artifact ZIP or manifest for {artifact}")
        actual = sha256(source)
        if actual != expected_checksum(manifest, filename):
            raise ValueError(f"SHA256 mismatch: {filename}")
        validate_zip(source, artifact)
        validated.append((filename, actual, source))
    destination.mkdir(parents=True)
    for filename, _, source in validated:
        shutil.copyfile(source, destination / filename)
    (destination / "SHA256SUMS.txt").write_text(
        "".join(f"{digest}  {filename}\n" for filename, digest, _ in validated),
        encoding="ascii",
    )
    return [(filename, digest) for filename, digest, _ in validated]


if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit("Usage: verify_release_assets.py <staging_dir> <destination_dir>")
    try:
        for filename, digest in assemble(pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2])):
            print(f"Verified {filename}: {digest}")
    except (ValueError, OSError, zipfile.BadZipFile) as exc:
        print(f"Release verification failed: {exc}", file=sys.stderr)
        raise SystemExit(1) from exc
