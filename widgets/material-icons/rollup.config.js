import igniter from 'module-igniter';
import { mapValues } from 'lodash';

const plug = igniter({ prefix: 'rollup-plugin-' });
const environment = process.env.NODE_ENV || 'development';
const prod = environment === 'production';
const watch = process.env.ROLLUP_WATCH;

const globals = {
  'netlify-cms': 'CMS',
  react: 'React',
  'react-dom': 'ReactDOM',
  'prop-types': 'PropTypes',
  immutable: 'Immutable',
  'react-immutable-proptypes': 'ImmutablePropTypes',
  classnames: 'classNames',
  'create-react-class': 'createClass',
  'react-virtualized-select': 'VirtualizedSelect',
};

const external = Object.keys(globals);
const WATCH_FORMAT = process.env.WATCH_FORMAT || 'umd';
const formats = ['umd', 'iife', 'cjs', 'es'];
const extension = prod ? 'min.js' : 'js';
const isBrowser = format => format === 'umd' || format === 'iife';

const createOutput = (format = 'umd') => ({
  sourcemap: prod,
  name: 'NetlifyCMSWidgetMaterialIcons',
  file: `dist/${format}/material-icons.${extension}`,
  format,
  globals: format === 'iife' ? mapValues(globals, o => `window['${o}']`) : globals,
});

export default (watch ? [WATCH_FORMAT] : formats).map(format => ({
  input: 'src/index.js',
  output: createOutput(format),
  external,
  plugins: [
    ...plug({
      replace: { 'process.env.NODE_ENV': JSON.stringify(environment) },
      'node-resolve': true,
      commonjs: {
        include: ['**/node_modules/**'],
      },
      babel: {
        exclude: ['**/node_modules/**'],
        plugins: isBrowser(format)
          ? [
            [
              'transform-react-jsx',
              {
                pragma: 'h',
              },
            ],
            [
              'transform-react-remove-prop-types',
              {
                removeImport: true,
                additionalLibraries: ['react-immutable-proptypes'],
              },
            ],
          ]
          : [],
      },
      postcss: {
        sourcemap: prod,
        minimize: prod,
      },
    }),
    ...plug('strip', 'uglify', prod),
    ...plug(
      {
        serve: {
          contentBase: [
            '../../node_modules',
            '../../widgets',
            '../../core',
            `dist/${WATCH_FORMAT}`,
            'public',
          ],
          historyApiFallback: true,
        },
        livereload: true,
      },
      watch,
    ),
  ],
}));
