"""Contract tests for the visual regression gate.

The gate's value rests on one promise: a noise allowance generous enough to
absorb rasterisation dither must still be incapable of absorbing a real change.
These tests construct PNGs that differ in known ways and check the verdict, so
the promise is verified rather than asserted in a comment.
"""
import struct
import subprocess
import sys
import tempfile
import zlib
from pathlib import Path

HERE = Path(__file__).resolve().parent
TOOL = HERE.parent / "tools" / "compare-captures.py"


def write_png(path, width, height, pixels):
    """Minimal 8-bit RGB PNG writer; pixels is a list of (r,g,b)."""
    raw = b""
    for y in range(height):
        raw += b"\x00"  # filter: none
        for x in range(width):
            raw += bytes(pixels[y * width + x])

    def chunk(kind, data):
        body = kind + data
        return struct.pack(">I", len(data)) + body + struct.pack(">I", zlib.crc32(body))

    png = b"\x89PNG\r\n\x1a\n"
    png += chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0))
    png += chunk(b"IDAT", zlib.compress(raw))
    png += chunk(b"IEND", b"")
    Path(path).write_bytes(png)


def run(before, after, *args):
    result = subprocess.run([sys.executable, str(TOOL), str(before), str(after), *args],
                            capture_output=True, text=True)
    return result.returncode, result.stdout.strip()


results = []


def check(name, fn):
    try:
        fn()
        results.append((name, "pass", ""))
    except AssertionError as error:
        results.append((name, "fail", str(error)))


W = H = 40
BASE = [(200, 200, 200)] * (W * H)

with tempfile.TemporaryDirectory() as tmp:
    tmp = Path(tmp)
    a = tmp / "a.png"
    write_png(a, W, H, BASE)

    def variant(name, mutate):
        pixels = list(BASE)
        mutate(pixels)
        path = tmp / name
        write_png(path, W, H, pixels)
        return path

    identical = variant("identical.png", lambda p: None)
    # Delta 3: above the tolerance of 2, far below the visible threshold of 24.
    dither = variant("dither.png", lambda p: [p.__setitem__(i, (203, 200, 200)) for i in range(300)])
    one_visible = variant("one.png", lambda p: p.__setitem__(0, (0, 0, 0)))

    def t_identical():
        code, out = run(a, identical)
        assert code == 0, out
        assert "identical" in out, out

    def t_dither_fails_exact():
        code, out = run(a, dither)
        assert code == 1, f"dither must fail an exact comparison: {out}"

    def t_dither_within_allowance():
        code, out = run(a, dither, "--tolerance", "2", "--max-differing", "400")
        assert code == 0, f"delta-2 dither should be forgiven: {out}"
        assert "identical" not in out, "a forgiven difference must not be reported as identical"

    def t_one_visible_pixel_always_fails():
        # The whole point: an allowance of a million pixels cannot forgive one
        # pixel that actually changed colour.
        code, out = run(a, one_visible, "--tolerance", "2", "--max-differing", "999999")
        assert code == 1, f"a visibly changed pixel must fail regardless of allowance: {out}"
        assert "visibly" in out, out

    def t_dimension_change_fails():
        odd = tmp / "odd.png"
        write_png(odd, W, H - 1, BASE[: W * (H - 1)])
        code, out = run(a, odd, "--tolerance", "2", "--max-differing", "999999")
        assert code == 1, f"a size change must fail: {out}"

    check("identical captures compare identical", t_identical)
    check("sub-threshold dither fails an exact comparison", t_dither_fails_exact)
    check("near-invisible dither is forgiven by a declared allowance", t_dither_within_allowance)
    check("one visibly changed pixel defeats any allowance", t_one_visible_pixel_always_fails)
    check("a dimension change fails", t_dimension_change_fails)

failures = [r for r in results if r[1] == "fail"]
print(f"visual gate contracts: {len(results)} checks, {len(failures)} failures")
for name, status, detail in results:
    print(f"  {status.upper():4}  {name}" + (f"  — {detail}" if detail else ""))
sys.exit(1 if failures else 0)
