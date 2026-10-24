import React from 'react';
import {S1Hook} from './S1Hook';
import {S2College} from './S2College';
import {S3Agitation} from './S3Agitation';
import {S4Signing} from './S4Signing';
import {S5Training} from './S5Training';
import {S6Assignment} from './S6Assignment';
import {S7Transport} from './S7Transport';
import {S8EndCard} from './S8EndCard';

/** Scene registry: episode.json "component" → React component. */
export const SCENES: Record<string, React.FC> = {
  Hook: S1Hook,
  College: S2College,
  Agitation: S3Agitation,
  Signing: S4Signing,
  Training: S5Training,
  Assignment: S6Assignment,
  Transport: S7Transport,
  EndCard: S8EndCard,
};
