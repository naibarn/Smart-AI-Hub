import * as React from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Alert,
  CircularProgress,
  Paper,
  Divider,
  IconButton,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Send, Bot, User, CreditCard, AlertCircle } from 'lucide-react';
import { GlassCard, GradientButton, LoadingSpinner } from '../components/common';
import { useSelector } from 'react-redux';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  tokens?: number;
  creditsUsed?: number;
}

interface CreditInfo {
  balance: number;
  lastUpdated: Date;
}

const ChatInterface: React.FC = () => {
  const theme = useTheme();
  const { user } = useSelector((state: { app: any }) => state.app.auth);

  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = React.useState('');
  const [selectedModel, setSelectedModel] = React.useState('gpt-4');
  const [isLoading, setIsLoading] = React.useState(false);
  const [creditInfo, setCreditInfo] = React.useState<CreditInfo>({
    balance: 5, // Starting with 5 credits for testing
    lastUpdated: new Date(),
  });
  const [error, setError] = React.useState<string | null>(null);
  const [wsConnection, setWsConnection] = React.useState<WebSocket | null>(null);

  const modelPricing = {
    'gpt-4': 10, // 10 credits per 1000 tokens as per FR-3
    'gpt-3.5-turbo': 1, // 1 credit per 1000 tokens
    'claude-3-opus': 8, // 8 credits per 1000 tokens
  };

  React.useEffect(() => {
    // Initialize WebSocket connection to MCP server
    const connectWebSocket = () => {
      try {
        const ws = new WebSocket('ws://localhost:3003');

        ws.onopen = () => {
          console.log('Connected to MCP server');
          setWsConnection(ws);
        };

        ws.onmessage = (event) => {
          try {
            const response = JSON.parse(event.data);

            if (response.type === 'chunk') {
              // Handle streaming response
              setMessages((prev) => {
                const lastMessage = prev[prev.length - 1];
                if (lastMessage && lastMessage.role === 'assistant' && !lastMessage.content) {
                  // Update the last assistant message
                  return prev.map((msg, index) =>
                    index === prev.length - 1
                      ? { ...msg, content: msg.content + response.data }
                      : msg
                  );
                } else {
                  // Add new assistant message
                  return [
                    ...prev,
                    {
                      id: response.id,
                      role: 'assistant' as const,
                      content: response.data || '',
                      timestamp: new Date(),
                    },
                  ];
                }
              });
            } else if (response.type === 'done') {
              setIsLoading(false);

              // Update credit balance
              if (response.usage) {
                const creditsUsed = calculateCredits(response.usage.totalTokens);
                setCreditInfo((prev) => ({
                  balance: prev.balance - creditsUsed,
                  lastUpdated: new Date(),
                }));

                // Update the last message with token info
                setMessages((prev) =>
                  prev.map((msg, index) =>
                    index === prev.length - 1
                      ? {
                          ...msg,
                          tokens: response.usage?.totalTokens,
                          creditsUsed,
                        }
                      : msg
                  )
                );
              }
            } else if (response.type === 'error') {
              setIsLoading(false);
              setError(response.error?.message || 'An error occurred');
            }
          } catch (err) {
            console.error('Error parsing WebSocket message:', err);
          }
        };

        ws.onclose = () => {
          console.log('Disconnected from MCP server');
          setWsConnection(null);
          // Attempt to reconnect after 3 seconds
          setTimeout(connectWebSocket, 3000);
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          setError('Failed to connect to AI service');
        };

        // Mock authentication for testing
        ws.onopen = () => {
          // Send mock auth token
          ws.send(
            JSON.stringify({
              type: 'auth',
              token: 'mock-jwt-token',
              userId: 'test-user-id',
            })
          );
        };
      } catch (err) {
        console.error('Failed to create WebSocket connection:', err);
        setError('Failed to initialize AI service');
      }
    };

    connectWebSocket();

    return () => {
      if (wsConnection) {
        wsConnection.close();
      }
    };
  }, []);

  const calculateCredits = (tokens: number): number => {
    const pricePerToken = modelPricing[selectedModel as keyof typeof modelPricing] / 1000;
    return Math.ceil(tokens * pricePerToken);
  };

  const estimateCredits = (text: string): number => {
    // Rough estimation: ~4 characters per token
    const estimatedTokens = Math.ceil(text.length / 4);
    return calculateCredits(estimatedTokens);
  };

  const handleSendMessage = () => {
    if (!inputValue.trim() || !wsConnection || isLoading) return;

    setError(null);
    const estimatedCredits = estimateCredits(inputValue);

    // Check if user has sufficient credits
    if (creditInfo.balance < estimatedCredits) {
      setError(
        `Insufficient credits. You need ${estimatedCredits} credits but only have ${creditInfo.balance}.`
      );
      return;
    }

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    // Add placeholder for assistant response
    const assistantMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, assistantMessage]);

    setIsLoading(true);

    // Send message to MCP server
    const mcpRequest = {
      id: Date.now().toString(),
      type: 'chat',
      provider: 'auto',
      model: selectedModel,
      messages: [{ role: 'user', content: inputValue }],
      stream: true,
      maxTokens: 1000,
      temperature: 0.7,
    };

    wsConnection.send(JSON.stringify(mcpRequest));
    setInputValue('');
  };

  const handleAdjustCredits = (amount: number) => {
    setCreditInfo((prev) => ({
      balance: Math.max(0, prev.balance + amount),
      lastUpdated: new Date(),
    }));
    setError(null);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
        AI Chat Interface
      </Typography>

      {/* Credit Balance Display */}
      <GlassCard sx={{ mb: 3, p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CreditCard size={24} color={theme.palette.primary.main} />
            <Typography variant="h6">
              Credit Balance:{' '}
              <span style={{ color: theme.palette.primary.main }}>{creditInfo.balance}</span>
            </Typography>
            <Chip
              label={`Model: ${selectedModel} (${modelPricing[selectedModel as keyof typeof modelPricing]} credits/1K tokens)`}
              size="small"
              color="primary"
              variant="outlined"
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              size="small"
              variant="outlined"
              onClick={() => handleAdjustCredits(-5)}
              disabled={creditInfo.balance <= 0}
            >
              -5
            </Button>
            <Button size="small" variant="outlined" onClick={() => handleAdjustCredits(15)}>
              +15
            </Button>
          </Box>
        </Box>
        <Typography
          variant="caption"
          sx={{ color: theme.palette.text.secondary, mt: 1, display: 'block' }}
        >
          Last updated: {creditInfo.lastUpdated.toLocaleTimeString()}
        </Typography>
      </GlassCard>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} icon={<ErrorIcon />}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 3, height: '70vh' }}>
        {/* Chat Messages */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <GlassCard sx={{ flex: 1, p: 3, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" gutterBottom>
              Conversation
            </Typography>

            <Box sx={{ flex: 1, overflow: 'auto', mb: 2 }}>
              {messages.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Bot size={48} sx={{ color: theme.palette.text.secondary, mb: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    Start a conversation with the AI assistant
                  </Typography>
                </Box>
              ) : (
                messages.map((message, index) => (
                  <Box key={message.id} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      {message.role === 'user' ? (
                        <Box sx={{ color: theme.palette.primary.main, mt: 1, display: 'flex' }}>
                          <User size={20} />
                        </Box>
                      ) : (
                        <Box sx={{ color: theme.palette.secondary.main, mt: 1, display: 'flex' }}>
                          <Bot size={20} />
                        </Box>
                      )}
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                          {message.role === 'user' ? 'You' : 'AI Assistant'}
                        </Typography>
                        <Paper
                          sx={{
                            p: 2,
                            backgroundColor:
                              message.role === 'user'
                                ? 'rgba(59, 130, 246, 0.1)'
                                : 'rgba(16, 185, 129, 0.1)',
                            border: `1px solid ${
                              message.role === 'user'
                                ? theme.palette.primary.main
                                : theme.palette.secondary.main
                            }20`,
                          }}
                        >
                          <Typography variant="body2">
                            {message.content ||
                              (isLoading && index === messages.length - 1 ? 'Thinking...' : '')}
                          </Typography>
                        </Paper>
                        {message.tokens && (
                          <Typography
                            variant="caption"
                            sx={{ color: theme.palette.text.secondary, mt: 0.5, display: 'block' }}
                          >
                            Tokens: {message.tokens} | Credits used: {message.creditsUsed}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                    {index < messages.length - 1 && <Divider sx={{ my: 2 }} />}
                  </Box>
                ))
              )}
              {isLoading && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
                  <CircularProgress size={16} />
                  <Typography variant="body2" color="text.secondary">
                    Processing...
                  </Typography>
                </Box>
              )}
            </Box>
          </GlassCard>
        </Box>

        {/* Input Controls */}
        <Box sx={{ width: '300px' }}>
          <GlassCard sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              AI Settings
            </Typography>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Model</InputLabel>
              <Select
                value={selectedModel}
                label="Model"
                onChange={(e) => setSelectedModel(e.target.value)}
                disabled={isLoading}
              >
                <MenuItem value="gpt-4">GPT-4 (10 credits/1K)</MenuItem>
                <MenuItem value="gpt-3.5-turbo">GPT-3.5 Turbo (1 credit/1K)</MenuItem>
                <MenuItem value="claude-3-opus">Claude-3 Opus (8 credits/1K)</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              multiline
              rows={4}
              label="Your Message"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isLoading}
              sx={{ mb: 2 }}
              helperText={`Estimated cost: ${estimateCredits(inputValue)} credits`}
            />

            <GradientButton
              fullWidth
              variant="primary"
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading || !wsConnection}
              startIcon={isLoading ? <CircularProgress size={16} /> : <Send size={20} />}
            >
              {isLoading ? 'Sending...' : 'Send Message'}
            </GradientButton>

            {!wsConnection && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                Not connected to AI service
              </Alert>
            )}
          </GlassCard>
        </Box>
      </Box>
    </Container>
  );
};

export default ChatInterface;
