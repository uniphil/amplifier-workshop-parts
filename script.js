'use strict';
const {
  t, createUpdater, render,
  d: { button, code, div, h1, h2, img, p, small, span },
} = xxs;
const { Union } = results;

const State = Union({
  Loading: {},
  Loaded: {},
  Failed: {},
});

const X = (props, children) => data => {
  const thing = {};
  Object.keys(props).forEach(k => {
    thing[k] = data[k];
  });
  if (children) {
    Object.keys(children).forEach(k => {
      const subk = data[k];
      if (k in props) {
        throw new Error(`duplicate key with props: ${k}`);
      }
      if (!(subk in data)) {
        throw new Error(`missing data for path '${k}' -> '${subk}'`);
      }
      if (!(subk in children[k])) {
        throw new Error(`unrecognized key for '${k}': '${subk}'`);
      }
      const U = Union(children[k], {
        match(cases) {
          return U.match(this, cases);
        },
      });
      thing[k] = U[subk](children[k][subk](data[subk]));
    });
  }
  return thing;
}

const PartData = X({
  name: 'string',
  image: 'url',
  symbol: 'url',
  description: 'array of strings',
  polarized: 'boolean',
  tags: 'array of strings',
}, {
  type: {
    input: X({}, {
      circuit: {
        direct: X({}),
        divider: X({
          typical: 'string',
        }),
        'powered-divider': X({
          typical: 'string',
        }),
      },
    }),
    'input-adapter': X({}),
    output: X({}, {
      circuit: {
        'class-a': X({}),
        'current-limit': X({
          typical: 'string',
        }),
        direct: X({}),
      },
    }),
  },
});

const LOADED = Symbol('LOADED');
const FAILED = Symbol('FAILED');


const Divider = details =>
  p({}, [t(`divider with ${details.typical} resistor, typically`)]);


const Tags = tags =>
  div({attrs: {'class': 'tags'}}, tags.map(tag => ({
    display: 'display📺',
    fast: 'fast⚡',
    heat: 'heat♨️',
    light: 'light💡',
    liquid: 'liquid🌊',
    magnetism: 'magnetism🧲',
    movement: 'movement🚗',
    sound: 'sound🔊',
    touch: 'touch🤏',
    wind: 'wind🌬️',
  }[tag] || tag)).map(tag =>
    code({attrs: {class: 'tag'}}, [t(tag)])));


const Part = part =>
  div({attrs: {'class': `part ${part.type.name}`}}, [
    div({attrs: {'class': 'part-header'}}, [
      h2({}, [t(part.type.match({
        input: () => 'Input',
        output: () => 'Output',
        'input-adapter': () => 'Input adapter',
      }))]),
      Tags(part.tags),
    ]),
    div({attrs: {'class': 'part-content'}}, [
      h1({}, [t(part.name)]),
      div({attrs: {'class': 'illustrations'}}, [
        img({attrs: {
          src: `images/${part.image}`,
        }}),
        part.symbol ? img({attrs: {
          src: `images/${part.symbol}`,
        }}) : span({}, []),
      ]),
      div({attrs: {'class': 'description'}}, part.description.map(d =>
        p({}, [t(d)]))),
      part.type.match({
        input: input => input.circuit.match({
          divider: details => Divider(details),
          _: () => p({}, [t(`circuit: ${input.circuit.name}`)]),
        }),
        'input-adapter': _ => p({}, [t('Input adapter')]),
        output: output => p({}, [t(`circuit: ${output.circuit.name}`)]),
      }),
    ]),
  ]);

const App = (state, dispatch) =>
  div({},
    State.match(state, {
      Loading: () => [p({}, [t('loading...')])],
      Loaded: parts => [
        p({}, [t(`${parts.length} parts`)]),
        div({attrs:{'class': 'parts'}}, parts.map(part => Part(part))),
      ],
      Failed: e => [p({}, [t(`failed to load :/ ${e}`)])],
    }),
  );

const updater = createUpdater({
  [LOADED]: (_, parts) => State.Loaded(parts),
  [FAILED]: (_, e) => State.Failed(e),
});

const inject = render(App, State.Loading(), updater, document.getElementById('stuff'));

fetch('./parts.json')
  .then(r => r.json())
  .then(parts => inject(LOADED, parts.map(PartData)))
  .catch(e => inject(FAILED, e));
