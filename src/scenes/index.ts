import React from 'react';
import {S1Hook} from './contract/S1Hook';
import {S2College} from './contract/S2College';
import {S3Agitation} from './contract/S3Agitation';
import {S4Signing} from './contract/S4Signing';
import {S5Training} from './contract/S5Training';
import {S6Assignment} from './contract/S6Assignment';
import {S7Transport} from './contract/S7Transport';
import {S8EndCard} from './contract/S8EndCard';
import {LbHook} from './bus/S1Hook';
import {LbCollege} from './bus/S2College';
import {LbStop} from './bus/S3Stop';
import {LbPassengers} from './bus/S4Passengers';
import {LbLoop} from './bus/S5Loop';
import {LbDriver} from './bus/S6Driver';
import {LbPhoto} from './bus/S7Photo';
import {LbFinal} from './bus/S8Final';
import {PmHook} from './bus2/P1Hook';
import {PmMirror} from './bus2/P2Mirror';
import {PmPassengers} from './bus2/P3Passengers';
import {PmRear} from './bus2/P4Rear';
import {PmAfter} from './bus2/P5After';
import {PmTicket} from './bus2/P6Ticket';
import {PmPhotos} from './bus2/P7Photos';
import {PmFinal} from './bus2/P8Final';

/** Scene registry: episode.json "component" → React component. */
export const SCENES: Record<string, React.FC> = {
  // legacy episode «Контракт»
  Hook: S1Hook,
  College: S2College,
  Agitation: S3Agitation,
  Signing: S4Signing,
  Training: S5Training,
  Assignment: S6Assignment,
  Transport: S7Transport,
  EndCard: S8EndCard,
  // «Последний автобус»
  LbHook,
  LbCollege,
  LbStop,
  LbPassengers,
  LbLoop,
  LbDriver,
  LbPhoto,
  LbFinal,
  // «Пустое место»
  PmHook,
  PmMirror,
  PmPassengers,
  PmRear,
  PmAfter,
  PmTicket,
  PmPhotos,
  PmFinal,
};
