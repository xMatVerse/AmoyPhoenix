import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, RefreshCw, TrendingUp, Wallet } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const EthCard = ({ address, title = 'Ethereum Address' }) => {
  const [balance, setBalance] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchData = async () => {
    if (!address) {
      setError('No address provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch balance and transactions in parallel
      const [balanceRes, txsRes] = await Promise.all([
        axios.get(`${API}/eth/balance/${address}`),
        axios.get(`${API}/eth/txs/${address}?limit=3`)
      ]);

      setBalance(balanceRes.data);
      setTransactions(txsRes.data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching Ethereum data:', err);
      setError(err.response?.data?.detail || 'Failed to fetch data from Etherscan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [address]);

  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatEth = (value) => {
    if (value === null || value === undefined) return '0';
    return parseFloat(value).toFixed(6);
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Card className="w-full animate-pulse">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-32 bg-gray-200 rounded" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <Wallet className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={fetchData} variant="outline" size="sm" className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-blue-500" />
              {title}
            </CardTitle>
            <CardDescription className="mt-1 font-mono text-xs">
              {formatAddress(address)}
            </CardDescription>
          </div>
          <Button onClick={fetchData} variant="ghost" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Balance Section */}
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-3xl font-bold">{formatEth(balance?.balance_eth)}</p>
              <p className="text-sm text-gray-500">ETH</p>
            </div>
            {balance?.balance_usd && (
              <div className="text-right">
                <p className="text-xl font-semibold text-green-600">
                  ${balance.balance_usd.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">USD</p>
              </div>
            )}
          </div>
        </div>

        {/* Transactions Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">Recent Transactions</h3>
            <TrendingUp className="h-4 w-4 text-gray-400" />
          </div>
          
          {transactions.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No recent transactions</p>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx) => (
                <div
                  key={tx.hash}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-mono text-gray-600 truncate">
                        {formatAddress(tx.hash)}
                      </p>
                      <a
                        href={`https://etherscan.io/tx/${tx.hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0"
                      >
                        <ExternalLink className="h-3 w-3 text-blue-500 hover:text-blue-700" />
                      </a>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(tx.timestamp)}
                    </p>
                  </div>
                  <div className="text-right ml-2">
                    <p className="text-sm font-semibold">{formatEth(tx.value_eth)}</p>
                    <p className="text-xs text-gray-500">ETH</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Last Updated */}
        {lastUpdated && (
          <p className="text-xs text-gray-400 text-center">
            Last updated: {formatDate(lastUpdated)}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default EthCard;
