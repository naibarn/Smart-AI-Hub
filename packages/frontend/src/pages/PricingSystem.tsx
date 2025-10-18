import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Alert,
  Snackbar,
  Pagination,
  Tabs,
  Tab,
  Divider,
  LinearProgress,
  Switch,
  FormControlLabel,
  InputAdornment,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Refresh,
  Calculate,
  History,
  Settings,
  MonetizationOn,
} from '@mui/icons-material';
import {
  pricingService,
  PricingRule,
  AgentPlatform,
  AgentModel,
  CostCalculationInput,
  CostBreakdown,
  AgentUsageLog,
} from '@/services';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`pricing-tabpanel-${index}`}
      aria-labelledby={`pricing-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const PricingSystem: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [platforms, setPlatforms] = useState<AgentPlatform[]>([]);
  const [models, setModels] = useState<AgentModel[]>([]);
  const [usageHistory, setUsageHistory] = useState<AgentUsageLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [calcDialogOpen, setCalcDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<PricingRule | null>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  // Form states
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [costPerUnit, setCostPerUnit] = useState('');
  const [markupPercent, setMarkupPercent] = useState('');
  const [pricePerUnit, setPricePerUnit] = useState('');
  const [creditsPerUnit, setCreditsPerUnit] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Calculation states
  const [calcPlatform, setCalcPlatform] = useState('');
  const [calcModel, setCalcModel] = useState('');
  const [inputTokens, setInputTokens] = useState('');
  const [outputTokens, setOutputTokens] = useState('');
  const [ragEmbeddings, setRagEmbeddings] = useState('');
  const [ragSearches, setRagSearches] = useState('');
  const [toolCalls, setToolCalls] = useState('');
  const [calculationResult, setCalculationResult] = useState<CostBreakdown | null>(null);

  useEffect(() => {
    fetchPricingRules();
    fetchUsageHistory();
  }, [page]);

  useEffect(() => {
    if (selectedPlatform) {
      fetchModels(selectedPlatform);
    }
  }, [selectedPlatform]);

  const fetchPricingRules = async () => {
    try {
      setLoading(true);
      const response = await pricingService.getAllPricingRules({ page, limit: 10 });
      setPricingRules(response.data);
      setTotalPages(Math.ceil(response.total / 10));
    } catch (error) {
      console.error('Failed to fetch pricing rules:', error);
      setSnackbar({
        open: true,
        message: 'Failed to fetch pricing rules',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchModels = async (platformId: string) => {
    try {
      // This would be implemented in the pricing service
      // const models = await pricingService.getModels(platformId);
      // setModels(models);
    } catch (error) {
      console.error('Failed to fetch models:', error);
    }
  };

  const fetchUsageHistory = async () => {
    try {
      setLoading(true);
      const response = await pricingService.getUsageHistory({ page, limit: 10 });
      setUsageHistory(response.logs);
      setTotalPages(Math.ceil(response.total / 10));
    } catch (error) {
      console.error('Failed to fetch usage history:', error);
      setSnackbar({
        open: true,
        message: 'Failed to fetch usage history',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRule = async () => {
    if (!selectedPlatform || !selectedModel || !costPerUnit || !creditsPerUnit) {
      setSnackbar({
        open: true,
        message: 'Please fill all required fields',
        severity: 'error',
      });
      return;
    }

    try {
      setLoading(true);
      const ruleData = {
        modelId: selectedModel,
        componentType: 'LLM_INPUT' as any, // Simplified for demo
        unitType: 'TOKEN' as any, // Simplified for demo
        costPerUnit: parseFloat(costPerUnit),
        markupPercent: parseFloat(markupPercent) || 0,
        pricePerUnit: parseFloat(pricePerUnit) || parseFloat(costPerUnit),
        creditsPerUnit: parseFloat(creditsPerUnit),
        tierMultiplier: 1,
        isActive,
        effectiveFrom: new Date(),
        metadata: {},
      };

      if (editingRule) {
        await pricingService.updatePricingRule(editingRule.id, ruleData);
        setSnackbar({
          open: true,
          message: 'Pricing rule updated successfully',
          severity: 'success',
        });
      } else {
        await pricingService.createPricingRule(ruleData);
        setSnackbar({
          open: true,
          message: 'Pricing rule created successfully',
          severity: 'success',
        });
      }

      setRuleDialogOpen(false);
      resetRuleForm();
      fetchPricingRules();
    } catch (error) {
      console.error('Failed to save pricing rule:', error);
      setSnackbar({
        open: true,
        message: 'Failed to save pricing rule',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm('Are you sure you want to delete this pricing rule?')) return;

    try {
      await pricingService.deletePricingRule(id);
      setSnackbar({
        open: true,
        message: 'Pricing rule deleted successfully',
        severity: 'success',
      });
      fetchPricingRules();
    } catch (error) {
      console.error('Failed to delete pricing rule:', error);
      setSnackbar({
        open: true,
        message: 'Failed to delete pricing rule',
        severity: 'error',
      });
    }
  };

  const handleCalculate = async () => {
    if (!calcPlatform || !calcModel) {
      setSnackbar({
        open: true,
        message: 'Please select platform and model',
        severity: 'error',
      });
      return;
    }

    try {
      setLoading(true);
      const input: CostCalculationInput = {
        platformId: calcPlatform,
        modelId: calcModel,
        inputTokens: inputTokens ? parseInt(inputTokens) : undefined,
        outputTokens: outputTokens ? parseInt(outputTokens) : undefined,
        ragEmbeddings: ragEmbeddings ? parseInt(ragEmbeddings) : undefined,
        ragSearches: ragSearches ? parseInt(ragSearches) : undefined,
        toolCalls: toolCalls ? parseInt(toolCalls) : undefined,
      };

      const result = await pricingService.calculateCost(input);
      setCalculationResult(result);
    } catch (error) {
      console.error('Failed to calculate cost:', error);
      setSnackbar({
        open: true,
        message: 'Failed to calculate cost',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetRuleForm = () => {
    setSelectedPlatform('');
    setSelectedModel('');
    setCostPerUnit('');
    setMarkupPercent('');
    setPricePerUnit('');
    setCreditsPerUnit('');
    setIsActive(true);
    setEditingRule(null);
  };

  const openEditDialog = (rule: PricingRule) => {
    setEditingRule(rule);
    setSelectedPlatform(rule.modelId); // Simplified
    setSelectedModel(rule.modelId);
    setCostPerUnit(rule.costPerUnit.toString());
    setMarkupPercent(rule.markupPercent.toString());
    setPricePerUnit(rule.pricePerUnit.toString());
    setCreditsPerUnit(rule.creditsPerUnit.toString());
    setIsActive(rule.isActive);
    setRuleDialogOpen(true);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" gutterBottom>
        Pricing System
      </Typography>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Pricing Rules" />
          <Tab label="Cost Calculator" />
          <Tab label="Usage History" />
        </Tabs>
      </Box>

      {/* Pricing Rules Tab */}
      <TabPanel value={tabValue} index={0}>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between' }}>
          <TextField label="Search rules" variant="outlined" sx={{ flexGrow: 1, mr: 2 }} />
          <Button variant="contained" startIcon={<Add />} onClick={() => setRuleDialogOpen(true)}>
            Add Rule
          </Button>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchPricingRules}
            sx={{ ml: 1 }}
          >
            Refresh
          </Button>
        </Box>

        {loading && <LinearProgress sx={{ mb: 2 }} />}

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Model</TableCell>
                <TableCell>Component</TableCell>
                <TableCell>Cost/Unit</TableCell>
                <TableCell>Markup</TableCell>
                <TableCell>Price/Unit</TableCell>
                <TableCell>Credits/Unit</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pricingRules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell>{rule.modelId}</TableCell>
                  <TableCell>{rule.componentType}</TableCell>
                  <TableCell>${rule.costPerUnit.toFixed(4)}</TableCell>
                  <TableCell>{rule.markupPercent}%</TableCell>
                  <TableCell>${rule.pricePerUnit.toFixed(4)}</TableCell>
                  <TableCell>{rule.creditsPerUnit}</TableCell>
                  <TableCell>
                    <Chip
                      label={rule.isActive ? 'Active' : 'Inactive'}
                      color={rule.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => openEditDialog(rule)}>
                      <Edit />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDeleteRule(rule.id)}>
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Pagination count={totalPages} page={page} onChange={(e, value) => setPage(value)} />
          </Box>
        )}
      </TabPanel>

      {/* Cost Calculator Tab */}
      <TabPanel value={tabValue} index={1}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Cost Calculator
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Platform</InputLabel>
                  <Select value={calcPlatform} onChange={(e) => setCalcPlatform(e.target.value)}>
                    <MenuItem value="openai">OpenAI</MenuItem>
                    <MenuItem value="anthropic">Anthropic</MenuItem>
                    <MenuItem value="google">Google</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Model</InputLabel>
                  <Select value={calcModel} onChange={(e) => setCalcModel(e.target.value)}>
                    <MenuItem value="gpt-4">GPT-4</MenuItem>
                    <MenuItem value="gpt-3.5-turbo">GPT-3.5 Turbo</MenuItem>
                    <MenuItem value="claude-3">Claude 3</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Input Tokens"
                  type="number"
                  fullWidth
                  value={inputTokens}
                  onChange={(e) => setInputTokens(e.target.value)}
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Output Tokens"
                  type="number"
                  fullWidth
                  value={outputTokens}
                  onChange={(e) => setOutputTokens(e.target.value)}
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="RAG Embeddings"
                  type="number"
                  fullWidth
                  value={ragEmbeddings}
                  onChange={(e) => setRagEmbeddings(e.target.value)}
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="RAG Searches"
                  type="number"
                  fullWidth
                  value={ragSearches}
                  onChange={(e) => setRagSearches(e.target.value)}
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Tool Calls"
                  type="number"
                  fullWidth
                  value={toolCalls}
                  onChange={(e) => setToolCalls(e.target.value)}
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  startIcon={<Calculate />}
                  onClick={handleCalculate}
                  disabled={loading}
                >
                  {loading ? 'Calculating...' : 'Calculate Cost'}
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {calculationResult && (
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Cost Breakdown
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">LLM Input Cost</Typography>
                  <Typography variant="h6">${calculationResult.llmInputCost.toFixed(4)}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">LLM Output Cost</Typography>
                  <Typography variant="h6">
                    ${calculationResult.llmOutputCost.toFixed(4)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">RAG Cost</Typography>
                  <Typography variant="h6">${calculationResult.ragCost.toFixed(4)}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Tool Call Cost</Typography>
                  <Typography variant="h6">${calculationResult.toolCallCost.toFixed(4)}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2">Total Cost (USD)</Typography>
                      <Typography variant="h5">
                        ${calculationResult.totalCostUsd.toFixed(4)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2">Total Credits</Typography>
                      <Typography variant="h5">{calculationResult.totalCredits}</Typography>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}
      </TabPanel>

      {/* Usage History Tab */}
      <TabPanel value={tabValue} index={2}>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between' }}>
          <TextField label="Search usage" variant="outlined" sx={{ flexGrow: 1, mr: 2 }} />
          <Button variant="outlined" startIcon={<Refresh />} onClick={fetchUsageHistory}>
            Refresh
          </Button>
        </Box>

        {loading && <LinearProgress sx={{ mb: 2 }} />}

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Platform</TableCell>
                <TableCell>Model</TableCell>
                <TableCell>Input Tokens</TableCell>
                <TableCell>Output Tokens</TableCell>
                <TableCell>Total Cost</TableCell>
                <TableCell>Credits</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {usageHistory.map((usage) => (
                <TableRow key={usage.id}>
                  <TableCell>{new Date(usage.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>{usage.platformId}</TableCell>
                  <TableCell>{usage.modelId}</TableCell>
                  <TableCell>{usage.inputTokens || 0}</TableCell>
                  <TableCell>{usage.outputTokens || 0}</TableCell>
                  <TableCell>${usage.totalCostUsd.toFixed(4)}</TableCell>
                  <TableCell>{usage.creditsCharged}</TableCell>
                  <TableCell>
                    <Chip
                      label={usage.status}
                      color={usage.status === 'completed' ? 'success' : 'warning'}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Pagination count={totalPages} page={page} onChange={(e, value) => setPage(value)} />
          </Box>
        )}
      </TabPanel>

      {/* Pricing Rule Dialog */}
      <Dialog
        open={ruleDialogOpen}
        onClose={() => setRuleDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{editingRule ? 'Edit Pricing Rule' : 'Add Pricing Rule'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Platform</InputLabel>
              <Select
                value={selectedPlatform}
                onChange={(e) => setSelectedPlatform(e.target.value)}
              >
                <MenuItem value="openai">OpenAI</MenuItem>
                <MenuItem value="anthropic">Anthropic</MenuItem>
                <MenuItem value="google">Google</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Model</InputLabel>
              <Select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}>
                <MenuItem value="gpt-4">GPT-4</MenuItem>
                <MenuItem value="gpt-3.5-turbo">GPT-3.5 Turbo</MenuItem>
                <MenuItem value="claude-3">Claude 3</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Cost per Unit ($)"
              type="number"
              fullWidth
              value={costPerUnit}
              onChange={(e) => setCostPerUnit(e.target.value)}
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
            />
            <TextField
              label="Markup Percent"
              type="number"
              fullWidth
              value={markupPercent}
              onChange={(e) => setMarkupPercent(e.target.value)}
              sx={{ mb: 2 }}
              InputProps={{
                endAdornment: <InputAdornment position="end">%</InputAdornment>,
              }}
            />
            <TextField
              label="Credits per Unit"
              type="number"
              fullWidth
              value={creditsPerUnit}
              onChange={(e) => setCreditsPerUnit(e.target.value)}
              sx={{ mb: 2 }}
            />
            <FormControlLabel
              control={
                <Switch checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
              }
              label="Active"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRuleDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveRule} variant="contained" disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PricingSystem;
