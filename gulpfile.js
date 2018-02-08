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
    ),
    ['gcanvas-guide']: pug.compile(
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
    
    const docsData = {};
    glob.sync('./sources/*/*.md').forEach(fileName => {
        const [dot, source, scope, name] = fileName.split('/');
        const [baseName, md] = name.split('.');
        if (!docsData[scope]) {
            docsData[scope] = {};
        }
        docsData[scope][baseName] = fs.readFileSync(fileName, 'utf-8');
    });

    const configDocs = yaml.load(fs.readFileSync('./sources/index.yaml')).docs;

    Object.keys(docsData).forEach(scope => {

        const scopeData = docsData[scope];

        Object.keys(scopeData).forEach(baseName => {

            fs.outputFileSync(`./docs/${scope.split('-').join('/')}/${baseName}.html`, templates[scope](
                {
                    index: Object.keys(scopeData).sort(
                        (k1, k2) => {
                            const z1 = Object.keys(configDocs[scope]).indexOf(k1);
                            const z2 = Object.keys(configDocs[scope]).indexOf(k2);
                            return z1 < z2 ? -1 : z1 > z2 ? 1 : 0
                        }
                    ),
                    content: marked(scopeData[baseName]),
                    root: '../../'
                }
            ));
        })
    })
})


gulp.task('fetch', async function () {

    const config = yaml.load(fs.readFileSync('./sources/index.yaml'));


    const scopes = ['g3d-docs', 'g3d-guide', 'gcanvas-docs', 'gcanvas-guide'];

    for (let item of scopes) {
        await dealScope(item);
    }

    async function dealScope(scope) {
        const docs = config['docs'][scope];

        for (let name in docs) {
            const url = docs[name];
            try {
                const content = await fetchAsync(url);
                log(`Fetch ${name} success. Content length ${content.length}`);
                fs.outputFileSync(`./sources/${scope}/${name}.md`, content);
            } catch (e) {
                log(`Error : fetch ${name}(${url}) failed. Message: ${e.toString()}`);
            }
        }
    }

})