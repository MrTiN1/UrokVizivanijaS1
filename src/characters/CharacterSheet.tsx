import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Character} from './Character';
import {BACK_PASSENGERS, CLASSMATE, COAT_MAN, COMMANDER, DRIVER, GLEB_CIVIL, GLEB_MILITARY, INSTRUCTOR, OLD_WOMAN, REPRESENTATIVE, SOLDIERS, STUDENTS} from './designs';
import {EXPRESSIONS, ExpressionName, Light, basePose} from './types';
import {FontLoader} from '../components/Fonts';

export const SHEET_LIGHT: Light = {x: 0.6, y: -0.5, rim: '#fff4e0', rimStrength: 0.35, shade: '#6b5a72', shadeStrength: 0.35};

const label: React.CSSProperties = {position: 'absolute', fontFamily: 'Oswald', fontWeight: 600, color: '#e9e4da', fontSize: 30, letterSpacing: 2, textAlign: 'center'};

export const GlebSheet: React.FC = () => {
  const views: [string, number][] = [
    ['СПЕРЕДИ', 0],
    ['ТРИ ЧЕТВЕРТИ', 0.55],
    ['СБОКУ', 1.9],
    ['СО СПИНЫ', 3.83],
  ];
  const exprs: [string, ExpressionName][] = [
    ['Нейтральное', 'neutral'],
    ['Радость', 'joy'],
    ['Интерес', 'interest'],
    ['Сомнение', 'doubt'],
    ['Растерянность', 'confusion'],
    ['Тревога', 'anxiety'],
    ['Страх', 'fear'],
    ['Усталость', 'tired'],
  ];
  return (
    <AbsoluteFill style={{background: 'linear-gradient(#2a2d33,#17191d)'}}>
      <FontLoader />
      <div style={{...label, top: 30, left: 0, right: 0, fontSize: 64, fontFamily: 'Russo One', color: '#fff'}}>ГЛЕБ — МОДЕЛЬНЫЙ ЛИСТ</div>
      <div style={{...label, top: 112, left: 0, right: 0, fontSize: 28, color: '#f4b942'}}>19 лет · студент колледжа · русые волосы, карие глаза, худощавый</div>
      <svg width={2400} height={2700} style={{position: 'absolute'}}>
        {views.map(([, t], i) => {
          const p = basePose();
          p.bodyTurn = Math.max(-1, Math.min(1, t)) * (t > 1.5 ? 1 : 1);
          p.headTurn = t;
          if (t > 3) p.bodyTurn = 3.83 / 0.85 * 0.82 / 1; // back
          return (
            <Character key={i} design={GLEB_CIVIL} pose={{...p, bodyTurn: t > 3 ? 3.7 : t > 1.5 ? 1.75 : t}} light={SHEET_LIGHT} x={300 + i * 470} y={760} scale={0.62} idp={`v${i}`} shadow />
          );
        })}
        {exprs.map(([, e], i) => {
          const p = {...basePose(), ...EXPRESSIONS[e], headTurn: 0.3, bodyTurn: 0.3};
          if (e === 'joy') p.mouth = 'C';
          if (e === 'fear') p.mouth = 'E';
          if (e === 'confusion') p.mouth = 'B';
          return (
            <g key={e}>
              <rect x={60 + (i % 4) * 520} y={1330 + Math.floor(i / 4) * 560} width={480} height={500} rx={24} fill="#22252b" stroke="#3a3e46" />
              <Character design={GLEB_CIVIL} pose={p} light={SHEET_LIGHT} x={300 + (i % 4) * 520} y={1330 + Math.floor(i / 4) * 560 + 760} scale={1.25} idp={`e${i}`} legs={false} />
            </g>
          );
        })}
      </svg>
      {views.map(([n], i) => (
        <div key={n} style={{...label, top: 1250, left: 300 + i * 470 - 200, width: 400}}>{n}</div>
      ))}
      {exprs.map(([n], i) => (
        <div key={n} style={{...label, top: 1330 + Math.floor(i / 4) * 560 + 440, left: 60 + (i % 4) * 520, width: 480, fontSize: 34}}>{n}</div>
      ))}
    </AbsoluteFill>
  );
};

export const CastSheet: React.FC = () => {
  const cast = [
    ['Глеб', GLEB_CIVIL],
    ['Глеб (форма)', GLEB_MILITARY],
    ['Артём, одногруппник', CLASSMATE],
    ['Представитель', REPRESENTATIVE],
    ['Инструктор', INSTRUCTOR],
    ['Командир', COMMANDER],
  ] as const;
  const extras = [...STUDENTS, ...SOLDIERS];
  return (
    <AbsoluteFill style={{background: 'linear-gradient(#2a2d33,#17191d)'}}>
      <FontLoader />
      <div style={{...label, top: 30, left: 0, right: 0, fontSize: 64, fontFamily: 'Russo One', color: '#fff'}}>ПЕРСОНАЖИ СЕРИИ 1</div>
      <svg width={2400} height={2700} style={{position: 'absolute'}}>
        {cast.map(([, d], i) => {
          const p = {...basePose(), bodyTurn: 0.3, headTurn: 0.3, helmet: d === GLEB_MILITARY, dirt: d === GLEB_MILITARY ? 0.8 : 0};
          return <Character key={i} design={d} pose={p} light={SHEET_LIGHT} x={220 + i * 395} y={700} scale={0.56} idp={`c${i}`} shadow />;
        })}
        {extras.map((d, i) => {
          const p = {...basePose(), bodyTurn: -0.3 + (i % 3) * 0.3, headTurn: -0.3 + (i % 3) * 0.3, helmet: d.outfit === 'soldier'};
          return <Character key={d.id} design={d} pose={p} light={SHEET_LIGHT} x={200 + (i % 5) * 480} y={1650 + Math.floor(i / 5) * 700} scale={0.5} idp={`x${i}`} shadow />;
        })}
      </svg>
      {cast.map(([n], i) => (
        <div key={n} style={{...label, top: 1150, left: 220 + i * 395 - 190, width: 380, fontSize: 30}}>{n}</div>
      ))}
    </AbsoluteFill>
  );
};

/** Cast of «Последний автобус»: everyone standing + seated, night light. */
export const BusCastSheet: React.FC = () => {
  const NIGHT: Light = {x: 0.5, y: -0.6, rim: '#9fc4ff', rimStrength: 0.45, shade: '#2a2440', shadeStrength: 0.4};
  const cast = [
    ['Глеб, 19 лет', GLEB_CIVIL],
    ['Водитель', DRIVER],
    ['Молчаливая женщина', OLD_WOMAN],
    ['Мужчина в пальто', COAT_MAN],
  ] as const;
  const seatedPose = (turn: number) => ({...basePose(), bodyTurn: turn, headTurn: turn, legL: {hip: 84, knee: 86, foot: 0}, legR: {hip: 80, knee: 82, foot: 0},
    armL: {shoulder: 18, elbow: 44, wrist: 0, hand: 'relaxed' as const}, armR: {shoulder: 20, elbow: 40, wrist: 0, hand: 'relaxed' as const}});
  return (
    <AbsoluteFill style={{background: 'linear-gradient(#1c2233,#0d1018)'}}>
      <FontLoader />
      <div style={{...label, top: 30, left: 0, right: 0, fontSize: 64, fontFamily: 'Russo One', color: '#fff'}}>ПОСЛЕДНИЙ АВТОБУС — ПЕРСОНАЖИ</div>
      <svg width={2400} height={2700} style={{position: 'absolute'}}>
        {cast.map(([, d], i) => (
          <Character key={i} design={d} pose={{...basePose(), bodyTurn: 0.3, headTurn: 0.3}} light={NIGHT} x={330 + i * 580} y={760} scale={0.6} idp={`bc${i}`} shadow />
        ))}
        {[...cast.map(([, d]) => d), ...BACK_PASSENGERS].map((d, i) => (
          <Character key={`s${i}`} design={d} pose={seatedPose(i % 2 ? -0.4 : 0.4)} light={NIGHT} x={200 + (i % 4) * 600} y={1750 + Math.floor(i / 4) * 640} scale={0.5} idp={`bs${i}`} />
        ))}
      </svg>
      {cast.map(([n], i) => (
        <div key={n} style={{...label, top: 1190, left: 330 + i * 580 - 260, width: 520, fontSize: 34}}>{n}</div>
      ))}
    </AbsoluteFill>
  );
};
