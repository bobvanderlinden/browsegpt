## Vector store

A Vector store stores documents based on their embeddings. You can find similar documents based on embeddings of a query.

The problem with this approach is that finding individual elements within a HTML page requires the elements to be seen as separate documents. Storing each of these elements takes quite a while, as we need to fetch the embeddings of each document from OpenAI.

## Linear Summarization

Splitting the HTML document into segments, where each segment fits within the context of ChatGPT. We give the LLM any previously summarized text and ask to summirize the summarized text + the new segment. With each query for a summirization we also make the LLM take note of the goal we currently have. This works to some extend, but it is quite slow. Not only that, the most relevant elements were not retrieved unfortunately.

## HTML Stripping

Minimize the HTML by going through all elements recursively and only output parts that are semantically significant:

- Remove any tags that never hold any content (`<script>`, `<style>`, etc)
- Flatten any tags that are not relevant by themselves (`<div>`, `<span>`, etc)
- Remove any non-semantic attributes (only allow `href`, `data-`, etc, but remove `class`, `style`, etc)

## Recursive summarization

Snip deep parts of the HTML tree until the HTML fits inside the LLM token limit.
Let the LLM find the relevant parts of the tree and output their selectors.
The LLM may explore those parts of the tree later using their selectors.

In the following example all elements of depth 4 and higher are snipped.

```html
<html>
  <body>
    <section>
      <h1>Hello</h1>
      <p>
        This is some text
        <table>[...]</table>
      </p>
    </section>
  </body>
</html>
```

We ask the LLM to give
