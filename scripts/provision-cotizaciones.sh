#!/usr/bin/env bash
# Provisiona la base de cotizaciones en Supabase y la deja conectada a Amplify.
#
# REQUISITO ÚNICO: haber corrido antes `supabase login` (una vez, en tu
# terminal). Ese comando abre el navegador y guarda el token en
# ~/.supabase/access-token; a partir de ahí este script hace el resto solo.
#
#   ./scripts/provision-cotizaciones.sh "<contraseña-de-la-base>"
#
set -euo pipefail

DB_PASS="${1:-}"
PROJECT_NAME="botasleon-cotizaciones"
REGION="us-east-2"            # misma región que el Amplify del sitio
AMPLIFY_APP_ID="dlrgtndu7af79"

if [ -z "$DB_PASS" ]; then
  echo "Falta la contraseña de la base: ./scripts/provision-cotizaciones.sh 'una-clave-larga'" >&2
  exit 1
fi

if ! supabase projects list >/dev/null 2>&1; then
  echo "Supabase no tiene sesión. Corre primero:  supabase login" >&2
  exit 1
fi

# El nombre del campo cambió entre versiones de la CLI (id / slug): aceptamos ambos.
ORG=$(supabase orgs list -o json | python3 -c "
import json,sys
o = json.load(sys.stdin)[0]
print(o.get('id') or o.get('slug'))
")
echo "▸ Organización: $ORG"

echo "▸ Creando proyecto $PROJECT_NAME en $REGION…"
supabase projects create "$PROJECT_NAME" \
  --org-id "$ORG" --region "$REGION" --db-password "$DB_PASS"

REF=$(supabase projects list -o json | python3 -c "
import json,sys
for p in json.load(sys.stdin):
    if p.get('name') == '$PROJECT_NAME':
        print(p.get('id') or p.get('ref') or p.get('reference_id')); break
")
echo "▸ Proyecto: $REF"

echo "▸ Aplicando el esquema (tablas, folio, RLS)…"
supabase link --project-ref "$REF" --password "$DB_PASS"
supabase db push

URL="https://$REF.supabase.co"
ANON=$(supabase projects api-keys --project-ref "$REF" -o json | python3 -c "
import json,sys
for k in json.load(sys.stdin):
    if k.get('name') == 'anon':
        print(k.get('api_key') or k.get('apiKey') or k.get('key')); break
")
[ -n "$ANON" ] || { echo 'No pude leer la anon key; sácala del panel de Supabase.' >&2; exit 1; }

echo "▸ Publicando las variables en Amplify…"
aws amplify update-app --app-id "$AMPLIFY_APP_ID" --environment-variables \
  "$(aws amplify get-app --app-id "$AMPLIFY_APP_ID" --query 'app.environmentVariables' --output json \
     | python3 -c "
import json,sys
env = json.load(sys.stdin)
env['NEXT_PUBLIC_SUPABASE_URL'] = '$URL'
env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] = '$ANON'
print(json.dumps(env))
")" >/dev/null

echo
echo "Listo. Falta un paso manual en amplify.yml: escribir esas dos variables"
echo "en .env.production.local, como se hace con las de Shopify."
echo "URL: $URL"
