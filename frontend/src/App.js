import { useEffect, useState } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import EthCard from "@/components/EthCard";
import PolygonCard from "@/components/PolygonCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Activity, Shield, Hexagon } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_BASE = BACKEND_URL ? `${BACKEND_URL}/api` : "/api";

// Default contract address (PoSELedger on Polygon Amoy)
const DEFAULT_ADDRESS = "0xC5c39D1f465cf664dcE5F3745836597CEe4EA028";

const Dashboard = () => {
  const [address, setAddress] = useState(DEFAULT_ADDRESS);
  const [inputValue, setInputValue] = useState(DEFAULT_ADDRESS);
  const [apiStatus, setApiStatus] = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const checkApiStatus = async () => {
      try {
        setCheckingStatus(true);
        const response = await axios.get(`${API_BASE}/`);
        if (!isMounted) return;
        setApiStatus(response.data.message || "API Available");
      } catch (error) {
        console.error("Error checking API status", error);
        if (!isMounted) return;
        setApiStatus("API Unavailable");
      } finally {
        if (isMounted) {
          setCheckingStatus(false);
        }
      }
    };

    checkApiStatus();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSearch = () => {
    const trimmed = inputValue.trim();
    if (trimmed) {
      setAddress(trimmed);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSearch();
    }
  };

  const isDefaultAddress = address.toLowerCase() === DEFAULT_ADDRESS.toLowerCase();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Emergent Ledger Monitor</h1>
                <p className="text-sm text-gray-500">
                  Unified visibility for Ethereum Mainnet & Polygon Amoy testnet
                </p>
              </div>
            </div>
            {apiStatus && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-green-200 bg-green-50">
                <Activity className="h-4 w-4 text-green-600 animate-pulse" />
                <span className="text-sm font-medium text-green-700">
                  {checkingStatus ? "Checking API..." : apiStatus}
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto flex max-w-5xl flex-col gap-8">
          {/* Address Search */}
          <Card>
            <CardHeader>
              <CardTitle>Inspect a blockchain address</CardTitle>
              <CardDescription>
                Track balances and activity across networks for any EVM compatible address.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <Input
                  value={inputValue}
                  onChange={(event) => setInputValue(event.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="0x..."
                  className="font-mono"
                />
                <Button onClick={handleSearch} className="w-full md:w-auto">
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </Button>
              </div>
              <p className="mt-3 text-xs text-gray-500">
                {isDefaultAddress ? (
                  <>
                    Monitoring PoSELedger contract activity at {DEFAULT_ADDRESS.slice(0, 10)}…
                  </>
                ) : (
                  <>Currently viewing data for {address.slice(0, 10)}…</>
                )}
              </p>
            </CardContent>
          </Card>

          {/* Network Tabs */}
          <Tabs defaultValue="ethereum" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="ethereum" className="flex items-center gap-2">
                <Activity className="h-4 w-4" /> Ethereum
              </TabsTrigger>
              <TabsTrigger value="polygon" className="flex items-center gap-2">
                <Hexagon className="h-4 w-4" /> Polygon Amoy
              </TabsTrigger>
            </TabsList>
            <TabsContent value="ethereum" className="mt-6">
              <EthCard
                address={address}
                title={isDefaultAddress ? "PoSELedger Contract (Ethereum view)" : "Ethereum Address"}
              />
            </TabsContent>
            <TabsContent value="polygon" className="mt-6">
              <PolygonCard
                address={address}
                title={isDefaultAddress ? "PoSELedger Contract (Polygon Amoy)" : "Polygon Address"}
              />
            </TabsContent>
          </Tabs>

          {/* Context Cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Dual-network coverage</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-600">
                  Fetches balances and transactions from Etherscan & PolygonScan simultaneously.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Phoenix Forense ready</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-600">
                  Backend webhook endpoint available for forensic ingest and evidence correlation.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Caching & resilience</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-600">
                  Leverages MongoDB cache to stay responsive even when API quotas are limited.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-gray-200 bg-white py-6">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500">
          <p>Emergent Ledger Monitor v1.1 · Powered by FastAPI & React</p>
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
