Webflow media wheel blocks live here.

Use them like this:

1. Apply the classes from `01-wrapper-classes.css` to real Webflow elements.
2. Put `02-widget-html-css-block.html` inside a custom code embed placed inside `.mw-sticky-stage`.
3. Put `03-widget-js-block.html` inside a second custom code embed placed inside `.mw-scroll-section` as a sibling of `.mw-sticky-stage`.

Expected Webflow structure:

```html
<div class="mw-scroll-section">
  <div class="mw-sticky-stage">
    <!-- paste 02-widget-html-css-block.html -->
  </div>

  <!-- paste 03-widget-js-block.html -->
</div>
```

Notes:

- Do not wrap either block again with `.mw-scroll-section` or `.mw-sticky-stage`.
- Update these files when the widget changes, then copy-paste from here into Webflow.
