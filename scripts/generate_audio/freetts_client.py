#!/usr/bin/env python3
"""Synthesize text with a freetts.ru voice (same WebSocket the site uses).
Usage: freetts_client.py <voiceId> <out.mp3> "text"
Note: be polite — one request at a time; the service is ad-supported."""
import asyncio, json, os, sys
import websockets

async def run(voice, out, text):
    kw = {}
    proxy = os.environ.get("HTTPS_PROXY") or os.environ.get("https_proxy")
    if proxy:
        kw["proxy"] = proxy
    chunks = []
    async with websockets.connect("wss://api.freetts.ru/generate", max_size=None, open_timeout=30, origin="https://freetts.ru", **kw) as ws:
        await ws.send(json.dumps({"action": "start", "text": text + "⁣", "voiceId": voice}))
        async for msg in ws:
            if isinstance(msg, bytes):
                chunks.append(msg)
                continue
            d = json.loads(msg)
            if d.get("status") == "error":
                raise SystemExit(f"freetts error: {d.get('message')}")
            if d.get("status") == "ready":
                break
    open(out, "wb").write(b"".join(chunks))
    print(f"{out}: {sum(map(len, chunks))} bytes")

if __name__ == "__main__":
    asyncio.run(run(*sys.argv[1:4]))
