#!/usr/bin/env python3
"""Local read-only League status companion for the 1nunt website (Windows)."""
import base64, json, os, ssl, time, threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError

HOST, PORT = '127.0.0.1', 8788
CTX = ssl._create_unverified_context()  # Riot local client uses a self-signed certificate.

def find_lockfile():
    explicit = os.environ.get('LEAGUE_LOCKFILE')
    candidates = [Path(explicit)] if explicit else []
    for root in [os.environ.get('PROGRAMFILES'), os.environ.get('PROGRAMFILES(X86)'), 'C:/Riot Games']:
        if root:
            candidates += [Path(root)/'Riot Games/League of Legends/lockfile', Path(root)/'League of Legends/lockfile']
    candidates += [Path('C:/Riot Games/League of Legends/lockfile')]
    for p in candidates:
        try:
            if p.is_file(): return p
        except OSError: pass
    return None

def request_json(url, auth=None, timeout=1.5):
    headers = {'Accept':'application/json'}
    if auth: headers['Authorization'] = 'Basic ' + base64.b64encode(auth.encode()).decode()
    req = Request(url, headers=headers)
    with urlopen(req, timeout=timeout, context=CTX) as response:
        return json.loads(response.read().decode('utf-8'))

_CHAMPION_IDS = None

def champion_name(champion_id):
    global _CHAMPION_IDS
    try:
        if _CHAMPION_IDS is None:
            versions = request_json('https://ddragon.leagueoflegends.com/api/versions.json', timeout=3)
            version = versions[0]
            data = request_json(f'https://ddragon.leagueoflegends.com/cdn/{version}/data/en_US/champion.json', timeout=3)
            _CHAMPION_IDS = {int(v['key']): v['id'] for v in data['data'].values()}
        return _CHAMPION_IDS.get(int(champion_id), '')
    except Exception:
        return ''

def ddragon_champion(champ):
    if not champ: return ''
    return 'https://ddragon.leagueoflegends.com/cdn/15.1.1/img/champion/' + champ.replace(' ', '').replace("'", '') + '.png'

def get_status():
    lock = find_lockfile()
    if not lock:
        return {'status':'offline','message':'Cliente do League não detectado. Abra o LoL e deixe o cliente rodando.'}
    try:
        parts = lock.read_text(errors='ignore').strip().split(':')
        if len(parts) < 5: raise ValueError('lockfile inválido')
        port, password = parts[2], parts[3]
        base = f'https://127.0.0.1:{port}'
        auth = 'riot:' + password
        phase = request_json(base + '/lol-gameflow/v1/gameflow-phase', auth)
        phase = phase if isinstance(phase, str) else str(phase)
        phase_lower = phase.lower()
        if phase_lower in ('champselect', 'championselect'):
            try:
                session = request_json(base + '/lol-champ-select/v1/session', auth)
                me = request_json(base + '/lol-summoner/v1/current-summoner', auth)
                my_puuid = me.get('puuid')
                my_team = session.get('myTeam', [])
                mine = next((p for p in my_team if p.get('puuid') == my_puuid), None)
                champ_id = (mine or {}).get('championId') or (mine or {}).get('championPickIntent') or 0
                champ = champion_name(champ_id) if champ_id else ''
                return {'status':'champselect','match':{'champion': (champ or 'Escolhendo campeão'), 'championImage': ddragon_champion(champ), 'queue':'Seleção de campeão', 'matchup':'Aguardando escolha inimiga', 'runes':[]}}
            except Exception:
                return {'status':'champselect','match':{'champion':'Seleção em andamento','queue':'Seleção de campeão','matchup':'Aguardando escolha inimiga','runes':[]}}
        if phase_lower in ('matchmaking','readycheck'):
            return {'status':'queue','match':{'queue':'Fila / lobby','champion':'—','matchup':'—','runes':[]}}
        if phase_lower == 'inprogress':
            try:
                game = request_json('https://127.0.0.1:2999/liveclientdata/allgamedata', timeout=1.0)
                active = game.get('activePlayer', {})
                players = game.get('allPlayers', [])
                me = next((p for p in players if p.get('summonerName') == active.get('summonerName')), None)
                champ = (me or {}).get('championName') or active.get('championName') or 'Campeão'
                my_team = (me or {}).get('team')
                enemies = [p for p in players if p.get('team') and my_team and p.get('team') != my_team]
                # If there is only one visible enemy, use it; otherwise avoid guessing lane matchup.
                matchup = enemies[0].get('championName','Não disponível') if len(enemies) == 1 else 'Veja os adversários no jogo'
                runes = []
                for rune in ((me or {}).get('runes') or []):
                    if isinstance(rune, dict):
                        runes.append({'name':rune.get('displayName') or rune.get('name') or 'Runa', 'image':rune.get('icon') or ''})
                return {'status':'ingame','match':{'champion':champ,'championImage':ddragon_champion(champ),'queue':(game.get('gameData') or {}).get('gameMode','League of Legends'),'matchup':matchup,'runes':runes}}
            except Exception:
                return {'status':'ingame','match':{'champion':'Em partida','queue':'Partida em andamento','matchup':'Dados detalhados indisponíveis','runes':[]}}
        if phase_lower in ('none','', 'waitingforstats', 'lobby'):
            return {'status':'offline','message':'Sem partida ativa.'}
        return {'status':'offline','message':'Nenhuma partida ativa.', 'phase':phase}
    except (HTTPError, URLError, TimeoutError, ValueError, OSError):
        return {'status':'offline','message':'Cliente do League fechado ou indisponível.'}

REMOTE_STATUS_URL = os.environ.get('LEAGUE_STATUS_PUBLISH_URL', '').strip()
REMOTE_SECRET = os.environ.get('LEAGUE_STATUS_SECRET', '').strip()
def publish_loop():
    while True:
        if REMOTE_STATUS_URL and REMOTE_SECRET:
            try:
                payload = json.dumps(get_status(), ensure_ascii=False).encode('utf-8')
                req = Request(REMOTE_STATUS_URL, data=payload, headers={'Content-Type':'application/json','Authorization':'Bearer '+REMOTE_SECRET}, method='POST')
                with urlopen(req, timeout=5) as response: response.read()
            except Exception as e:
                print('Falha ao publicar status remoto:', e)
        time.sleep(10)

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path.split('?')[0] != '/status':
            self.send_error(404); return
        body = json.dumps(get_status(), ensure_ascii=False).encode()
        self.send_response(200)
        self.send_header('Content-Type','application/json; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin','*')
        self.send_header('Cache-Control','no-store')
        self.send_header('Content-Length',str(len(body)))
        self.end_headers(); self.wfile.write(body)
    def do_OPTIONS(self):
        self.send_response(204); self.send_header('Access-Control-Allow-Origin','*'); self.send_header('Access-Control-Allow-Methods','GET, OPTIONS'); self.send_header('Access-Control-Allow-Headers','Content-Type'); self.end_headers()
    def log_message(self, *_): pass

if __name__ == '__main__':
    if REMOTE_STATUS_URL and REMOTE_SECRET:
        threading.Thread(target=publish_loop, daemon=True).start()
        print('Publicação remota ativada; mantenha este programa aberto.')
    else:
        print('Modo local: configure LEAGUE_STATUS_PUBLISH_URL e LEAGUE_STATUS_SECRET para publicar online.')
    print(f'1nunt League Companion ativo em http://{HOST}:{PORT}/status')
    print('Mantenha esta janela aberta enquanto jogar. Ctrl+C para fechar.')
    ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()
