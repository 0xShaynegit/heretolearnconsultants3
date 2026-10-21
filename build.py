"""Build the static site.

Pages live in src/pages/*.html. Each starts with a JSON block between two
lines of ---, for example:

    ---
    {"title": "About Us", "description": "...", "nav": "about"}
    ---

Inside a page, these tokens are expanded:

    [[header]] [[footer]]               shared partials from src/partials/
    [[img SLUG]]                        responsive <picture> from images/
    [[img SLUG eager sizes="50vw" class="x" alt="..."]]

Run:  python build.py
Output is written to the project root, one .html file per page.
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).parent
SRC = ROOT / "src"
IMAGES = ROOT / "images"
PREFIX = "heretolearnconsultants-here-to-learn-"
SITE = "https://heretolearnconsultants3.pages.dev"  # change when the real domain is live
INDEX = json.loads((SRC / "images.json").read_text(encoding="utf-8"))
SIZES = {
    "hero": "100vw",
    "band": "(max-width: 900px) 100vw, 50vw",
    "product": "(max-width: 700px) 100vw, 400px",
    "portrait": "(max-width: 600px) 50vw, 300px",
    "logo": "192px",
}
TOKEN = re.compile(r"\[\[(\w+)([^\]]*)\]\]")
ATTR = re.compile(r'(\w+)(?:="([^"]*)")?')


def widths(slug, ext):
    found = []
    for f in IMAGES.glob(f"{PREFIX}{slug}-*w.{ext}"):
        m = re.fullmatch(rf"{re.escape(PREFIX + slug)}-(\d+)w\.{ext}", f.name)
        if m:
            found.append(int(m.group(1)))
    if not found:
        raise SystemExit(f"No {ext} files for image slug: {slug}")
    return sorted(found)


def dims(slug, w):
    from PIL import Image
    with Image.open(IMAGES / f"{PREFIX}{slug}-{w}w.webp") as im:
        return im.size


def picture(slug, opts):
    meta = INDEX[slug]
    alt = opts.get("alt", meta["alt"])
    sizes = opts.get("sizes", SIZES.get(meta["class"], "100vw"))
    ws = widths(slug, "webp")
    big = ws[-1]
    w, h = dims(slug, big)

    def srcset(ext):
        return ", ".join(f"images/{PREFIX}{slug}-{x}w.{ext} {x}w" for x in widths(slug, ext))

    cls = f' class="{opts["class"]}"' if "class" in opts else ""
    load = 'fetchpriority="high" decoding="async"' if "eager" in opts else 'loading="lazy" decoding="async"'
    return (
        f'<picture>'
        f'<source type="image/avif" srcset="{srcset("avif")}" sizes="{sizes}">'
        f'<img{cls} src="images/{PREFIX}{slug}-{big}w.webp" srcset="{srcset("webp")}" sizes="{sizes}" '
        f'width="{w}" height="{h}" alt="{alt}" {load}>'
        f'</picture>'
    )


def preload(slug):
    ws = widths(slug, "avif")
    srcset = ", ".join(f"images/{PREFIX}{slug}-{x}w.avif {x}w" for x in ws)
    return (f'<link rel="preload" as="image" type="image/avif" '
            f'href="images/{PREFIX}{slug}-{ws[-1]}w.avif" imagesrcset="{srcset}" imagesizes="100vw">')


def expand(text, page):
    def sub(m):
        name, rest = m.group(1), m.group(2)
        opts = {k: (v if v is not None else True) for k, v in ATTR.findall(rest) if k}
        if name == "img":
            slug = rest.split()[0]
            opts.pop(slug, None)
            return picture(slug, opts)
        part = SRC / "partials" / f"{name}.html"
        if part.exists():
            return expand(part.read_text(encoding="utf-8"), page)
        if name in page:
            return str(page[name])
        raise SystemExit(f"Unknown token [[{name}]]")
    return TOKEN.sub(sub, text)


def build():
    for src in sorted((SRC / "pages").glob("*.html")):
        raw = src.read_text(encoding="utf-8")
        _, front, body = raw.split("---\n", 2)
        page = json.loads(front)
        page["slug"] = src.stem
        page["site"] = SITE
        page["canonical"] = "" if src.stem == "index" else src.stem
        page["preload"] = preload(page["hero"]) if page.get("hero") else ""
        html = expand(body, page)
        # mark the current nav item
        if page.get("nav"):
            html = html.replace(f'data-nav="{page["nav"]}"', f'data-nav="{page["nav"]}" aria-current="page"')
        (ROOT / src.name).write_text(html, encoding="utf-8")
        print("built", src.name)


if __name__ == "__main__":
    build()
