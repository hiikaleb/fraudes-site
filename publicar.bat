@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
title Publicar - Painel Firebase Hosting

set "LOG=publicar-log.txt"
set "ARQ_KEY=firebase-key.txt"
set "PLACEHOLDER=COLOQUE_SUA_KEY_AQUI"

echo Execucao iniciada em %date% %time% >> "%LOG%"

REM ===========================================================
REM Checagem inicial de dependencias (uma vez, ao abrir)
REM ===========================================================
where node >nul 2>nul
if errorlevel 1 goto SEM_NODE
where firebase >nul 2>nul
if errorlevel 1 goto INSTALA_FIREBASE
goto MENU

:SEM_NODE
echo Node.js nao encontrado.
where winget >nul 2>nul
if errorlevel 1 (
    echo   [ERRO] winget indisponivel. Instale o Node.js manualmente em https://nodejs.org
    pause
    exit /b 1
)
echo Instalando Node.js LTS via winget, aguarde...
winget install OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements >> "%LOG%" 2>&1
echo.
echo Node.js instalado. Feche esta janela e rode o publicar.bat de novo.
pause
exit /b 0

:INSTALA_FIREBASE
echo Firebase CLI nao encontrado. Instalando via npm, aguarde...
call npm install -g firebase-tools >> "%LOG%" 2>&1
if errorlevel 1 (
    echo   [ERRO] Falha ao instalar Firebase CLI. Tente: npm install -g firebase-tools
    pause
    exit /b 1
)
echo Firebase CLI instalado com sucesso.
goto MENU

REM ===========================================================
REM MENU PRINCIPAL
REM ===========================================================
:MENU
cls
echo ================================================
echo   PAINEL PUBLICAR - Firebase Hosting
echo ================================================
echo.
call :MOSTRA_STATUS
echo.
echo   1. Publicar - deploy
echo   2. Parar o site - desativar hosting
echo   3. Trocar a pasta publicada
echo   4. Trocar de projeto Firebase
echo   5. Criar novo projeto Firebase
echo   6. Ver informacoes do projeto
echo   7. Configurar/trocar a apiKey manualmente
echo   8. Buscar apiKey automaticamente do Firebase
echo   9. Resetar configuracao desta pasta
echo   10. Sair
echo.
set "OPCAO="
set /p OPCAO="  Escolha uma opcao: "

if "%OPCAO%"=="1" goto DEPLOY
if "%OPCAO%"=="2" goto PARAR_SITE
if "%OPCAO%"=="3" goto TROCAR_PASTA
if "%OPCAO%"=="4" goto TROCAR_PROJETO
if "%OPCAO%"=="5" goto CRIAR_PROJETO
if "%OPCAO%"=="6" goto VER_INFO
if "%OPCAO%"=="7" goto CONFIG_KEY
if "%OPCAO%"=="8" goto BUSCA_KEY
if "%OPCAO%"=="9" goto RESETAR
if "%OPCAO%"=="10" goto FIM
echo   Opcao invalida.
pause
goto MENU

REM ===========================================================
REM Status resumido mostrado no topo do menu
REM ===========================================================
:MOSTRA_STATUS
set "PROJ_MOSTRA=nenhum"
if exist ".firebaserc" (
    for /f "tokens=2 delims=:}" %%P in ('findstr /c:"default" .firebaserc') do set "PROJ_MOSTRA=%%P"
    set "PROJ_MOSTRA=!PROJ_MOSTRA:"=!"
    set "PROJ_MOSTRA=!PROJ_MOSTRA: =!"
)
set "PASTA_MOSTRA=nao configurada"
if exist "firebase.json" (
    for /f "tokens=2 delims=:," %%P in ('findstr /c:"\"public\"" firebase.json') do set "PASTA_MOSTRA=%%P"
    set "PASTA_MOSTRA=!PASTA_MOSTRA:"=!"
    set "PASTA_MOSTRA=!PASTA_MOSTRA: =!"
)
echo   Projeto atual : !PROJ_MOSTRA!
echo   Pasta atual   : !PASTA_MOSTRA!
exit /b 0

REM ===========================================================
REM 1) DEPLOY COMPLETO
REM ===========================================================
:DEPLOY
cls
echo ================================================
echo   PUBLICAR - Deploy
echo ================================================
echo.

echo [1/6] Verificando login do Firebase...
set "CONTA_ATUAL="
for /f "usebackq delims=" %%A in (`firebase login:list 2^>nul ^| findstr /r "^\[.*@.*\]$\|@.*\.com"`) do set "CONTA_ATUAL=%%A"

if defined CONTA_ATUAL (
    echo   - Logado como: !CONTA_ATUAL!
    choice /c SN /m "  Essa e a conta correta"
    if errorlevel 2 (
        call firebase logout >> "%LOG%" 2>&1
        call firebase login
        if errorlevel 1 (
            echo   [ERRO] Falha no login.
            pause
            goto MENU
        )
    )
) else (
    echo   - Nenhuma conta logada. Abrindo login...
    call firebase login
    if errorlevel 1 (
        echo   [ERRO] Falha no login.
        pause
        goto MENU
    )
)

echo.
echo [2/6] Selecionando projeto Firebase...
call :GARANTE_PROJETO
if not defined PROJETO_ID_ATUAL (
    echo   [ERRO] Nenhum projeto selecionado.
    pause
    goto MENU
)

echo.
echo [3/6] Verificando build do projeto...
if exist "package.json" (
    findstr /c:"\"build\"" package.json >nul 2>nul
    if not errorlevel 1 (
        choice /c SN /m "  package.json com build detectado. Rodar npm install e npm run build agora"
        if not errorlevel 2 (
            echo   - Instalando dependencias...
            call npm install >> "%LOG%" 2>&1
            echo   - Rodando build...
            call npm run build >> "%LOG%" 2>&1
        )
    )
)

echo.
echo [4/6] Detectando pasta publicavel...
call :DETECTA_PASTA
if not defined PASTA_PUBLIC (
    echo   [ERRO] Nenhum index.html encontrado.
    pause
    goto MENU
)
echo   - Pasta: !PASTA_PUBLIC!

echo.
echo [5/6] Configurando apiKey...
call :INJETA_KEY

echo.
echo [6/6] Publicando no Firebase Hosting...
echo   ------------------------------------------
call firebase deploy --only hosting
set "DEPLOY_ERR=%errorlevel%"
echo   ------------------------------------------

if not "%DEPLOY_ERR%"=="0" (
    echo.
    echo   [ERRO] O deploy falhou. Veja "%LOG%" para detalhes.
    echo Deploy FALHOU em %date% %time% >> "%LOG%"
    pause
    goto MENU
)

echo.
echo   PUBLICADO COM SUCESSO! Fe nelas.
echo   Dica: use Ctrl+Shift+R no navegador se ver a versao antiga.
echo Deploy OK em %date% %time% >> "%LOG%"
pause
goto MENU

REM ===========================================================
REM 2) PARAR O SITE - desativar hosting
REM ===========================================================
:PARAR_SITE
cls
echo ================================================
echo   PARAR O SITE
echo ================================================
echo.
if not exist ".firebaserc" (
    echo   Nenhum projeto configurado nesta pasta ainda.
    pause
    goto MENU
)
echo   Isso vai DESATIVAR o site publicado no Firebase Hosting.
echo   O site para de responder ate voce publicar de novo.
echo.
choice /c SN /m "  Tem certeza que deseja parar o site"
if errorlevel 2 goto MENU

echo.
echo   Parando o site...
call firebase hosting:disable --force
if errorlevel 1 (
    echo   [ERRO] Nao foi possivel parar o site. Veja mensagens acima.
    pause
    goto MENU
)
echo.
echo   Site desativado com sucesso.
echo Site desativado em %date% %time% >> "%LOG%"
pause
goto MENU

REM ===========================================================
REM 3) TROCAR A PASTA PUBLICADA
REM ===========================================================
:TROCAR_PASTA
cls
echo ================================================
echo   TROCAR PASTA PUBLICADA
echo ================================================
echo.
call :DETECTA_PASTA
if not defined PASTA_PUBLIC (
    echo   [ERRO] Nenhum index.html encontrado nesta pasta ou subpastas.
    pause
    goto MENU
)
echo   Pasta selecionada: !PASTA_PUBLIC!
call :ESCREVE_FIREBASE_JSON
echo   firebase.json atualizado.
echo Pasta trocada para !PASTA_PUBLIC! em %date% %time% >> "%LOG%"
pause
goto MENU

REM ===========================================================
REM 4) TROCAR DE PROJETO FIREBASE
REM ===========================================================
:TROCAR_PROJETO
cls
echo ================================================
echo   TROCAR PROJETO FIREBASE
echo ================================================
echo.
set "FORCA_TROCA=1"
call :GARANTE_PROJETO
pause
goto MENU

REM ===========================================================
REM 5) CRIAR NOVO PROJETO FIREBASE
REM ===========================================================
:CRIAR_PROJETO
cls
echo ================================================
echo   CRIAR NOVO PROJETO FIREBASE
echo ================================================
echo.
echo   Regras do ID do projeto:
echo     - Somente letras minusculas, numeros e hifen
echo     - Precisa comecar com uma letra
echo     - Entre 6 e 30 caracteres
echo     - Precisa ser unico em todo o Firebase mundial
echo.
set "NOVO_ID="
set /p NOVO_ID="  Digite o ID do novo projeto: "
if not defined NOVO_ID (
    echo   [ERRO] Nenhum ID informado.
    pause
    goto MENU
)

set "NOVO_NOME="
set /p NOVO_NOME="  Nome de exibicao do projeto, Enter para usar o mesmo ID: "
if not defined NOVO_NOME set "NOVO_NOME=!NOVO_ID!"

echo.
echo   Vai criar o projeto:
echo     ID   : !NOVO_ID!
echo     Nome : !NOVO_NOME!
echo.
choice /c SN /m "  Confirma a criacao"
if errorlevel 2 goto MENU

echo.
echo   Criando projeto no Firebase, aguarde...
call firebase projects:create "!NOVO_ID!" --display-name "!NOVO_NOME!"
if errorlevel 1 (
    echo.
    echo   [ERRO] Nao foi possivel criar o projeto. Veja as mensagens acima.
    echo   Motivos comuns: ID ja em uso por outra pessoa, ou ID fora das regras.
    pause
    goto MENU
)

echo.
echo   Projeto criado com sucesso.
echo Projeto criado: !NOVO_ID! em %date% %time% >> "%LOG%"

choice /c SN /m "  Deseja usar este projeto nesta pasta agora"
if errorlevel 2 goto MENU
(
    echo {
    echo   "projects": {
    echo     "default": "!NOVO_ID!"
    echo   }
    echo }
) > .firebaserc
echo   Projeto "!NOVO_ID!" definido como ativo nesta pasta.

echo.
choice /c SN /m "  Deseja tambem criar um app Web neste projeto agora"
if errorlevel 2 (
    pause
    goto MENU
)
call firebase apps:create WEB "!NOVO_NOME!" --project "!NOVO_ID!"
if errorlevel 1 (
    echo   [ERRO] Nao foi possivel criar o app Web. Voce pode tentar depois manualmente.
) else (
    echo   App Web criado. Use a opcao 8 do menu para buscar a apiKey automaticamente.
)
pause
goto MENU

REM ===========================================================
REM 6) VER INFORMACOES DO PROJETO
REM ===========================================================
:VER_INFO
cls
echo ================================================
echo   INFORMACOES DO PROJETO
echo ================================================
echo.
call :MOSTRA_STATUS
echo.
if exist "!ARQ_KEY!" (
    echo   apiKey       : configurada
) else (
    echo   apiKey       : nao configurada
)
echo.
if exist ".firebaserc" (
    echo   Sites de hosting deste projeto:
    echo   ------------------------------------------
    call firebase hosting:sites:list
    echo   ------------------------------------------
) else (
    echo   Nenhum projeto vinculado ainda.
)
echo.
pause
goto MENU

REM ===========================================================
REM 7) CONFIGURAR/TROCAR A APIKEY
REM ===========================================================
:CONFIG_KEY
cls
echo ================================================
echo   CONFIGURAR APIKEY
echo ================================================
echo.
call :DETECTA_PASTA
if not defined PASTA_PUBLIC (
    echo   [ERRO] Nenhum index.html encontrado. Configure a pasta primeiro.
    pause
    goto MENU
)
set "FORCA_KEY=1"
call :INJETA_KEY
pause
goto MENU

REM ===========================================================
REM 8) BUSCAR APIKEY AUTOMATICAMENTE DO FIREBASE
REM ===========================================================
:BUSCA_KEY
cls
echo ================================================
echo   BUSCAR APIKEY AUTOMATICAMENTE
echo ================================================
echo.
if not exist ".firebaserc" (
    echo   [ERRO] Nenhum projeto configurado ainda. Use a opcao 4 primeiro.
    pause
    goto MENU
)

echo   Consultando apps deste projeto no Firebase...
set "APPS_JSON=%TEMP%\publicar-apps.json"
call firebase apps:list --json > "!APPS_JSON!" 2>>"%LOG%"

set "QTD_APPID=0"
for /f "tokens=2 delims=:," %%N in ('findstr /c:"\"appId\"" "!APPS_JSON!"') do (
    set /a QTD_APPID+=1
    set "APPID!QTD_APPID!=%%N"
)
set "QTD_PLAT=0"
for /f "tokens=2 delims=:," %%N in ('findstr /c:"\"platform\"" "!APPS_JSON!"') do (
    set /a QTD_PLAT+=1
    set "APPPLAT!QTD_PLAT!=%%N"
)

if "!QTD_APPID!"=="0" (
    echo.
    echo   Nenhum app encontrado neste projeto Firebase.
    echo   Saida bruta recebida, salva em: !APPS_JSON!
    echo   ------------------------------------------
    type "!APPS_JSON!"
    echo   ------------------------------------------
    echo   Se a lista acima estiver vazia de verdade, crie um app Web com:
    echo     firebase apps:create WEB nome-do-app
    pause
    goto MENU
)

set "QTD_WEB=0"
for /l %%K in (1,1,!QTD_APPID!) do (
    call set "TMPPLAT=%%APPPLAT%%K%%"
    set "TMPPLAT=!TMPPLAT:"=!"
    set "TMPPLAT=!TMPPLAT: =!"
    if "!TMPPLAT!"=="WEB" (
        set /a QTD_WEB+=1
        call set "TMPID=%%APPID%%K%%"
        set "TMPID=!TMPID:"=!"
        set "TMPID=!TMPID: =!"
        call set "WEBID!QTD_WEB!=!TMPID!"
    )
)

if "!QTD_WEB!"=="0" (
    echo.
    echo   Nenhum app do tipo Web encontrado neste projeto.
    echo   Crie um com:
    echo     firebase apps:create WEB nome-do-app
    pause
    goto MENU
)

set "APPID_ESCOLHIDO="
if "!QTD_WEB!"=="1" (
    set "APPID_ESCOLHIDO=!WEBID1!"
    echo   - Unico app Web encontrado - selecionando automaticamente.
) else (
    echo.
    echo   Apps Web encontrados neste projeto:
    echo   ------------------------------------------
    for /l %%K in (1,1,!QTD_WEB!) do (
        call set "MOSTRA=%%WEBID%%K%%"
        echo   %%K^) !MOSTRA!
    )
    echo   ------------------------------------------
    echo.
    set "ESCOLHA_APP="
    set /p ESCOLHA_APP="  Digite o numero do app desejado: "
    call set "APPID_ESCOLHIDO=%%WEBID!ESCOLHA_APP!%%"
)

if not defined APPID_ESCOLHIDO (
    echo   [ERRO] Selecao invalida.
    pause
    goto MENU
)

echo.
echo   Buscando a configuracao do app...
set "SDK_OUT=%TEMP%\publicar-sdkconfig.json"
call firebase apps:sdkconfig WEB "!APPID_ESCOLHIDO!" --json > "!SDK_OUT!" 2>>"%LOG%"

set "API_KEY_ENCONTRADA="
for /f "tokens=2 delims=:," %%N in ('findstr /c:"\"apiKey\"" "!SDK_OUT!"') do set "API_KEY_ENCONTRADA=%%N"
set "API_KEY_ENCONTRADA=!API_KEY_ENCONTRADA:"=!"
set "API_KEY_ENCONTRADA=!API_KEY_ENCONTRADA: =!"

if not defined API_KEY_ENCONTRADA (
    echo   [ERRO] Nao foi possivel extrair a apiKey automaticamente.
    echo   Saida bruta recebida do Firebase, salva em: !SDK_OUT!
    echo   ------------------------------------------
    type "!SDK_OUT!"
    echo   ------------------------------------------
    pause
    goto MENU
)

echo.
echo   apiKey encontrada:
echo   !API_KEY_ENCONTRADA!
echo.
choice /c SN /m "  Deseja salvar essa key para uso automatico no proximo deploy"
if not errorlevel 2 (
    >"!ARQ_KEY!" echo !API_KEY_ENCONTRADA!
    echo   Salva em !ARQ_KEY!.
)
pause
goto MENU

REM ===========================================================
REM 9) RESETAR CONFIGURACAO DESTA PASTA
REM ===========================================================
:RESETAR
cls
echo ================================================
echo   RESETAR CONFIGURACAO
echo ================================================
echo.
echo   Isso vai apagar, se existirem, nesta pasta:
echo     - .firebaserc
echo     - firebase.json
echo     - firebase-key.txt
echo     - publicar-log.txt
echo.
echo   Os arquivos do SEU SITE nao serao apagados.
echo.
choice /c SN /m "  Confirma o reset"
if errorlevel 2 goto MENU

if exist ".firebaserc" del /q ".firebaserc"
if exist "firebase.json" del /q "firebase.json"
if exist "!ARQ_KEY!" del /q "!ARQ_KEY!"
echo   Configuracao resetada.
if exist "!LOG!" del /q "!LOG!"
pause
goto MENU

REM ===========================================================
REM SUBROTINA: garante que existe um projeto selecionado
REM Usa variavel FORCA_TROCA=1 para forcar nova escolha mesmo
REM se ja houver .firebaserc
REM ===========================================================
:GARANTE_PROJETO
set "PROJETO_ID_ATUAL="
if exist ".firebaserc" (
    for /f "tokens=2 delims=:}" %%P in ('findstr /c:"default" .firebaserc') do set "PROJETO_ID_ATUAL=%%P"
    set "PROJETO_ID_ATUAL=!PROJETO_ID_ATUAL:"=!"
    set "PROJETO_ID_ATUAL=!PROJETO_ID_ATUAL: =!"
)

set "PRECISA_ESCOLHER=0"
if not defined PROJETO_ID_ATUAL set "PRECISA_ESCOLHER=1"
if defined FORCA_TROCA set "PRECISA_ESCOLHER=1"

if defined PROJETO_ID_ATUAL if not defined FORCA_TROCA (
    echo   - Projeto atual: !PROJETO_ID_ATUAL!
    choice /c SN /m "  Deseja trocar de projeto"
    if not errorlevel 2 set "PRECISA_ESCOLHER=1"
    if errorlevel 2 set "PRECISA_ESCOLHER=0"
)
set "FORCA_TROCA="

if "!PRECISA_ESCOLHER!"=="0" exit /b 0

echo.
echo   Consultando projetos da sua conta...
set "PROJ_JSON=%TEMP%\publicar-projects.json"
call firebase projects:list --json > "!PROJ_JSON!" 2>>"%LOG%"

set "QTD_PROJ=0"
for /f %%N in ('findstr /c:"\"projectId\"" "!PROJ_JSON!" ^| find /c /v ""') do set "QTD_PROJ=%%N"

if "!QTD_PROJ!"=="1" (
    for /f "tokens=2 delims=:," %%N in ('findstr /c:"\"projectId\"" "!PROJ_JSON!"') do set "PROJETO_ID_ATUAL=%%N"
    set "PROJETO_ID_ATUAL=!PROJETO_ID_ATUAL:"=!"
    set "PROJETO_ID_ATUAL=!PROJETO_ID_ATUAL: =!"
    echo   - Unico projeto encontrado: !PROJETO_ID_ATUAL! - selecionando automaticamente.
) else (
    set "QTD_PJ=0"
    for /f "tokens=2 delims=:," %%N in ('findstr /c:"\"projectId\"" "!PROJ_JSON!"') do (
        set /a QTD_PJ+=1
        set "PJID!QTD_PJ!=%%N"
    )
    set "QTD_NM=0"
    for /f "tokens=2 delims=:," %%N in ('findstr /c:"\"displayName\"" "!PROJ_JSON!"') do (
        set /a QTD_NM+=1
        set "PJNAME!QTD_NM!=%%N"
    )
    echo.
    echo   Projetos disponiveis na sua conta:
    echo   ------------------------------------------
    for /l %%K in (1,1,!QTD_PJ!) do (
        call set "TMPID=%%PJID%%K%%"
        set "TMPID=!TMPID:"=!"
        set "TMPID=!TMPID: =!"
        call set "TMPNAME=%%PJNAME%%K%%"
        set "TMPNAME=!TMPNAME:"=!"
        set "TMPNAME=!TMPNAME: =!"
        set "PJID%%K=!TMPID!"
        echo   %%K^) !TMPNAME! - ID: !TMPID!
    )
    echo   ------------------------------------------
    echo.
    set "ESCOLHA_PJ="
    set /p ESCOLHA_PJ="  Digite o numero do projeto desejado: "
    call set "PROJETO_ID_ATUAL=%%PJID!ESCOLHA_PJ!%%"
)

if not defined PROJETO_ID_ATUAL exit /b 1

(
    echo {
    echo   "projects": {
    echo     "default": "!PROJETO_ID_ATUAL!"
    echo   }
    echo }
) > .firebaserc
echo   - Projeto salvo: !PROJETO_ID_ATUAL!
echo Projeto selecionado: !PROJETO_ID_ATUAL! >> "%LOG%"
exit /b 0

REM ===========================================================
REM SUBROTINA: detecta pasta com index.html
REM Prioriza raiz, depois dist/build/out/public, depois busca geral
REM Se houver mais de uma opcao na busca geral, deixa escolher
REM ===========================================================
:DETECTA_PASTA
set "PASTA_PUBLIC="

if exist "index.html" (
    set "PASTA_PUBLIC=."
    goto DETECTA_PASTA_FIM
)

for %%P in (dist build out public) do (
    if not defined PASTA_PUBLIC if exist "%%P\index.html" set "PASTA_PUBLIC=%%P"
)
if defined PASTA_PUBLIC goto DETECTA_PASTA_FIM

set "QTD_IDX=0"
for /f "delims=" %%F in ('dir /s /b index.html 2^>nul ^| findstr /v /i "node_modules \.git"') do (
    set /a QTD_IDX+=1
    set "IDX!QTD_IDX!=%%F"
)

if "!QTD_IDX!"=="0" goto DETECTA_PASTA_FIM

if "!QTD_IDX!"=="1" (
    for %%D in ("!IDX1!") do set "PASTA_ABS=%%~dpD"
    set "PASTA_PUBLIC=!PASTA_ABS:%cd%\=!"
    if "!PASTA_PUBLIC:~-1!"=="\" set "PASTA_PUBLIC=!PASTA_PUBLIC:~0,-1!"
    set "PASTA_PUBLIC=!PASTA_PUBLIC:\=/!"
    goto DETECTA_PASTA_FIM
)

echo   Foram encontradas !QTD_IDX! pastas com index.html:
echo   ------------------------------------------
for /l %%K in (1,1,!QTD_IDX!) do (
    call set "ITEM=%%IDX%%K%%"
    for %%D in ("!ITEM!") do set "ITEM_ABS=%%~dpD"
    set "ITEM_REL=!ITEM_ABS:%cd%\=!"
    if "!ITEM_REL:~-1!"=="\" set "ITEM_REL=!ITEM_REL:~0,-1!"
    echo   %%K^) !ITEM_REL!
)
echo   ------------------------------------------
set "ESCOLHA_PASTA="
set /p ESCOLHA_PASTA="  Digite o numero da pasta desejada: "
call set "ITEM_ESCOLHIDO=%%IDX!ESCOLHA_PASTA!%%"
if not defined ITEM_ESCOLHIDO goto DETECTA_PASTA_FIM
for %%D in ("!ITEM_ESCOLHIDO!") do set "PASTA_ABS=%%~dpD"
set "PASTA_PUBLIC=!PASTA_ABS:%cd%\=!"
if "!PASTA_PUBLIC:~-1!"=="\" set "PASTA_PUBLIC=!PASTA_PUBLIC:~0,-1!"
set "PASTA_PUBLIC=!PASTA_PUBLIC:\=/!"

:DETECTA_PASTA_FIM
if defined PASTA_PUBLIC call :ESCREVE_FIREBASE_JSON
exit /b 0

REM ===========================================================
REM SUBROTINA: escreve firebase.json com a pasta atual + 404.html
REM ===========================================================
:ESCREVE_FIREBASE_JSON
(
    echo {
    echo   "hosting": {
    echo     "public": "!PASTA_PUBLIC!",
    echo     "cleanUrls": true,
    echo     "ignore": [
    echo       "firebase.json",
    echo       ".firebaserc",
    echo       "firebase-debug.log",
    echo       "firebase-key.txt",
    echo       "publicar-log.txt",
    echo       "node_modules/**",
    echo       "**/.*",
    echo       "rules/**",
    echo       "*.bat"
    echo     ]
    echo   }
    echo }
) > firebase.json

if "!PASTA_PUBLIC!"=="." (
    set "CAMINHO_404=404.html"
) else (
    set "CAMINHO_404=!PASTA_PUBLIC!/404.html"
)
if not exist "!CAMINHO_404!" (
    (
        echo ^<!DOCTYPE html^>
        echo ^<html lang="pt-BR"^>^<head^>^<meta charset="UTF-8"^>
        echo ^<title^>Pagina nao encontrada^</title^>
        echo ^<style^>body{font-family:sans-serif;background:#0d1117;color:#e6edf3;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}.b{text-align:center}a{color:#58a6ff}^</style^>
        echo ^</head^>^<body^>^<div class="b"^>
        echo ^<h1^>404^</h1^>^<p^>Esta pagina nao existe.^</p^>
        echo ^<p^>^<a href="/"^>Voltar para o inicio^</a^>^</p^>
        echo ^</div^>^</body^>^</html^>
    ) > "!CAMINHO_404!"
)
exit /b 0

REM ===========================================================
REM SUBROTINA: pergunta/injeta a apiKey no index.html da pasta
REM ===========================================================
:INJETA_KEY
if "!PASTA_PUBLIC!"=="." (
    set "CAMINHO_INDEX=index.html"
) else (
    set "CAMINHO_INDEX=!PASTA_PUBLIC!/index.html"
)

set "API_KEY="
if exist "!ARQ_KEY!" (
    set /p API_KEY=<"!ARQ_KEY!"
    echo   - apiKey salva encontrada.
    choice /c SN /m "  Deseja trocar a apiKey salva"
    if not errorlevel 2 (
        set /p API_KEY="  Cole a nova apiKey: "
        >"!ARQ_KEY!" echo !API_KEY!
    )
) else (
    choice /c SN /m "  Deseja configurar a apiKey agora"
    if not errorlevel 2 (
        set /p API_KEY="  Cole a apiKey do Firebase: "
        >"!ARQ_KEY!" echo !API_KEY!
    )
)

if not defined API_KEY exit /b 0
if not exist "!CAMINHO_INDEX!" exit /b 0

findstr /c:"!PLACEHOLDER!" "!CAMINHO_INDEX!" >nul 2>nul
if errorlevel 1 exit /b 0

echo   - Injetando apiKey em !CAMINHO_INDEX!...
powershell -NoProfile -Command ^
    "$c = Get-Content -Raw -Encoding UTF8 '!CAMINHO_INDEX!'; $c = $c -replace '!PLACEHOLDER!', '!API_KEY!'; [System.IO.File]::WriteAllText('!CAMINHO_INDEX!', $c, [System.Text.Encoding]::UTF8)"
exit /b 0

:FIM
echo.
echo   Ate mais! Fe nelas.
echo.
exit /b 0
