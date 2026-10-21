"""Build the static site.

Pages live in src/pages/*.html. Each starts with a JSON block between two
lines of ---, for example:

    ---
    {"title": "About Us", "description": "...", "nav": "about"}
    ---

Inside a page, these tokens are expanded:

    [[header]] [[footer]] [[cta]]       shared partials from src/partials/
    [[img SLUG]]                        responsive <picture> from images/
    [[img SLUG eager sizes="50vw" class="x" alt="..."]]

Run:  python build.py
Output is written to the project root, one .html file per page, plus
sitemap.xml and robots.txt.
"""
import json
import re
from datetime import date
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
NL = "\n"


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


HREF = re.compile(r'href="([a-z0-9-]+)\.html(#[^"]*)?"')


def deploy_links(html):
    """Cloudflare Pages 308-redirects /page.html to /page and /index.html to /,
    so deployed pages link to the final URLs directly."""
    def sub(m):
        name, anchor = m.group(1), m.group(2) or ""
        return f'href="{"./" if name == "index" else name}{anchor}"'
    return HREF.sub(sub, html)


def preview_links(html):
    """Double-click preview copy in _preview/: assets resolve from the project
    root through <base>, page links stay on the preview copies."""
    html = html.replace("<head>" + NL, "<head>" + NL + '<base href="../">' + NL, 1)
    return HREF.sub(lambda m: f'href="_preview/{m.group(1)}.html{m.group(2) or ""}"', html)


def build():
    urls = []
    preview = ROOT / "_preview"
    preview.mkdir(exist_ok=True)
    for src in sorted((SRC / "pages").glob("*.html")):
        raw = src.read_text(encoding="utf-8")
        _, front, body = raw.split("---" + NL, 2)
        page = json.loads(front)
        page["slug"] = src.stem
        page["site"] = SITE
        page["canonical"] = "" if src.stem == "index" else src.stem
        page["preload"] = preload(page["hero"]) if page.get("hero") else ""
        html = expand(body, page)
        if src.stem == "404":
            # served at any missing path, so resolve every relative URL from the root
            extra = '<base href="/">' + NL + '<meta name="robots" content="noindex">' + NL
            html = html.replace("<head>" + NL, "<head>" + NL + extra, 1)
        # mark the current nav item(s)
        navs = page.get("nav") or []
        for nav in ([navs] if isinstance(navs, str) else navs):
            if nav:
                html = html.replace(f'data-nav="{nav}"', f'data-nav="{nav}" aria-current="page"')
        if src.stem != "404":
            (preview / src.name).write_text(preview_links(html), encoding="utf-8")
        (ROOT / src.name).write_text(deploy_links(html), encoding="utf-8")
        if src.stem != "404":
            urls.append(page["canonical"])
        print("built", src.name)
    write_sitemap(urls)


def write_sitemap(urls):
    today = date.today().isoformat()
    order = sorted(urls, key=lambda u: (u != "", u))
    rows = "".join(f"  <url><loc>{SITE}/{u}</loc><lastmod>{today}</lastmod></url>{NL}" for u in order)
    (ROOT / "sitemap.xml").write_text(
        '<?xml version="1.0" encoding="UTF-8"?>' + NL
        + '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + NL
        + rows + "</urlset>" + NL,
        encoding="utf-8")
    (ROOT / "robots.txt").write_text(
        "User-agent: *" + NL + "Allow: /" + NL + NL + f"Sitemap: {SITE}/sitemap.xml" + NL,
        encoding="utf-8")
    print("wrote sitemap.xml with", len(order), "urls")


if __name__ == "__main__":
    build()
