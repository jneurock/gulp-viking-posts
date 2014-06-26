var DOMParser = require('xmldom').DOMParser,
		frontMatter = require('front-matter'),
		gulpUtil = require('gulp-util'),
		markdown = require('marked'),
		through = require('through2'),
		titleCase = require('to-title-case'),
		titleSeparator = '-';

/**
 * Create a post object
 *
 * @param {Object} file
 * @param {Object} [options]
 * @returns {string} post object as a string
 */
function createPost( file, options ) {

	var _formatDate = options && typeof options.formatDate === 'function' ?
				options.formatDate : formatDate,
			post = new Post();

	// Parse front matter to get as many post attributes as possible
	parseFrontMatter( file, post, options );

	// Get category from path if not from front matter
	if ( !post.category ) {

		post.category = getCategoryFromPath( file );
	}

	// Get creation date from file if not from front matter
	if ( !post.created ) {

		post.created = _formatDate( file.stat.ctime );
	}

	// Get excerpt from first <p> tag if not from front matter
	if ( !post.excerpt ) {

		post.excerpt = getDefaultExcerpt( post.content );
	}

	// Get title from file name if not from front matter
	if ( !post.title ) {

		post.title = getTitleFromPath( file );
	}

	// Get updated date from file if not from front matter
	if ( !post.updated ) {

		post.updated = _formatDate( file.stat.mtime );
	}

	return JSON.stringify( post );
}

/**
 * Format a date
 *
 * @param {(Object|string)} date The date object to format
 * @returns {string}
 */
function formatDate( date ) {

	var dateString = '';

	date = new Date( date );

	dateString = date.getMonth() + 1;
	dateString += '/';
	dateString += date.getDate();
	dateString += '/';
	dateString += date.getFullYear();

	return dateString;
}

/**
 * Get post category from file path
 *
 * @param {Object} file
 * @returns {string}
 */
function getCategoryFromPath( file ) {

	var category = '',
			i = 0,
			parts = file.path.split('/'),
			len = parts.length,
			last = len - 1;

	for ( ; i < len; i++ ) {

		/*
		 * If previous path part is "posts" and the
		 * current path part isn't the last path part
		 */
		if ( parts[i - 1] === 'posts' && i !== last ) {

			category = parts[i];

			break;
		}
	}

	return category;
}

/**
 * Get the post excerpt from the first <p> tag found
 *
 * @param {string} content The full post content
 * @returns {string}
 */
function getDefaultExcerpt( content ) {

	var doc = new DOMParser().parseFromString( content, 'text/html' ),
			pTags = doc.getElementsByTagName('p');

	if ( pTags.length ) {

		return '<p>' + pTags[0].firstChild.nodeValue + '</p>';

	} else {

		return '';
	}
}

/**
 * Get post title from file path
 *
 * @param {Object} file
 * @param {Object} [options]
 * @returns {string}
 */
function getTitleFromPath( file, options ) {

	var _titleSeparator = options && options.titleSeparator ?
				options.titleSeparator : titleSeparator,
			i = 0,
			parts = file.path.split('/'),
			fileParts = parts[parts.length - 1].split('.'),
			filename = fileParts[0],
			fileNameParts = filename.split( _titleSeparator ),
			len = fileNameParts.length,
			title = '';

	for ( ; i < len; i++ ) {

		title += i ? ' ' : '';
		title += fileNameParts[i];
	}

	return titleCase( title );
}

/**
 * Check if front matter attribute is custom or not
 *
 * @param {string} attr The attribute name
 * @returns {boolean}
 */
function isCustomFrontMatter( attr ) {

	if ( attr !== 'title' && attr !== 'category' && attr !== 'content' &&
		attr !== 'created' && attr !== 'excerpt' && attr !== 'updated' ) {

		return true;

	} else {

		return false;
	}
}

/**
 * Parse YAML front matter from post
 *
 * @param {Object} file The post file object
 * @param {Object} post The new post object we're working with
 * @param {Object} [options]
 */
function parseFrontMatter( file, post, options ) {

	var _formatDate = options && typeof options.formatDate === 'function' ?
				options.formatDate : formatDate,
			content = frontMatter( file.contents.toString() ),
			prop = '';

	if ( content.attributes ) {

		post.category = content.attributes.category || '';
		post.created = content.attributes.created ? _formatDate( content.attributes.created ) : '';
		post.title = content.attributes.title || '';
		post.updated = content.attributes.updated ? _formatDate( content.attributes.updated ) : '';

		if ( content.attributes.excerpt ) {

			post.excerpt = markdown( content.attributes.excerpt );
		}

		post.content = content.body ? markdown( content.body ) : '';

		// Look for custom front-matter
		for ( prop in content.attributes ) {

			if ( content.attributes.hasOwnProperty(prop) && isCustomFrontMatter( prop ) ) {

				post[ prop ] = content.attributes[ prop ];
			}
		}
	}
}

/**
 * Post object constructor
 *
 * @constructor
 */
function Post() {

	return {
		/**
		 * Optional post category
		 *
		 * @type {string}
		 */
		category: '',
		/**
		 * Full post content
		 *
		 * @type {string}
		 */
		content: '',
		/**
		 * Post creation date
		 *
		 * @type {string}
		 */
		created: '',
		/**
		 * Optional post excerpt
		 *
		 * @type {string}
		 */
		excerpt: '',
		/**
		 * Post title
		 *
		 * @type {string}
		 */
		title: '',
		/**
		 * Optional post updated date
		 *
		 * @type {string}
		 */
		updated: ''
	};
}

/**
 * Sort posts. By default posts are sorted by
 * date descending, category, title
 *
 * @param {Object} a
 * @param {Object} b
 */
function sortPosts( a, b ) {

	var dateA = new Date( a.created ),
			dateB = new Date( b.created );

	// See if dates match
	if ( dateB - dateA === 0 ) {

		// See if categories are the same
		if ( a.category === b.category ) {

			// Sort by title
			return a.title.localeCompare( b.title );

		// Sort by category
		} else {

			return a.category.localeCompare( b.category );
		}

	// Sort by date descending
	} else {

		return dateB - dateA;
	}
}

/**
 * Iterate over posts objects and delete the content property
 *
 * @param {string} posts
 * @param {Object} [options]
 * @returns {string}
 */
function removePostsContent( posts, options ) {

	var _sortPosts = options && typeof options.sortPosts === 'function' ?
				options.sortPosts : sortPosts,
			i = 0,
			len = 0;

	// Posts should be objects separated by commas but not wrapped in []
	posts = JSON.parse( '[' + posts.contents.toString() + ']' );

	len = posts.length;

	for ( i; i < len; i++ ) {

		delete posts[i].content;
	}

	// Sort posts by newest
	posts.sort( _sortPosts );

	return JSON.stringify( posts );
}

module.exports = function( options ) {

	options = options || {};

	return through.obj(function( file, enc, cb ) {

		if ( file.isNull() ) {

			this.push( file );

			return cb();
		}

		if ( file.isStream() ) {

			this.emit('error', new gulpUtil.PluginError('gulp-viking-blog', 'Streaming not supported'));

			return cb();
		}

		// Override format date function
		if ( options.formatDate && typeof options.formatDate === 'function' ) {

			formatDate = options.formatDate;
		}

		// Override sort posts function
		if ( options.sortPosts && typeof options.sortPosts === 'function' ) {

			sortPosts = options.sortPosts;
		}

		// Override title separator for use with generating title from file name
		if ( options.titleSeparator ) {

			titleSeparator = options.titleSeparator;
		}

		// If concat option is set, iterate over post objects and remove full content
		if ( options.concat ) {

			file.contents = new Buffer( removePostsContent( file, options ) );

		// Else create post object
		} else {

			file.contents = new Buffer( createPost( file, options ) );

			file.path = gulpUtil.replaceExtension( file.path, '.json' );
		}

		this.push( file );

		cb();
	});
};