Viking Posts is a [gulp](http://gulpjs.com/) plugin meant to work with [Viking Base](https://github.com/jneurock/viking-base) to create lightweight JSON blog posts from Markdown files. The plugin can be used without Viking Base, too.

## Getting Started

Install the package via `npm`:

`npm install --save-dev gulp-viking-posts`

Edit the gulp file in your Viking Base project:
```javascript
// Output updates
vb.output.post = 'posts/';
vb.output.posts = 'posts.json';

// Source updates
vb.sources.posts = 'posts/**/*.md';

// Task updates
vb.tasks.build.depends = [
  'handlebars',
  'js-doc',
  'posts',
  'root'
];

vb.tasks.posts = {
  cb: function() {

    return gulp.src( this.sources.posts )
      .pipe( plugins.vikingPosts() )
      .pipe( gulp.dest( this.output.publish + this.output.post ) )
      .pipe( plugins.concat( this.output.posts, {
        newLine: ','
      }))
      .pipe( plugins.vikingPosts({
        concat: true
      }))
      .pipe( gulp.dest( this.output.publish + this.output.post ) );
  }
};

```

In the above example, 4 key steps are shown:

1. Post output is specified. There's a path to the post output folder, `vb.output.post`, and a file name for concatenated posts `vb.output.posts`.
2. Post source is defined `vb.sources.posts`.
3. Build dependencies now include posts task.
4. Posts task is defined. The example above also shows how to concatenate posts into one file.

Note: Concatenating posts is optional and is easily done by using the `gulp-concat` plugin that Viking Base already depends on. If you aren't using Viking Base, you'll need to include `gulp-concat` yourself. Pay close attention to the second argument passed to `plugins.concat`. This is an options hash for `gulp-concat`. It's critical that the `newLine` property's value is `','`. If not, `gulp-concat` will separate posts with a new line and produce invalid JSON for the final output. It's also key to pass an options hash to the second occurence of `plugins.vikingPosts` with a `concat` property having a value of `true`. This tells the Viking Posts plugin to work with concatenated posts and to remove the full content from them, leaving only the excerpt.

## Using gulp-viking-posts without Viking Base

Using this plugin without Viking Base is perfectly fine but the above example won't be too helpful.

A more abstract example:
```javascript
var concat = require('gulp-concat'),
    gulp = require('gulp'),
    vp = require('gulp-viking-posts');

gulp.task('posts', function() {
  
  return gulp.src('posts/**/*.md')
    .pipe( vp() )
    .pipe( gulp.dest('dist/posts') )
    .pipe( concat( 'posts.json', {
      newLine: ','
    }))
    .pipe( vp({
      concat: true
    }))
    .pipe( gulp.dest('dist/posts') );
});
```

## Writing Posts

Posts are simply [Markdown](http://daringfireball.net/projects/markdown/) files that can optionally include [YAML front matter](http://assemble.io/docs/YAML-front-matter.html). If front matter is ommitted, Viking Posts will get the title from the file name, the excerpt from the first `<p>` tag it finds, the creation and updated dates from the file system and the category from the file path. For example, a file found in `posts/articles/` that has no front matter will be categorized in "articles".

Example:
```markdown
---
title: Hello World
category: articles
excerpt: My first post!
created: 6/24/2014
updated:
---

# Hello World

This is my first post!
```

## Custom Front Matter

Any front matter that isn't `title`, `category`, `content`, `created`, `excerpt` or `updated` will be added to the generated post object.

## Plugin Options

You may pass an options hash to the Viking Posts plugin. The options are:

* `concat: {boolean}` Tells the Viking Posts plugin to concatenate posts
* `formatDate: {function}` User-defined function that overrides the built-in date formatting function. Expects a date or a string to be passed in.
* `sortPosts: {function}` User-defined sort function for concatenated posts. Defaults to date descending, category, title. Expects two post objects to be passed in.
* `titleSeparator: {string}` For use without front matter. Viking Posts will generate a post title from the file name, separating words by this separator. Default is `'-'`.

## Example Output

Single post `dist/posts/articles/hello-world.json`:
```json
{
  "title": "Hello World",
  "category": "articles",
  "excerpt": "<p>My firt post</p>",
  "content": "<h1>Hello World</h1>\n<p>My first post is here!</p>",
  "created": "6/20/2014",
  "updated": ""
}
```

Concatenated posts `dist/posts/posts.json`:
```json
[
  {
    "title": "Chicken Soup",
    "category": "recipes",
    "excerpt": "<p>A delicious chicken soup recipe that's been in my family for generations.</p>",
    "created": "6/19/2014",
    "updated": "6/24/2014"
  },
  {
    "title": "Hello World",
    "category": "articles",
    "excerpt": "<p>My firt post</p>",
    "created": "6/20/2014",
    "updated": ""
  }
]
```

## References
* [Viking Base](https://github.com/jneurock/viking-base)
* [npm](http://npmjs.org/)
* [gulp](http://gulpjs.com/)
* [Markdown](http://daringfireball.net/projects/markdown/)
* [YAML front matter](http://assemble.io/docs/YAML-front-matter.html)