# CSV Viewer & Editor - Extensão Chrome

Uma extensão do Chrome que permite visualizar e editar arquivos CSV e XLSX com funcionalidades similares ao Excel, incluindo edição de células, soma automática de colunas e formatação de moeda.

## Funcionalidades

- 📁 **Suporte CSV e XLSX**: Abra arquivos CSV (.csv) e Excel (.xlsx, .xls)
- 📂 **Drag & Drop**: Arraste arquivos diretamente para a extensão
- ✏️ **Edição Tipo Excel**: Clique em qualquer célula para editar
- ➕ **Soma Automática**: Soma automática de colunas numéricas exibida no rodapé
- 💰 **Formatação de Moeda**: Aplique formatos de moeda em diferentes localidades (R$, $, £, €, ¥)
- 📄 **Exportar para Excel**: Baixe a tabela como arquivo Excel (.xlsx)
- 💾 **Download CSV**: Baixe o arquivo CSV editado
- 🎨 **Interface Moderna**: Design limpo e responsivo
- ⌨️ **Atalhos de Teclado**: Ctrl+C/V para copiar/colar, setas para navegar
- ✅ **Testes Automatizados**: Suite de testes com 60+ testes para garantir qualidade

## Formatos Suportados

| Formato | Extensões | Leitura | Escrita |
|---------|-----------|---------|---------|
| CSV | `.csv` | ✅ | ✅ |
| Excel | `.xlsx`, `.xls` | ✅ | ✅ (via Export Excel) |

## Instalação

### Passo 1: Gerar os Ícones

**Opção A - Usando o Gerador HTML (Recomendado):**
1. Abra o arquivo `generate-icons.html` no seu navegador
2. Clique nos três botões para baixar os ícones
3. Salve os arquivos na pasta da extensão

**Opção B - Usando Python (se tiver Pillow instalado):**
```bash
python3 generate_icons.py
```

**Opção C - Criar manualmente:**
Crie ícones de 16x16, 48x48 e 128x128 pixels usando qualquer editor de imagens e salve como `icon16.png`, `icon48.png` e `icon128.png`.

### Passo 2: Carregar a Extensão no Chrome

1. Abra o Chrome e vá para `chrome://extensions/`
2. Ative o "Modo do desenvolvedor" (toggle no canto superior direito)
3. Clique em "Carregar sem compactação"
4. Selecione a pasta `csv-viewer-extension`
5. A extensão será carregada e aparecerá na barra de ferramentas

### Passo 3: Usar a Extensão

1. Clique no ícone da extensão na barra de ferramentas
2. Arraste um arquivo CSV ou XLSX para a área de drop ou clique para selecionar
3. Edite as células clicando nelas
4. Use o botão "Converter Colunas" para formatar colunas como moeda
5. Baixe o arquivo editado usando o botão "Download CSV" ou "Download Excel"

## Como Usar

### Editar Células
- Clique em qualquer célula para editar
- Pressione Enter para mover para a célula abaixo
- As alterações são salvas automaticamente

### Formatar Moeda
1. (Opcional) Clique no cabeçalho de uma ou mais colunas para pré-selecionar
2. Selecione o formato de entrada (ex.: $1,234.56 ou R$ 1.234,56)
3. Selecione o formato de moeda desejado no menu dropdown
4. Clique em "Converter Colunas"
5. Na modal, marque as colunas que deseja converter e confirme
6. A formatação será aplicada a todas as células numéricas das colunas selecionadas

### Soma de Colunas
- A soma de cada coluna é calculada automaticamente
- Valores numéricos são detectados e somados
- O resultado aparece no rodapé da tabela

## Estrutura do Projeto

```
csv-viewer-extension/
├── manifest.json           # Configuração da extensão
├── popup.html              # Interface HTML (popup)
├── viewer.html             # Interface HTML (full-page viewer)
├── popup.css               # Estilos do popup
├── viewer.css              # Estilos do viewer
├── app.js                  # Lógica do popup
├── viewer.js               # Lógica do viewer
├── background.js           # Service worker da extensão
├── shared/                 # Módulos compartilhados
│   ├── csv-utils.js        # Parser e serializador CSV
│   ├── xlsx-utils.js       # Parser de arquivos Excel
│   ├── file-utils.js       # Leitura de arquivos
│   ├── number-utils.js     # Formatação de números
│   ├── storage-utils.js    # Persistência de preferências
│   ├── cell-selection.js   # Seleção de células
│   ├── table-renderer.js   # Renderização da tabela
│   ├── download-utils.js   # Download de arquivos
├── vendor/                 # Bibliotecas de terceiros
│   └── xlsx.full.min.js    # SheetJS para ler arquivos Excel
├── tests/                  # Testes automatizados
│   ├── csv-utils.test.js
│   ├── xlsx-utils.test.js
│   ├── number-utils.test.js
│   └── file-utils.test.js
├── icon16.png              # Ícone 16x16
├── icon48.png              # Ícone 48x48
├── icon128.png             # Ícone 128x128
├── package.json            # Dependências e scripts
├── jest.config.js          # Configuração do Jest
└── README.md               # Este arquivo
```

## Desenvolvimento

### Requisitos

- Node.js 18+
- npm

### Instalar Dependências

```bash
npm install
```

### Executar Testes

```bash
# Executar todos os testes
npm test

# Modo watch (para desenvolvimento)
npm run test:watch

# Relatório de cobertura
npm run test:coverage
```

### Testar no Chrome

1. Abra o Chrome e vá para `chrome://extensions/`
2. Ative o "Modo do desenvolvedor"
3. Clique em "Carregar sem compactação"
4. Selecione a pasta `csv-viewer-extension`

## Tecnologias Utilizadas

- HTML5
- CSS3
- JavaScript (Vanilla ES Modules)
- Chrome Extensions API (Manifest V3)
- [SheetJS](https://sheetjs.com/) - Biblioteca para ler e escrever arquivos Excel
- [Jest](https://jestjs.io/) - Framework de testes

## Notas

- A extensão funciona completamente no lado do cliente (client-side)
- Nenhum dado é enviado para servidores externos
- O formato de moeda preferido é salvo localmente no Chrome

## Licença

Este projeto é de código aberto e está disponível para uso livre.
