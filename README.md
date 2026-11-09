# 1 PORCENTO — website

Site estático gerado a partir da pasta `conteudo/`.

- `conteudo/site.json` — e-mail, WhatsApp, redes e endereço do formulário
- `conteudo/projetos/*.md` — um ficheiro por projeto (ver `conteudo/projetos/LEIA-ME.md`)
- `media/` — imagens e vídeos dos projetos
- `assets/` — estilos, script e logótipo (SVG)

Pré-visualizar no computador:

    node build.mjs && node serve.mjs

Publicação: cada alteração enviada para o ramo `main` no GitHub é publicada
automaticamente no GitHub Pages (`.github/workflows/publicar.yml`).
