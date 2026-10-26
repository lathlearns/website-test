# Ancient Access

Static site for Ancient Access: characters, presets, blog.

## Adding a character

1. Put the card PNG in `cards/` (e.g. `cards/zmey.png`).
2. Add an entry to `characters.json` (copy an existing one and change it):

```json
{
  "card": "cards/zmey.png",
  "tagline": "He has chosen a bride. That would be you.",
  "era": "Ottoman-era Bulgaria",
  "warning": "Content warning text.",
  "story": ["First paragraph.", "Second paragraph."],
  "vibe": ["The vibe paragraph."],
  "extras": [{ "label": "QR set", "file": "cards/zmey-qr.json" }]
}
```

The **name**, **tags** and **picture** come from the card itself, so there's no need
to type them. The filter buttons on the page are built from the tags of every card.
A brand-new tag gets its own button automatically.

Optional fields:

- `"name"`: use a different name on the site than the one in the card.
- `"tags"`: extra tags on top of the card's own.
- `"art"`: a different picture than the card (e.g. `"art/zmey-wide.jpg"`).
- `"extras"`: more download buttons (QR sets, lorebooks…).

Tags ignore capitals and stray spaces, so `romance`, `Romance` and `ROMANCE ` all
count as one tag.

Watch the commas: every entry except the last one in the list needs a comma after its `}`.

## Testing locally

The page loads `characters.json`, which browsers block when you open the file
directly. Run `python3 -m http.server` in this folder and open
http://localhost:8000/characters.html instead.
