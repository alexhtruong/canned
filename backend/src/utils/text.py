import html2text

def strip_html_to_plaintext(html: str):
    if not html:
        return None
    
    try:
        h = html2text.HTML2Text()
        h.ignore_links = False  # Keep URLs (convert to Markdown)
        h.ignore_images = True  # Remove images
        h.ignore_emphasis = True  # Keep bold/italic as Markdown
        h.body_width = 0  # Don't wrap lines
        h.unicode_snob = True  # Use Unicode instead of ASCII
        
        # Convert HTML to Markdown-style text
        text = h.handle(html)
        
        # Clean up excessive newlines
        text = " ".join(text.split())
        text = text.strip()
        
        return text if text else None
    except Exception as e:
        print(f"Failed to strip html: {e}")
        return html