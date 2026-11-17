"""Verify generated assets against recorded originals without source checkout."""
import hashlib
import json
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
manifest = json.loads((root / 'public/teaware/source-manifest.json').read_text())
registry = (root / 'backend/src/teaware/teaware-presets.ts').read_text()
records = json.loads(registry.split(' = ', 1)[1].removesuffix(' as const;\n'))
assert len(records) == 264
assert len({item['variantId'] for item in records}) == len(records)
assert len({item['kind'] for item in records}) == 9
for source in manifest['sources']:
    base = 'dc-' + source['baseId'] + '-'
    group = [item for item in records if item['variantId'].startswith(base)]
    assert len(group) == 8, base
    original_path = root / 'public/teaware/presets' / (base + 'original.png')
    assert hashlib.sha256(original_path.read_bytes()).hexdigest() == source['sha256']
    original = Image.open(original_path).convert('RGBA')
    signatures = set()
    for item in group:
        image = Image.open(root / 'public' / item['imagePath'].lstrip('/')).convert('RGBA')
        assert image.size == original.size
        assert image.getchannel('A').tobytes() == original.getchannel('A').tobytes()
        for before, after in zip(original.getdata(), image.getdata()):
            r, g, b, alpha = before
            if alpha == 0 or .2126*r + .7152*g + .0722*b < 55:
                assert before == after
        signatures.add(image.tobytes())
    assert len(signatures) == 8, f'Duplicate variants: {base}'
print('264 unique variants verified: exact originals, unchanged geometry, alpha and dark outlines.')
