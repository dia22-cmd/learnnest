from app.services import pdf_service


def test_extract_text_invalid_bytes():
    """
    Verify that pdf_service returns an empty string when given
    invalid or corrupted PDF bytes.
    """
    result = pdf_service.extract_text_from_pdf(b"not a pdf")
    assert result == ""


def test_extract_text_empty_bytes():
    """
    Verify that pdf_service returns an empty string when given
    empty bytes.
    """
    result = pdf_service.extract_text_from_pdf(b"")
    assert result == ""
