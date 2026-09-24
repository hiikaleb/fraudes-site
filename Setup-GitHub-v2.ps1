param(
    [string]$ProjectPath = "",
    [ValidateSet("menu","publish","new","update","engines","host")]
    [string]$Mode = "menu"
)

$ErrorActionPreference = "Stop"

function Write-Ok($msg)    { Write-Host "[OK] $msg" -ForegroundColor Green }
function Write-Info($msg)  { Write-Host "[*] $msg" -ForegroundColor Cyan }
function Write-Warn($msg)  { Write-Host "[!] $msg" -ForegroundColor Yellow }
function Write-Fail($msg)  { Write-Host "[X] $msg" -ForegroundColor Red }

function Test-Command($name) {
    return $null -ne (Get-Command $name -ErrorAction SilentlyContinue)
}

function Pause-Script {
    Write-Host ""
    Read-Host "Pressione Enter para continuar"
}

function Select-Folder($description = "Selecione a pasta do projeto") {
    Add-Type -AssemblyName System.Windows.Forms
    $dialog = New-Object System.Windows.Forms.FolderBrowserDialog
    $dialog.Description = $description
    $dialog.ShowNewFolderButton = $true

    if ($dialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {
        return $dialog.SelectedPath
    }

    return $null
}

function Ensure-Winget {
    if (-not (Test-Command "winget")) {
        Write-Fail "WinGet nao foi encontrado."
        Write-Host "No Windows 11, instale/atualize o App Installer pela Microsoft Store e tente novamente."
        throw "WinGet ausente."
    }
}

function Ensure-Git {
    if (Test-Command "git") {
        Write-Ok "Git ja esta instalado."
        return
    }

    Write-Info "Git nao encontrado. Instalando pelo WinGet..."
    winget install --id Git.Git -e --source winget --accept-package-agreements --accept-source-agreements

    if (-not (Test-Command "git")) {
        Write-Warn "O Git foi instalado, mas esta janela ainda nao atualizou o PATH."
        Write-Warn "Feche este programa e execute novamente."
        throw "Git nao disponivel nesta sessao."
    }

    Write-Ok "Git instalado."
}

function Ensure-GitHubCli {
    if (Test-Command "gh") {
        Write-Ok "GitHub CLI ja esta instalado."
        return
    }

    Write-Info "GitHub CLI nao encontrado. Instalando pelo WinGet..."
    winget install --id GitHub.cli -e --source winget --accept-package-agreements --accept-source-agreements

    if (-not (Test-Command "gh")) {
        Write-Warn "O GitHub CLI foi instalado, mas esta janela ainda nao atualizou o PATH."
        Write-Warn "Feche este programa e execute novamente."
        throw "GitHub CLI nao disponivel nesta sessao."
    }

    Write-Ok "GitHub CLI instalado."
}

function Ensure-Node {
    if (Test-Command "node") {
        Write-Ok "Node.js ja esta instalado."
        return
    }

    Write-Info "Node.js nao encontrado. Instalando LTS pelo WinGet..."
    winget install --id OpenJS.NodeJS.LTS -e --source winget --accept-package-agreements --accept-source-agreements
    Write-Warn "Se o Node nao aparecer nesta sessao, feche e abra o programa novamente."
}

function Ensure-Python {
    if (Test-Command "python") {
        Write-Ok "Python ja esta instalado."
        return
    }

    Write-Info "Python nao encontrado. Instalando pelo WinGet..."
    winget install --id Python.Python.3.13 -e --source winget --accept-package-agreements --accept-source-agreements
    Write-Warn "Se o Python nao aparecer nesta sessao, feche e abra o programa novamente."
}

function Ensure-DotNet {
    if (Test-Command "dotnet") {
        Write-Ok ".NET ja esta instalado."
        return
    }

    Write-Info ".NET SDK nao encontrado. Instalando pelo WinGet..."
    winget install --id Microsoft.DotNet.SDK.8 -e --source winget --accept-package-agreements --accept-source-agreements
    Write-Warn "Se o .NET nao aparecer nesta sessao, feche e abra o programa novamente."
}

function Ensure-Java {
    if (Test-Command "java") {
        Write-Ok "Java ja esta instalado."
        return
    }

    Write-Info "Java nao encontrado. Instalando OpenJDK pelo WinGet..."
    winget install --id Microsoft.OpenJDK.21 -e --source winget --accept-package-agreements --accept-source-agreements
    Write-Warn "Se o Java nao aparecer nesta sessao, feche e abra o programa novamente."
}

function Ensure-Dependencies {
    param([string]$Path)

    Set-Location -LiteralPath $Path

    if (Test-Path "package.json") {
        Write-Info "Projeto Node.js detectado."
        Ensure-Node

        if (Test-Path "package-lock.json") {
            Write-Info "Instalando dependencias com npm ci..."
            npm ci
        } else {
            Write-Info "Instalando dependencias com npm install..."
            npm install
        }
    }

    if ((Test-Path "requirements.txt") -or (Test-Path "pyproject.toml")) {
        Write-Info "Projeto Python detectado."
        Ensure-Python

        if (-not (Test-Path ".venv")) {
            Write-Info "Criando ambiente virtual .venv..."
            python -m venv .venv
        }

        if (Test-Path "requirements.txt") {
            Write-Info "Instalando requirements.txt..."
            & ".\.venv\Scripts\python.exe" -m pip install -r requirements.txt
        }
    }

    if ((Get-ChildItem -Filter "*.csproj" -ErrorAction SilentlyContinue).Count -gt 0 -or
        (Get-ChildItem -Filter "*.sln" -ErrorAction SilentlyContinue).Count -gt 0) {
        Write-Info "Projeto .NET detectado."
        Ensure-DotNet
        dotnet restore
    }

    if ((Test-Path "pom.xml") -or (Test-Path "build.gradle") -or (Test-Path "build.gradle.kts")) {
        Write-Info "Projeto Java detectado."
        Ensure-Java

        if (Test-Path "pom.xml") {
            if (Test-Command "mvn") {
                mvn dependency:resolve
            } else {
                Write-Warn "Maven nao foi encontrado. O projeto Java foi detectado, mas as dependencias nao foram instaladas automaticamente."
            }
        }
    }

    Write-Ok "Verificacao de dependencias concluida."
}

function New-GitIgnore {
    if (Test-Path ".gitignore") {
        Write-Ok ".gitignore ja existe. Mantendo o arquivo atual."
        return
    }

    $content = @'
# Dependencies
node_modules/
.pnpm-store/
.yarn/
.venv/
venv/
__pycache__/

# Build
dist/
build/
out/
target/
bin/
obj/

# Environment / secrets
.env
.env.*
!.env.example

# IDE / OS
.vscode/
.idea/
*.code-workspace
.DS_Store
Thumbs.db

# Logs
*.log

# Local files
*.local
'@

    Set-Content -LiteralPath ".gitignore" -Value $content -Encoding utf8
    Write-Ok ".gitignore criado."
}

function New-Readme {
    if (Test-Path "README.md") {
        Write-Ok "README.md ja existe. Mantendo o arquivo atual."
        return
    }

    $folder = Split-Path -Leaf (Get-Location)
    @"
# $folder

Projeto publicado no GitHub e hospedado.

## Sobre

Adicione aqui a descricao do projeto.

## Tecnologias

Adicione aqui as tecnologias utilizadas.

## Como executar

Adicione aqui as instrucoes para executar o projeto.
"@ | Set-Content -LiteralPath "README.md" -Encoding utf8

    Write-Ok "README.md criado."
}

function Scan-Secrets {
    Write-Info "Procurando arquivos potencialmente sensiveis..."

    $patterns = @(
        ".env",
        ".env.*",
        "*.pem",
        "*.key",
        "*credentials*",
        "*credential*",
        "*secret*",
        "*password*",
        "*token*"
    )

    $found = @()

    foreach ($pattern in $patterns) {
        $items = Get-ChildItem -Path . -Recurse -Force -File -Filter $pattern -ErrorAction SilentlyContinue |
            Where-Object {
                $_.FullName -notmatch "\\node_modules\\" -and
                $_.FullName -notmatch "\\.git\\" -and
                $_.FullName -notmatch "\\.venv\\"
            }
        $found += $items
    }

    $found = $found | Sort-Object FullName -Unique

    if ($found.Count -gt 0) {
        Write-Warn "Foram encontrados arquivos que podem conter dados sensiveis:"
        $found | ForEach-Object { Write-Host "   $($_.FullName)" }
        Write-Host ""
        $answer = Read-Host "Continuar mesmo assim? [s/N]"
        if ($answer -notmatch "^(s|sim|y|yes)$") {
            throw "Publicacao cancelada por seguranca."
        }
    } else {
        Write-Ok "Nenhum arquivo sensivel obvio encontrado."
    }
}

function Ensure-GitConfig {
    $name = git config --global user.name
    $email = git config --global user.email

    if ([string]::IsNullOrWhiteSpace($name)) {
        $name = Read-Host "Nome para os commits do Git"
        git config --global user.name "$name"
    }

    if ([string]::IsNullOrWhiteSpace($email)) {
        $email = Read-Host "Email para os commits do Git"
        git config --global user.email "$email"
    }

    Write-Ok "Git configurado como: $name <$email>"
}

function Ensure-GitHubAuth {
    $status = gh auth status 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Ok "GitHub CLI ja esta autenticado."
        gh auth setup-git | Out-Null
        return
    }

    Write-Info "Login no GitHub necessario."
    gh auth login --web --git-protocol https

    if ($LASTEXITCODE -ne 0) {
        throw "Nao foi possivel autenticar no GitHub."
    }

    gh auth setup-git | Out-Null
    Write-Ok "GitHub autenticado."
}

function Validate-ProjectPath([string]$Path) {
    if ([string]::IsNullOrWhiteSpace($Path)) {
        throw "Nenhuma pasta foi selecionada."
    }

    $resolved = (Resolve-Path -LiteralPath $Path).Path
    $windows = [Environment]::GetFolderPath("Windows")

    if ($resolved.TrimEnd('\') -ieq $windows.TrimEnd('\')) {
        throw "A pasta Windows nao pode ser usada como projeto."
    }

    if ($resolved -ieq "$windows\System32") {
        throw "C:\Windows\System32 nao pode ser usada como projeto."
    }

    return $resolved
}

function Initialize-Repository {
    if (-not (Test-Path ".git")) {
        Write-Info "Criando repositorio Git local..."
        git init
        git branch -M main
        Write-Ok "Repositorio Git criado."
    } else {
        Write-Ok "Repositorio Git ja existe."
    }
}

function Commit-Project {
    Write-Info "Adicionando arquivos ao Git..."
    git add .

    if ($LASTEXITCODE -ne 0) {
        throw "git add falhou."
    }

    $changes = git status --porcelain

    if ([string]::IsNullOrWhiteSpace(($changes -join ""))) {
        Write-Warn "Nao ha alteracoes novas para commit."
        return $false
    }

    $message = Read-Host "Mensagem do commit [Enter = Initial commit]"
    if ([string]::IsNullOrWhiteSpace($message)) {
        $message = "Initial commit"
    }

    git commit -m "$message"

    if ($LASTEXITCODE -ne 0) {
        throw "git commit falhou."
    }

    Write-Ok "Commit criado: $message"
    return $true
}

function Select-OrCreateGitHubRepo {
    Write-Info "Buscando seus repositorios existentes no GitHub..."
    $reposJson = gh repo list --limit 20 --json name 2>$null
    $repos = @()
    if ($LASTEXITCODE -eq 0 -and -not [string]::IsNullOrWhiteSpace($reposJson)) {
        $repos = $reposJson | ConvertFrom-Json | Select-Object -ExpandProperty name
    }

    $defaultName = Split-Path -Leaf (Get-Location)

    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host "                   SELECAO DE REPOSITORIO                   " -ForegroundColor Cyan
    Write-Host "============================================================" -ForegroundColor Cyan
    if ($repos.Count -gt 0) {
        for ($i = 0; $i -lt $repos.Count; $i++) {
            Write-Host "  [$($i + 1)] $($repos[$i])"
        }
        Write-Host "  [0] Criar um NOVO repositorio com o nome da pasta ($defaultName)"
    } else {
        Write-Host "  Nenhum repositorio encontrado na conta ou offline."
    }
    Write-Host ""

    $choice = Read-Host "Digite o numero da opcao [Enter = Criar novo com nome '$defaultName']"

    if ([string]::IsNullOrWhiteSpace($choice) -or $choice -eq "0") {
        return @{ Name = $defaultName; IsNew = $true }
    }

    if ($repos.Count -gt 0 -and $choice -match '^\d+$') {
        $index = [int]$choice - 1
        if ($index -ge 0 -and $index -lt $repos.Count) {
            return @{ Name = $repos[$index]; IsNew = $false }
        }
    }

    # Se digitou o nome diretamente por texto
    return @{ Name = $choice; IsNew = $true }
}

function Handle-GitHubRemote([string]$RepoName, [bool]$IsNew) {
    $remotes = git remote
    if ($remotes -contains "origin") {
        $remote = git remote get-url origin
        Write-Ok "Remote origin ja existe: $remote"
        return
    }

    if ($IsNew) {
        Write-Host ""
        Write-Host "Visibilidade do repositorio novo:"
        Write-Host "  1 - Publico (Obrigatorio para GitHub Pages)"
        Write-Host "  2 - Privado"

        do {
            $visibility = Read-Host "Escolha [1/2]"
        } until ($visibility -in @("1","2"))

        $flag = if ($visibility -eq "1") { "--public" } else { "--private" }

        Write-Info "Criando novo repositorio '$RepoName' no GitHub..."
        gh repo create "$RepoName" $flag --source=. --remote=origin
    } else {
        Write-Info "Conectando ao repositorio existente '$RepoName'..."
        $username = gh api user --jq '.login' 2>$null
        if ([string]::IsNullOrWhiteSpace($username)) {
            $username = Read-Host "Digite o seu nome de usuario do GitHub"
        }
        $remoteUrl = "https://github.com/$username/$RepoName.git"
        git remote add origin $remoteUrl
        git branch -M main
    }

    Write-Info "Enviando para origin/main..."
    git push -u origin main

    if ($LASTEXITCODE -ne 0) {
        throw "git push falhou."
    }

    Write-Ok "Projeto publicado no GitHub com sucesso."
}

function Push-ExistingRepository {
    $remotes = git remote

    if (-not ($remotes -contains "origin")) {
        Write-Warn "Este repositorio ainda nao possui origin configurado."
        $selected = Select-OrCreateGitHubRepo
        Handle-GitHubRemote $selected.Name $selected.IsNew
        return
    }

    Write-Info "Enviando alteracoes para origin/main..."
    git push -u origin main

    if ($LASTEXITCODE -ne 0) {
        Write-Warn "Push para main falhou. Tentando detectar a branch atual..."
        $branch = git branch --show-current
        git push -u origin $branch

        if ($LASTEXITCODE -ne 0) {
            throw "git push falhou."
        }
    }

    Write-Ok "Push concluido."
}

function Enable-GitHubHosting {
    Write-Info "Configurando Hospedagem Estatica via GitHub Pages..."
    
    Ensure-GitHubCli
    Ensure-GitHubAuth

    gh repo edit --enable-pages --source . --branch main

    if ($LASTEXITCODE -eq 0) {
        Write-Ok "Hospedagem ativada com sucesso!"
        Write-Info "O site estara disponivel online em instantes."
        $view = Read-Host "Deseja abrir o link do site no navegador agora? [S/n]"
        if ($view -notmatch "^(n|nao|no)$") {
            gh repo view --web --pages 2>$null
        }
    } else {
        Write-Warn "Nao foi possivel configurar o Pages automaticamente."
        Write-Warn "Certifique-se de que o repositorio e publico e ja possui commits enviados."
    }
}

function Update-SystemEngines {
    Write-Info "Verificando e atualizando ferramentas do sistema via WinGet..."
    Ensure-Winget

    winget upgrade --id Git.Git -e --accept-source-agreements --accept-package-agreements
    winget upgrade --id GitHub.cli -e --accept-source-agreements --accept-package-agreements
    winget upgrade --id OpenJS.NodeJS.LTS -e --accept-source-agreements --accept-package-agreements
    winget upgrade --id Python.Python.3.13 -e --accept-source-agreements --accept-package-agreements

    Write-Ok "Atualizacao de motores concluida!"
}

function Publish-Project([string]$Path, [bool]$InstallDeps = $true) {
    $Path = Validate-ProjectPath $Path
    Set-Location -LiteralPath $Path

    Write-Host ""
    Write-Host "============================================================"
    Write-Host " PROJETO SELECIONADO"
    Write-Host " $Path"
    Write-Host "============================================================"
    Write-Host ""

    Ensure-Winget
    Ensure-Git
    Ensure-GitHubCli
    Ensure-GitConfig
    Ensure-GitHubAuth

    if ($InstallDeps) {
        Ensure-Dependencies $Path
    }

    New-GitIgnore
    New-Readme
    Scan-Secrets
    Initialize-Repository

    $committed = Commit-Project

    $remotes = git remote

    if (-not ($remotes -contains "origin")) {
        Write-Info "Este projeto ainda nao possui um repositorio remoto associado."
        $selected = Select-OrCreateGitHubRepo
        Handle-GitHubRemote $selected.Name $selected.IsNew
    }
    elseif ($committed) {
        Push-ExistingRepository
    }
    else {
        Write-Info "Nenhuma alteracao nova. Nada para enviar."
    }

    Write-Host ""
    $hostSite = Read-Host "Deseja configurar hospedagem gratuita (GitHub Pages) para este site? [S/n]"
    if ($hostSite -notmatch "^(n|nao|no)$") {
        Enable-GitHubHosting
    }

    Write-Host ""
    Write-Ok "PROCESSO CONCLUIDO."
    Write-Host ""

    $open = Read-Host "Abrir o repositorio no navegador? [S/n]"
    if ($open -notmatch "^(n|nao|no)$") {
        $url = gh repo view --web 2>$null
    }
}

function Create-NewProject {
    Write-Info "Escolha onde o novo projeto sera criado."
    $parent = Select-Folder "Escolha a pasta onde o novo projeto sera criado"

    if ([string]::IsNullOrWhiteSpace($parent)) {
        Write-Warn "Operacao cancelada."
        return
    }

    do {
        $name = Read-Host "Nome da nova pasta/projeto"
    } while ([string]::IsNullOrWhiteSpace($name))

    $newPath = Join-Path $parent $name

    if (Test-Path -LiteralPath $newPath) {
        throw "A pasta ja existe: $newPath"
    }

    New-Item -ItemType Directory -Path $newPath | Out-Null
    Write-Ok "Projeto criado em: $newPath"

    Publish-Project $newPath $false
}

function Update-Existing {
    $path = Select-Folder "Selecione o projeto Git que voce quer atualizar"

    if ([string]::IsNullOrWhiteSpace($path)) {
        Write-Warn "Operacao cancelada."
        return
    }

    $path = Validate-ProjectPath $path
    Set-Location -LiteralPath $path

    if (-not (Test-Path ".git")) {
        throw "Essa pasta nao possui um repositorio Git. Use a opcao 1 para publicar o projeto."
    }

    Ensure-Git
    Ensure-GitHubCli
    Ensure-GitConfig
    Ensure-GitHubAuth
    Scan-Secrets

    Write-Info "Status atual:"
    git status

    Write-Host ""
    $install = Read-Host "Instalar/atualizar dependencias detectadas? [S/n]"
    if ($install -notmatch "^(n|nao|no)$") {
        Ensure-Dependencies $path
    }

    $committed = Commit-Project

    if ($committed) {
        Push-ExistingRepository
    } else {
        Write-Info "Nada novo para enviar."
    }

    Write-Host ""
    Write-Ok "Atualizacao concluida."
}

function Show-Menu {
    Clear-Host
    Write-Host "============================================================"
    Write-Host "             SETUP GITHUB - WINDOWS 11 v2"
    Write-Host "============================================================"
    Write-Host ""
    Write-Host "  1 - Publicar uma pasta/projeto existente"
    Write-Host "  2 - Escolher uma pasta e publicar"
    Write-Host "  3 - Criar um projeto novo e publicar"
    Write-Host "  4 - Atualizar um projeto que ja esta no GitHub"
    Write-Host "  5 - Atualizar ferramentas e motores do sistema"
    Write-Host "  6 - Configurar Hospedagem (GitHub Pages) em um site"
    Write-Host "  7 - Sair"
    Write-Host ""

    do {
        $choice = Read-Host "Escolha uma opcao [1-7]"
    } until ($choice -in @("1","2","3","4","5","6","7"))

    switch ($choice) {
        "1" {
            $path = Split-Path -Parent $PSCommandPath
            Publish-Project $path $true
        }
        "2" {
            $path = Select-Folder "Selecione a pasta do projeto que sera publicada"
            if ($path) { Publish-Project $path $true }
        }
        "3" {
            Create-NewProject
        }
        "4" {
            Update-Existing
        }
        "5" {
            Update-SystemEngines
            Pause-Script
            Show-Menu
        }
        "6" {
            $path = Select-Folder "Selecione a pasta do site que deseja hospedar"
            if ($path) {
                Set-Location -LiteralPath $path
                Enable-GitHubHosting
            }
            Pause-Script
            Show-Menu
        }
        "7" {
            Write-Host "Saindo..."
            return
        }
    }
}

try {
    if ($Mode -eq "menu") {
        Show-Menu
    }
    elseif ($Mode -eq "publish") {
        Publish-Project $ProjectPath $true
    }
    elseif ($Mode -eq "new") {
        Create-NewProject
    }
    elseif ($Mode -eq "update") {
        Update-Existing
    }
    elseif ($Mode -eq "engines") {
        Update-SystemEngines
    }
    elseif ($Mode -eq "host") {
        Enable-GitHubHosting
    }
}
catch {
    Write-Host ""
    Write-Fail $_.Exception.Message
    Write-Host ""
    Write-Warn "O processo foi interrompido para evitar alterar uma pasta errada."
    exit 1
}
finally {
    Write-Host ""
}