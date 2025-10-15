import { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Cpu, ExternalLink } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = BACKEND_URL ? `${BACKEND_URL}/api` : '/api';

const formatAddress = (address) => {
  if (!address) return '';
  return `${address.slice(0, 8)}...${address.slice(-6)}`;
};

const formatCurrency = (value) => {
  if (value === null || value === undefined) return '—';
  return value.toFixed(2);
};

const formatEth = (value) => {
  if (value === null || value === undefined) return '0.0000';
  return value.toFixed(4);
};

const EmergentAgentCard = ({ address }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!address) {
      setData(null);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    axios
      .get(`${API}/emergent/etherscan/balance/${address}`)
      .then((response) => {
        if (!isMounted) return;
        setData(response.data);
      })
      .catch((error) => {
        if (!isMounted) return;
        setData({
          status: 'error',
          error: error.response?.data?.detail || error.message || 'Unknown error',
          address
        });
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [address]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-blue-500" />
            Emergent Agent
          </CardTitle>
          <CardDescription>Consulting Emergent Agent API…</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-24 mt-2" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.status === 'error') {
    return (
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            Emergent Agent
          </CardTitle>
          <CardDescription>Erro ao consultar o Emergent Agent</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600">{data?.error || 'Unknown error'}</p>
          {address && (
            <p className="mt-3 text-xs font-mono text-gray-500">
              Address: {formatAddress(address)}
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cpu className="h-5 w-5 text-blue-500" />
          Emergent Agent
        </CardTitle>
        <CardDescription className="flex items-center gap-2 text-xs text-muted-foreground">
          Consulta alternativa via Emergent Agent API
          {address && (
            <a
              href={`https://etherscan.io/address/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-blue-600 hover:underline"
            >
              {formatAddress(address)}
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-3xl font-bold">{formatEth(data.balance_eth)} ETH</p>
          <p className="text-sm text-gray-500">
            ≈ ${formatCurrency(data.usd_estimate)} USD
          </p>
        </div>
        <p className="text-xs text-green-600 flex items-center gap-2">
          <Cpu className="h-3 w-3" /> Consulta bem-sucedida via Emergent Agent
        </p>
      </CardContent>
    </Card>
  );
};

export default EmergentAgentCard;
