# Como adicionar ou editar um projeto

Cada projeto é um ficheiro `.md` nesta pasta. O nome do ficheiro vira o endereço da página
(ex.: `hotel-tarrafal.md` → `/projetos/hotel-tarrafal/`).

No topo, entre as linhas `---`, ficam os dados:

- `titulo`, `cliente`, `categoria`, `ano`, `resumo`
- `ordem`: posição na página inicial (1 = primeiro)
- `destaque`: `sim` para aparecer na página inicial
- `exemplo`: apagar esta linha quando o projeto for real
- `conceptual`: `sim` para identificar trabalhos conceptuais ou pessoais
- `capa`: imagem principal (ex.: `/media/hotel-tarrafal/capa.jpg`)
- `video`: vídeo de apresentação opcional (mp4, sem som)
- `servicos`: lista separada por vírgulas
- `creditos`: uma linha por pessoa, separadas por `;`

Depois vem o texto, com títulos `## ...` e imagens `![descrição](/media/...)`.
Várias imagens na mesma linha aparecem lado a lado.

As imagens ficam na pasta `media/`. Ao guardar no GitHub, o site atualiza sozinho em 1–2 minutos.
