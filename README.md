# ld-last-visited

👉 [中文说明文档](./README.zh-CN.md)

A Tampermonkey user script that displays a floating popup showing the last topic you viewed before the current page refresh on [linux.do](https://linux.do).

## Features

- Automatically tracks the latest topic you viewed.
- Displays a floating popup in the top-left corner showing the title and link to your last viewed topic.
- Retains the information across sessions via persistent storage.
- Works on `https://linux.do/latest?order=created`.

## Installation

1. Install [Tampermonkey](https://tampermonkey.net/) in your browser.
2. [Click here to install the script](ld-last-visited-topic).
3. Refresh `https://linux.do/latest?order=created` and the popup will appear in the corner.

## File Structure

```
ld-last-visited/
├── ld-last-visited.user.js   # Main user script
├── README.md                 # Project documentation
```

## License

MIT
