import React from 'react';
import {continueRender, delayRender, staticFile} from 'remotion';

const faces: [string, string, number][] = [
  ['Montserrat', 'montserrat-cyrillic-500-normal.woff2', 500],
  ['Montserrat', 'montserrat-cyrillic-700-normal.woff2', 700],
  ['Montserrat', 'montserrat-cyrillic-800-normal.woff2', 800],
  ['Montserrat', 'montserrat-cyrillic-900-normal.woff2', 900],
  ['Montserrat', 'montserrat-latin-800-normal.woff2', 800],
  ['Montserrat', 'montserrat-latin-900-normal.woff2', 900],
  ['Oswald', 'oswald-cyrillic-500-normal.woff2', 500],
  ['Oswald', 'oswald-cyrillic-600-normal.woff2', 600],
  ['Oswald', 'oswald-cyrillic-700-normal.woff2', 700],
  ['Oswald', 'oswald-latin-700-normal.woff2', 700],
  ['Russo One', 'RussoOne-Regular.ttf', 400],
];

let loaded = false;
export const useFonts = () => {
  if (loaded || typeof document === 'undefined') return;
  loaded = true;
  const handle = delayRender('fonts');
  Promise.all(
    faces.map(([family, file, weight]) => {
      const f = new FontFace(family, `url(${staticFile(`fonts/${file}`)})`, {weight: String(weight)});
      return f.load().then((ff) => (document.fonts as unknown as Set<FontFace>).add(ff));
    }),
  )
    .then(() => continueRender(handle))
    .catch((e) => {
      console.error(e);
      continueRender(handle);
    });
};

export const FontLoader: React.FC = () => {
  useFonts();
  return null;
};
