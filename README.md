# Santerm Resistências Elétricas — site

Site institucional e catálogo da **Santerm Resistências Elétricas** (revitalização do antigo `santerm.com.br/index.asp`).

Site estático (HTML + CSS + JavaScript puro), sem banco de dados e sem build: basta hospedar os arquivos. Funciona no GitHub Pages, Netlify, Vercel ou em qualquer hospedagem comum.

## O que tem no site

- **Catálogo** com os 32 produtos, busca (por nome, código ou aplicação) e filtro por categoria
- **Lista de orçamento**: o cliente monta a lista e envia tudo pelo WhatsApp ou por e-mail de uma vez
- **Sob medida**: processo de pedido e guia de materiais (inox 304L/316L/430, cobre, PTFE, titânio, chumbo)
- **Calculadora de potência** (a fórmula da antiga página "Informações Técnicas", agora interativa)
- Botão flutuante de WhatsApp, FAQ, formulário de contato (abre WhatsApp ou e-mail, sem servidor)
- Responsivo para celular, SEO (meta tags, Open Graph, dados estruturados, sitemap) e página 404 que redireciona os links antigos `.asp`

## Como editar

| O que mudar | Onde |
|---|---|
| Produtos (nome, código, descrição, foto, categoria) | `assets/js/produtos.js` |
| Número do WhatsApp e e-mail dos pedidos | topo de `assets/js/main.js` (`WHATS` e `EMAIL`) |
| Textos das seções | `index.html` |
| Cores e visual | variáveis no início de `assets/css/style.css` |
| Fotos dos produtos | `assets/img/produtos/` (800×600, fundo branco, `.webp`) |
| Logo (vetor, redesenhado fiel ao original) | `assets/img/logo-santerm.svg` |

## Ver no computador

```bash
python3 -m http.server 8000
```

Depois abra http://localhost:8000

## Publicar no GitHub Pages

1. No GitHub: **Settings → Pages → Build and deployment → Deploy from a branch**, branch `main`, pasta `/ (root)`.
2. Para usar o domínio `www.santerm.com.br`, informe o domínio no campo **Custom domain** e aponte o DNS (registro `CNAME` de `www` para `gui09gs-lab.github.io`).
