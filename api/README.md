# API interna de BotasLeón

Cotizaciones, notas de venta y pagos. Todo en AWS, sin Supabase.

```
navegador ──HTTPS──► API Gateway ──► Lambda (en la VPC) ──► RDS Postgres (privada)
   │                                      │
   └─ token de Cognito ───────────────────┘ verifica firma, emisor, audiencia y expiración
```

## Piezas

| Qué | Identificador |
|---|---|
| API | `https://3tpv2e1470.execute-api.us-east-2.amazonaws.com` |
| Lambda | `botasleon-api` · nodejs22.x · arm64 · en `subnet-02ca81a8111a5c0ad` |
| Base | `botasleon-db.cz0m886cq7ej.us-east-2.rds.amazonaws.com` · Postgres 17.10 · privada |
| Cognito | pool `us-east-2_PvE8WBLjG` · cliente `69m1ib88af5h489c9lmf1hj0hf` |

La contraseña de la base la administra RDS en Secrets Manager. No existe en
ningún archivo ni variable de entorno de este repo.

## Por qué la Lambda vive dentro de la VPC

La RDS es privada y su grupo de seguridad solo admite el puerto 5432 desde el
grupo de la Lambda — no desde un rango de IPs, que con Lambda serían dinámicas.

Estar en la VPC le quita la salida a internet. En lugar de un NAT Gateway
(~$32/mes) hay dos endpoints de interfaz, `secretsmanager` y `cognito-idp`, en
la misma subred (~$14/mes entre los dos). **Sin ellos la Lambda falla con
`fetch failed` al leer el JWKS** — comprobado durante la instalación.

## Por qué API Gateway y no una Function URL

Se intentó primero con Function URL. Con `AuthType: NONE` y la política de
recursos correcta de manual, seguía devolviendo 403 en todas las peticiones.
La cuenta no está en ninguna organización, así que no era una SCP. API Gateway
resuelve lo mismo por unos centavos al mes y sin ese misterio.

## Desplegar un cambio

```sh
cd api
npm install --omit=dev
rm -rf build lambda.zip && mkdir -p build/migrations
cp -r src node_modules package.json build/ && cp ../db/migrations/*.sql build/migrations/
(cd build && zip -qr ../lambda.zip .)
aws lambda update-function-code --function-name botasleon-api --zip-file fileb://lambda.zip
```

Las migraciones viajan dentro del paquete. Para aplicarlas:

```sh
curl -X POST -H "authorization: Bearer <access token>" \
  https://3tpv2e1470.execute-api.us-east-2.amazonaws.com/migrate
```

Es idempotente: lleva registro en `schema_migrations` y cada archivo corre en su
propia transacción.

## Dar de alta un vendedor

```sh
aws cognito-idp admin-create-user --user-pool-id us-east-2_PvE8WBLjG \
  --username vendedor@botasleon.com \
  --user-attributes Name=email,Value=vendedor@botasleon.com Name=email_verified,Value=true
```

Cognito le manda la contraseña temporal por correo. La fila en `vendedores` se
crea sola la primera vez que entra, y con ella queda firmado cada documento.

## Rutas

| Método | Ruta | Qué hace |
|---|---|---|
| GET | `/yo` | Vendedor de la sesión (lo da de alta si es su primera vez) |
| POST | `/migrate` | Aplica migraciones pendientes |
| GET POST | `/quotes` | Listar y crear cotizaciones |
| PATCH DELETE | `/quotes/:id` | Editar y borrar |
| POST | `/quotes/:id/emitir` | Congela una versión |
| GET POST | `/notas` | Listar y crear notas |
| PATCH | `/notas/:id` | Editar (solo en borrador) |
| POST | `/notas/:id/emitir` | Congela la nota y devuelve su folio |
| POST | `/notas/:id/cancelar` | Cancela con motivo |
| GET POST | `/notas/:id/pagos` | Consultar y registrar abonos |
| GET | `/notas/:id/saldo` | Total, pagado y saldo |

`folio` y `estado` nunca se aceptan del cliente: el folio lo genera la base y el
estado solo se mueve por rutas explícitas.
