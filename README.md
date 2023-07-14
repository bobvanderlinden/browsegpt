# BrowseGPT

Chrome-extension that gives OpenAI GPT control over your browser session.
Instruct GPT what to do and it will use your browser to follow through.

It is able to:

- Navigate to URLs
- Click links
- Fill in and submit forms

## Installation

- `npm install`
- `npm run build`
- Go to `chrome://extensions`
- Select `Manage Extensions`
- Enable `Developer mode`
- Click `Load unpacked`
- Choose [extension/](extension/) where `manifest.json` is located.

## Configuration

- In the Chrome toolbar, click the extensions button
- Pin `BrowseGPT` to toolbar
- Click `BrowseGPT` icon in toolbar
- Click `Options`
- Fill in your OpenAI API key
- Click `Save`

## Usage

- Click `BrowseGPT` icon in toolbar
- Type your instructions to fulfil and hit enter.

Examples:

- Place something to buy for a 5 year-old in my basket on Amazon.com
