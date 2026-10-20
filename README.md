# Mower status card

Home Assistant dashboard card for a robotic lawn mower, with its state, battery and the task under way, what is wrong
with it, and its buttons.

[![GitHub Release][releases-shield]][releases] [![GitHub Release Date][release-date-shield]][releases] [![HACS][hacs-shield]][hacs] [![License][license-shield]](LICENSE)

<p>
<img src="https://raw.githubusercontent.com/jesmak/mower-status-card/main/docs/images/mowing-light.png#gh-light-mode-only" width="400" alt="A mower mowing, a ring with the task 46% done, the time left, the battery and the time elapsed beside it, and a large pause button">
<img src="https://raw.githubusercontent.com/jesmak/mower-status-card/main/docs/images/mowing-dark.png#gh-dark-mode-only" width="400" alt="A mower mowing, a ring with the task 46% done, the time left, the battery and the time elapsed beside it, and a large pause button">
<img src="https://raw.githubusercontent.com/jesmak/mower-status-card/main/docs/images/problems-light.png#gh-light-mode-only" width="400" alt="A paused mower with five problems as chips, an error, weak positioning, worn blades, rain and an update, with the error's text open below them">
<img src="https://raw.githubusercontent.com/jesmak/mower-status-card/main/docs/images/problems-dark.png#gh-dark-mode-only" width="400" alt="A paused mower with five problems as chips, an error, weak positioning, worn blades, rain and an update, with the error's text open below them">
</p>

## What is it?

A custom card for a robotic lawn mower. It shows what the mower is doing and how far it has got, its battery, and when
it last mowed. Whatever is wrong with it shows as chips, an error, weak positioning, worn blades, rain or a firmware
update, and nothing shows while all is well. One large button does what makes sense now. It pauses while mowing,
continues an unfinished task, or starts a new one. Cancel and dock sit beside it.

The card needs only the mower's `lawn_mower` entity. It finds the rest on the mower's own device, the battery,
charging and rain by Home Assistant's own device classes and the firmware by its update entity for any mower, and for a
[Mammotion](https://github.com/mikey0000/Mammotion-HA) mower everything else too, such as the task's progress, the last
error, positioning and the blades. A [Sunseeker](https://github.com/Sdahl1234/Sunseeker-lawn-mower) mower, Brucke and
Adano among them, gets its error, rain sensor and picture found, and its own states understood. With another
integration the rest can be chosen in the card's editor. The card
works alongside a map of the mower, such as [ha-map-card](https://github.com/nathan-gs/ha-map-card) with
[Mammotion's GeoJSON plugin](https://github.com/mikey0000/ha-mammotion-geojson-map-plugin), but doesn't draw one.

## Installation

### With HACS

1. Add this repository to HACS custom repositories with type **Dashboard**
2. Search for Mower status card in HACS and download it
3. Refresh your browser

### Manual

1. Take `dist/mower-status-card.js` from the source code of the [latest release][releases] and copy it to the
   `config/www` folder of your Home Assistant installation
2. In Home Assistant settings, open dashboards, click the three dots at the top right and open resources
3. Add a new resource with the path `/local/mower-status-card.js` and type JavaScript
4. Refresh your browser

## Options

| Name                  | Type    | Default   | Description                                                                                |
| --------------------- | ------- | --------- | ------------------------------------------------------------------------------------------ |
| `type`                | string  | required  | `custom:mower-status-card`                                                                 |
| `entity`              | string  | required  | The mower's `lawn_mower` entity                                                            |
| `name`                | string  |           | Replaces the device's name                                                                 |
| `show_image`          | boolean | `true`    | Show a picture of the mower when one is given or found. Without one the card shows a gauge |
| `image`               | string  |           | A picture of your own, such as `/local/mower.png`. Replaces the one found                  |
| `image_variant`       | string  | `default` | For a Mammotion mower, `white` for the white model's picture where there is one            |
| `show_cancel`         | boolean | `true`    | Show the cancel button, or Home Assistant's stop for a mower that has none                 |
| `blade_warning_hours` | number  |           | The blades' limit in hours, for a mower that reports none of its own                       |
| `entities`            | map     |           | The mower's other entities, only where they differ from what the card finds. See below     |

Each key of `entities` is one of the slots below, and its value an entity id, or `none` to leave the slot out. A slot
left out of `entities` uses what the card found.

| Slot          | Domain                  | What it is                           | Found for any mower by          |
| ------------- | ----------------------- | ------------------------------------ | ------------------------------- |
| `battery`     | sensor                  | Battery level                        | Device class `battery`          |
| `charging`    | binary_sensor           | Whether it is charging               | Device class `battery_charging` |
| `progress`    | sensor                  | The task's progress, in %            |                                 |
| `time_left`   | sensor                  | The task's time left                 |                                 |
| `elapsed`     | sensor                  | The task's time elapsed              |                                 |
| `error`       | sensor                  | The last error                       |                                 |
| `error_time`  | sensor                  | When the last error happened         |                                 |
| `rain`        | binary_sensor or sensor | Whether it rains, or "wet" for rain  | Device class `moisture`         |
| `positioning` | sensor or binary_sensor | RTK positioning, or "on" for weak    |                                 |
| `vision`      | sensor or binary_sensor | Visual positioning, or "on" for weak |                                 |
| `satellites`  | sensor                  | Satellites in view                   |                                 |
| `blade_time`  | sensor                  | The blades' running time             |                                 |
| `blade_limit` | sensor                  | The blades' limit, set on the mower  |                                 |
| `update`      | update                  | The firmware                         | The device's `update` entity    |
| `mileage`     | sensor                  | The distance mowed in total          |                                 |
| `continue`    | button                  | Continues the last task              |                                 |
| `cancel`      | button                  | Cancels the task                     |                                 |
| `picture`     | image                   | A picture of the mower               |                                 |

For a Mammotion mower every slot but charging and the picture is found by its entities' translation keys, which stay put
when you rename an entity, and for a Sunseeker mower the error, rain and picture slots. A Mammotion mower's charging is
found by its device class, and its picture comes from ha-mammotion-assets. Everything can be set in the card's visual
editor, which shows what was found for each slot.

## What it shows

- **The state**, in the integration's own words where they say more than Home Assistant's standard states, otherwise
  in the card's or Home Assistant's, and whether the mower is charging.
- **A ring** with the one number that matters now, which is the task's progress while a task is under way and the
  battery otherwise.
- **While mowing**, the time left, the battery and the time elapsed. **Between tasks**, when it last mowed ("Last mowed
  yesterday at 3:18 PM"), from Home Assistant's history. The distance mowed in total shows whenever it isn't mowing.
- **The large button** pauses while mowing, continues a task that isn't finished, and otherwise starts. A mower that
  can't pause gets a dock button in its place. A mower with a continue button of its own, as Mammotion's have, works
  in tasks ("Continue task", "Start a new task"). Any other just mows ("Continue mowing", "Start mowing") through Home
  Assistant's own `lawn_mower.start_mowing`.
- **Cancel**, with a confirmation, when the mower has a cancel button and a task is under way. A mower without one
  that can stop gets Home Assistant's **stop** in its place, also with a confirmation. **Dock** unless it is
  docked or charging. A button the mower can't use is left out, one it can't use now is greyed.

<img src="https://raw.githubusercontent.com/jesmak/mower-status-card/main/docs/images/paused-light.png#gh-light-mode-only" width="510" alt="A mower paused 63% through its task while it charges, the ring with the task's progress and a large continue button">
<img src="https://raw.githubusercontent.com/jesmak/mower-status-card/main/docs/images/paused-dark.png#gh-dark-mode-only" width="510" alt="A mower paused 63% through its task while it charges, the ring with the task's progress and a large continue button">

### Problems

Each problem is a chip, the most severe first. The chip's text opens below the chips when it is chosen, and closes when
it is chosen again. The most severe one opens by itself when a problem appears that hasn't been seen since the page
was opened, so rain that comes and goes doesn't keep opening it. An error with a new time or text counts as new.

- **Error:** the last error for as long as the mower is in its error state, and otherwise for 24 hours after it happened
  by the error time sensor. A source prefix such as "mcu:" is dropped, and an error in several lines keeps them. A
  sensor's own word for no error, such as `no_error`, is no error, and an error from a list of codes shows as Home
  Assistant translates it. A mower in its error state with no error text gets a general error, or the integration's own
  word for that state where it has one.
- **Weak positioning**, only while the mower is out on a task and not charging. It is Mammotion's RTK in another mode
  than Fix, or its visual positioning weak, with the satellites in view. A binary sensor in either slot is weak when on.
- **Blades:** once their running time reaches the limit set on the mower, or `blade_warning_hours` when the mower has
  none.
- **Rain**, while the rain sensor is on, or says "wet".
- **Update**, while a firmware update is available.

### The picture

With a picture of the mower the card shows it beside the state, greyed while the mower is unavailable. The picture is
the first of these that loads, in this order. The card's own `image`, the integration's picture entity, such as
Sunseeker's, the mower entity's own picture, and for a Mammotion mower its model's picture from
[ha-mammotion-assets](https://github.com/mikey0000/ha-mammotion-assets) when that is installed. A picture that didn't
load is tried again when the address of one of these pictures changes, as an image entity's does with each new token,
and comes back once it loads. Without any, or with `show_image: false`, the card shows the ring.

A model picture sits in a framed box with a soft background in the theme's colours. So does a picture of your own that
is transparent at its corners, such as a cut-out photo of your mower. A picture with a background of its own, such as a
photo with the lawn in it, is shown as it is, with rounded corners.

<p>
<img src="https://raw.githubusercontent.com/jesmak/mower-status-card/main/docs/images/picture-light.png#gh-light-mode-only" width="510" alt="A mowing mower with its photo beside the large state, the battery and the time left below it, a bar with the task 46% done and the time elapsed, a large pause button beside cancel and dock, and the name at the bottom">
<img src="https://raw.githubusercontent.com/jesmak/mower-status-card/main/docs/images/picture-dark.png#gh-dark-mode-only" width="510" alt="A mowing mower with its photo beside the large state, the battery and the time left below it, a bar with the task 46% done and the time elapsed, a large pause button beside cancel and dock, and the name at the bottom">
</p>

Clicking the mower's name or picture opens its entity.

## Sizes

In a sections view the card takes a whole section by default and can be made as narrow as half of one. On a narrow
card the large button takes a row of its own, and on a very narrow one, such as half of a phone's section, the ring or
the picture moves above the texts. A day and a time are never broken apart from their own words, so "Last mowed" wraps
before "Wed, 10/14 at 3:18 PM" does.

<p>
<img src="https://raw.githubusercontent.com/jesmak/mower-status-card/main/docs/images/narrow-light.png#gh-light-mode-only" width="270" alt="A narrow card, the ring beside the texts and the large button on a row of its own above cancel and dock">
<img src="https://raw.githubusercontent.com/jesmak/mower-status-card/main/docs/images/narrow-dark.png#gh-dark-mode-only" width="270" alt="A narrow card, the ring beside the texts and the large button on a row of its own above cancel and dock">
<img src="https://raw.githubusercontent.com/jesmak/mower-status-card/main/docs/images/very-narrow-light.png#gh-light-mode-only" width="210" alt="A very narrow card, the ring above the name, state and times, and the buttons below">
<img src="https://raw.githubusercontent.com/jesmak/mower-status-card/main/docs/images/very-narrow-dark.png#gh-dark-mode-only" width="210" alt="A very narrow card, the ring above the name, state and times, and the buttons below">
</p>

## Examples

### A Mammotion mower

Nothing else is needed. The card finds the rest, and shows the model's picture when ha-mammotion-assets is installed.

```yaml
type: custom:mower-status-card
entity: lawn_mower.rosie
```

### Another mower, with its sensors chosen

```yaml
type: custom:mower-status-card
entity: lawn_mower.back_yard
image: /local/back-yard-mower.png
blade_warning_hours: 200
entities:
  error: sensor.back_yard_error
  blade_time: sensor.back_yard_cutting_blade_usage_time
  mileage: sensor.back_yard_total_drive_distance
  rain: binary_sensor.weather_station_rain
```

### Without the picture or the cancel button

```yaml
type: custom:mower-status-card
entity: lawn_mower.rosie
show_image: false
show_cancel: false
```

## Data

Everything comes from the mower's entities in Home Assistant, and when it last mowed from Home Assistant's history of
the mower, the last 10 days of it by default. The card fetches nothing else, apart from checking whether
ha-mammotion-assets has the model's picture.

The card has been tested with [Mammotion](https://github.com/mikey0000/Mammotion-HA) and
[Sunseeker](https://github.com/Sdahl1234/Sunseeker-lawn-mower) mowers. The Sunseeker preset follows the states in the
integration's source, and has so far been tried with a mower at rest only. Anything that has a `lawn_mower` entity works
with what Home Assistant's standards give, which is its state, buttons, battery, charging, rain, firmware and when it
last mowed. An integration's own preset lives in `src/slots.ts`, with the translation keys of its slots and, for an
integration that has states of its own, what each of them means. A pull request adding yours is welcome, from someone
who can test it with their own mower.

## Translating

The card's texts are in `src/localize/languages/`, one JSON file per language, named by its language code, such as
`en.json` and `fi.json`. To add a language, copy `en.json` to the new language's code, such as `sv.json`, and translate
the values. Nothing else needs changing. The card finds the file by itself and uses it when Home Assistant is set to
that language. A text left out falls back to English, apart from those under `state`, which fall back to Home
Assistant's word. The mower's states come in the integration's own words where they say more than Home Assistant's
standard states, such as Sunseeker's, otherwise in the card's or Home Assistant's, and the errors in the integration's.
The texts under `state` give the card words of its own for idle, returning and error, as Home Assistant hasn't
translated those into every language. Leave out any for which Home Assistant's word will do.

## Development

Requires Node 22.13 or newer.

```
npm install
npm run check
```

`npm run check` typechecks, lints, checks formatting, runs the tests and builds `dist/mower-status-card.js`, which is
the file HACS installs and is committed to the repository.

| Path                       | What it contains                                                              |
| -------------------------- | ----------------------------------------------------------------------------- |
| `src/mower-status-card.ts` | The card itself                                                               |
| `src/editor.ts`            | The visual editor                                                             |
| `src/slots.ts`             | Finding the mower's other entities, and the integrations' presets             |
| `src/mower.ts`             | What the states mean, such as the large button, the problems and the pictures |
| `src/localize/languages/`  | The card's texts, one JSON file per language                                  |
| `docs/screenshots.json`    | The made-up data the README's screenshots are taken from                      |
| `tests/`                   | Tests, run with vitest                                                        |

## Support

Hey dude! Help me out for a couple of :beers: or a :coffee:!

[![coffee](https://www.buymeacoffee.com/assets/img/custom_images/black_img.png)](https://www.buymeacoffee.com/jesmak)

## Thanks

To Syced for the photo of a mower in the screenshots, from Wikimedia Commons.

## License

MIT, see [LICENSE](LICENSE). The photo of a mower in the screenshots is CC0, see
[LICENSE-example-mower](LICENSE-example-mower).

[releases-shield]: https://img.shields.io/github/release/jesmak/mower-status-card.svg?style=for-the-badge
[release-date-shield]: https://img.shields.io/github/release-date/jesmak/mower-status-card?style=for-the-badge
[releases]: https://github.com/jesmak/mower-status-card/releases
[hacs-shield]: https://img.shields.io/badge/HACS-Custom-orange.svg?style=for-the-badge
[hacs]: https://hacs.xyz/docs/faq/custom_repositories/
[license-shield]: https://img.shields.io/github/license/jesmak/mower-status-card.svg?style=for-the-badge
