"""Google Drive service — list and fetch documents from a shared folder."""
from __future__ import annotations

import json
import logging
from dataclasses import dataclass
from datetime import datetime
from typing import Optional

from google.oauth2 import service_account
from googleapiclient.discovery import build

from app.config import settings

logger = logging.getLogger(__name__)

SCOPES = ["https://www.googleapis.com/auth/drive.readonly"]

GOOGLE_DOC_MIME = "application/vnd.google-apps.document"
GOOGLE_FOLDER_MIME = "application/vnd.google-apps.folder"


@dataclass
class DriveFile:
    id: str
    name: str
    mime_type: str
    modified_time: datetime
    web_view_link: str
    folder_path: str = ""


def _get_credentials():
    """Load credentials from GOOGLE_SERVICE_ACCOUNT_JSON env var, or fall back to file."""
    if settings.google_service_account_json:
        info = json.loads(settings.google_service_account_json)
        return service_account.Credentials.from_service_account_info(info, scopes=SCOPES)
    return service_account.Credentials.from_service_account_file(
        str(settings.google_service_account_path), scopes=SCOPES,
    )


def _get_drive_service():
    return build("drive", "v3", credentials=_get_credentials(), cache_discovery=False)


def _get_docs_service():
    return build("docs", "v1", credentials=_get_credentials(), cache_discovery=False)


def list_docs_in_folder(
    folder_id: Optional[str] = None,
    folder_path: str = "",
) -> list[DriveFile]:
    """Recursively list all Google Docs inside a Drive folder."""
    folder_id = folder_id or settings.google_drive_folder_id
    if not folder_id:
        raise ValueError("No GOOGLE_DRIVE_FOLDER_ID configured")

    drive = _get_drive_service()
    results: list[DriveFile] = []
    page_token = None

    while True:
        resp = drive.files().list(
            q=f"'{folder_id}' in parents and trashed = false",
            fields="nextPageToken, files(id, name, mimeType, modifiedTime, webViewLink)",
            pageSize=100,
            pageToken=page_token,
            supportsAllDrives=True,
            includeItemsFromAllDrives=True,
        ).execute()

        for f in resp.get("files", []):
            if f["mimeType"] == GOOGLE_FOLDER_MIME:
                sub_path = f"{folder_path}/{f['name']}" if folder_path else f["name"]
                results.extend(list_docs_in_folder(f["id"], sub_path))
            elif f["mimeType"] == GOOGLE_DOC_MIME:
                results.append(DriveFile(
                    id=f["id"],
                    name=f["name"],
                    mime_type=f["mimeType"],
                    modified_time=datetime.fromisoformat(
                        f["modifiedTime"].replace("Z", "+00:00")
                    ),
                    web_view_link=f.get(
                        "webViewLink",
                        f"https://docs.google.com/document/d/{f['id']}",
                    ),
                    folder_path=folder_path,
                ))

        page_token = resp.get("nextPageToken")
        if not page_token:
            break

    logger.info("Found %d Google Docs in folder %s", len(results), folder_id)
    return results


def export_doc_as_text(doc_id: str) -> str:
    """Export a Google Doc as plain text."""
    drive = _get_drive_service()
    content = drive.files().export(
        fileId=doc_id, mimeType="text/plain"
    ).execute()
    if isinstance(content, bytes):
        return content.decode("utf-8")
    return str(content)


def export_doc_as_pdf_bytes(doc_id: str) -> bytes:
    """Export a Google Doc as PDF and return the raw bytes."""
    drive = _get_drive_service()
    content = drive.files().export(
        fileId=doc_id, mimeType="application/pdf"
    ).execute()
    if not isinstance(content, bytes):
        content = content.encode("utf-8")
    logger.info("Exported PDF bytes for doc %s (%d bytes)", doc_id, len(content))
    return content
