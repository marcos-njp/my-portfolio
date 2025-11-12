'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

interface AnalyticsData {
  recentChats: Array<{
    userQuery: string;
    mood: string;
    chunksUsed: number;
    topScore: number;
    hadFeedback: boolean;
    timestamp: string;
  }>;
  frequentQuestions: Array<{
    question: string;
    category: string;
    count: number;
    lastAsked: string;
  }>;
  moodDistribution: Array<{
    mood: string;
    _count: number;
  }>;
}

export default function AdminAnalyticsPage() {
  const [secretKey, setSecretKey] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!secretKey) {
      setError('Please enter admin secret key');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/analytics/get', {
        headers: {
          'Authorization': `Bearer ${secretKey}`,
        },
      });

      if (response.status === 401) {
        setError('Invalid admin key');
        setIsAuthorized(false);
        return;
      }

      if (!response.ok) {
        setError('Failed to fetch analytics');
        return;
      }

      const data = await response.json();
      setAnalytics(data);
      setIsAuthorized(true);
    } catch (err) {
      setError('Failed to connect to analytics API');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <Card className="w-full max-w-md p-8">
          <h1 className="text-2xl font-bold mb-6 text-center">Admin Analytics</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 text-center">
            Enter your admin secret key to view analytics
          </p>
          
          <div className="space-y-4">
            <Input
              type="password"
              placeholder="Admin Secret Key"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
            
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
            
            <Button 
              onClick={handleLogin} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Authenticating...' : 'Access Analytics'}
            </Button>
          </div>
          
          <p className="text-xs text-gray-500 mt-6 text-center">
            Secret key is stored in .env.local as ADMIN_SECRET_KEY
          </p>
        </Card>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">AI Chat Analytics</h1>
          <Button variant="outline" onClick={() => setIsAuthorized(false)}>
            Logout
          </Button>
        </div>

        {/* Mood Distribution */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Mood Distribution</h2>
          <div className="space-y-2">
            {analytics.moodDistribution.map((item) => (
              <div key={item.mood} className="flex justify-between items-center">
                <span className="capitalize">{item.mood}</span>
                <span className="font-mono">{item._count} chats</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Frequent Questions */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Most Frequent Questions (Top 20)</h2>
          <div className="space-y-4">
            {analytics.frequentQuestions.map((faq) => (
              <div key={faq.question} className="border-b pb-3 last:border-0">
                <div className="flex justify-between items-start mb-1">
                  <p className="font-medium">{faq.question}</p>
                  <span className="text-sm bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">
                    {faq.count}x
                  </span>
                </div>
                <div className="flex gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <span className="capitalize">{faq.category}</span>
                  <span>•</span>
                  <span>Last asked: {new Date(faq.lastAsked).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Chats */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Chats (Last 100)</h2>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {analytics.recentChats.map((chat, idx) => (
              <div key={idx} className="border-b pb-3 last:border-0">
                <p className="font-medium mb-2">{chat.userQuery}</p>
                <div className="flex gap-4 text-xs text-gray-600 dark:text-gray-400">
                  <span>Mood: {chat.mood}</span>
                  <span>Chunks: {chat.chunksUsed}</span>
                  <span>Score: {(chat.topScore * 100).toFixed(1)}%</span>
                  {chat.hadFeedback && <span className="text-orange-600">📝 Feedback</span>}
                  <span>{new Date(chat.timestamp).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
