// The cast. Gleb's design is the canonical "model sheet": every scene builds
// him from this one object so his face, hair and proportions never drift.
import {Design} from './types';

const GLEB_BASE = {
  skin: '#f0c9a6',
  skinShade: '#d39d7c',
  hair: '#8c6440',
  hairShade: '#5c3f27',
  hairLight: '#b98d5d',
  hairStyle: 'gleb' as const,
  iris: '#6e4424',
  eyeScale: 1,
  browThick: 1,
  browColor: '#5a3c25',
  faceWidth: 1,
  jaw: 0.15,
  age: 0,
  bodyWidth: 1,
  height: 1,
};

export const GLEB_CIVIL: Design = {
  ...GLEB_BASE,
  id: 'gleb',
  outfit: 'gleb_civil',
  colors: {
    top: '#22252b', // black jacket
    topShade: '#14161a',
    under: '#a3a7ad', // grey hoodie
    underShade: '#7b8087',
    pants: '#2b2e35',
    pantsShade: '#1b1d22',
    shoes: '#e9e6df',
    accent: '#3a3f47', // backpack
  },
};

export const GLEB_MILITARY: Design = {
  ...GLEB_BASE,
  id: 'gleb_mil',
  outfit: 'gleb_military',
  colors: {
    top: '#5d6544',
    topShade: '#3f4630',
    under: '#4a5236', // plate carrier
    underShade: '#333a25',
    pants: '#565e3f',
    pantsShade: '#3b4129',
    shoes: '#2b2620',
    accent: '#6b7350', // helmet
  },
};

export const REPRESENTATIVE: Design = {
  id: 'rep',
  skin: '#e9bf9c',
  skinShade: '#c48f6e',
  hair: '#3b3029',
  hairShade: '#241c17',
  hairLight: '#5a4a3f',
  hairStyle: 'neat',
  iris: '#4a5560',
  eyeScale: 0.82,
  browThick: 1.15,
  browColor: '#2f2620',
  faceWidth: 1.08,
  jaw: 0.75,
  age: 0.45,
  outfit: 'officer_dress',
  colors: {
    top: '#4f5a3c',
    topShade: '#353d27',
    under: '#c9c2a8',
    underShade: '#9d977f',
    pants: '#4f5a3c',
    pantsShade: '#353d27',
    shoes: '#1d1b19',
    accent: '#c9a54a',
  },
  bodyWidth: 1.18,
  height: 1.03,
};

export const INSTRUCTOR: Design = {
  id: 'instructor',
  skin: '#e2b08b',
  skinShade: '#bb835f',
  hair: '#4a3a2c',
  hairShade: '#2e231a',
  hairLight: '#6b5644',
  hairStyle: 'buzz',
  iris: '#55462f',
  eyeScale: 0.8,
  browThick: 1.3,
  browColor: '#33281e',
  faceWidth: 1.06,
  jaw: 0.85,
  age: 0.3,
  stubble: true,
  outfit: 'field',
  colors: {
    top: '#5a6243',
    topShade: '#3d432d',
    under: '#3f4530',
    underShade: '#2c3121',
    pants: '#535b3d',
    pantsShade: '#383e29',
    shoes: '#24211d',
    accent: '#7b6a4c',
  },
  bodyWidth: 1.22,
  height: 1.04,
};

export const COMMANDER: Design = {
  id: 'commander',
  skin: '#deae8c',
  skinShade: '#b47e60',
  hair: '#77746f',
  hairShade: '#4d4b48',
  hairLight: '#a3a09b',
  hairStyle: 'grey',
  iris: '#4b4f45',
  eyeScale: 0.76,
  browThick: 1.45,
  browColor: '#56524b',
  faceWidth: 1.12,
  jaw: 0.9,
  age: 0.85,
  mustache: true,
  outfit: 'commander',
  colors: {
    top: '#535b3f',
    topShade: '#373d29',
    under: '#434a33',
    underShade: '#2d3222',
    pants: '#4d553a',
    pantsShade: '#343a27',
    shoes: '#1f1c19',
    accent: '#b89a4e',
  },
  bodyWidth: 1.3,
  height: 1.02,
};

export const CLASSMATE: Design = {
  id: 'artyom',
  skin: '#f2cfb0',
  skinShade: '#d6a585',
  hair: '#2a2420',
  hairShade: '#161210',
  hairLight: '#4a3f37',
  hairStyle: 'side',
  iris: '#3d2c1f',
  eyeScale: 0.95,
  browThick: 1.05,
  browColor: '#211a16',
  faceWidth: 1.02,
  jaw: 0.3,
  age: 0,
  glasses: true,
  outfit: 'student_sweater',
  colors: {
    top: '#3f5a52',
    topShade: '#2b4039',
    under: '#e7e2d6',
    underShade: '#bdb7a9',
    pants: '#384152',
    pantsShade: '#262d3a',
    shoes: '#d9d5cc',
    accent: '#c26a3d',
  },
  bodyWidth: 1.06,
  height: 0.99,
};

type Variant = Omit<Partial<Design>, 'colors'> & {colors?: Partial<Design['colors']>};
const variant = (base: Design, id: string, v: Variant): Design => ({
  ...base,
  ...v,
  id,
  colors: {...base.colors, ...(v.colors ?? {})},
});

// Background students — share the rig, vary hair/colours so the crowd reads
// as different people.
export const STUDENTS: Design[] = [
  variant(CLASSMATE, 'st1', {
    hairStyle: 'curly', hair: '#6b4a2e', hairShade: '#45301d', hairLight: '#8d6a47', glasses: false,
    outfit: 'student_hoodie', colors: {top: '#7a3b36', topShade: '#552824', under: '#7a3b36', underShade: '#552824'},
  }),
  variant(CLASSMATE, 'st2', {
    hairStyle: 'long', hair: '#c49a63', hairShade: '#946f42', hairLight: '#e0bd88', glasses: false, jaw: 0, eyeScale: 1.05,
    skin: '#f4d3b8', outfit: 'student_sweater', colors: {top: '#c7a46c', topShade: '#9a7c4d'},
  }),
  variant(CLASSMATE, 'st3', {
    hairStyle: 'buzz', hair: '#3a2d23', glasses: false, outfit: 'student_shirt',
    colors: {top: '#4b6b8f', topShade: '#344c67'},
  }),
  variant(CLASSMATE, 'st4', {
    hairStyle: 'neat', hair: '#9b7448', hairShade: '#6b4f30', glasses: false, outfit: 'student_hoodie',
    colors: {top: '#2f3d55', topShade: '#202a3b', under: '#2f3d55', underShade: '#202a3b'},
  }),
  variant(CLASSMATE, 'st5', {
    hairStyle: 'long', hair: '#2b211c', hairShade: '#15100d', hairLight: '#4a3a31', glasses: false, jaw: 0,
    skin: '#ecc3a1', outfit: 'student_sweater', colors: {top: '#6b5a7d', topShade: '#4b3f59'},
  }),
  variant(CLASSMATE, 'st6', {
    hairStyle: 'side', hair: '#7d5a3a', glasses: true, outfit: 'student_shirt',
    colors: {top: '#8a8f5a', topShade: '#62663f'},
  }),
];

export const SOLDIERS: Design[] = [
  variant(INSTRUCTOR, 'sol1', {outfit: 'soldier', hairStyle: 'buzz', age: 0.1, stubble: false, eyeScale: 0.9, jaw: 0.5, bodyWidth: 1.1}),
  variant(INSTRUCTOR, 'sol2', {outfit: 'soldier', hairStyle: 'buzz', age: 0.25, skin: '#d9a77f', jaw: 0.7, bodyWidth: 1.15}),
  variant(INSTRUCTOR, 'sol3', {outfit: 'soldier', hairStyle: 'buzz', age: 0.05, skin: '#f0c6a3', eyeScale: 0.95, jaw: 0.3, bodyWidth: 1.05}),
];

export const RECRUITS: Design[] = STUDENTS.map((s, i) =>
  variant(s, `rec${i}`, {
    outfit: i % 2 ? 'student_hoodie' : 'student_shirt',
  }),
);

export const CAST = {GLEB_CIVIL, GLEB_MILITARY, REPRESENTATIVE, INSTRUCTOR, COMMANDER, CLASSMATE};

/** Gleb at the training centre: field uniform, no helmet or vest. */
export const GLEB_RECRUIT: Design = {
  ...GLEB_MILITARY,
  id: 'gleb_rec',
  outfit: 'field',
  colors: {...GLEB_MILITARY.colors, under: '#4a5236', underShade: '#333a25'},
};

// ---------------- Episode «Последний автобус» ----------------

/** Elderly bus driver: grey hair, moustache, navy uniform and peaked cap. */
export const DRIVER: Design = {
  id: 'driver',
  skin: '#d9ab8c',
  skinShade: '#b07e62',
  hair: '#8d8a85',
  hairShade: '#5d5b57',
  hairLight: '#b7b3ad',
  hairStyle: 'grey',
  iris: '#3f4a52',
  eyeScale: 0.74,
  browThick: 1.5,
  browColor: '#6e6a64',
  faceWidth: 1.1,
  jaw: 0.8,
  age: 0.95,
  mustache: true,
  hat: 'driver_cap',
  hatColor: '#1e2534',
  outfit: 'driver',
  colors: {
    top: '#232b3b',
    topShade: '#151a25',
    under: '#9fb2c4',
    underShade: '#7487a0',
    pants: '#1d2330',
    pantsShade: '#12161f',
    shoes: '#121212',
    accent: '#3b1f24',
  },
  bodyWidth: 1.25,
  height: 1.0,
};

/** Silent elderly woman: grey bun, plum coat, green-grey scarf. */
export const OLD_WOMAN: Design = {
  id: 'woman',
  skin: '#e6c0a5',
  skinShade: '#c39478',
  hair: '#a9a7a4',
  hairShade: '#76736f',
  hairLight: '#d2d0cc',
  hairStyle: 'bun',
  iris: '#4d4a42',
  eyeScale: 0.8,
  browThick: 0.8,
  browColor: '#8b8781',
  faceWidth: 1.0,
  jaw: 0.1,
  age: 0.9,
  scarf: '#5b6b5f',
  outfit: 'woman_coat',
  colors: {
    top: '#4c3a4f',
    topShade: '#33263a',
    under: '#6d6170',
    underShade: '#4f4552',
    pants: '#2e2a33',
    pantsShade: '#1e1b22',
    shoes: '#1a1716',
    accent: '#5b6b5f',
  },
  bodyWidth: 1.08,
  height: 0.94,
};

/** Man in a dark coat and fedora, always on the back seat. */
export const COAT_MAN: Design = {
  id: 'coatman',
  skin: '#d8b096',
  skinShade: '#ab8167',
  hair: '#2a2622',
  hairShade: '#171411',
  hairLight: '#4a423b',
  hairStyle: 'neat',
  iris: '#2e3438',
  eyeScale: 0.76,
  browThick: 1.3,
  browColor: '#25211d',
  faceWidth: 1.04,
  jaw: 0.7,
  age: 0.55,
  hat: 'fedora',
  hatColor: '#24262b',
  outfit: 'coat',
  colors: {
    top: '#25272d',
    topShade: '#17181c',
    under: '#c9c5bb',
    underShade: '#9a968d',
    pants: '#1f2025',
    pantsShade: '#131417',
    shoes: '#0f0f10',
    accent: '#3a3d45',
  },
  bodyWidth: 1.16,
  height: 1.04,
};

/** Background passengers on the rear seats — same rig, muted night palette. */
export const BACK_PASSENGERS: Design[] = [
  variant(COAT_MAN, 'bp1', {hat: 'beanie', hatColor: '#3d4a4a', hairStyle: 'buzz', age: 0.35, outfit: 'woman_coat', scarf: undefined,
    colors: {top: '#3b4542', topShade: '#28302e'}}),
  variant(OLD_WOMAN, 'bp2', {hairStyle: 'long', hair: '#3a2c26', hairShade: '#221915', hairLight: '#5a463c', age: 0.4, scarf: '#6b4a4a',
    colors: {top: '#3c3f52', topShade: '#282a38'}}),
  variant(COAT_MAN, 'bp3', {hat: undefined, hairStyle: 'grey', age: 0.8, mustache: true,
    colors: {top: '#3e3a33', topShade: '#2a2722'}}),
];

export const BUS_CAST = {GLEB_CIVIL, DRIVER, OLD_WOMAN, COAT_MAN};
