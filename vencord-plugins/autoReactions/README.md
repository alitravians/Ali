# AutoReactions

AutoReactions is a simple [Vencord](https://vencord.dev) plugin that automatically adds emoji reactions to messages containing specific keywords. When a new message is received, AutoReactions compares its content against a list of keywords and reacts with the corresponding emoji. For example:

- Messages containing “شكرا”, “thanks” or “thx” will automatically receive ❤️.
- Messages containing “مرحبا”, “hello” or “hi” will automatically receive 👋.

## Features

- Fully client‑side – no bots or external services.
- Configurable keyword → emoji rules by editing the `TRIGGERS` array in the source code.
- Light‑weight and open‑source.

## Installation

> **Note**: This plugin is not yet part of the official Vencord plugin collection. You will need a development build of Vencord to load custom plugins【662011322760364†L119-L156】.

1. Install a development build of Vencord and set up your environment as described in the [official plugin development guide](https://docs.vencord.dev/plugins/)【662011322760364†L119-L156】.
2. Clone or download this repository and copy the contents of `vencord-plugins/autoReactions` into Vencord’s `src/plugins` folder.
3. Build Vencord and start Discord. You should now see **AutoReactions** in the list of plugins.

## Configuration

The file `index.ts` defines a constant `TRIGGERS` containing an array of rules. Each rule has a `keywords` array and an `emoji` string. Edit this array to customise which words trigger which reactions.

```ts
const TRIGGERS = [
  {
    keywords: ["شكرا", "thanks", "thx"],
    emoji: "❤️",
  },
  {
    keywords: ["مرحبا", "hello", "hi"],
    emoji: "👋",
  },
  // add more rules here…
];
```

After modifying `TRIGGERS`, rebuild Vencord and reload Discord to apply your changes.

## License

AutoReactions is released under the GNU GPLv3. See the source code for details.
