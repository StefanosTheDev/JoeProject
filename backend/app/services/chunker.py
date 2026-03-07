"""Text chunker — splits SOP documents into embeddable chunks."""
from __future__ import annotations

import re
from dataclasses import dataclass

import tiktoken

_enc = tiktoken.get_encoding("cl100k_base")

HEADING_RE = re.compile(r"^(#{1,3})\s+(.+)$|^(.+)\n[=\-]{3,}$", re.MULTILINE)


@dataclass
class Chunk:
    content: str
    section_title: str
    index: int
    token_count: int


def _count_tokens(text: str) -> int:
    return len(_enc.encode(text))


def chunk_document(
    text: str,
    max_tokens: int = 800,
    overlap_tokens: int = 100,
) -> list[Chunk]:
    """Split text into chunks, preferring section boundaries.

    Strategy:
    1. Split on markdown-style headings first (SOPs often have them).
    2. If a section is too long, split by paragraphs within it.
    3. If a paragraph is still too long, split by sentences with overlap.
    """
    sections = _split_by_headings(text)
    chunks: list[Chunk] = []

    for section_title, section_text in sections:
        section_text = section_text.strip()
        if not section_text:
            continue

        if _count_tokens(section_text) <= max_tokens:
            chunks.append(Chunk(
                content=section_text,
                section_title=section_title,
                index=len(chunks),
                token_count=_count_tokens(section_text),
            ))
        else:
            sub_chunks = _split_long_section(
                section_text, section_title, max_tokens, overlap_tokens
            )
            for sc in sub_chunks:
                sc.index = len(chunks)
                chunks.append(sc)

    return chunks


def _split_by_headings(text: str) -> list[tuple[str, str]]:
    """Split text into (heading, body) tuples."""
    lines = text.split("\n")
    sections: list[tuple[str, str]] = []
    current_heading = ""
    current_lines: list[str] = []

    for line in lines:
        heading_match = re.match(r"^#{1,3}\s+(.+)$", line)
        if heading_match:
            if current_lines:
                sections.append((current_heading, "\n".join(current_lines)))
            current_heading = heading_match.group(1).strip()
            current_lines = []
        else:
            current_lines.append(line)

    if current_lines:
        sections.append((current_heading, "\n".join(current_lines)))

    if not sections:
        sections = [("", text)]

    return sections


def _split_long_section(
    text: str,
    section_title: str,
    max_tokens: int,
    overlap_tokens: int,
) -> list[Chunk]:
    """Split a long section by paragraphs, then by sentences if needed."""
    paragraphs = re.split(r"\n\s*\n", text)
    chunks: list[Chunk] = []
    current_parts: list[str] = []
    current_count = 0

    for para in paragraphs:
        para = para.strip()
        if not para:
            continue
        para_tokens = _count_tokens(para)

        if para_tokens > max_tokens:
            if current_parts:
                chunks.append(Chunk(
                    content="\n\n".join(current_parts),
                    section_title=section_title,
                    index=0,
                    token_count=current_count,
                ))
                current_parts = []
                current_count = 0
            chunks.extend(
                _split_by_sentences(para, section_title, max_tokens, overlap_tokens)
            )
            continue

        if current_count + para_tokens > max_tokens and current_parts:
            chunks.append(Chunk(
                content="\n\n".join(current_parts),
                section_title=section_title,
                index=0,
                token_count=current_count,
            ))
            overlap_text = current_parts[-1] if current_parts else ""
            if _count_tokens(overlap_text) <= overlap_tokens:
                current_parts = [overlap_text]
                current_count = _count_tokens(overlap_text)
            else:
                current_parts = []
                current_count = 0

        current_parts.append(para)
        current_count += para_tokens

    if current_parts:
        chunks.append(Chunk(
            content="\n\n".join(current_parts),
            section_title=section_title,
            index=0,
            token_count=current_count,
        ))

    return chunks


def _split_by_sentences(
    text: str,
    section_title: str,
    max_tokens: int,
    overlap_tokens: int,
) -> list[Chunk]:
    """Last-resort split by sentence boundaries."""
    sentences = re.split(r"(?<=[.!?])\s+", text)
    chunks: list[Chunk] = []
    current: list[str] = []
    current_count = 0

    for sent in sentences:
        sent_tokens = _count_tokens(sent)
        if current_count + sent_tokens > max_tokens and current:
            chunk_text = " ".join(current)
            chunks.append(Chunk(
                content=chunk_text,
                section_title=section_title,
                index=0,
                token_count=current_count,
            ))
            overlap_sents = []
            overlap_count = 0
            for s in reversed(current):
                s_count = _count_tokens(s)
                if overlap_count + s_count > overlap_tokens:
                    break
                overlap_sents.insert(0, s)
                overlap_count += s_count
            current = overlap_sents
            current_count = overlap_count

        current.append(sent)
        current_count += sent_tokens

    if current:
        chunks.append(Chunk(
            content=" ".join(current),
            section_title=section_title,
            index=0,
            token_count=current_count,
        ))

    return chunks
