# Desmonte

O iPhone 18 Pro Max aberto peça por peça numa bancada de reparo, na ordem do
teardown, e as três câmeras de trás fotografando uma oficina de verdade.

## Como abrir

Precisa de servidor (módulo ES não abre por `file://`). Pelo preview do Claude
Code é a entrada `desmonte`, na porta **4333**. Na mão:

```powershell
python -m http.server 4333 --bind 127.0.0.1 --directory desmonte
```

E abre `http://localhost:4333`. Sem instalar nada e sem build.

## O que dá pra fazer

- **Montado, Explodido, Na bancada, Câmeras**: os quatro botões lá em cima.
  - **Montado:** o celular em pé com as medidas oficiais desenhadas. Girando
    até a frente, a tela mostra o que a câmera está vendo agora.
  - **Explodido:** as camadas abertas em diagonal. A barrinha "Afastar as
    peças" abre e fecha.
  - **Na bancada:** as 22 peças deitadas na manta, cada uma no compartimento
    com o número dela.
  - **Câmeras:** os três módulos fora da ilha e desmontados. Dá pra ver as 6
    lâminas fechando e, na tele, a luz quicando 4 vezes dentro do prisma.
- **Clicar numa peça**, no 3D ou na lista da esquerda: a câmera chega perto e
  a ficha conta o que ela faz e de onde veio a informação. `Esc` fecha.
- **As bolinhas de cor** trocam o acabamento: preto, prata, Glacier ou
  Burgundy.
- **Lente:** 0,5× (ultra-angular), 1× (principal), 2× (recorte da principal),
  4× (tele) e 8× (recorte da tele).
- **Abertura:** só na principal, de f/1,48 a f/4, nos 4 passos reais. Fechando,
  as bolinhas de luz desfocadas viram hexágono.
- **Foco:** pela barra, ou clicando na prévia em cima do que você quer nítido.
- **Mão tremendo** e **Estabilização:** liga o tremor e tira uma foto a 8× com
  e sem estabilização pra ver a diferença. O painel diz de quantos pixels é o
  rastro.
- **Fotografar:** a foto vai pro rolo (as últimas 8, neste navegador). Clicar
  numa abre ela grande, com botão de salvar.
- **O desenho no fim do painel** é a luz até o sensor, em escala. Na tele, ele
  mostra por que o prisma existe: reto, o caminho teria 16,3 mm num celular
  de 8,75 mm.
- `?sem3d` no endereço mostra o plano B, que aparece sozinho se o navegador
  não liberar WebGL.

## O que é dado e o que é estimativa

Medidas, câmeras, abertura, bateria, chips e o que o iFixit achou vêm da Apple
e dos teardowns (a lista está no `CLAUDE.md`). O formato da placa e da bateria,
a posição exata das lentes, o tamanho dos módulos e o desenho do prisma são
estimados. Cada ficha diz qual é o caso.

## Trocar texto ou cor

Toda frase da tela mora em `js/textos.js`. Pra mudar a ficha de uma peça, no
arquivo `js/textos.js`, procure o `nome:` dela e troque o `texto:` logo
abaixo. Pra mudar uma cor da página, no arquivo `css/estilo.css`, as variáveis
estão todas no topo, dentro de `:root`, com um comentário em cada grupo. As
cores do celular estão em `js/textos.js`, na lista `ACABAMENTOS`.

## Testes

```powershell
node --test
```

Na pasta `desmonte`. São 16, todos da óptica: conferem que os números da
Apple, do iFixit e do GSMArena fecham entre si (pixel, furo, campo de visão) e
que desfoque, exposição e estabilização se comportam como devem.
