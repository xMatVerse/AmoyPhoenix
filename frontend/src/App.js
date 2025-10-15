import { useEffect, useState } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import EthCard from "@/components/EthCard";
import PolygonCard from "@/components/PolygonCard";
import EmergentAgentCard from "@/components/EmergentAgentCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Activity, Shield, Hexagon, Cpu } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_BASE = BACKEND_URL ? `${BACKEND_URL}/api` : "/api";

// Default contract address (PoSELedger on Polygon Amoy)
const DEFAULT_ADDRESS = "0xC5c39D1f465cf664dcE5F3745836597CEe4EA028";

const Dashboard = () => {
  const [address, setAddress] = useState(DEFAULT_ADDRESS);
  const [inputValue, setInputValue] = useState(DEFAULT_ADDRESS);
  const [systemHealth, setSystemHealth] = useState({ emergent: { status: "checking" } });

  useEffect(() => {
    let isMounted = true;

    const loadHealth = async () => {
      try {
        const [apiResponse, emergentResponse] = await Promise.allSettled([
          axios.get(`${API_BASE}/`),
          axios.get(`${API_BASE}/emergent/health`)
        ]);

        if (!isMounted) return;

        setSystemHealth({
          api: apiResponse.status === "fulfilled"
            ? { status: "healthy", message: apiResponse.value.data.message }
            : { status: "unhealthy", message: apiResponse.reason?.message },
          emergent: emergentResponse.status === "fulfilled"
            ? emergentResponse.value.data
            : { status: "unhealthy", message: emergentResponse.reason?.message }
        });
      } catch (error) {
        if (!isMounted) return;
        setSystemHealth((prev) => ({
          ...prev,
          emergent: { status: "unhealthy", message: error.message }
        }));
      }
    };

    loadHealth();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSearch = () => {
    const trimmed = inputValue.trim();
    if (trimmed.length !== 42 || !trimmed.startsWith("0x")) {
      alert("Por favor, insira um endereço Ethereum válido (0x...)");
      return;
    }
    setAddress(trimmed);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSearch();
    }
  };

  const isDefaultAddress = address.toLowerCase() === DEFAULT_ADDRESS.toLowerCase();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <header className="border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 md:flex-row md:items-center md:justify-between">
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center gap-3 md:justify-start">
              <Shield className="h-9 w-9 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Emergent Dashboard</h1>
                <p className="text-sm text-gray-500">
                  Monitoramento unificado Ethereum, Polygon Amoy e Emergent Agent
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center gap-2 text-sm md:items-end">
            <span
              className={`rounded-full px-3 py-1 ${
                systemHealth.api?.status === "healthy"
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              API: {systemHealth.api?.status || "checking"}
            </span>
            <span
              className={`rounded-full px-3 py-1 ${
                systemHealth.emergent?.status === "healthy"
                  ? "bg-green-100 text-green-700"
                  : "bg-yellow-100 text-yellow-700"
              }`}
            >
              Emergent Agent: {systemHealth.emergent?.status || "checking"}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>🔍 Consulta de Endereço Blockchain</CardTitle>
            <CardDescription>
              Digite qualquer endereço EVM (0x...) para visualizar saldo e transações nas redes disponíveis.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3 md:flex-row">
              <Input
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="0x..."
                className="font-mono text-lg"
              />
              <Button onClick={handleSearch} className="md:w-auto">
                <Search className="mr-2 h-4 w-4" /> Buscar
              </Button>
            </div>
            <p className="mt-3 text-xs text-gray-500">
              {isDefaultAddress
                ? `Monitorando contrato PoSELedger: ${DEFAULT_ADDRESS}`
                : `Consultando endereço: ${address}`}
            </p>
          </CardContent>
        </Card>

        <Tabs defaultValue="emergent" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="emergent" className="flex items-center gap-2">
              <Cpu className="h-4 w-4" /> Emergent Agent
            </TabsTrigger>
            <TabsTrigger value="ethereum" className="flex items-center gap-2">
              <Activity className="h-4 w-4" /> Ethereum
            </TabsTrigger>
            <TabsTrigger value="polygon" className="flex items-center gap-2">
              <Hexagon className="h-4 w-4" /> Polygon Amoy
            </TabsTrigger>
          </TabsList>

          <TabsContent value="emergent" className="mt-6 space-y-4">
            <EmergentAgentCard address={address} />
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Sobre o Emergent Agent</CardTitle>
                <CardDescription>
                  Serviço proxy resiliente para consultas Etherscan, fornecendo redundância e resiliência.
                </CardDescription>
              </CardHeader>
            </Card>
          </TabsContent>

          <TabsContent value="ethereum" className="mt-6">
            <EthCard
              address={address}
              title={isDefaultAddress ? "PoSELedger (Ethereum)" : "Ethereum Address"}
            />
          </TabsContent>

          <TabsContent value="polygon" className="mt-6">
            <PolygonCard
              address={address}
              title={isDefaultAddress ? "PoSELedger (Polygon Amoy)" : "Polygon Address"}
            />
          </TabsContent>
        </Tabs>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Cobertura Multirrede</CardTitle>
              <CardDescription>
                Ethereum Mainnet, Polygon Amoy e Emergent Agent trabalhando em conjunto.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Integração Phoenix Forense</CardTitle>
              <CardDescription>
                Webhooks e ancoragem prontos para ingestão e auditoria de evidências.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Monitoramento Contínuo</CardTitle>
              <CardDescription>
                Indicadores de saúde automáticos e consulta redundante para alta disponibilidade.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </main>

      <footer className="mt-10 border-t bg-white py-6">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-gray-500">
          Emergent Dashboard • Phoenix Forense • PoSELedger • {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
