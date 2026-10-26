# Ancient Access

Static site for Ancient Access: characters, presets, blog. Plain HTML, CSS and
JavaScript with no build step, so it can be hosted anywhere that serves files
(GitHub Pages, Cloudflare Pages).

| File | What it is |
| --- | --- |
| `index.html`, `about.html`, `contact.html` | Pages with their text written straight in |
| `characters.html` + `characters.json` | Character catalogue. The text lives in the JSON |
| `prompts.html` + `prompts.json` | Preset and Recall. The text lives in the JSON |
| `blog.html`, `blog/*.html` | Post list and one file per post |
| `cards/` | Character card PNGs (name and tags are read from these) |
| `assets/` | Shared styles, script, images |

## Adding a character

1. Put the card PNG in `cards/` and the display art in `assets/img/characters/`.
2. Copy an existing entry in `characters.json` and change it:

```json
{
  "card": "cards/zmey.png",
  "art": "assets/img/characters/zmey.jpg",
  "tagline": "He has chosen a bride. That would be you.",
  "warning": "Content warning text.",
  "sections": [
    { "title": "The story", "text": ["First paragraph.", "Second paragraph."] },
    { "title": "The vibe", "text": ["…"] },
    { "title": "How to play", "text": ["1. First step", "1. Second step"] }
  ],
  "downloads": [{ "label": "Download", "file": "downloads/zmey.zip" }]
}
```

- **Name and tags come from the card**, so there's no need to type them. Every tag
  on any card gets a filter button automatically. Tags ignore capitals and stray
  spaces (`romance` and `Romance` are one tag).
- Each `sections` entry becomes a tab in the pop-up, in that order, after the
  content warning. Use as many or as few as the character needs.
- Optional: `"name"` (overrides the card's name), `"tags"` (extra tags on top of
  the card's), `"warningLabel"` (e.g. `"Graphic content warning"`).
- Without a `"card"`, the entry still works. It just has no tags.

Text formatting inside the JSON: `**bold**`, `*italic*`, `` `code` ``,
`[link text](https://…)`. A paragraph starting `- ` becomes a bullet point and
one starting `1. ` a numbered step (consecutive ones join into one list).

Watch the commas: every entry in a list except the last needs a comma after it.

## Updating the preset or Recall

Edit `prompts.json`: the version number, summary, tabs and download link are all there.

## Adding a blog post

Copy a file in `blog/`, rename it, replace the title, date and text inside
`<article>`, then add it to the top of the list in `blog.html`.

## Testing locally

The character and prompt pages load JSON files, which browsers block when you
open the file directly. Run `python3 -m http.server` in this folder and open
http://localhost:8000 instead.

## Notes

- `cards/zmey.png` is a stand-in that holds only Zmey's name and tags, so the test
  site on GitHub doesn't carry the real (NSFW) card. Swap in the real cards when
  moving to Cloudflare.
- Download buttons currently point at the zips on the old Weebly site. When those
  move, put the zips in a `downloads/` folder and update the `file` links.
