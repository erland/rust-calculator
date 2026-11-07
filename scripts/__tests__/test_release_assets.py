import hashlib
import pathlib
import tempfile
import unittest
import zipfile

from scripts.verify_release_assets import PACKAGES, assemble


def make_zip(path: pathlib.Path, artifact: str) -> None:
    if "windows" in artifact:
        entries = {"Kalkylator.exe": b"binary", "LAS-MIG.md": b"help"}
    elif "macos" in artifact:
        entries = {
            "Kalkylator.app/Contents/Info.plist": b"plist",
            "Kalkylator.app/Contents/MacOS/kalkylator-desktop": b"executable",
        }
    else:
        entries = {
            "index.html": b"html",
            "assets/calculator_bg.wasm": b"wasm",
            "assets/main.js": b"js",
            "manifest.webmanifest": b"manifest",
        }
    with zipfile.ZipFile(path, "w") as output:
        for filename, data in entries.items():
            output.writestr(filename, data)


def fixture(root: pathlib.Path) -> pathlib.Path:
    stage = root / "stage"
    for artifact, name in PACKAGES.items():
        folder = stage / artifact
        folder.mkdir(parents=True)
        archive = folder / name
        make_zip(archive, artifact)
        checksum = hashlib.sha256(archive.read_bytes()).hexdigest()
        (folder / "SHA256SUMS.txt").write_text(
            f"{checksum}  ../../portable-output/{name}\n", encoding="ascii"
        )
    return stage


class ReleaseAssemblyTests(unittest.TestCase):
    def test_assembles_exactly_four_valid_archives(self):
        with tempfile.TemporaryDirectory() as temp:
            root = pathlib.Path(temp)
            destination = root / "release-assets"
            result = assemble(fixture(root), destination)
            self.assertEqual({name for name, _ in result}, set(PACKAGES.values()))
            self.assertEqual(len(list(destination.glob("*.zip"))), 4)
            self.assertEqual(len((destination / "SHA256SUMS.txt").read_text().splitlines()), 4)

    def test_rejects_modified_archive(self):
        with tempfile.TemporaryDirectory() as temp:
            root = pathlib.Path(temp)
            stage = fixture(root)
            archive = stage / "kalkylator-pwa-portable" / "kalkylator-pwa.zip"
            archive.write_bytes(archive.read_bytes() + b"tamper")
            with self.assertRaisesRegex(ValueError, "SHA256 mismatch"):
                assemble(stage, root / "release-assets")

    def test_rejects_missing_wasm(self):
        with tempfile.TemporaryDirectory() as temp:
            root = pathlib.Path(temp)
            stage = fixture(root)
            archive = stage / "kalkylator-pwa-portable" / "kalkylator-pwa.zip"
            with zipfile.ZipFile(archive, "w") as output:
                output.writestr("index.html", "html")
                output.writestr("manifest.webmanifest", "{}")
                output.writestr("app.js", "app")
            digest = hashlib.sha256(archive.read_bytes()).hexdigest()
            (archive.parent / "SHA256SUMS.txt").write_text(
                f"{digest}  {archive.name}\n", encoding="ascii"
            )
            with self.assertRaisesRegex(ValueError, "missing the Rust/WebAssembly"):
                assemble(stage, root / "release-assets")

    def test_rejects_unsafe_zip_entry(self):
        with tempfile.TemporaryDirectory() as temp:
            root = pathlib.Path(temp)
            stage = fixture(root)
            archive = stage / "kalkylator-windows-x64-portable" / "kalkylator-windows-x64-portable.zip"
            with zipfile.ZipFile(archive, "w") as output:
                output.writestr("Kalkylator.exe", "binary")
                output.writestr("LAS-MIG.md", "help")
                output.writestr("../escape", "bad")
            digest = hashlib.sha256(archive.read_bytes()).hexdigest()
            (archive.parent / "SHA256SUMS.txt").write_text(f"{digest}  {archive.name}\n", encoding="ascii")
            with self.assertRaisesRegex(ValueError, "Unsafe ZIP member"):
                assemble(stage, root / "release-assets")


if __name__ == "__main__":
    unittest.main()
