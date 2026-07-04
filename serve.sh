#!/usr/bin/env bash
# Uruchamia lokalny serwer Quartza (notatki z farmakologii) na http://localhost:8080
# Node przypięty do wersji z mise.toml. Odpalane też jako usługa systemd --user.
cd "$(dirname "$(readlink -f "$0")")" || exit 1
exec /usr/bin/mise exec -- node ./quartz/bootstrap-cli.mjs build --serve
