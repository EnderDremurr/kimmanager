import requests
import os
import toml
import json
import time
import schedule
import logging
import base64

from io import BytesIO
from PIL import Image
from pathlib import Path
from typing import TypedDict, Literal
from argparse import ArgumentParser


class Localization(TypedDict):
    id: str
    version: str
    name: str
    flag: str
    icon: str
    description: str
    authors: list[str]
    url: str
    font: dict[str, str]
    format: Literal["compatible", "new"]
    localization_asset: str | None = None


def get_description(repo: str, release_notes: str, token: str | None = None) -> str:
    readme_url = f"https://api.github.com/repos/{repo}/contents/README.md"
    headers = {}
    if token:
        headers["Authorization"] = f"token {token}"
            
    response = requests.get(readme_url, headers=headers)

    if response.status_code != 200:
        logging.warning(f"Could not fetch README for {repo}: {response.status_code} {response.text}")
        return release_notes

    readme_content = base64.b64decode(response.json()["content"]).decode("utf-8")
    return f"{release_notes}\n\n---\n\n{readme_content}"


def get_optimized_icon(icon_url: str) -> str:
    response = requests.get(icon_url)

    script_dir = Path(__file__).parent.absolute()

    if response.status_code != 200:
        image = Image.open(script_dir / "icon_404.png")
    else:
        image = Image.open(BytesIO(response.content))

    image = image.convert("RGBA")
    image = image.resize((40, 40), Image.Resampling.LANCZOS)
    
    buffer = BytesIO()
    image.save(buffer, format="WebP", quality=95, lossless=False)
    buffer.seek(0)
    
    base64_data = base64.b64encode(buffer.getvalue()).decode('utf-8')
    return f"data:image/webp;base64,{base64_data}"


def get_latest_release(repo: str, localization_asset: str | None = None, token: str | None = None) -> tuple[str, str, str, int]:
    url = f"https://api.github.com/repos/{repo}/releases/latest"
    headers = {}
    if token:
        headers["Authorization"] = f"token {token}"
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    content = response.json()
    
    version = content["tag_name"]
    description = None
    data_url = None
    size = None
    for asset in content["assets"]:
        if asset["name"].lower() == "readme.md":
            description = requests.get(asset["browser_download_url"], headers=headers).text

        if not asset["name"].endswith(".zip"):
            continue

        if localization_asset is None:
            data_url = asset["browser_download_url"]
            size = asset["size"]

        if asset["name"].lower() == localization_asset:
            data_url = asset["browser_download_url"]
            size = asset["size"]

    if data_url is None:
        raise Exception(f"No data URL found for {repo}")

    if description is None:
        # description = get_description(repo, content["body"], token)
        description = content["body"]
        
    return version, description, data_url, size


def main() -> int:
    logging.info("Checking for localizations updates")

    gist_id = os.environ["GITHUB_GIST_ID"]
    gist_owner = os.environ["GITHUB_GIST_OWNER"]
    gist_token = os.environ["GITHUB_TOKEN"]

    script_dir = Path(__file__).parent.absolute()
    
    localizations_path = script_dir / "localizations.toml"
    
    if not localizations_path.exists() or not localizations_path.is_file():
        logging.error(f"Localizations file not found: {localizations_path}")
        return 1
    
    with localizations_path.open("r") as f:
        localizations = toml.load(f)

    current_contents = requests.get(
        f"https://gist.githubusercontent.com/{gist_owner}/{gist_id}/raw/localizations.json"
    ).json()

    current_localizations: dict[str, Localization] = {}
    for localization in current_contents["localizations"]:
        current_localizations[localization["id"]] = localization
    
    processed: dict[str, Localization] = {}
    for localization_id, data in localizations.items():
        try:
            localization_asset = data.get("localization_asset")
            version, description, data_url, size = get_latest_release(data["repo"], localization_asset, gist_token)
        except Exception as e:
            logging.error(f"Error getting latest release for {localization_id}: {e}")
            if current_localizations.get(localization_id) is not None:
                version = current_localizations[localization_id]["version"]
                description = current_localizations[localization_id]["description"]
                data_url = current_localizations[localization_id]["url"]
                size = current_localizations[localization_id]["size"]
            else:
                continue

        processed[localization_id] = {
            "id": localization_id,
            "version": version,
            "name": data["name"],
            "flag": data["flag"],
            "icon": get_optimized_icon(data["icon"]),
            "description": description.replace("\r\n", "\n\n"),
            "authors": data["authors"],
            "url": data_url,
            "size": size,
            "fonts": data["fonts"],
            "format": data["format"],
        }

    headers = {
        "Authorization": f"token {gist_token}",
        "Accept": "application/vnd.github.v3+json",
    }

    if processed == current_localizations:
        logging.info("No changes to the localizations")
        return 0
    
    content = json.dumps(
        {"localizations": list(processed.values()), "format_version": 1},
        indent=2,
        ensure_ascii=False,
    )

    response = requests.patch(
        f"https://api.github.com/gists/{gist_id}",
        headers=headers,
        json={"files": {"localizations.json": {"content": content}}},
    )

    if response.status_code != 200:
        logging.error(f"Failed to update gist: {response.status_code} {response.text}")
        return 1

    logging.info("Gist updated successfully")
    return 0


if __name__ == "__main__":
    parser = ArgumentParser()
    parser.add_argument("--schedule", action="store_true", default=False)
    parser.add_argument("--interval", type=int, default=5)
    parser.add_argument("--log-level", default="INFO", choices=["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"])
    args = parser.parse_args()

    logging.basicConfig(
        level=getattr(logging, args.log_level),
        format="%(asctime)s [%(levelname)s]: %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )

    if not args.schedule:
        exit(main())
    
    else:
        logging.info(f"Scheduling updates every {args.interval} minutes")
        schedule.every(args.interval).minutes.do(main)

        while True:
            schedule.run_pending()
            time.sleep(1)
