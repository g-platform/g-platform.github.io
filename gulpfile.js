const fs = require('fs-extra');
const gulp = require('gulp');
const pug = require('pug');
const less = require('gulp-less');
const _ = require('lodash');
const glob = require('glob');
const marked = require('marked');
const yaml = require('yaml-js');
const watch = require('gulp-watch');
const fetch = require('fetch');
const log = require('fancy-log');

const fetchAsync = url => new Promise(
    (resolve, reject) => fetch.fetchUrl(url,
        (e, m, body) => e ? reject(e) : resolve(body.toString())
    ));

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
    ['gcanvas-coorperation']: pug.compile(
        fs.readFileSync('./template/gcanvas-coorperation.pug', 'utf-8'),
        {
            filename: './template/gcanvas-coorperation.pug',
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
    ),
    ['g3d-guide']: pug.compile(
        fs.readFileSync('./template/g3d-docs.pug', 'utf-8'),
        {
            filename: './template/g3d-docs.pug',
            pretty: true
        }
    ),
    ['gcanvas-docs']: pug.compile(
        fs.readFileSync('./template/gcanvas-docs.pug', 'utf-8'),
        {
            filename: './template/gcanvas-docs.pug',
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
    fs.writeFileSync('./docs/gcanvas-coorperation.html', templates['gcanvas-coorperation'](option));

    const configDocs = yaml.load(fs.readFileSync('./sources/index.yaml')).docs;

    Object.keys(configDocs).forEach(scope => {

        function deal(docs, k, s) {
            if (typeof docs === 'string') {
                const content = fs.readFileSync(`./sources/${scope}/${k}.md`, 'utf-8');

                if (content) {
                    fs.outputFileSync(`./docs/${scope.split('-').join('/')}/${k}.html`, templates[scope](
                        {
                            index: configDocs[scope],
                            content: marked(content),
                            root: '../../'
                        }
                    ));
                } else {
                    throw new Error('Read source file failed, please run gulp fetch first.');
                }
            } else {
                for (let key in docs) {
                    deal(docs[key], key, docs);
                }
            }
        }

        const docs = configDocs[scope];

        deal(docs);
    });
})


gulp.task('fetch', async function () {

    const config = yaml.load(fs.readFileSync('./sources/index.yaml'));

    const scopes = [
        'g3d-docs',
        'g3d-guide',
        'gcanvas-guide',
        'gcanvas-docs'
    ];

    for (let item of scopes) {
        await dealScope(config['docs'][item], item);
    }

    async function dealScope(docs, scope) {
        for (let name in docs) {
            const url = docs[name];
            if (typeof url === 'string') {
                try {
                    const content = await fetchAsync(url);
                    log(`Fetch ${name} success. Content length ${content.length}`);
                    fs.outputFileSync(`./sources/${scope}/${name}.md`, content);
                } catch (e) {
                    log(`Error : fetch ${name}(${url}) failed. Message: ${e.toString()}`);
                }
            } else {
                await dealScope(url, scope);
            }
        }
    }
})