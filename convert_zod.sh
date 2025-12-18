#!/usr/bin/env bash
set -euo pipefail

INDIR="prisma/generated/zod/modelSchema"
INPUTDIR="prisma/generated/zod/inputTypeSchemas"
OUTDIR="prisma/zod/models"
INPUT_OUTDIR="prisma/zod/input-schemas"

mkdir -p "$OUTDIR"
mkdir -p "$INPUT_OUTDIR"

echo "📦 Scanning model files for used input type schemas..."

# Extract all unique input schema imports from modelSchema files
IMPORTS=$(grep -rohP "from\s+['\"]\.\./inputTypeSchemas/([^'\"]+)['\"]" "$INDIR" | sed -E "s/from ['\"]..\/inputTypeSchemas\///" | sed 's/["'\'']//g' | sort -u)

echo "🔍 Found input schemas:"
echo "$IMPORTS"

# Copy only the required input type schema files to the new INPUT_OUTDIR
for schema in $IMPORTS; do
  src="$INPUTDIR/$schema.ts"
  dest="$INPUT_OUTDIR/${schema%.ts}.js"
  if [ -f "$src" ]; then
    echo "➕ Copying $schema → input-schemas"
    # Strip type-only lines and convert to .js
    sed -E '
      /^(import type |export type )/d;
      s|(:\s*[^=]+)\s*=\s*| = |g
    ' "$src" > "$dest"
  else
    echo "⚠️ Warning: $schema.ts not found"
  fi
done

echo "⚙️ Converting model schema files and updating import paths..."

# Process each model schema file
find "$INDIR" -type f -name '*.ts' ! -name '*.d.ts' | while read -r tsfile; do
  jsfile="$OUTDIR/$(basename "${tsfile%.ts}.js")"

  # Remove type-only lines and replace import paths from inputTypeSchemas → input-schemas
  sed -E '
    /^(import type |export type )/d;
    s|\.\./inputTypeSchemas/|../input-schemas/|g;
    s|(:\s*[^=]+)\s*=\s*| = |g
  ' "$tsfile" > "$jsfile"

  echo "✔ Converted: $(basename "$tsfile") → $(basename "$jsfile")"
done

echo "✅ Done. Output written to:"
echo "- $OUTDIR (model schemas)"
echo "- $INPUT_OUTDIR (used input schemas)"

CLEANDIR="prisma/generated"
echo "Cleaning Generated dir"
rm -r "$CLEANDIR"