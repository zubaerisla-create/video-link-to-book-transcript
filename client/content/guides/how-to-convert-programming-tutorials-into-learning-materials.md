Programming tutorials on YouTube are excellent for seeing how someone thinks through a problem, and frustrating to learn from afterwards. The code is on screen but not in any text you can copy, the explanation is spread across forty minutes, and finding "the bit where she set up the database connection" means scrubbing through the timeline. A transcript doesn't solve all of that — the code itself usually isn't in it — but it gives you the explanation in searchable form, which is the hardest part to recover. This guide shows how to combine the two into learning material you'll actually reuse.

## What a coding-video transcript contains (and doesn't)

It's worth being clear about the limits first:

- **Included:** what the presenter *says* — the reasoning, warnings, explanations of why each step is needed, and names of tools, commands and functions spoken aloud.
- **Not included:** code shown on screen but not read out, terminal output, diagrams, and anything the presenter types silently.
- **Often garbled:** technical vocabulary. Auto-captions were trained mainly on everyday speech, so library names, functions and acronyms come out wrong. Typical examples: "pie test" for *pytest*, "jason" for *JSON*, "sequel" for *SQL* (which is sometimes correct — it's a common pronunciation), "react use effect" for `useEffect`, "get hub" for *GitHub*.

So the transcript is the *narration*. You'll get the code from the video, the presenter's repository, or by writing it yourself — which is the best option for learning anyway.

## Step 1: Extract and skim

1. Extract the transcript on the [Transcriptly home page](/).
2. Use the **Timestamped** view. For coding tutorials, timestamps matter more than paragraphs because you'll keep jumping back to the screen.
3. Skim the whole thing and mark the stages of the tutorial: setup, first feature, refactor, testing, deployment, and so on.
4. Check the video description for a repository link. If the presenter publishes the code, you won't need to copy it from the screen.

## Step 2: Build a "chapters" index

Create a short index with timestamps, like YouTube chapters but your own:

```
00:00  What we're building (todo API)
02:30  Project setup: venv, install FastAPI + uvicorn
07:45  First endpoint: GET /todos
15:10  Pydantic models for request validation
24:00  Connecting SQLite with SQLAlchemy
36:20  Writing tests with pytest
44:00  Common errors + fixes
```

This alone makes a long tutorial far more reusable. Put it at the top of your notes file.

## Step 3: Turn narration into reference notes

For each chapter, write notes in three parts:

1. **What and why** — the presenter's explanation, condensed from the transcript.
2. **Code** — the minimal snippet that demonstrates it, typed by you (from the repo or the screen).
3. **Gotchas** — anything the presenter warned about, which is usually *only* in the narration.

Example:

````markdown
## Pydantic models for request validation  [15:10]

**Why:** FastAPI uses the type hints on the model to validate incoming JSON
and return a 422 error automatically if a field is missing or the wrong type.

```python
class TodoCreate(BaseModel):
    title: str
    done: bool = False
```

**Gotchas (from narration):**
- Fields with defaults are optional in the request body.
- She mentions the 422 response is easy to mistake for a server bug —
  read the "detail" field in the response.
````

The "gotchas" section is where transcripts earn their keep. Presenters say things like "this tripped me up for an hour" or "don't do this in production" — exactly what you'll want later, and nearly impossible to find by scrubbing.

## Step 4: Fix terminology as you go

Correct technical terms in your notes, not in the transcript, and keep a small personal list of the mishearings you've seen. After a few tutorials you'll recognise them instantly. [How to Fix Incorrect YouTube Captions](/guides/how-to-fix-incorrect-youtube-captions) explains why these errors happen and how to correct them efficiently.

## Step 5: Turn the tutorial into exercises

Watching someone code is not the same as coding. Use your chapter index to create exercises:

- **Rebuild without the video.** Using only your notes, rebuild the project. When you get stuck, check the relevant chapter.
- **Change the requirements.** If the tutorial builds a todo API, add due dates or user accounts. The transcript's explanations help you reason about the changes.
- **Explain it back.** Write a short explanation of each chapter as if teaching it. If you can't, reread that part of the transcript.

## Step 6: Build a personal cookbook

Over time, the most useful output is a collection of short, searchable "recipes" drawn from many tutorials:

```
recipes/
  python-fastapi-validation.md
  python-pytest-fixtures.md
  git-undo-last-commit.md
  docker-compose-postgres.md
```

Each recipe: problem, solution snippet, explanation, gotchas, and a link to the source video with a timestamp. This turns hours of video into something you can search in seconds when you need it.

## Keeping the transcript itself

For tutorials you'll revisit, save the transcript to your Transcriptly library with a clear title (`Tutorial: FastAPI todo API — Channel, 2025`) and export the **JSON** or **SRT** if you want timestamps preserved. [SRT vs TXT vs JSON](/guides/srt-vs-txt-vs-json-transcript-formats) explains which format keeps what.

## Common mistakes

- **Copying code from the transcript.** Spoken code is almost always wrong in captions. Get code from the repo or the screen.
- **Following along passively.** Rebuilding from notes teaches far more than typing along with the video.
- **Ignoring versions.** Tutorials age. Note the library versions mentioned in the narration or shown on screen, and check current documentation before relying on an old tutorial's approach.
- **Skipping the gotchas.** They're the most valuable thing the narration contains.

## Frequently asked questions

### Can Transcriptly extract the code shown on screen?

No. Transcriptly works with captions (and speech recognition where available), so it only captures spoken words. Code shown on screen but not spoken won't appear.

### Are creator-uploaded captions better for coding videos?

Usually, yes. When a creator has uploaded or corrected captions, technical terms are much more likely to be right. Transcriptly prefers creator captions when they exist.

### What about live-coding streams?

Long streams have a lot of thinking aloud, which can be valuable but noisy. The chapter index step matters even more: mark the few sections worth keeping and ignore the rest.

## Related guides

- [How to Turn YouTube Lectures into Structured Study Notes](/guides/how-to-turn-youtube-lectures-into-study-notes) — the general note-taking method.
- [How to Build a Personal Digital Library from Video Content](/guides/how-to-build-a-personal-digital-library-from-video) — keeping your best tutorials organised.
