# Arma la propuesta visual con los logos oficiales incrustados tal cual (sin redibujarlos).
import re
from pathlib import Path

aqui = Path(__file__).parent
marca = aqui.parent / "public" / "marca"
logo = (marca / "kanna-horizontal.svg").read_text(encoding="utf-8")
simbolo = (marca / "kanna-simbolo-negativo.svg").read_text(encoding="utf-8")
# El mismo símbolo, solo con una clase para ubicarlo como motivo en la maqueta.
motivo = re.sub(r"<svg ", '<svg class="motivo" aria-hidden="true" ', simbolo, count=1)

html = (aqui / "propuesta-visual.plantilla.html").read_text(encoding="utf-8")
html = html.replace("{{LOGO}}", logo).replace("{{SIMBOLO_MOTIVO}}", motivo)
(aqui / "propuesta-visual.html").write_text(html, encoding="utf-8", newline="\n")
print("ok", len(html))
