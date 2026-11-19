"""Baixa as estatísticas públicas do WakaTime e grava um JSON pequeno para o site.

O WakaTime não manda cabeçalho CORS, então o navegador não consegue ler a API direto.
Este script roda numa GitHub Action (uma vez por dia) e o site lê o arquivo gerado.

Uso: python wakatime.py <arquivo_de_saida.json>
"""
import json
import sys
import urllib.request

USER_ID = "cc389d26-71f3-4d80-915a-2c56372ee434"
URL = f"https://wakatime.com/api/v1/users/{USER_ID}/stats/all_time"


def segundos(item: dict) -> float:
    return float(item.get("ai_coding_seconds") or 0) + float(item.get("manual_coding_seconds") or 0)


def main(saida: str) -> None:
    req = urllib.request.Request(URL, headers={"User-Agent": "portfolio-stats"})
    with urllib.request.urlopen(req, timeout=30) as r:
        d = json.load(r)["data"]

    editores = d.get("editors") or []
    total = sum(segundos(e) for e in editores)
    if total <= 0:
        sys.exit("WakaTime não devolveu tempo (estatística ainda calculando ou privada); arquivo mantido.")

    linguagens = [
        {"nome": l["name"], "pct": round(l.get("percent", 0), 1)}
        for l in (d.get("languages") or [])
        if l.get("name") not in ("Other", "Text", "Markdown", "JSON")
    ][:5]

    dados = {
        "horas": round(total / 3600),
        "desde": d.get("human_readable_range", "").replace("since ", ""),
        "linguagens": linguagens,
    }
    with open(saida, "w", encoding="utf-8") as f:
        json.dump(dados, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print(json.dumps(dados, ensure_ascii=False))


if __name__ == "__main__":
    main(sys.argv[1])
