import * as React from 'react';
import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  FormControl,
  FormControlLabel,
  Checkbox,
  Button,
  Alert,
  Card,
  CardContent,
  Grid,
  InputAdornment,
  IconButton,
  Tooltip,
  Divider,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import GlassCard from '../common/GlassCard';
import GradientButton from '../common/GradientButton';
import LoadingSpinner from '../common/LoadingSpinner';
import {
  webhookService,
  WebhookEndpoint,
  CreateWebhookData,
  UpdateWebhookData,
  validateWebhookUrl,
  generateWebhookSecret,
  EVENT_TYPE_DESCRIPTIONS,
} from '../../services/webhook.service';

interface WebhookFormProps {
  webhook?: WebhookEndpoint;
  onSave: (webhook: WebhookEndpoint) => void;
  onCancel: () => void;
}

const WebhookForm: React.FC<WebhookFormProps> = ({
  webhook,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState<CreateWebhookData>({
    url: '',
    eventTypes: [],
    secret: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [availableEventTypes, setAvailableEventTypes] = useState<string[]>([]);

  useEffect(() => {
    fetchEventTypes();
    if (webhook) {
      setFormData({
        url: webhook.url,
        eventTypes: webhook.eventTypes,
        secret: webhook.secret,
      });
    } else {
      setFormData(prev => ({ ...prev, secret: generateWebhookSecret() }));
    }
  }, [webhook]);

  const fetchEventTypes = async () => {
    try {
      const response = await webhookService.getEventTypes();
      setAvailableEventTypes(response.eventTypes);
    } catch (err: any) {
      console.error('Failed to fetch event types:', err);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.url.trim()) {
      newErrors.url = 'URL is required';
    } else {
      const urlValidation = validateWebhookUrl(formData.url);
      if (!urlValidation.isValid) {
        newErrors.url = urlValidation.error || 'Invalid URL';
      }
    }

    if (formData.eventTypes.length === 0) {
      newErrors.eventTypes = 'At least one event type must be selected';
    }

    if (!formData.secret?.trim()) {
      newErrors.secret = 'Secret is required';
    } else if (formData.secret.length < 8) {
      newErrors.secret = 'Secret must be at least 8 characters long';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      let savedWebhook: WebhookEndpoint;
      
      if (webhook) {
        savedWebhook = await webhookService.updateWebhook(webhook.id, formData as UpdateWebhookData);
      } else {
        savedWebhook = await webhookService.createWebhook(formData);
      }
      
      onSave(savedWebhook);
    } catch (err: any) {
      setErrors({ submit: err.message || 'Failed to save webhook' });
    } finally {
      setLoading(false);
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setFormData(prev => ({ ...prev, url }));
    
    if (url.trim()) {
      const validation = validateWebhookUrl(url);
      setUrlError(validation.isValid ? null : validation.error || null);
    } else {
      setUrlError(null);
    }
  };

  const handleEventTypeToggle = (eventType: string) => {
    setFormData(prev => ({
      ...prev,
      eventTypes: prev.eventTypes.includes(eventType)
        ? prev.eventTypes.filter(type => type !== eventType)
        : [...prev.eventTypes, eventType],
    }));
  };

  const regenerateSecret = () => {
    setFormData(prev => ({ ...prev, secret: generateWebhookSecret() }));
  };

  const isEditing = !!webhook;

  return (
    <Box sx={{ width: '100%', maxWidth: 800, mx: 'auto' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <GlassCard>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mb: 3 }}>
              {isEditing ? 'Edit Webhook' : 'Create Webhook'}
            </Typography>

            {errors.submit && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {errors.submit}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                {/* URL Field */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Webhook URL"
                    value={formData.url}
                    onChange={handleUrlChange}
                    error={!!errors.url || !!urlError}
                    helperText={errors.url || urlError || 'The endpoint URL where events will be sent'}
                    placeholder="https://your-domain.com/webhook"
                    disabled={loading}
                  />
                </Grid>

                {/* Event Types */}
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>
                    Event Types
                    <Tooltip title="Select the events that will trigger this webhook">
                      <InfoIcon sx={{ ml: 1, fontSize: 18, color: 'text.secondary' }} />
                    </Tooltip>
                  </Typography>
                  
                  {errors.eventTypes && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {errors.eventTypes}
                    </Alert>
                  )}

                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    {Object.entries(EVENT_TYPE_DESCRIPTIONS).map(([eventType, description]) => (
                      <Chip
                        key={eventType}
                        label={eventType}
                        onClick={() => handleEventTypeToggle(eventType)}
                        color={formData.eventTypes.includes(eventType) ? 'primary' : 'default'}
                        variant={formData.eventTypes.includes(eventType) ? 'filled' : 'outlined'}
                        clickable
                        sx={{ mb: 1 }}
                      />
                    ))}
                  </Box>

                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="body2" color="text.secondary">
                        Event Type Descriptions
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container spacing={2}>
                        {Object.entries(EVENT_TYPE_DESCRIPTIONS).map(([eventType, description]) => (
                          <Grid item xs={12} sm={6} key={eventType}>
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                              <Checkbox
                                checked={formData.eventTypes.includes(eventType)}
                                onChange={() => handleEventTypeToggle(eventType)}
                                size="small"
                              />
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {eventType}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {description}
                                </Typography>
                              </Box>
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
                </Grid>

                {/* Secret Field */}
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>
                    Webhook Secret
                    <Tooltip title="Used to verify webhook signatures">
                      <InfoIcon sx={{ ml: 1, fontSize: 18, color: 'text.secondary' }} />
                    </Tooltip>
                  </Typography>
                  
                  <TextField
                    fullWidth
                    type={showSecret ? 'text' : 'password'}
                    label="Secret"
                    value={formData.secret}
                    onChange={(e) => setFormData(prev => ({ ...prev, secret: e.target.value }))}
                    error={!!errors.secret}
                    helperText={errors.secret || 'Used to verify webhook signatures. Keep this secure!'}
                    disabled={loading}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowSecret(!showSecret)}
                            edge="end"
                          >
                            {showSecret ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                          <IconButton
                            onClick={regenerateSecret}
                            edge="end"
                            title="Generate new secret"
                          >
                            <RefreshIcon />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                {/* Form Actions */}
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                    <Button
                      variant="outlined"
                      onClick={onCancel}
                      disabled={loading}
                      sx={{ minWidth: 120 }}
                    >
                      Cancel
                    </Button>
                    <GradientButton
                      variant="primary"
                      type="submit"
                      disabled={loading}
                      sx={{ minWidth: 120 }}
                    >
                      {loading ? (
                        <LoadingSpinner size={24} overlay={false} />
                      ) : (
                        isEditing ? 'Update' : 'Create'
                      )}
                    </GradientButton>
                  </Box>
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </GlassCard>
      </motion.div>
    </Box>
  );
};

export default WebhookForm;