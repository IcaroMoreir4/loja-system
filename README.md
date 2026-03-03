# Loja System (Loula Control)

Um sistema completo de gestão de loja focado em pequenos negócios para substituição do caderno físico. Permite gerenciar estoque, vendas diretas, vendas fiado e acompanhar o lucro através de relatórios.

## Arquitetura
- **Frontend**: React Native + Expo (com suporte completo a Web e preparado para PWA). Gerenciamento de estado com Zustand.
- **Backend**: FastAPI com SQLAlchemy.
- **Banco de Dados**: PostgreSQL hospedado no Supabase.

## Como rodar localmente

### 1. Configurar Banco de Dados
- Crie um arquivo `.env` na raiz (baseado no `.env.example`).
- Insira as credenciais `DATABASE_URL`, `SUPABASE_URL` e `SUPABASE_KEY` do seu banco Supabase.

### 2. Rodar o Backend
```bash
cd backend
python -m venv venv
source venv/Scripts/activate # (ou venv\Scripts\activate no Windows)
pip install -r requirements.txt
cp ../.env .env
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Rodar o Frontend
```bash
cd frontend
npm install --legacy-peer-deps
npm run web
```
Acesse `http://localhost:8081` no seu navegador.

## Testes Automatizados

### Backend (Pytest)
```bash
cd backend
source venv/Scripts/activate
pytest -v
```

### Frontend (Jest)
```bash
cd frontend
npm test
```

## Docker (Opcional)
Se possuir o Docker Compose instalado:
```bash
docker compose up -d --build
```
Isso levantará o backend na porta `8000` e o frontend web na porta `8081`.
