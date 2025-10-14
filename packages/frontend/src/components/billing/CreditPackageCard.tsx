import * as React from 'react';
import { motion } from 'framer-motion';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Chip,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Check,
  Star,
} from 'lucide-react';

export interface CreditPackageCardProps {
  id: string;
  name: string;
  credits: number;
  price: number;
  currency?: string;
  description?: string;
  features?: string[];
  popular?: boolean;
  onPurchase: (packageId: string) => void;
  loading?: boolean;
}

const CreditPackageCard: React.FC<CreditPackageCardProps> = ({
  id,
  name,
  credits,
  price,
  currency = 'USD',
  description,
  features = [],
  popular = false,
  onPurchase,
  loading = false,
}) => {
  const theme = useTheme();

  const handlePurchase = () => {
    onPurchase(id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -5 }}
    >
      <Card
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'visible',
          borderRadius: 3,
          boxShadow: popular
            ? `0 10px 40px rgba(0, 0, 0, 0.15), 0 0 0 2px ${theme.palette.primary.main}`
            : '0 4px 20px rgba(0, 0, 0, 0.08)',
          transition: 'all 0.3s ease',
          backgroundColor: popular
            ? 'rgba(255, 255, 255, 0.05)'
            : 'rgba(255, 255, 255, 0.02)',
          backdropFilter: 'blur(10px)',
          border: popular
            ? `1px solid ${theme.palette.primary.main}30`
            : `1px solid ${theme.palette.divider}`,
        }}
      >
        {popular && (
          <Chip
            icon={<Star size={16} />}
            label="Most Popular"
            size="small"
            sx={{
              position: 'absolute',
              top: -12,
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: theme.palette.primary.main,
              color: 'white',
              fontWeight: 600,
              fontSize: '0.75rem',
              zIndex: 1,
            }}
          />
        )}

        <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ mb: 2, textAlign: 'center' }}>
            <Typography variant="h5" component="h3" sx={{ fontWeight: 700, mb: 1 }}>
              {name}
            </Typography>
            {description && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {description}
              </Typography>
            )}
          </Box>

          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography
              variant="h3"
              component="div"
              sx={{
                fontWeight: 700,
                color: popular ? theme.palette.primary.main : theme.palette.text.primary,
                mb: 0.5,
              }}
            >
              {credits.toLocaleString()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              credits
            </Typography>
          </Box>

          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography
              variant="h4"
              component="div"
              sx={{ fontWeight: 700 }}
            >
              {currency} {price.toFixed(2)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              one-time payment
            </Typography>
          </Box>

          {features.length > 0 && (
            <Box sx={{ mb: 3, flexGrow: 1 }}>
              <List dense sx={{ p: 0 }}>
                {features.map((feature, index) => (
                  <ListItem key={index} sx={{ px: 0, py: 0.5 }}>
                    <Check
                      size={16}
                      color={theme.palette.success.main}
                      style={{ minWidth: 24 }}
                    />
                    <ListItemText
                      primary={feature}
                      primaryTypographyProps={{
                        variant: 'body2',
                        color: theme.palette.text.secondary,
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          <Button
            variant={popular ? 'contained' : 'outlined'}
            size="large"
            fullWidth
            onClick={handlePurchase}
            disabled={loading}
            sx={{
              py: 1.5,
              fontWeight: 600,
              borderRadius: 2,
              textTransform: 'none',
              boxShadow: popular
                ? `0 4px 14px 0 ${theme.palette.primary.main}40`
                : 'none',
              backgroundColor: popular
                ? theme.palette.primary.main
                : 'transparent',
              borderColor: theme.palette.primary.main,
              color: popular
                ? 'white'
                : theme.palette.primary.main,
              '&:hover': {
                backgroundColor: popular
                  ? theme.palette.primary.dark
                  : `${theme.palette.primary.main}10`,
                borderColor: popular
                  ? theme.palette.primary.dark
                  : theme.palette.primary.main,
                boxShadow: popular
                  ? `0 6px 20px 0 ${theme.palette.primary.main}60`
                  : 'none',
              },
            }}
          >
            {loading ? 'Processing...' : 'Purchase Now'}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default CreditPackageCard;