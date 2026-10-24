#!/usr/bin/env python3
"""Minimal ctypes binding to RHVoice (no system install needed).
Usage: rhvoice_tts.py <data_dir> <lib_dir> <voice> <out.wav> "text" [rate%] [pitch%]"""
import ctypes as C
import sys
import wave

data_dir, lib_dir, voice, out, text = sys.argv[1:6]
rate = float(sys.argv[6]) / 100 if len(sys.argv) > 6 else 1.0
pitch = float(sys.argv[7]) / 100 if len(sys.argv) > 7 else 1.0
C.CDLL(f"{lib_dir}/libRHVoice_core.so.7", mode=C.RTLD_GLOBAL)
lib = C.CDLL(f"{lib_dir}/libRHVoice.so.5")

SR = C.CFUNCTYPE(C.c_int, C.c_int, C.c_void_p)
PS = C.CFUNCTYPE(C.c_int, C.POINTER(C.c_short), C.c_uint, C.c_void_p)
STR = C.CFUNCTYPE(C.c_int, C.c_char_p, C.c_void_p)
POS = C.CFUNCTYPE(C.c_int, C.c_uint, C.c_uint, C.c_void_p)
DONE = C.CFUNCTYPE(None, C.c_void_p)


class Callbacks(C.Structure):
    _fields_ = [("set_sample_rate", SR), ("play_speech", PS), ("process_mark", STR), ("word_starts", POS), ("word_ends", POS),
                ("sentence_starts", POS), ("sentence_ends", POS), ("play_audio", STR), ("done", DONE)]


class InitParams(C.Structure):
    _fields_ = [("data_path", C.c_char_p), ("config_path", C.c_char_p), ("resource_paths", C.POINTER(C.c_char_p)),
                ("callbacks", Callbacks), ("options", C.c_uint)]


class SynthParams(C.Structure):
    _fields_ = [("voice_profile", C.c_char_p), ("absolute_rate", C.c_double), ("absolute_pitch", C.c_double), ("absolute_volume", C.c_double),
                ("relative_rate", C.c_double), ("relative_pitch", C.c_double), ("relative_volume", C.c_double),
                ("punctuation_mode", C.c_int), ("punctuation_list", C.c_char_p), ("capitals_mode", C.c_int), ("flags", C.c_int)]


state = {"sr": 24000, "pcm": bytearray()}
cb = Callbacks(
    SR(lambda r, u: state.__setitem__("sr", r) or 1),
    PS(lambda s, n, u: state["pcm"].extend(C.string_at(s, n * 2)) or 1),
    STR(lambda *a: 1), POS(lambda *a: 1), POS(lambda *a: 1), POS(lambda *a: 1), POS(lambda *a: 1), STR(lambda *a: 1), DONE(lambda u: None),
)
ip = InitParams(data_dir.encode(), b"/nonexistent", None, cb, 0)
lib.RHVoice_new_tts_engine.restype = C.c_void_p
eng = lib.RHVoice_new_tts_engine(C.byref(ip))
if not eng:
    raise SystemExit("engine init failed")
sp = SynthParams(voice.encode(), 0, 0, 0, rate, pitch, 1.0, 0, None, 0, 0)
lib.RHVoice_new_message.restype = C.c_void_p
lib.RHVoice_new_message.argtypes = [C.c_void_p, C.c_char_p, C.c_uint, C.c_int, C.POINTER(SynthParams), C.c_void_p]
b = text.encode()
msg = lib.RHVoice_new_message(eng, b, len(b), 0, C.byref(sp), None)
lib.RHVoice_speak.argtypes = [C.c_void_p]
lib.RHVoice_speak(msg)
with wave.open(out, "wb") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(state["sr"]); w.writeframes(bytes(state["pcm"]))
print(f"{out}: {len(state['pcm']) / 2 / state['sr']:.2f}s @ {state['sr']}")
