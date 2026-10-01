# Sahayak — OA Early Screening (Prototype)

This is a small screening tool for catching early signs of knee
osteoarthritis in community health settings — the kind of thing an
ASHA worker or PHC nurse could run on a laptop during a village health
camp. You walk through a short form with the patient, snap or upload
a knee X-ray, and it gives you a risk read-out in a few seconds.

To be upfront about where things stand: this is a **prototype**, not
a finished product. It's one Flask app talking to one SQLite file on
whatever machine you run it on. No logins, no multi-user support, no
offline mode, no Hindi/regional language UI yet. It's built to prove
the idea works end to end and to be a solid base to build on — not to
hand to a clinic tomorrow.

## The short version of how it works

You fill in some basic patient info and a short movement test, upload
a knee X-ray, and hit submit. On the backend, the X-ray gets run
through a DenseNet121 model (trained on knee X-rays, Normal vs
Osteoarthritis) that spits out a probability. That probability gets
bucketed into Normal / Mild / Moderate / Severe so the rest of the app
has something tidy to display, and the whole thing — form answers,
image, and result — gets saved so you can look it up again later or
see it on the dashboard.

Worth saying clearly: the clinical questions in the form (pain score,
gait, stiffness, etc.) are **not** currently feeding the model. The
model only looks at the image. Those answers are stored for the
record and shown back to you, but they're not part of the math yet.
Combining them with the image is the natural next step if you keep
building this.

## What's in the folder

```
oa_screening/
  app.py                 Flask server — the pages and the API routes
  database.py             SQLite helpers, one "screenings" table
  image_model.py            Loads the trained model and runs predictions
  requirements.txt
  models/
    oa_densenet_best.pt      <- you add this yourself, see below
    README_MODEL.md
  uploaded_xrays/            X-rays people submit get saved here
  templates/               The actual pages (Jinja2/HTML)
  static/                 CSS and the JS that drives the wizard, history table, charts
```

## Getting it running

**1. Set up a virtual environment and install things.**

```bash
cd oa_screening
python3 -m venv venv
source venv/bin/activate        # on Windows: venv\Scripts\activate
pip install -r requirements.txt
```

This pulls in Flask, PyTorch, torchvision, and Pillow. PyTorch is a
chunky download (a few hundred MB), so don't panic if it takes a
minute or two.

**2. Get the trained model in place.**

The model itself isn't bundled with this code — it lives wherever you
trained it (Google Colab, most likely). Find `oa_densenet_best.pt` in
your Google Drive and drop it into:

```
oa_screening/models/oa_densenet_best.pt
```

That exact filename, that exact folder. `models/README_MODEL.md` has
more detail if you ever retrain with a different setup.

**3. Run it.**

```bash
python3 app.py
```

If it's happy, you'll see:

```
OA image model loaded successfully.
 * Running on http://127.0.0.1:5000
```

If you instead see a warning about the model not being ready, the
`.pt` file isn't where it's expected — the warning tells you the exact
path it looked for. Everything except actually running a new screening
(History, Dashboard) still works fine without it, so you're not
totally stuck.

Open `http://127.0.0.1:5000` in your browser and you're in.

A quick note on first launch: the app creates its own database file
(`oa_screening.db`) the first time it runs, and seeds it with some
demo screenings so History and the Dashboard aren't just empty and
sad. Once you submit real screenings, those pile up right alongside
the demo ones. If you want a clean slate, just delete `oa_screening.db`
and restart — it'll reseed the demo data automatically. If you'd
rather it stayed empty, delete the file *and* remove the auto-seed
block near the top of `app.py`.

## Walking through the app itself

**New Screening** is the main page — a four-step form (patient
details, symptoms, a short movement test plus the X-ray upload, then
the result). Hit submit and it talks to `/api/screen`, which runs the
model and comes back with a risk category, a confidence number, a
probability breakdown, and some suggested next steps. The X-ray itself
gets saved to `uploaded_xrays/` so it's there if you need to look back
at it.

**Patient History** is just every screening that's ever been run,
searchable and filterable by risk level, with a detail view if you
click into one.

**Dashboard** gives you the bird's-eye view — how many people have
been screened, how many came back high-risk, average pain/mobility
scores, and a couple of charts (risk spread, screenings over time,
occupation breakdown).

## How a probability becomes "Mild" or "Severe"

The model itself only gives you one number: how likely it thinks the
X-ray shows osteoarthritis, from 0–100%. To keep the rest of the app
working the way it already did (the colored chips, the dashboard
filters), that number gets split into four bands:

| Model's OA probability | Shown as |
|---|---|
| under 20% | Normal |
| 20–45% | Mild |
| 45–70% | Moderate |
| 70% and up | Severe |

I want to be honest about these numbers: I picked them, they're not
from a clinical study. The model was trained to answer "does this
X-ray show OA, yes or no" — it was never trained to grade severity on
a scale. These thresholds are a reasonable stand-in so the UI has
something to show, not a validated medical scale. If you get access to
data with real severity grades (KL grades, for instance), it'd be
worth recalibrating these — the cutoffs live in one place,
`image_model.py`, so that's an easy change later.

## Where this actually stands, accuracy-wise

On a properly held-out test set, the model lands around 90% accuracy
and a 0.965 AUC telling Normal from Osteoarthritis X-rays apart. For a
first pass, that's genuinely good — good enough to be useful as a
**triage tool** that flags people who should get a proper look from a
clinician. It is not, and shouldn't be presented as, a diagnosis. The
UI already tries to make that clear by calling results "preliminary,"
but it's worth repeating to anyone you show this to.

## If you keep building this

A few obvious next steps, roughly in order of how much they'd matter:

- Actually use the clinical form answers in the prediction, not just
  the image — a fusion model (image + symptoms) would likely do
  meaningfully better than the image alone.
- Get hold of a better, more clinically representative dataset if you
  can — the current model's accuracy is only as good as the Kaggle
  dataset it was trained on, which has its own quirks.
- User accounts per health worker, so screenings are tied to the
  person who ran them.
- Offline-first data capture for places with patchy internet — a
  local queue that syncs when connectivity comes back.
- Multilingual labels for the actual field workers who'd use this.

None of these need a rewrite — they're all things you can layer on top
of what's already here.