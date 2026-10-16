import io
import os
import html
from typing import Optional
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    HRFlowable,
    KeepTogether,
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

# Register custom Unicode fonts
FONTS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "fonts")
REGULAR_FONT_PATH = os.path.join(FONTS_DIR, "NotoSansBengali-Regular.ttf")
BOLD_FONT_PATH = os.path.join(FONTS_DIR, "NotoSansBengali-Bold.ttf")

FONT_NAME = "Helvetica"
BOLD_FONT_NAME = "Helvetica-Bold"

if os.path.exists(REGULAR_FONT_PATH):
    try:
        pdfmetrics.registerFont(TTFont("NotoBengali", REGULAR_FONT_PATH))
        FONT_NAME = "NotoBengali"
    except Exception:
        pass

if os.path.exists(BOLD_FONT_PATH):
    try:
        pdfmetrics.registerFont(TTFont("NotoBengali-Bold", BOLD_FONT_PATH))
        BOLD_FONT_NAME = "NotoBengali-Bold"
    except Exception:
        pass
elif FONT_NAME == "NotoBengali":
    BOLD_FONT_NAME = "NotoBengali"


class NumberedCanvas(canvas.Canvas):
    """Canvas that computes total pages dynamically and stamps 'Page X of Y' in footer."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_number(num_pages)
            super().showPage()
        super().save()

    def draw_page_number(self, page_count):
        self.saveState()
        self.setFont(FONT_NAME, 9)
        self.setFillColor(colors.HexColor("#77716D"))

        # Footer divider line
        self.setStrokeColor(colors.HexColor("#F0E8E2"))
        self.setLineWidth(0.5)
        self.line(54, 40, 558, 40)

        # Left footer: Branding
        self.drawString(54, 26, "Transcriptly — Digital Book")

        # Right footer: Page X of Y
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(558, 26, page_text)
        self.restoreState()


def generate_book_pdf(
    title: str,
    paragraphs: list[str],
    video_url: str,
    channel_title: Optional[str] = None,
    language_name: Optional[str] = None,
    detected_language_name: Optional[str] = None,
    is_translated: bool = False,
    include_timestamps: bool = False,
) -> bytes:
    """Generates a clean, publication-ready PDF supporting Bengali & Latin scripts."""
    buffer = io.BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54,
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        "BookTitle",
        parent=styles["Normal"],
        fontName=BOLD_FONT_NAME,
        fontSize=20,
        leading=26,
        textColor=colors.HexColor("#292522"),
        spaceAfter=8,
    )

    meta_style = ParagraphStyle(
        "BookMeta",
        parent=styles["Normal"],
        fontName=FONT_NAME,
        fontSize=9,
        leading=14,
        textColor=colors.HexColor("#77716D"),
        spaceAfter=4,
    )

    body_style = ParagraphStyle(
        "BookBody",
        parent=styles["Normal"],
        fontName=FONT_NAME,
        fontSize=11,
        leading=18,
        textColor=colors.HexColor("#292522"),
        spaceAfter=14,
        firstLineIndent=12,
    )

    story = []

    # Title
    safe_title = html.escape(title or "Untitled Transcript Book")
    story.append(Paragraph(safe_title, title_style))
    story.append(Spacer(1, 4))

    # Metadata block
    meta_lines = []
    if channel_title:
        meta_lines.append(f"<b>Channel:</b> {html.escape(channel_title)}")
    if detected_language_name:
        meta_lines.append(f"<b>Original Language:</b> {html.escape(detected_language_name)}")
    if is_translated and language_name:
        meta_lines.append(f"<b>Translated Language:</b> {html.escape(language_name)}")
    meta_lines.append(f"<b>Source Video:</b> <a href=\"{video_url}\" color=\"#E9A9C3\">{html.escape(video_url)}</a>")

    for line in meta_lines:
        story.append(Paragraph(line, meta_style))

    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#F0E8E2"), spaceAfter=16))

    # Book Paragraphs
    for para in paragraphs:
        cleaned_para = para.strip()
        if not cleaned_para:
            continue
        safe_para = html.escape(cleaned_para)
        story.append(Paragraph(safe_para, body_style))

    # Build PDF using NumberedCanvas
    doc.build(story, canvasmaker=NumberedCanvas)
    buffer.seek(0)
    return buffer.getvalue()
