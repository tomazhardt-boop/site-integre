# Recorta o fundo das imagens de "Logos e imagens para se basear" e grava em imagens/.
# Uso (PowerShell, na raiz do projeto):
#   Set-ExecutionPolicy -Scope Process Bypass -Force
#   & .\_ferramentas\recorte\recorte.ps1 -Proj (Get-Location).Path -Task mascotes   # ou -Task logos
# Previas sobre azul-marinho/azul vao para %TEMP%\integre-recorte-preview (para conferir halos).
# Mantenha este arquivo em ASCII: o PowerShell 5.1 le .ps1 sem BOM como ANSI.
param([string]$Proj, [string]$Task = 'mascotes')
$ErrorActionPreference = 'Stop'
Add-Type -Path (Join-Path $PSScriptRoot 'Recorte.cs') -ReferencedAssemblies System.Drawing

$src  = Join-Path $Proj 'Logos e imagens para se basear'
$out  = Join-Path $Proj 'imagens'
$prev = Join-Path $env:TEMP 'integre-recorte-preview'
New-Item -ItemType Directory -Force $out, $prev | Out-Null

# mode: 0 = fundo branco, 1 = degrade (bordas esquerda/direita), 2 = papel + mancha lilas de aquarela
# smooth > 0: so avanca por pixels lisos (pelo tem textura) - usado no tigre 3D
function Mascote($file, $name, $mode, $tol, $step, $seeds, $rad, $minFg, $speck = 60, $smooth = 0) {
  $im = [Recorte]::Load((Join-Path $src $file), 1400, 1000)
  if ($smooth -gt 0) { $reg = [Recorte]::RegionSmooth($im, $tol, $step, $smooth, [double[]]$seeds) }
  else { $reg = [Recorte]::Region($im, $mode, $tol, $step, $false, [double[]]$seeds) }
  [Recorte]::Despeck($im, $reg, $speck)
  $o = [Recorte]::Trim([Recorte]::Apply($im, $reg, $rad, $minFg), 4, 10)
  [Recorte]::Save($o, (Join-Path $out "$name.png"))
  [Recorte]::Preview($o, (Join-Path $prev "$name-navy.png"), 6, 16, 51)
  [Recorte]::Preview($o, (Join-Path $prev "$name-azul.png"), 33, 121, 255)
  Write-Host ("{0}: {1}x{2}" -f $name, $o.W, $o.H)
}

# global = $true: todo branco vira transparente (inclusive os vaos entre as facetas do simbolo)
function Logo($file, $name, $global) {
  $im  = [Recorte]::Load((Join-Path $src $file), 4000, 4000)
  $reg = [Recorte]::Region($im, 0, 24, 255, $global, $null)
  [Recorte]::Despeck($im, $reg, 30)
  $o = [Recorte]::Trim([Recorte]::Apply($im, $reg, 2, 30), 2, 10)
  [Recorte]::Save($o, (Join-Path $out "$name.png"))
  [Recorte]::Preview($o, (Join-Path $prev "$name-navy.png"), 6, 16, 51)
  Write-Host ("{0}: {1}x{2}" -f $name, $o.W, $o.H)
  return $o
}

if ($Task -eq 'mascotes') {
  Mascote 'Gemini_Generated_Image_mk82hamk82hamk82.jpg' 'mascote-apontando'       0 28 255 $null 2 30
  Mascote 'Gemini_Generated_Image_qrotaqrotaqrotaq.jpg' 'mascote-bracos-cruzados' 0 28 255 $null 2 30
  Mascote 'Hand-drawn-comic-book-caricature-of-a-wh.png' 'mascote-aquarela'       2 22 255 $null 2 30 400
  # Sementes = vao de fundo preso entre as pernas do tigre 3D (fracoes de largura/altura).
  Mascote 'Semi-realistic-anthropomorphic-white-tig.png' 'mascote-3d' 1 30 14 @(0.507,0.851, 0.519,0.80, 0.499,0.879) 4 30 400 10
}

# Padrao de linhas da Integre (enviado ja sem fundo, em imagens/). So recorta a area util e gera
# a versao branca (mesmo alpha) para fundo escuro.
if ($Task -eq 'linhas') {
  $im = [Recorte]::Load((Join-Path $out 'Design sem nome (1).png'), 1920, 1080)
  $c  = [Recorte]::Crop($im, 586, 102, 637, 751)
  [Recorte]::Save($c, (Join-Path $out 'linhas-escuras.png'))
  [Recorte]::Save([Recorte]::Whiten($c), (Join-Path $out 'linhas-claras.png'))
  [Recorte]::Preview([Recorte]::Whiten($c), (Join-Path $prev 'linhas-claras-navy.png'), 6, 16, 51)
  Write-Host ("linhas: {0}x{1}" -f $c.W, $c.H)
}

if ($Task -eq 'logos') {
  $h = Logo 'photo_4976743928212597845_y.jpg' 'logo-horizontal' $true
  [Recorte]::Save([Recorte]::Whiten($h), (Join-Path $out 'logo-horizontal-branca.png'))
  $v = Logo 'photo_4976743928212597847_y.jpg' 'logo-vertical' $true
  [Recorte]::Save([Recorte]::Whiten($v), (Join-Path $out 'logo-vertical-branca.png'))
  $x = Logo 'photo_4976743928212597843_y.jpg' 'icone-hexagono' $false
  $sq = [Recorte]::PadSquare($x, 8)
  [Recorte]::Save([Recorte]::Resize($sq, 180, 180), (Join-Path $out 'apple-touch-icon.png'))
  [Recorte]::Save([Recorte]::Resize($sq, 48, 48), (Join-Path $out 'favicon-48.png'))
}
