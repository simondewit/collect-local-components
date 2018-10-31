# Collect Local Components
Captures tagged HTML comments and their corresponding HTML components from local HTML files and generates components.json.
*** This gulp task is an adjusted version of Arjen Scherff-de Water's collect-components task to handle local component scraping. (https://www.npmjs.com/package/collect-components) ***


## Usage
Use the keyword @component to flag html comments in your templates. Comments should be written in properly formatted [YAML](http://en.wikipedia.org/wiki/YAML) format.

```html
<!-- @component
    name: My Component
    description: this is a description for my component
-->
```

The immediate next DOM-node after the comment will be used as HTML-source for the component. If you need to capture multiple blocks, see [Capture multiple](#capture-multiple-blocks) blocks. Any parameter in the component block will be add to the `meta` object in the output json.

```html
<!-- @component
    name: My Component
-->

<div>This is my component</div>
<div>This isn't</div>
```

---


### Output file
Output will look something like this.

```json
[
  {
    "meta": {
      "name": "foo",
      "description": "foo description",
      "param": "foo"
    },
    "file": "file.html",
    "output": "<div>this is my component</div>"
  }
]
```


---

### Examples
You can add an example or multiple examples with the `example` or `examples` keyword, where the former is a YAML string and the latter a YAML list. The `{{block}}` flag will be replaced by the captured block

_single example_
```html
<!-- @component
    name: My Component
    example: |
        <div style="max-width: 300px">
            {{block}}
        </div>
-->

<p>this is my example</p>
```

_multiple example_
```html
<!-- @component
    name: My Component
    examples: 
        - >
            <div style="max-width: 300px">
                {{block}}
            </div>
        - >
            <div style="max-width: 300px">
                {{block}}
            </div>
-->

<p>this is my example</p>
```

---

### Capture multiple blocks
The `capture` keyword specifies how many blocks after the comment will be returned. Use `capture: all` to capture the comments' siblings. Use `capture: section` to capture all items until the next @component tag.

```html
<!-- @component
    name: My Component
    capture: 3
-->

<div>1</div>
<div>2</div>
<div>3</div>
<div>nope</div>
<div>nope</div>
```

```html
<!-- @component
    name: My Component
    capture: section
-->

<div>1</div>
<div>2</div>
<div>3</div>
<!-- @component -->
<div>nope</div>
```

```html
<!-- @component
    name: My Component
    capture: all
-->

<div>1</div>
<div>2</div>
<div>3</div>
<!-- @component -->
<div>yep</div>
```


---

### Reserved words
* `example` for an example block
* `examples` for multiple example blocks
* `capture` for the number of DOM-nodes to be captured
    - `all`: the rest of the DOM-nodes within the comments` parent
    - `section`: the rest of the DOM-nodes within the comments` parent or a new @component comment
    - `number`: the exact positive number of DOM-nodes

---

## How to use

* Copy the custom-modules folder into your project directory
* use the following terminal command to copy the custom module to your node-modules folder
```
npm install --save-dev custom-modules/collect-local-components
```

Copy the following code to you gulp file:

```js
//=================================================================================//
//=============================== COLLECT COMPONENTS  =============================//
//=================================================================================//
$.scraper = require('collect-local-components');

gulp.task('collect', function() {
    // make sure to compile html before scanning
    $.runSequence('all', 'your', 'other', 'tasks' 'collect-comps');
});

gulp.task('collect-comps', function() {
    $.scraper({
        url: 'demo/',
        keyword: '@component',
        block: '{{block}}',
        output: 'components.json',
        complete: function(components){}
    });
    console.log('>>> File components.json was created')
});
//=================================================================================//

```

You should be all set!

## NB: If you make any edits to the code of the custom module, don't forget to update the node-module too:
```
rm -rf node_module/custom_module && npm install
```

## If you want to use the collect local components in combination with Design Manual:

* Install Design Manual first:
```
npm install design-manual --save-dev
```
and copy the following code into your gulp file:

```js
//=================================================================================//
//=============================== COLLECT COMPONENTS  =============================//
//=================================================================================//
$.scraper = require('collect-local-components');

gulp.task('collect', function() {
    // make sure to compile html before scanning
    $.runSequence('clean', 'sass', 'html', 'collect-comps');
});

gulp.task('collect-comps', function() {
    $.scraper({
        url: 'demo/templates/',
        keyword: '@component',
        block: '{{block}}',
        output: path.demo + 'docs/components.json',
        complete: function() {
            // build design manual
            $.designManual.build({
                force: true,
                output: path.demo + 'styleguide/',
                pages: path.src + 'styleguide/',
                components: path.demo + 'docs/components.json',
                componentHeadHtml: `
                    <link rel="stylesheet" href="/static/css/style.css" />
                    <link rel="stylesheet" href="https://fonts.typotheque.com/WF-014369-010251.css" type="text/css" />
                    <link href="https://fonts.googleapis.com/css?family=Source+Sans+Pro:400,400i,700,700i" rel="stylesheet">
                `,
                componentBodyHtml: `
                    <script type="text/javascript" src="/static/js/script.js"></script>
                `,
                headHtml: `<style>
                    header.header {
                        background-color: #ed1b34;
                    }

                    .content h1 {
                        color: #ed1b34;
                    }

                    .content h2 {
                        color: #ed1b34;
                    }

                    .content h3 {
                        color: #ed1b34;
                    }

                    .content a {
                        color: #ed1b34;
                    }
                </style>`,
                nav: [
                    {
                        label: 'Index', href: 'index.html'
                    },
                    {
                        label: 'Templates', href: 'templates.html'
                    },
                    {
                        label: 'Components', href: 'components.html'
                    },
                    {
                        label: 'Elements', href: 'elements.html',
                    }
                ],
                meta: {
                    domain: 'zuyd.nl',
                    title: 'zuyd'
                },
                prerender: {
                    port: 3004,
                    path: path.demo + 'styleguide/',
                    serveFolder: path.demo + 'styleguide/'
                }
            });
        }
    });
    console.log('>>> File components.json was created')
});
//=================================================================================//

```