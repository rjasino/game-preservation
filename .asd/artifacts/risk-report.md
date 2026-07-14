# Risk Report Idea for the Dashboard

## Goal

Add a preservation risk report to the dashboard that identifies games that are more endangered because they are locked to a narrow platform ecosystem, especially closed ecosystems such as PlayStation.

For v1, "endangered" should mean platform lock-in, not a general AI-driven prediction.

## Core Approach

Use a rule-based scoring model based on the structured data already in the dataset.

Main signal:

- `platforms`

Supporting signals:

- `releases`
- `first_release_date`
- `category`
- `developers`
- `publishers`

This should be transparent and auditable. Each game should show both a risk level and the reasons why it received that level.

## Why AI Is Not Needed

AI is not required for v1 because the current dataset already contains structured fields that can support deterministic classification.

Benefits of a rule-based system:

- easier to explain
- easier to validate
- cheaper to build and maintain
- more trustworthy for a preservation report

AI can be considered later for enrichment, natural-language summaries, or handling messy external data.

## Suggested Risk Model (v1)

### Risk levels

- `Critical`: only available on `PlayStation Vita`
- `High`: only available within the Sony ecosystem, such as Vita + PS3/PS4/PSP
- `Medium`: available on Vita and a small number of other closed ecosystems, but not on PC, web, or mobile
- `Low`: also available on PC, web, or mobile
- `Minimal`: widely available across multiple ecosystem families

### Example scoring direction

- `100`: Vita only
- `80`: Sony-family only
- `60`: closed-platform release set, no PC/web/mobile
- `30`: has PC/web/mobile release
- `10`: broadly distributed across several platform families

## Explainability Per Game

Each game should include a short list of reasons, for example:

- "Only released on PlayStation Vita"
- "Locked to Sony platforms"
- "No PC, web, or mobile release found"
- "Available on PC, so preservation risk is lower"

This explanation layer is important so the report is useful and defensible.

## Important Dataset Caveat

The current dashboard copy suggests the dataset contains PS Vita exclusives, but the bundled data now includes many multi-platform games.

What the current dataset really represents:

- games that include `PlayStation Vita` among their platforms

This is still useful for preservation risk scoring, but the dashboard copy should be updated so it does not claim all entries are Vita-exclusive.

## Numbers Observed in the Current Dataset

- total games: `2,129`
- games that include Vita: `2,129`
- games with only `PlayStation Vita`: `518`
- games locked to Sony-family platforms only: `811`

These counts suggest there is already a meaningful high-risk group for an endangerment report.

## Platform Family Mapping Idea

Map raw platforms into broader ecosystem families:

- `Sony`: PlayStation Vita, PSP, PS3, PS4, PS5
- `PC`: Windows, Mac, Linux
- `Nintendo`: Switch, 3DS, Wii U
- `Xbox`: Xbox 360, Xbox One, Xbox Series
- `Mobile`: iOS, Android
- `Web`: browser
- `Other`: fallback bucket

This family mapping makes the scoring model easier to reason about than relying only on raw platform counts.

## Dashboard Implementation Plan

1. Add a preservation analysis helper in the dashboard data layer.
2. Derive fields such as:
   - `ecosystemFamilies`
   - `endangermentScore`
   - `endangermentLevel`
   - `endangermentReasons`
3. Extend filtering and sorting so the dashboard can query by risk level.
4. Add summary counts for each risk level.
5. Add a report view or report section to the dashboard.
6. Show the score, level, and reasons in the table and detail modal.
7. Update dashboard copy to say the dataset contains games available on PS Vita, not necessarily games exclusive to PS Vita.

## Recommended First Report UI

Sort highest risk first and show:

- game title
- risk level
- score
- platforms
- short reason

Useful filters:

- risk level
- ecosystem family
- content type
- developer
- publisher

## Recommended Scope for v1

Keep v1 focused on platform lock-in only.

Possible future expansion areas:

- digital-only vs physical availability
- delisting/store shutdown risk
- region lock concerns
- metadata enrichment from external sources
- AI-assisted explanations or classification for incomplete records
