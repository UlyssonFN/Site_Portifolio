# DataStock BI

Site institucional e portfólio profissional da DataStock BI, desenvolvido para apresentar projetos, serviços e soluções nas áreas de dados, Business Intelligence, automação e desenvolvimento de sistemas.

O projeto também inclui páginas comerciais para o Sistema PDV DataStock e Power BI, além do **Anne OS Kids**, uma experiência de desktop educativo executada no navegador.

## Funcionalidades

- Página institucional com serviços, projetos, depoimentos e formulário de contato.
- Portfólio com projetos categorizados por BI, logística e automação.
- Filtros e modais com detalhes dos projetos apresentados.
- Página comercial do Sistema PDV DataStock, com recursos, planos, FAQ e chamadas para contato.
- Página comercial de serviços de visualização e Power BI.
- Anne OS Kids com login de perfis, desktop, janelas, configurações, aplicativos educativos, jogos e conquistas.
- Painel administrativo local para gerenciar projetos, fotos, serviços, depoimentos e contatos.

## Tecnologias

- HTML5
- CSS3
- JavaScript vanilla
- IndexedDB e `localStorage` para persistência local
- Google Fonts via CDN
- Web3Forms no formulário de contato

As tecnologias citadas nas páginas comerciais, como Python, Streamlit, SQLite, Oracle Cloud e Power BI, fazem parte da apresentação dos serviços e projetos. Este repositório não contém um backend para elas.

## Estrutura principal

```text
.
├── index.html                 # Página institucional
├── portfolio.html             # Portfólio e filtros de projetos
├── pdv.html                   # Apresentação do Sistema PDV
├── powerbi.html               # Apresentação dos serviços de Power BI
├── anne.html                  # Anne OS Kids
├── admin.html                 # Painel administrativo local
├── style.css                  # Estilos do site institucional
├── desktop.css                # Estilos do desktop do Anne OS
├── windows.css                # Estilos das janelas do Anne OS
├── games.css                  # Estilos dos jogos
├── database.js                # IndexedDB e fallback em memória
├── apps.js, desktop.js        # Inicialização e desktop
├── windows.js, os.js          # Janelas e núcleo do Anne OS
├── js/apps/                   # Aplicativos do Anne OS
├── js/games/                  # Jogos educativos e arcade
└── assets/                    # Imagens e recursos estáticos
```

## Como executar

O projeto não possui dependências npm, build ou testes automatizados. Para visualizar o site, abra o `index.html` no navegador ou use um servidor HTTP local.

Com Python instalado:

```bash
python -m http.server 8000
```

Depois, acesse:

```text
http://localhost:8000
```

Também é possível usar a extensão **Live Server** do VS Code. Usar um servidor local é recomendado para evitar limitações do navegador com arquivos JavaScript e armazenamento local.

## Armazenamento e painel administrativo

O `admin.html` é um painel local. Os dados são armazenados no navegador e no dispositivo em que foram cadastrados; não há sincronização com um banco de dados remoto neste projeto.

O Anne OS Kids usa IndexedDB para dados como usuários, notas, desenhos, configurações, jogos e conquistas, com fallback em memória quando necessário. Limpar os dados do navegador pode remover essas informações.

## Links

- [Site DataStock BI](https://datastockbi.com.br)
- [Portfólio](https://datastockbi.com.br/portfolio)
- [GitHub — UlyssonFN](https://github.com/UlyssonFN)
- [LinkedIn — Ulysson Fontenele](https://www.linkedin.com/in/ulysson-fontenele-nobre-287a26125/)

## Status

Projeto em evolução. Novos projetos, serviços e recursos podem ser adicionados conforme o desenvolvimento da DataStock BI.
