#!/usr/bin/env python3
import asyncio
import json
import re
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from typing import Dict, List, Optional, Set, Tuple
from urllib.parse import urljoin, urlparse

import httpx
from bs4 import BeautifulSoup, Tag
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

BASE_URL = "https://www.ontarioplaques.com/"
COUNTIES_URL = urljoin(BASE_URL, "Directory_Counties.html")
CITIES_URL = urljoin(BASE_URL, "Directory_City_Town.html")
OUTSIDE_URL = urljoin(BASE_URL, "Locations/Location_DirectoryOutsideOntario.html")

USER_AGENT = (
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
)

CONCURRENCY = 8
REQUEST_TIMEOUT = httpx.Timeout(20.0, connect=20.0)
HEADERS = {"User-Agent": USER_AGENT, "Accept": "text/html,application/xhtml+xml"}

PLAQUE_LINK_RE = re.compile(r"^/?Plaques/Pl(?:aque|aques)_[A-Za-z0-9]+.*\.html$", re.IGNORECASE)
DIRECTORY_LINK_RE = re.compile(r"^/?Locations/Location_Directory[\w]+\.html(?:#.*)?$", re.IGNORECASE)

COORDS_RE = re.compile(r"([NS])\s*(\d+)\s+(\d+(?:\.\d+)?)\s*([EW])\s*(\d+)\s+(\d+(?:\.\d+)?)")


def normalize_url(url: str) -> str:
    if not url:
        return url
    # Ensure absolute URL on this site
    if url.startswith("//"):
        url = "https:" + url
    elif url.startswith("/"):
        url = urljoin(BASE_URL, url)
    elif not url.startswith("http"):
        url = urljoin(BASE_URL, url)
    # Drop fragments
    parsed = urlparse(url)
    return parsed._replace(fragment="").geturl()


# Choose best available parser for BeautifulSoup
try:
    import lxml  # noqa: F401
    BS_PARSER = "lxml"
except Exception:
    BS_PARSER = "html.parser"


@dataclass
class Photo:
    src: str
    alt: Optional[str]
    caption: Optional[str]
    width: Optional[int]
    height: Optional[int]


@dataclass
class Link:
    title: str
    url: str


@dataclass
class Plaque:
    id: str
    url: str
    canonical_url: Optional[str]
    title: Optional[str]
    meta_description: Optional[str]
    location_text: Optional[str]
    location_hierarchy: List[str]
    coordinates_text: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    map_image: Optional[str]
    plaque_text: Optional[str]
    related_links: List[Link]
    subject_links: List[Link]
    more_links: List[Link]
    location_directory_links: List[Link]
    photos: List[Photo]
    source_directories: List[str]
    scraped_at: str


class FetchError(Exception):
    pass


@retry(
    reraise=True,
    stop=stop_after_attempt(4),
    wait=wait_exponential(multiplier=0.5, min=0.5, max=4),
    retry=retry_if_exception_type(FetchError),
)
async def fetch(client: httpx.AsyncClient, url: str) -> str:
    try:
        resp = await client.get(url, timeout=REQUEST_TIMEOUT)
    except Exception as e:  # network error
        raise FetchError(str(e))
    if resp.status_code != 200:
        raise FetchError(f"HTTP {resp.status_code} for {url}")
    # Some pages are in ISO-8859-1; httpx generally handles encoding automatically
    return resp.text


def extract_directory_links(html: str) -> Set[str]:
    soup = BeautifulSoup(html, BS_PARSER)
    links: Set[str] = set()
    for a in soup.find_all("a", href=True):
        href = a["href"].strip()
        if DIRECTORY_LINK_RE.match(href):
            links.add(normalize_url(href))
    return links


def extract_plaque_links_from_directory(html: str) -> Set[str]:
    soup = BeautifulSoup(html, BS_PARSER)
    links: Set[str] = set()
    for a in soup.find_all("a", href=True):
        href = a["href"].strip()
        # Most plaque links are like /Plaques/Plaque_X.html
        if href.lower().startswith("/plaques/") or href.lower().startswith("plaques/"):
            if href.endswith(".html"):
                links.add(normalize_url(href))
    return links


def parse_decimal_degrees(coords_text: str) -> Tuple[Optional[float], Optional[float]]:
    if not coords_text:
        return None, None
    m = COORDS_RE.search(coords_text)
    if not m:
        return None, None
    lat_hem, lat_deg, lat_min, lon_hem, lon_deg, lon_min = m.groups()
    try:
        lat = float(lat_deg) + float(lat_min) / 60.0
        lon = float(lon_deg) + float(lon_min) / 60.0
        if lat_hem.upper() == "S":
            lat = -lat
        if lon_hem.upper() == "W":
            lon = -lon
        return lat, lon
    except Exception:
        return None, None


def text_or_none(el: Optional[Tag]) -> Optional[str]:
    if not el:
        return None
    return el.get_text(" ", strip=True)


def parse_plaque_page(html: str, url: str, source_dirs: List[str]) -> Plaque:
    soup = BeautifulSoup(html, BS_PARSER)
    canonical_url = None
    link_canon = soup.find("link", rel=lambda v: v and "canonical" in v)
    if link_canon and link_canon.get("href"):
        canonical_url = normalize_url(link_canon["href"])

    title_el = soup.find("h1")
    title = text_or_none(title_el)

    meta_desc_el = soup.find("meta", attrs={"name": "description"})
    meta_description = meta_desc_el.get("content", None) if meta_desc_el else None

    # Photos with optional captions right after each img.photo
    photos: List[Photo] = []
    for img in soup.select("img.photo"):
        src = normalize_url(img.get("src")) if img.get("src") else None
        if not src:
            continue
        alt = img.get("alt")
        width = None
        height = None
        try:
            if img.get("width"):
                width = int(img["width"])  
            if img.get("height"):
                height = int(img["height"]) 
        except Exception:
            width = width or None
            height = height or None
        # caption is often the next p.text_navy_12 sibling
        caption = None
        nxt = img.find_next_sibling()
        if isinstance(nxt, Tag) and nxt.name == "p" and ("text_navy_12" in (nxt.get("class") or [])):
            caption = text_or_none(nxt)
        photos.append(Photo(src=src, alt=alt, caption=caption, width=width, height=height))

    # Plaque Location block
    location_text = None
    location_hierarchy: List[str] = []
    map_image = None
    coords_text = None
    lat = None
    lon = None

    # Find the header p that mentions 'Plaque Location'
    header_loc = None
    for p in soup.find_all("p"):
        s = p.get_text(strip=True)
        if s and "Plaque Location" in s:
            header_loc = p
            break
    if header_loc is not None:
        det = header_loc.find_next("p")
        if det is not None:
            # Collect anchor texts (hierarchy like Region, City)
            location_hierarchy = [a.get_text(strip=True) for a in det.find_all("a")]
            # Full text with <br/> rendered as spaces
            location_text = det.get_text(" ", strip=True)
        # Coordinates often live inside a small table after the details
        coords_p = soup.find("p", class_="plaquecoordinates")
        if coords_p:
            coords_text = text_or_none(coords_p)
            lat, lon = parse_decimal_degrees(coords_text)
        map_img = soup.select_one("img.plaquemap")
        if map_img and map_img.get("src"):
            map_image = normalize_url(map_img.get("src"))

    # Plaque Text block
    plaque_text = None
    header_text = None
    for p in soup.find_all("p"):
        s = p.get_text(strip=True)
        if s and s.startswith("Plaque Text"):
            header_text = p
            break
    if header_text is not None:
        pt = header_text.find_next("p")
        if pt is not None:
            plaque_text = pt.get_text(" ", strip=True)

    # Related plaques, Subjects, and More links
    related_links: List[Link] = []
    subject_links: List[Link] = []
    more_links: List[Link] = []
    location_directory_links: List[Link] = []

    for p in soup.find_all("p"):
        s = p.get_text(" ", strip=True)
        if not s:
            continue
        anchors = p.find_all("a", href=True)
        if not anchors:
            continue
        s_lower = s.lower()
        if "related" in s_lower and "plaque" in s_lower:
            for a in anchors:
                related_links.append(Link(title=a.get_text(strip=True), url=normalize_url(a["href"])) )
        elif s_lower.startswith("more"):
            for a in anchors:
                href = normalize_url(a["href"]) 
                link = Link(title=a.get_text(strip=True), url=href)
                more_links.append(link)
                if "/Subjects/" in href:
                    subject_links.append(link)
                if "/Locations/Location_Directory" in href:
                    location_directory_links.append(link)

    # Fallback id derived from URL path
    path = urlparse(url).path
    plaque_id = path.rsplit("/", 1)[-1].replace(".html", "")  # e.g., Plaque_Niagara73

    return Plaque(
        id=plaque_id,
        url=normalize_url(url),
        canonical_url=canonical_url,
        title=title,
        meta_description=meta_description,
        location_text=location_text,
        location_hierarchy=location_hierarchy,
        coordinates_text=coords_text,
        latitude=lat,
        longitude=lon,
        map_image=map_image,
        plaque_text=plaque_text,
        related_links=related_links,
        subject_links=subject_links,
        more_links=more_links,
        location_directory_links=location_directory_links,
        photos=photos,
        source_directories=sorted(set(source_dirs)),
        scraped_at=datetime.now(timezone.utc).isoformat(),
    )


async def gather_with_semaphore(sem: asyncio.Semaphore, coros):
    async def sem_task(coro):
        async with sem:
            return await coro
    return await asyncio.gather(*[sem_task(c) for c in coros])


async def main():
    out_path = "data/ontario_plaques.json"
    sem = asyncio.Semaphore(CONCURRENCY)
    async with httpx.AsyncClient(headers=HEADERS, follow_redirects=True, timeout=REQUEST_TIMEOUT) as client:
        # Fetch top-level directories
        top_pages = [COUNTIES_URL, CITIES_URL, OUTSIDE_URL]
        top_htmls = await gather_with_semaphore(sem, [fetch(client, u) for u in top_pages])

        # Build set of location directory pages
        loc_dir_urls: Set[str] = set()
        for html in top_htmls:
            loc_dir_urls |= extract_directory_links(html)
        # Ensure OUTSIDE is included
        loc_dir_urls.add(OUTSIDE_URL)

        # Fetch all location directory pages
        dir_html_map: Dict[str, str] = {}
        dir_htmls = await gather_with_semaphore(sem, [fetch(client, u) for u in sorted(loc_dir_urls)])
        for u, html in zip(sorted(loc_dir_urls), dir_htmls):
            dir_html_map[u] = html

        # Extract all plaque URLs and keep reverse mapping to their source directories
        plaque_to_dirs: Dict[str, Set[str]] = {}
        for dir_url, html in dir_html_map.items():
            links = extract_plaque_links_from_directory(html)
            for purl in links:
                plaque_to_dirs.setdefault(purl, set()).add(dir_url)

        plaque_urls = sorted(plaque_to_dirs.keys())
        print(f"Discovered {len(plaque_urls)} plaque pages across {len(loc_dir_urls)} directories")

        # Fetch and parse plaque pages in batches
        plaques: List[Dict] = []

        async def fetch_and_parse(purl: str):
            try:
                html = await fetch(client, purl)
            except Exception as e:
                print(f"WARN: failed to fetch {purl}: {e}")
                return None
            try:
                plaque = parse_plaque_page(html, purl, sorted(plaque_to_dirs.get(purl, [])))
                return asdict(plaque)
            except Exception as e:
                print(f"WARN: failed to parse {purl}: {e}")
                return None

        # Fetch all plaques with bounded concurrency
        results = await gather_with_semaphore(sem, [fetch_and_parse(u) for u in plaque_urls])
        for r in results:
            if r:
                plaques.append(r)

    # Write JSON
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(plaques, f, ensure_ascii=False, indent=2)
    print(f"Wrote {len(plaques)} plaques to {out_path}")


if __name__ == "__main__":
    asyncio.run(main())
