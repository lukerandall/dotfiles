# What each target allows

Read this before step 7 of `SKILL.md`, and before choosing how to draw.

## A claude.ai artifact

Scripts and external libraries from approved CDNs are allowed. The `artifact-design` skill sets the theme tokens and the page. Static SVG from the helper still suits it, because static output reads in both themes with no code. Define `--series-1` and the other series variables on `:root` for light and dark.

## A hangar first-version page

Hangar renders Mustache templates on the server and sends a content security policy that allows no scripts. A chart here is static inline SVG, or HTML and CSS. Use the helper's output unchanged, and print every value the reader needs as a label or in a table under the chart. Take colour tokens from board-ui's token stylesheet, and define `--series-N` from them.

## A later scripted hangar page

A page that runs scripts may import `render` from `scripts/chart.ts`. The rule against boxes and the rule for direct labels still apply. Interactive charts, tooltips and filters are out of scope for this skill.

## When `dataviz` is absent

In a Codex session `dataviz` may not exist. The skill still applies. Use `currentColor` for text and axes, one accent colour for the series that carries the finding, and a lighter tint of the text colour for the others.

## When Deno cannot fetch the packages

The first run of the helper fetches three pinned npm packages. With no network the command fails and writes no SVG. Run it again with a network, or draw the SVG by hand following the worked SVG examples in `forms.md`.
