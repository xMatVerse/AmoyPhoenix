# 🚀 Emergent Dashboard - Sistema de Monitoramento Blockchain

Sistema unificado de monitoramento e análise blockchain desenvolvido com FastAPI + React, integrando Ethereum, Polygon e funcionalidades forenses via **Etherscan API V2**.

## 🎯 Visão Geral

O **Emergent Dashboard** é uma plataforma completa para monitoramento de redes blockchain, análise forense digital e gestão de casos investigativos. Desenvolvido para integração com sistemas existentes como Phoenix Forense e PoSELedger.

## ✨ Funcionalidades Principais

### 🔗 Monitoramento Blockchain Multi-Rede
- **Ethereum Mainnet**: Saldos e transações em tempo real
- **Polygon (Amoy/Mainnet)**: Monitoramento com conversão USD
- **Contratos Inteligentes**: Integração com PoSELedger
- **APIs Unificadas**: Etherscan API V2 para todas as redes
- **Emergent Agent**: Proxy resiliente para consultas

### 🕵️ Análise Forense Integrada
- **Phoenix Forense**: Intake automático de evidências
- **Score Phoenix**: Métricas de integridade (MI, P_sus, Dt, I)
- **Cadeia de Custódia**: Registro imutável via blockchain
- **Laudos Automatizados**: Geração de relatórios forenses

### 📊 Dashboard Unificado
- **Interface Moderna**: React com componentes shadcn/ui
- **Tabs Inteligentes**: Alternância entre Ethereum/Polygon/Emergent
- **Busca Universal**: Qualquer endereço em qualquer rede
- **Health Checks**: Monitoramento em tempo real dos serviços

## 🏗️ Arquitetura do Sistema

```
Emergent Dashboard/
├── 🐍 Backend (FastAPI)
│   ├── /api/eth/*          # Endpoints Ethereum
│   ├── /api/polygon/*      # Endpoints Polygon (Etherscan V2)
│   ├── /api/emergent/*     # Proxy Emergent Agent
│   ├── /api/forensic/*     # Integração Phoenix Forense
│   └── /services/          # Serviços modulares
│       ├── emergent_agent.py
│       └── pricing.py
├── ⚛️ Frontend (React)
│   ├── EthCard.jsx         # Componente Ethereum
│   ├── PolygonCard.jsx     # Componente Polygon
│   ├── EmergentAgentCard.jsx # Componente Emergent
│   └── Dashboard.jsx       # Página principal
└── 🔗 Integrações
    ├── PoSELedger Contract (0xC5c39D1f465cf664dcE5F3745836597CEe4EA028)
    ├── Phoenix Forense (Base44)
    └── Etherscan API V2
```

## 🚀 Começando Rápido

### Pré-requisitos
- Docker & Docker Compose
- **API Key**: [Etherscan](https://etherscan.io/apis) (suporta Ethereum + Polygon)

### Instalação

1. **Clone e Configure**
   ```bash
   git clone <repository>
   cd emergent-dashboard
   cp .env.example .env
   ```

2. **Configure a API Key (ÚNICA)**
   ```env
   # APENAS ESTA API KEY É NECESSÁRIA
   ETHERSCAN_API_KEY=sua_chave_etherscan_aqui

   # URLs do backend
   BACKEND_URL=http://localhost:8000
   REACT_APP_BACKEND_URL=http://localhost:8000

   # Emergent Agent
   EMERGENT_AGENT_URL=https://etherscan-query.preview.emergentagent.com
   ```

3. **Execute com Docker**
   ```bash
   docker-compose up -d --build
   ```

4. **Acesse o Dashboard**
   ```
   http://localhost:3000
   ```

## 🔧 Configuração de Produção

### Variáveis de Ambiente
```env
# Blockchain (Etherscan API V2 - Suporta múltiplas redes)
ETHERSCAN_API_KEY=obrigatória

# Banco de Dados
MONGO_URL=mongodb://mongo:27017
DB_NAME=emergent_dashboard

# Segurança
PHOENIX_WEBHOOK_SECRET=change-me-in-production

# CORS
CORS_ORIGINS=http://localhost:3000,https://seu-dominio.com

# URLs de Serviço
BACKEND_URL=http://localhost:8000
REACT_APP_BACKEND_URL=http://localhost:8000
EMERGENT_AGENT_URL=https://etherscan-query.preview.emergentagent.com
```

### Endpoints Principais

| Rota | Método | Descrição |
|------|--------|-----------|
| `/api/eth/balance/{address}` | GET | Saldo Ethereum (Etherscan V2) |
| `/api/polygon/balance/{address}` | GET | Saldo Polygon (Etherscan V2) |
| `/api/emergent/etherscan/balance/{address}` | GET | Saldo via Emergent Agent |
| `/api/emergent/health` | GET | Saúde do Emergent Agent |
| `/api/webhook/phoenix` | POST | Webhook Phoenix Forense |

## 🎯 Casos de Uso

### 1. Monitoramento de Contratos
```javascript
// Contrato PoSELedger padrão
const DEFAULT_CONTRACT = "0xC5c39D1f465cf664dcE5F3745836597CEe4EA028";

// Monitoramento multi-rede com mesma API Key
const endpoints = [
  `/api/eth/balance/${DEFAULT_CONTRACT}`,
  `/api/polygon/balance/${DEFAULT_CONTRACT}`,
  `/api/emergent/etherscan/balance/${DEFAULT_CONTRACT}`
];
```

### 2. Análise Forense Digital
```python
# Fluxo completo de evidência
evidence → phoenix_analysis → blockchain_anchor → forensic_report

# Webhook automático
@app.post("/api/webhook/phoenix-case")
async def phoenix_webhook(case_data: dict):
    evidence = await process_phoenix_evidence(case_data)
    tx_hash = await anchor_to_poseledger(evidence.hash)
    return {"case_id": case_data.id, "ledger_proof": tx_hash}
```

### 3. Dashboard Empresarial
- Monitoramento de múltiplas wallets em diferentes redes
- Health checks automáticos de todos os serviços
- Consultas redundantes (Etherscan + Emergent Agent)
- Analytics de blockchain em tempo real

## 🔍 Integração com Sistemas Existentes

### PoSELedger Blockchain
```python
# Conexão com contrato existente na Polygon Amoy
contract = connect_to_poseledger(
    address="0xC5c39D1f465cf664dcE5F3745836597CEe4EA028",
    abi=POSELEDGER_ABI
)
```

### Arquitetura de Preços
```python
# Conversões automáticas multi-moeda
from services.pricing import (
    get_eth_price_usd,           # Preço ETH/USD
    get_matic_price_usd,         # Preço MATIC/USD  
    estimate_usd_from_wei,       # Wei → ETH → USD
    estimate_usd_from_matic_wei  # Wei → MATIC → USD
)
```

## 📈 Métricas e Monitoramento

### Health Checks Automáticos
```json
{
  "api": {"status": "healthy", "message": "API operacional"},
  "emergent": {"status": "healthy", "message": "Emergent Agent operacional"},
  "timestamp": "2024-10-15T14:30:00Z"
}
```

### Status do Sistema
```json
{
  "frontend": "operational",
  "backend": "operational", 
  "blockchain_apis": {
    "etherscan": "connected",
    "polygonscan": "connected_via_etherscan",
    "emergent_agent": "connected"
  },
  "database": "connected",
  "last_health_check": "2024-10-15T14:30:00Z"
}
```

## 🛠️ Desenvolvimento

### Estrutura de Desenvolvimento
```bash
./backend/
├── app/
│   ├── server.py           # Aplicação FastAPI principal
│   ├── services/           # Serviços modulares
│   │   ├── emergent_agent.py
│   │   └── pricing.py
│   └── __init__.py
./frontend/
├── src/
│   ├── components/         # Componentes React
│   │   ├── EthCard.jsx
│   │   ├── PolygonCard.jsx
│   │   └── EmergentAgentCard.jsx
│   └── App.js             # Aplicação principal
./docker-compose.yml        # Orquestração
./README.md                 # Documentação
```

### Comandos Úteis
```bash
# Desenvolvimento
docker-compose up -d
docker-compose logs -f backend

# Produção
docker-compose -f docker-compose.prod.yml up -d

# Testes
docker-compose exec backend pytest

# Health Check
curl http://localhost:8000/api/emergent/health

# Teste de endpoints
curl http://localhost:8000/api/eth/balance/0x1e20DD5aD01155e33EC6AaA72D1D8d7A4e2c6BE6
curl http://localhost:8000/api/polygon/balance/0xC5c39D1f465cf664dcE5F3745836597CEe4EA028
```

## 🔄 Migração de PolygonScan para Etherscan V2

### O Que Mudou
- ✅ **API Key Única**: Apenas `ETHERSCAN_API_KEY` necessária
- ✅ **Endpoints Unificados**: Mesma API para Ethereum e Polygon
- ✅ **PolygonScan Descontinuado**: Substituído por `api.polygonscan.com`
- ✅ **Métodos Preservados**: Todos os endpoints mantêm compatibilidade

### Benefícios
- **Simplificação**: Uma única API Key para todas as redes
- **Consistência**: Métodos e respostas padronizados
- **Manutenção**: Documentação e suporte unificados
- **Performance**: Infraestrutura otimizada do Etherscan

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Distribuído sob a MIT License. Veja `LICENSE` para mais informações.

## 🆘 Suporte

- **Documentação API**: [/docs](http://localhost:8000/docs) (Swagger UI)
- **Health Checks**: [/api/emergent/health](http://localhost:8000/api/emergent/health)
- **Dashboard**: [http://localhost:3000](http://localhost:3000)

---

**Desenvolvido com ❤️ para a comunidade blockchain e forense digital**

```
STATUS: ✅ PRODUCTION READY  
VERSION: 2.0.0
ETHERSCAN_API: V2
LAST UPDATE: 2024-10-15
MIGRATION: ✅ PolygonScan → Etherscan V2
```

---

## 🚨 Notas de Migração

### Para Usuários Existentes
Se você estava usando a versão anterior com `POLYGONSCAN_API_KEY`:

1. **Remova** `POLYGONSCAN_API_KEY` do seu `.env`
2. **Mantenha apenas** `ETHERSCAN_API_KEY`
3. **Reinicie** os serviços: `docker-compose restart`

### Para Novos Usuários
1. Obtenha uma API Key em [Etherscan](https://etherscan.io/apis)
2. Configure apenas `ETHERSCAN_API_KEY` no `.env`
3. Execute `docker-compose up -d`

O sistema agora usa **Etherscan API V2** para todas as consultas blockchain! 🎯
