# Energetics

AP Biology Unit 3 practice with a five-axis radar chart, a performance rating after every set, and a customizable Redemption Questions queue.

## Run locally

From the repository directory, run:

```sh
python3 server.py
```

Open [Energetics](http://127.0.0.1:8736/) in your browser. Practice needs no build step or account. Progress and flagged questions are stored in this browser.

## Study Buddy

To enable GPT chat, stop the running server and start it with:

```sh
python3 server.py --ask-key
```

Enter an OpenAI API key at the hidden terminal prompt. The server also accepts the `OPENAI_API_KEY` environment variable and supports overriding the default model, GPT-5.6 Sol, with `OPENAI_MODEL`. The server listens only on this computer.

Open the **Ask Neko** tab and choose Neko or Chad. Each avatar has a separate conversation while the panel is open. Closing the panel clears both conversations. Questions and recent chat turns are sent to the [OpenAI Responses API](https://developers.openai.com/api/reference/resources/responses/methods/create). When chat is opened from a checked quiz question, the request can also include its text and feedback.

## Practice and scoring

- Choose 20, 50, 100, or all 102 questions. Each set includes all five Unit 3 topics, sampled without repeats. The smaller sets distribute questions across the five topics as evenly as the pool permits.
- Each axis shows correct answers divided by attempted questions within that topic. A topic with no questions in a custom redemption set is marked unmeasured.
- Ratings reflect the displayed set accuracy. Excellent is 90% or higher, Strong starts at 75%, and Developing starts at 60%. The rest are rated Needs review. These are practice ratings.
- A wrong answer flags the question immediately. Filter or hand-pick flagged items to build a redemption set. A correct answer during redemption clears the flag.
- Focus advice is tied to the concepts behind missed questions and ordered by the number of misses.

## Question bank

The bank uses 102 items with explicit answer keys in the supplied *AP Biology Unit 3 MCQ Scoring Guide*. Question text is typeset in the app font at source positions, retaining numbering, formatting, and answer order. Shared stimuli and figures are preserved. Original colors can be toggled in the quiz. The question excerpts and explanations are derived from the supplied guide. The [College Board course framework](https://apcentral.collegeboard.org/media/pdf/ap-biology-course-and-exam-description.pdf) supplies the five topic categories.

## Study music

Click the chibi avatar to start the bundled focus loop, or click again to switch it to reading. The bundled excerpt starts at 16:07 in [iCanStudy’s Study With Me video](https://www.youtube.com/watch?v=74cOUSKXMz0&t=967s). The selected Neko or Chad avatar plays the same music. The header Sound control mutes both music and sound effects.

## Free-response practice

Choose **FRQ** in the header for sets of 5, 10, or all 20 original Unit 3 questions. Graph questions accept drawing, tapping, and typed coordinates. **Grade response** sends only the current question, the rubric, and your response, including sampled graph coordinates, to the configured GPT model. Separate submissions carry no chat history. Moving to another FRQ also clears the Ask Neko conversation. Drafts and feedback stay available while the page is open. Scores are practice feedback.

On GitHub Pages, **Grade response** uses [GPT-5.6 Sol via Puter](https://developer.puter.com/ai/openai/gpt-5.6-sol/). The browser may ask the learner to sign in to Puter. Grading uses their Puter usage allowance or balance, and no API key or local server is needed. Only the current submission, prompt, and rubric are sent for each grade. The **Self-score with rubric** checklist is also available.

### Share your own API allowance

The standalone Node grader in `backend/` can grade public FRQs on the owner's OpenAI account. It requires Node.js 22 or later and has no package dependencies. Run `node backend/server.mjs` locally or deploy the Dockerfile on a container host. Set `OPENAI_API_KEY` and a strong `ENERGETICS_ACCESS_CODE` as private environment secrets on the host. Use one backend instance for the shared eight-request-per-minute quota.

Once the hosted HTTPS endpoint is deployed, set the `energetics-grader` meta tag in `index.html` to that endpoint's `/grade` URL and redeploy GitHub Pages. The site only needs the endpoint URL. The owner shares the access code privately with their group.
