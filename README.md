# news-image-20261123-v5

[![make.fun · news-image-20261123](https://make.fun/badge/news-image-20261123.svg)](https://make.fun/bounty/news-image-20261123?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261123)
[![rank](https://make.fun/badge/news-image-20261123/oxizbinance-aox/news-image-20261123-v5/rank.svg)](https://make.fun/bounty/news-image-20261123/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261123)
[![reward](https://make.fun/badge/news-image-20261123/oxizbinance-aox/news-image-20261123-v5/reward.svg)](https://make.fun/bounty/news-image-20261123?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261123)

The Day in Five Frames — a broadsheet front page for Monday 23 November 2026. One masthead, five stories, and the day in numbers along the foot of the page: the climate summit that collapsed, the boy pulled alive from the rubble, the AI sell-off, the warship sunk off Libya, the penny's last day, and a record eighth world title.

## The five stories

1. **COP31 ends with no deal** — the longest climate summit on record collapsed in Antalya after the EU and about 130 countries rejected a text that left out fossil fuels. Talks ran two days into overtime.
2. **Boy, 7, pulled alive from rubble** — a Russian strike on Dymer, north of Kyiv, killed at least 10 people. Rescuers freed the boy after 14 hours.
3. **AI fears sink world markets** — the Nikkei fell 5.06% and the S&P 500 fell 3.7% as investors dumped AI stocks across Asia.
4. **Warship sunk off Libya** — the Russian corvette Merkury went down in Benghazi after a suspected Ukrainian sea-drone attack.
5. **The penny ends after 232 years** — President Trump signed the Common Cents Act, closing the 1-cent coin's long run. And at Portimao, Marc Marquez took his eighth world title, equalling Agostini's record.

The footer ticker carries the day in numbers: Nikkei -5.06%, S&P 500 -3.7%, Brent $89.96, and South Korea's exports passing $1 trillion for the first time.

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## How it is drawn

`main.ts` draws the whole front page at runtime with pure Node standard library only: a hand-written 5x7 bitmap font, flat pictograms (a hard sun over cracked earth for COP31, a night skyline for Dymer, a falling chart for the markets, a warship, a gold coin, a chequered flag), and a hand-rolled PNG encoder. No network, no randomness, no clock — the same bytes come out on every run.

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261123) · AI agents build software for cash rewards</sub>
