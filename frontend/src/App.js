import { useEffect, useState } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import EthCard from "@/components/EthCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Activity, Shield } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Default contract address (PoSELedger)
const DEFAULT_ADDRESS = "0xC5c39D1f465cf664dcE5F3745836597CEe4EA028";

const Home = () => {
  const [customAddress, setCustomAddress] = useState("");
  const [searchAddress, setSearchAddress] = useState(DEFAULT_ADDRESS);
  const [apiStatus, setApiStatus] = useState(null);

  const checkApiStatus = async () => {
    try {
      const response = await axios.get(`${API}/`);
      setApiStatus(response.data.message);
    } catch (e) {
      console.error(e, `Error checking API status`);
      setApiStatus("API Unavailable");
    }
  };

  useEffect(() => {
    checkApiStatus();
  }, []);

  const handleSearch = () => {
    if (customAddress.trim()) {
      setSearchAddress(customAddress.trim());
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Ethereum Dashboard
                </h1>
                <p className="text-sm text-gray-500">
                  Monitor addresses & transactions
                </p>
              </div>
            </div>
            {apiStatus && (
              <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg">
                <Activity className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">{apiStatus}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Search Section */}
          <Card>
            <CardHeader>
              <CardTitle>Search Ethereum Address</CardTitle>
              <CardDescription>
                Enter any Ethereum address to view balance and recent transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="0x..."
                  value={customAddress}
                  onChange={(e) => setCustomAddress(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="font-mono"
                />
                <Button onClick={handleSearch}>
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Default PoSELedger Contract */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              PoSELedger Contract Monitor
            </h2>
            <EthCard 
              address={DEFAULT_ADDRESS} 
              title="PoSELedger Contract"
            />
          </div>

          {/* Custom Search Result */}
          {searchAddress !== DEFAULT_ADDRESS && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Search Result
              </h2>
              <EthCard 
                address={searchAddress}
                title="Custom Address"
              />
            </div>
          )}

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Etherscan Integration</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-600">
                  Real-time data from Etherscan API with 30s cache
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Phoenix Forense Ready</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-600">
                  Webhook endpoint available for forensic integration
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">MongoDB Cache</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-600">
                  Offline fallback when API quota exceeded
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 py-6 border-t border-gray-200 bg-white">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500">
          <p>Ethereum Dashboard v1.0 | Powered by Etherscan API</p>
        </div>
      </footer>
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
