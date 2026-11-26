# Energetics

AP Biology Unit 3 practice with a five-axis radar chart, a performance rating after every set, and a customizable Redemption Questions queue.

## Run locally

From the repository directory, run:

```sh
python3 -m http.server 8736 --bind 127.0.0.1
```

Open [Energetics](http://127.0.0.1:8736/) in your browser. The app is static and needs no build step or account. Progress and flagged questions are stored in this browser.

## Practice and scoring

- Choose 20, 50, 100, or all 102 questions. Each set includes all five Unit 3 topics, sampled without repeats. The smaller sets distribute questions across the five topics as evenly as the pool permits.
- Each axis shows correct answers divided by attempted questions within that topic. A topic with no questions in a custom redemption set is marked unmeasured.
- Ratings reflect the displayed set accuracy. Excellent is 90% or higher, Strong starts at 75%, and Developing starts at 60%. The rest are rated Needs review. These are practice ratings.
- A wrong answer flags the question immediately. Filter or hand-pick flagged items to build a redemption set. A correct answer during redemption clears the flag.
- Focus advice is tied to the concepts behind missed questions and ordered by the number of misses.

## Question bank

The bank uses 102 items with explicit answer keys in the supplied *AP Biology Unit 3 MCQ Scoring Guide*. Question images retain the source numbering, shared stimuli, and figures. Answer markings were removed from the quiz images. The question excerpts and explanations are derived from the supplied guide. The [College Board course framework](https://apcentral.collegeboard.org/media/pdf/ap-biology-course-and-exam-description.pdf) supplies the five topic categories.
