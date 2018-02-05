const fs = require('fs-extra');
const gulp = require('gulp');
const pug = require('pug');
const less = require('gulp-less');
const _ = require('lodash');
const glob = require('glob');
const marked = require('marked');

// marked.setOptions({
//   renderer: new marked.Renderer(),
//   gfm: true,
//   tables: true,
//   breaks: false,
//   pedantic: false,
//   sanitize: false,
//   smartLists: true,
//   smartypants: false
// });

const watch = require('gulp-watch');

const templates = {
    index: pug.compile(
        fs.readFileSync('./template/index.pug', 'utf-8'),
        {
            filename: './template/index.pug',
            pretty: true
        }
    ),
    gcanvas: pug.compile(
        fs.readFileSync('./template/gcanvas.pug', 'utf-8'),
        {
            filename: './template/gcanvas.pug',
            pretty: true
        }
    ),
    g3d: pug.compile(
        fs.readFileSync('./template/g3d.pug', 'utf-8'),
        {
            filename: './template/g3d.pug',
            pretty: true
        }
    ),
    ['g3d-docs']: pug.compile(
        fs.readFileSync('./template/g3d-docs.pug', 'utf-8'),
        {
            filename: './template/g3d-docs.pug',
            pretty: true
        }
    )
}


gulp.task('watch-less', function () {
    return watch('./style/**/*.less')
        .pipe(less())
        .pipe(gulp.dest('./docs'));
})


gulp.task('less', function () {
    return gulp.src('./style/**/*.less')
        .pipe(less())
        .pipe(gulp.dest('./docs'));
})


gulp.task('build', ['less'], function () {

    const option = {
        root: './'
    }

    fs.writeFileSync('./docs/index.html', templates.index(option));
    fs.writeFileSync('./docs/gcanvas.html', templates.gcanvas(option));
    fs.writeFileSync('./docs/g3d.html', templates.g3d(option));

    const docsData = {};
    glob.sync('./sources/*/*.md').forEach(fileName => {
        const [dot, source, scope, name] = fileName.split('/');
        const [baseName, md] = name.split('.');
        if (!docsData[scope]) {
            docsData[scope] = {};
        }
        docsData[scope][baseName] = fs.readFileSync(fileName, 'utf-8');
    });

    Object.keys(docsData).forEach(scope => {

        const scopeData = docsData[scope];

        Object.keys(scopeData).forEach(baseName => {

            fs.outputFileSync(`./docs/${scope.split('-').join('/')}/${baseName}.html`, templates[scope](
                { 
                    index: Object.keys(scopeData), 
                    content: marked(scopeData[baseName]) ,
                    root: '../../'
                }
            ));
        })
    })
})
